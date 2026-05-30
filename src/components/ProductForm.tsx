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
        // Ensure PP, P, M, G, GG are always initialized as fields
        const loadedStocks = { ...initialProduct.tamanhos_estoque };
        ['PP', 'P', 'M', 'G', 'GG'].forEach(sz => {
          if (loadedStocks[sz] === undefined) {
            loadedStocks[sz] = 0;
          } else {
            loadedStocks[sz] = Math.max(0, Number(loadedStocks[sz]) || 0);
          }
        });
        Object.keys(loadedStocks).forEach(sz => {
          loadedStocks[sz] = Math.max(0, Number(loadedStocks[sz]) || 0);
        });
        setSizeStocks(loadedStocks);
      } else {
        // Legacy conversion
        const sizes = initialProduct.tamanho
          ? initialProduct.tamanho.split(',').map(s => s.trim()).filter(Boolean)
          : ['M'];
        const legacyMap: Record<string, number> = {
          'PP': 0, 'P': 0, 'M': 0, 'G': 0, 'GG': 0
        };
        if (sizes.length === 1) {
          legacyMap[sizes[0]] = Math.max(0, initialProduct.estoque || 0);
        } else {
          sizes.forEach((s, i) => {
            legacyMap[s] = i === 0 ? Math.max(0, initialProduct.estoque || 0) : 0;
          });
        }
        Object.keys(legacyMap).forEach(sz => {
          legacyMap[sz] = Math.max(0, Number(legacyMap[sz]) || 0);
        });
        setSizeStocks(legacyMap);
      }
    } else {
      // Clear for new product with PP, P, M, G, GG default to 0 as requested
      setNome('');
      setPreco('');
      setCategoria(PRESET_CATEGORIES[0]);
      setDescricao('');
      setImagem('');
      setSizeStocks({ 'PP': 0, 'P': 0, 'M': 0, 'G': 0, 'GG': 0 });
      
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

    // Sanitize size stocks to guarantee no negative numbers exist
    const sanitizedStocks: Record<string, number> = {};
    Object.entries(sizeStocks).forEach(([sz, val]) => {
      sanitizedStocks[sz] = Math.max(0, Number(val) || 0);
    });

    const totalEstoque = (Object.values(sanitizedStocks) as number[]).reduce((acc, curr) => acc + curr, 0);
    const tamanhoString = Object.keys(sanitizedStocks)
      .filter(sz => sanitizedStocks[sz] > 0 || ['PP', 'P', 'M', 'G', 'GG'].includes(sz))
      .join(', ');

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
        tamanhos_estoque: sanitizedStocks,
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-100/30 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-pink-500" />
                    Controle de Estoque por Tamanho
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Insira a quantidade em estoque para os tamanhos principais ou gerencie tamanhos adicionais.
                  </p>
                </div>
                
                <span className="self-start sm:self-center px-2.5 py-1 bg-pink-600 text-white text-[10px] font-black rounded-lg uppercase tracking-wider whitespace-nowrap shadow-sm">
                  Estoque Total: {(Object.values(sizeStocks) as number[]).reduce((sum, q) => sum + Number(q || 0), 0)} pçs
                </span>
              </div>

              {/* Grid with fields for PP, P, M, G, GG */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Estoque por Tamanho (PP, P, M, G, GG):</span>
                <div className="grid grid-cols-5 gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  {[
                    { key: 'PP', label: 'PP' },
                    { key: 'P', label: 'P' },
                    { key: 'M', label: 'M' },
                    { key: 'G', label: 'G' },
                    { key: 'GG', label: 'GG' },
                  ].map(({ key, label }) => {
                    const qty = sizeStocks[key] !== undefined ? sizeStocks[key] : 0;
                    return (
                      <div key={key} className="flex flex-col items-center gap-1 p-2 bg-slate-50/50 rounded-lg border border-slate-150 text-center">
                        <span className="text-xs font-extrabold text-pink-700">{label}</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={qty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const cleanVal = isNaN(val) ? 0 : Math.max(0, val);
                            setSizeStocks(prev => ({
                              ...prev,
                              [key]: cleanVal
                            }));
                          }}
                          className="block w-full px-1.5 py-1 text-center bg-white border border-slate-250 rounded-md text-xs font-bold focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900"
                          placeholder="0"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Manage extra custom sizes if needed */}
              {Object.keys(sizeStocks).some(sz => !['PP', 'P', 'M', 'G', 'GG'].includes(sz)) && (
                <div className="space-y-1.5 pt-2 border-t border-slate-150/40">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Outros Tamanhos Cadastrados:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                    {Object.entries(sizeStocks)
                      .filter(([sz]) => !['PP', 'P', 'M', 'G', 'GG'].includes(sz))
                      .map(([sz, stock]) => (
                        <div key={sz} className="relative bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(sz)}
                            className="absolute top-1 right-1 p-0.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition cursor-pointer"
                            title="Remover"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          
                          <span className="text-[10px] font-extrabold text-slate-700 pr-4">{sz}</span>
                          <input
                            type="number"
                            min="0"
                            required
                            value={stock}
                            onChange={(e) => handleUpdateStock(sz, e.target.value)}
                            className="block w-full px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-950"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Minimal field to add custom and non-standard sizes */}
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between pt-2 border-t border-slate-150/40">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Incluir Tamanho Adicional (Ex: G1, EG, Único):</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tamanho..."
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    className="block w-24 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSize();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 select-none text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>
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
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cor de Fundo ou Gradiente do Banner</label>
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
                          placeholder="Ex: #fdf2f8 ou linear-gradient(...)"
                          className="block w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 bg-white"
                        />
                      </div>

                      {/* Cool palette suggests with both gradients and solid colors */}
                      <div className="space-y-2 pt-0.5">
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Gradientes de Luxo:</span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { label: 'Rosé Imperial', value: 'linear-gradient(135deg, #fdf2f8 0%, #fff1f2 50%, #fef3c7 100%)' },
                              { label: 'Lilás Atelier', value: 'linear-gradient(135deg, #f5f3ff 0%, #fae8ff 50%, #fdf2f8 100%)' },
                              { label: 'Seda Celeste', value: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #fdf2f8 100%)' },
                              { label: 'Champagne', value: 'linear-gradient(135deg, #fafaf9 0%, #f5f5f4 55%, #ffe4e6 100%)' },
                              { label: 'Midnight Velvet', value: 'linear-gradient(135deg, #111827 0%, #1e1b4b 50%, #311042 100%)' },
                            ].map((preset) => (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => setBannerBg(preset.value)}
                                className={`px-1.5 py-0.5 text-[8px] font-bold rounded border transition cursor-pointer flex items-center gap-1 ${bannerBg === preset.value ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-150 bg-slate-50 hover:bg-slate-100 text-slate-500'}`}
                              >
                                <span className="w-2.5 h-2.5 rounded-full border border-slate-200/50 flex-shrink-0" style={{ background: preset.value }}></span>
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Cores Sólidas Premium:</span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { label: 'Preto Silk', value: '#111827' },
                              { label: 'Rosa Soft', value: '#fdf2f8' },
                              { label: 'Cereja', value: '#fff1f2' },
                              { label: 'Violeta Lilá', value: '#f5f3ff' },
                              { label: 'Algodão', value: '#fafaf9' },
                            ].map((preset) => (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => setBannerBg(preset.value)}
                                className={`px-1.5 py-0.5 text-[8px] font-bold rounded border transition cursor-pointer flex items-center gap-1 ${bannerBg === preset.value ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-150 bg-slate-50 hover:bg-slate-100 text-slate-500'}`}
                              >
                                <span className="w-2.5 h-2.5 rounded-full border border-slate-200 flex-shrink-0" style={{ backgroundColor: preset.value }}></span>
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Banner Live Preview Box */}
                  <div className="col-span-1 pt-1.5 border-t border-slate-100">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Visualização Prévia do Banner (Tempo Real)</span>
                    <div 
                      className="relative rounded-xl p-4 overflow-hidden min-h-[105px] flex flex-col justify-center border border-slate-200 transition-all duration-300"
                      style={{ 
                        background: bannerBg || '#fdf2f8',
                        color: (bannerBg.toLowerCase() === '#111827' || bannerBg.includes('111827') || bannerBg.includes('#1e1b4b')) ? '#ffffff' : '#0f172a'
                      }}
                    >
                      {/* Interactive custom banner optional background decorative image representation */}
                      {bannerImage && (
                        <div 
                          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30 transition-all duration-300"
                          style={{ backgroundImage: `url(${bannerImage})` }}
                        />
                      )}
                      
                      {/* Soft protective drop overlay for text readability without darkening too much */}
                      <div className="absolute inset-0 bg-black/[0.02] pointer-events-none"></div>

                      <div className="relative z-10 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block px-1.5 py-0.5 bg-pink-600 text-white text-[8px] font-black uppercase tracking-wider rounded-md">
                            {categoria || PRESET_CATEGORIES[0]} &bull; Destaque
                          </span>
                        </div>
                        <h3 className="text-sm font-black tracking-tight leading-tight uppercase font-sans">
                          {nome || 'Nome do Produto Exemplo'}
                        </h3>
                        <p className="text-[10px] opacity-80 line-clamp-1 max-w-[85%] font-medium">
                          {descricao || 'Insira uma descrição elegante do seu produto de alta costura...'}
                        </p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-xs font-black">
                            R$ {emPromocao && precoPromocional ? Number(precoPromocional).toFixed(2) : Number(preco || 0).toFixed(2)}
                          </span>
                          {emPromocao && precoPromocional && (
                            <span className="text-[9px] line-through opacity-60">
                              R$ {Number(preco || 0).toFixed(2)}
                            </span>
                          )}
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
