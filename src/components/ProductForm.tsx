import React, { useState, useEffect } from 'react';
import { X, Image, Tag, DollarSign, Layers, Compass, Type, Save, Upload, Palette } from 'lucide-react';
import { Product } from '../types';
import { uploadProductFile } from '../supabaseClient';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Product, 'id' | 'created_at'>) => Promise<void>;
  initialProduct: Product | null;
}

const PRESET_CATEGORIES = [
  'Camisetas',
  'Blusas',
  'Calças',
  'Shorts',
  'Vestidos',
  'Casacos',
  'Saias',
  'Bolsas',
  'Acessórios',
  'Sapatos',
  'Promoções'
];

const PRESET_SIZES = [
  'XP', 'PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG', 'EG', 'EGG', 'EXG',
  'G1', 'G2', 'G3', 'G4', 'G5',
  'XXS', 'XS', 'S', 'L', 'XL', 'XXL',
  '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56',
  'P/M', 'M/G', 'G/GG',
  'Único', 'Tamanho Único'
];

// Beautiful Unsplash Fashion Presets to make populating forms look stunning
const IMAGE_PRESETS = [
  {
    name: 'Linho Off-White',
    url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
    category: 'Camisas'
  },
  {
    name: 'Camisa Preta Casual',
    url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80',
    category: 'Camisetas'
  },
  {
    name: 'T-Shirt Branca Classic',
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    category: 'Camisetas'
  },
  {
    name: 'Calça Jeans Premium',
    url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80',
    category: 'Calças'
  },
  {
    name: 'Calça Chino Khaki',
    url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&auto=format&fit=crop&q=80',
    category: 'Calças'
  },
  {
    name: 'Vestido Midi Terracota',
    url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80',
    category: 'Vestidos'
  },
  {
    name: 'Vestido Florido Verão',
    url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80',
    category: 'Vestidos'
  },
  {
    name: 'Jaqueta Puffer Térmica',
    url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
    category: 'Casacos'
  },
  {
    name: 'Blazer Alfaiataria Areia',
    url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80',
    category: 'Casacos'
  },
  {
    name: 'Suéter de Lã Minimal',
    url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop&q=80',
    category: 'Casacos'
  }
];

export default function ProductForm({ isOpen, onClose, onSubmit, initialProduct }: ProductFormProps) {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState(PRESET_CATEGORIES[0]);
  const [descricao, setDescricao] = useState('');
  const [imagem, setImagem] = useState('');
  const [sizeStocks, setSizeStocks] = useState<Record<string, number>>({ 'P': 5, 'M': 5, 'G': 5 });
  const [customSizeInput, setCustomSizeInput] = useState('');
  
  // New shop variables states
  const [emPromocao, setEmPromocao] = useState(false);
  const [precoPromocional, setPrecoPromocional] = useState('');
  const [destaque, setDestaque] = useState(false);
  const [banner, setBanner] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [bannerImage, setBannerImage] = useState('');
  const [bannerBg, setBannerBg] = useState('#fdf2f8');

  // File Upload Status States
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sync state if editing
  useEffect(() => {
    if (initialProduct) {
      setNome(initialProduct.nome);
      setPreco(initialProduct.preco.toString());
      setCategoria(initialProduct.categoria);
      setDescricao(initialProduct.descricao || '');
      setImagem(initialProduct.imagem || '');
      
      // New fields sync
      setEmPromocao(!!initialProduct.em_promocao);
      setPrecoPromocional(initialProduct.preco_promocional !== undefined && initialProduct.preco_promocional !== null ? initialProduct.preco_promocional.toString() : '');
      setDestaque(!!initialProduct.destaque);
      setBanner(!!initialProduct.banner);
      setAtivo(initialProduct.ativo !== undefined ? !!initialProduct.ativo : true);
      setBannerImage(initialProduct.banner_image || '');
      setBannerBg(initialProduct.banner_bg || '#fdf2f8');

      if (initialProduct.tamanhos_estoque && Object.keys(initialProduct.tamanhos_estoque).length > 0) {
        setSizeStocks({ ...initialProduct.tamanhos_estoque });
      } else {
        // Legacy conversion
        const sizes = initialProduct.tamanho
          ? initialProduct.tamanho.split(',').map(s => s.trim()).filter(Boolean)
          : ['M'];
        const legacyMap: Record<string, number> = {};
        if (sizes.length === 1) {
          legacyMap[sizes[0]] = initialProduct.estoque;
        } else {
          sizes.forEach((s, i) => {
            legacyMap[s] = i === 0 ? initialProduct.estoque : 0;
          });
        }
        setSizeStocks(legacyMap);
      }
    } else {
      // Clear for new product
      setNome('');
      setPreco('');
      setCategoria(PRESET_CATEGORIES[0]);
      setDescricao('');
      setImagem('');
      setSizeStocks({ 'PP': 2, 'P': 5, 'M': 5, 'G': 5, 'GG': 2 });
      
      // Clear new fields
      setEmPromocao(false);
      setPrecoPromocional('');
      setDestaque(false);
      setBanner(false);
      setAtivo(true);
      setBannerImage('');
      setBannerBg('#fdf2f8');
    }
    setCustomSizeInput('');
    setError(null);
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  const handleToggleSize = (size: string) => {
    setSizeStocks(prev => {
      const updated = { ...prev };
      if (updated.hasOwnProperty(size)) {
        delete updated[size];
      } else {
        updated[size] = 5; // default 5 for premium quick-inventory addition
      }
      return updated;
    });
  };

  const handleAddCustomSize = () => {
    const clean = customSizeInput.trim().toUpperCase();
    if (clean) {
      setSizeStocks(prev => ({
        ...prev,
        [clean]: prev[clean] !== undefined ? prev[clean] : 5
      }));
      setCustomSizeInput('');
    }
  };

  const handleRemoveSize = (size: string) => {
    setSizeStocks(prev => {
      const updated = { ...prev };
      delete updated[size];
      return updated;
    });
  };

  const handleUpdateStock = (size: string, valueString: string) => {
    const parsed = parseInt(valueString);
    const value = isNaN(parsed) ? 0 : parsed;
    setSizeStocks(prev => ({
      ...prev,
      [size]: Math.max(0, value)
    }));
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    setIsUploadingImage(true);
    setError(null);
    setUploadError(null);
    try {
      const { publicUrl, error: uploadErr } = await uploadProductFile(file, 'produtos');
      if (uploadErr) {
        setUploadError(uploadErr);
      }
      if (publicUrl) {
        setImagem(publicUrl);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao enviar arquivo.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    setIsUploadingBanner(true);
    setError(null);
    setUploadError(null);
    try {
      const { publicUrl, error: uploadErr } = await uploadProductFile(file, 'banners');
      if (uploadErr) {
        setUploadError(uploadErr);
      }
      if (publicUrl) {
        setBannerImage(publicUrl);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao enviar arquivo de banner.');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Basic Validation Check
    if (!nome.trim()) {
      setError('O nome do produto é obrigatório.');
      setIsSubmitting(false);
      return;
    }

    const parsedPrice = parseFloat(preco);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Por favor, informe um preço de venda válido maior que zero.');
      setIsSubmitting(false);
      return;
    }

    const sizesCount = Object.keys(sizeStocks).length;
    if (sizesCount === 0) {
      setError('Sua grade de tamanhos está vazia. Selecione ao menos um tamanho para a peça.');
      setIsSubmitting(false);
      return;
    }

    const totalEstoque = (Object.values(sizeStocks) as number[]).reduce((acc, curr) => acc + curr, 0);
    const tamanhoString = Object.keys(sizeStocks).join(', ');

    // Validate Promotional fields
    const parsedPromoPrice = emPromocao ? parseFloat(precoPromocional) : undefined;
    if (emPromocao) {
      if (parsedPromoPrice === undefined || isNaN(parsedPromoPrice) || parsedPromoPrice <= 0) {
        setError('Por favor, informe um preço promocional válido maior que zero.');
        setIsSubmitting(false);
        return;
      }
      if (parsedPromoPrice >= parsedPrice) {
        setError('O preço promocional deve ser menor do que o preço original de venda.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await onSubmit({
        nome: nome.trim(),
        preco: parsedPrice,
        categoria: categoria,
        tamanho: tamanhoString,
        descricao: descricao.trim(),
        imagem: imagem.trim() || 'https://images.unsplash.com/photo-1540221129048-8e178929e52b?w=600&auto=format&fit=crop&q=80', // stylish empty apparel fallback
        estoque: totalEstoque,
        tamanhos_estoque: sizeStocks,
        preco_promocional: emPromocao ? parsedPromoPrice : null,
        em_promocao: emPromocao,
        destaque: destaque,
        banner: banner,
        ativo: ativo,
        banner_image: banner ? (bannerImage.trim() || null) : null,
        banner_bg: banner ? (bannerBg.trim() || null) : null
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Algo deu errado ao salvar o produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectPreset = (url: string, category: string, name: string) => {
    setImagem(url);
    if (PRESET_CATEGORIES.includes(category)) {
      setCategoria(category);
    }
    // Auto populate matching name if current name is empty
    if (!nome.trim()) {
      setNome(name);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center z-50 p-4 overflow-y-auto animate-fade-in">
      <div 
        id="product-form-card" 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 my-8 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-pink-950/20 flex items-center justify-between bg-slate-900 text-white">
          <div>
            <h3 className="text-lg font-bold">
              {initialProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </h3>
            <p className="text-xs text-pink-200 mt-0.5">
              Preencha as especificações da peça para atualizar o catálogo.
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <span className="font-semibold">&#9888; Erro:</span> {error}
            </div>
          )}

          {/* Grids Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome do Produto */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome do Produto *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Type className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Camiseta Oversized Vintage Algodão Black"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* Preço de Venda */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Preço de Venda (R$) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs select-none">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="0,00"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Categoria *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono">
                  <Tag className="w-4 h-4" />
                </span>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
                >
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sizing & Stocks Grid Section */}
            <div className="md:col-span-2 border border-pink-100 bg-pink-50/20 p-4 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-pink-500" />
                    Grade de Tamanhos & Estoques
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Selecione os tamanhos que possui e informe o estoque de cada um. O estoque total será preenchido automaticamente.
                  </p>
                </div>
                
                <span className="self-start sm:self-center px-2.5 py-1 bg-pink-100 text-pink-700 text-[10px] font-black rounded-lg uppercase tracking-wider whitespace-nowrap">
                  Total da Grade: {(Object.values(sizeStocks) as number[]).reduce((acc, curr) => acc + curr, 0)} pçs
                </span>
              </div>

              {/* Fast size toggle pills */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Tamanhos Disponíveis (Clique para ativar):</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_SIZES.map((size) => {
                    const isActive = sizeStocks.hasOwnProperty(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleToggleSize(size)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${
                          isActive 
                            ? 'bg-pink-600 border-pink-600 text-white shadow-xs font-bold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-pink-300 hover:bg-pink-50/10'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Add Size Form Row */}
              <div className="flex gap-2 items-end pt-1 border-t border-slate-150/40">
                <div className="flex-1 max-w-[200px]">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Adicionar Outro Tamanho / Número
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 48, G1, Único"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    className="block w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSize();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomSize}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-sm"
                >
                  + Incluir
                </button>
              </div>

              {/* Table or Grid of active custom stocks */}
              {Object.keys(sizeStocks).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-inner">
                  {Object.entries(sizeStocks).map(([sz, stock]) => (
                    <div key={sz} className="relative bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between gap-1 group">
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(sz)}
                        className="absolute top-1 right-1 p-0.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition cursor-pointer"
                        title="Remover tamanho"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      
                      <span className="text-xs font-black text-pink-700 pr-5">{sz}</span>
                      
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-slate-400 font-bold uppercase block">Estoque</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={stock}
                          onChange={(e) => handleUpdateStock(sz, e.target.value)}
                          placeholder="0"
                          className="block w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-250 rounded-xl bg-white text-slate-400 text-xs">
                  Nenhum tamanho ativo. Selecione tamanhos rápidos acima para montar sua grade.
                </div>
              )}
            </div>

            {/* Imagem do Produto com Opção de Upload */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Imagem do Produto * (Envie do computador ou use URL)
              </label>
              
              {uploadError && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2">
                  <span className="font-bold shrink-0">⚠️ Nota de Upload:</span>
                  <p className="leading-relaxed">{uploadError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                {/* Upload from Computer Container */}
                <div className="border border-dashed border-slate-250 hover:border-pink-500 bg-slate-50/50 hover:bg-pink-50/5 p-4 rounded-xl text-center space-y-1.5 relative transition duration-250 min-h-[100px] flex flex-col justify-center items-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProductImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    disabled={isUploadingImage}
                  />
                  {isUploadingImage ? (
                    <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700">Enviar Foto do PC</span>
                      <span className="text-[10px] text-slate-400">Arraste ou clique para selecionar</span>
                    </div>
                  )}
                </div>

                {/* Direct Image URL input */}
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Image className="w-4 h-4" />
                    </span>
                    <input
                      type="url"
                      value={imagem}
                      onChange={(e) => setImagem(e.target.value)}
                      placeholder="Ou cole a URL da imagem aqui..."
                      className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  {imagem && (
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-150 relative">
                      <img
                        src={imagem}
                        alt="Preview"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540221129048-8e178929e52b?w=600&auto=format&fit=crop&q=80'; }}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-white"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block leading-none">Preview</span>
                        <span className="text-xs text-slate-600 truncate block mt-1">{imagem}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImagem('')}
                        className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                        title="Remover imagem"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Aesthetic Images Presets List - Incremental value-add for beautiful store generation */}
              <div className="mt-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Ou selecione uma foto de alta qualidade da nossa curadoria de moda:
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar max-w-full">
                  {IMAGE_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectPreset(p.url, p.category, p.name)}
                      className={`h-11 px-2.5 border rounded-lg shrink-0 flex items-center gap-2 hover:border-pink-600 hover:bg-slate-50 transition text-left cursor-pointer ${imagem === p.url ? 'border-pink-600 bg-pink-50 ring-1 ring-pink-600' : 'border-slate-200 bg-white'}`}
                    >
                      <img 
                        src={p.url} 
                        alt={p.name} 
                        className="w-7 h-7 rounded-md object-cover border border-slate-100" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="leading-tight shrink-0">
                        <div className="text-[10px] font-bold text-slate-800 line-clamp-1">{p.name}</div>
                        <div className="text-[8px] font-medium text-slate-400">{p.category}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Descrição do Produto */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Descrição ou Detalhes da Roupa
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                placeholder="Explicite detalhes do tecido, caimento ou especificações da peça de vestuário."
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              ></textarea>
            </div>

            {/* Controle de Exibição e Promoção */}
            <div className="md:col-span-2 border border-slate-100 bg-slate-50/40 p-4 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-150 pb-2">
                <Compass className="w-4 h-4 text-pink-500" />
                Controle de Exibição e Promoção
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ativo toggle */}
                <div id="toggle-ativo" className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-150">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">Produto Ativo</span>
                    <span className="text-[10px] text-slate-500 block">Exibir no catálogo público</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAtivo(!ativo)}
                    className={`w-12 h-6 rounded-full p-0.5 transition-all cursor-pointer relative shrink-0 ${ativo ? 'bg-pink-600' : 'bg-slate-300'}`}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full transition-all duration-300 ${ativo ? 'translate-x-6' : 'translate-x-0'}`}></span>
                  </button>
                </div>

                {/* Banner toggle */}
                <div id="toggle-banner" className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-150">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">Destaque em Banner</span>
                    <span className="text-[10px] text-slate-500 block">Exibir no carrossel principal</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBanner(!banner)}
                    className={`w-12 h-6 rounded-full p-0.5 transition-all cursor-pointer relative shrink-0 ${banner ? 'bg-pink-600' : 'bg-slate-300'}`}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full transition-all duration-300 ${banner ? 'translate-x-6' : 'translate-x-0'}`}></span>
                  </button>
                </div>

                {/* Destaque toggle */}
                <div id="toggle-destaque" className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-150">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">Seção Especiais / Novidades</span>
                    <span className="text-[10px] text-slate-500 block">Colocar na vitrine de destaque</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDestaque(!destaque)}
                    className={`w-12 h-6 rounded-full p-0.5 transition-all cursor-pointer relative shrink-0 ${destaque ? 'bg-pink-600' : 'bg-slate-300'}`}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full transition-all duration-300 ${destaque ? 'translate-x-6' : 'translate-x-0'}`}></span>
                  </button>
                </div>

                {/* Em Promoção toggle */}
                <div id="toggle-em-promocao" className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-150">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">Peça em Promoção</span>
                    <span className="text-[10px] text-slate-500 block">Habilitar preço de desconto</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmPromocao(!emPromocao)}
                    className={`w-12 h-6 rounded-full p-0.5 transition-all cursor-pointer relative shrink-0 ${emPromocao ? 'bg-pink-600' : 'bg-slate-300'}`}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full transition-all duration-300 ${emPromocao ? 'translate-x-6' : 'translate-x-0'}`}></span>
                  </button>
                </div>
              </div>

              {/* Preço Promocional sub-field */}
              {emPromocao && (
                <div id="promo-price-input" className="p-3 bg-white border border-rose-100 rounded-xl space-y-1.5 animate-fade-in">
                  <label className="block text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                    Preço Promocional (R$) *
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-rose-500 font-bold text-xs select-none">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required={emPromocao}
                      min="0.01"
                      value={precoPromocional}
                      onChange={(e) => setPrecoPromocional(e.target.value)}
                      placeholder="Preço promocional..."
                      className="block w-full pl-9 pr-3 py-1.5 border border-rose-200 rounded-lg text-rose-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-rose-50/10"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Preço original de venda: <strong>R$ {preco || '0.00'}</strong>. Insira um valor menor.
                  </span>
                </div>
              )}

              {/* Banner custom options */}
              {banner && (
                <div id="banner-custom-panel" className="p-3 bg-white border border-sky-100 rounded-xl space-y-3.5 animate-fade-in mt-3">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <Palette className="w-4 h-4 text-sky-500" />
                    <span className="text-[11px] font-bold text-sky-850 uppercase tracking-wider">Configuração do Banner Promocional</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Banner Image file & input */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Imagem de Fundo do Banner</label>
                      
                      <div className="border border-dashed border-slate-200 hover:border-sky-400 bg-slate-50/40 p-3 rounded-lg text-center space-y-1 relative cursor-pointer flex flex-col items-center justify-center min-h-[75px]">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          disabled={isUploadingBanner}
                        />
                        {isUploadingBanner ? (
                          <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-700">Enviar Arte/Banner</span>
                            <span className="text-[8px] text-slate-400">Clique ou arraste a imagem de banner</span>
                          </>
                        )}
                      </div>

                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 pointer-events-none">
                          <Image className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="url"
                          value={bannerImage}
                          onChange={(e) => setBannerImage(e.target.value)}
                          placeholder="Ou insira link da imagem de banner..."
                          className="block w-full pl-8 pr-2 py-1 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 text-slate-800 focus:outline-none placeholder-slate-400 bg-white"
                        />
                      </div>

                      {bannerImage && (
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-150 relative truncate">
                          <img
                            src={bannerImage}
                            alt="Preview do Banner"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&auto=format&fit=crop&q=80'; }}
                            className="w-10 h-7 rounded object-cover border border-slate-200 bg-white shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-1 text-[10px] text-slate-500">
                            <span className="block text-[8px] font-semibold uppercase text-slate-400 leading-none">Arte do Banner</span>
                            <span className="block truncate mt-1 text-[9px] leading-tight">{bannerImage}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setBannerImage('')}
                            className="text-slate-400 hover:text-red-500 p-1 shrink-0 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Banner Color Picker & custom Background */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cor de Fundo (Padrão ou Customizada)</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={bannerBg.startsWith('#') ? bannerBg : '#fdf2f8'}
                          onChange={(e) => setBannerBg(e.target.value)}
                          className="w-8 h-8 rounded-md cursor-pointer border border-slate-200 flex-shrink-0 bg-transparent p-0"
                        />
                        <input
                          type="text"
                          value={bannerBg}
                          onChange={(e) => setBannerBg(e.target.value)}
                          placeholder="Ex: #fdf2f8 ou gradiente"
                          className="block w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 bg-white"
                        />
                      </div>

                      {/* Cool palette suggests */}
                      <div className="space-y-1 pt-0.5">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Sugestões de fundos elegantes:</span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { label: 'Rosa Soft', value: '#fdf2f8' },
                            { label: 'Cereja', value: '#fff1f2' },
                            { label: 'Bruto Escuro', value: '#111827' },
                            { label: 'Algodão', value: '#fafaf9' },
                            { label: 'Violeta Lilá', value: '#f5f3ff' },
                          ].map((preset) => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => setBannerBg(preset.value)}
                              className={`px-1.5 py-0.5 text-[8px] font-bold rounded border transition cursor-pointer flex items-center gap-0.5 ${bannerBg === preset.value ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-150 bg-slate-50 hover:bg-slate-100 text-slate-500'}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full border border-slate-200" style={{ backgroundColor: preset.value }}></span>
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="px-1 py-1 flex items-center justify-end gap-3 border-t border-slate-150 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{initialProduct ? 'Atualizar Produto' : 'Adicionar ao Catálogo'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
