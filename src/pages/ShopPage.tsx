import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase, type Product, type Category } from "../lib/supabase";
import { ProductCard, ProductCardSkeleton } from "../components/ProductCard";
import { Search, SlidersHorizontal, X } from "lucide-react";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get("categorie") ?? "";
  const searchQuery = searchParams.get("q") ?? "";
  const sortBy = searchParams.get("tri") ?? "popularite";

  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    (async () => {
      const [{ data: catData }, { data: prodData }] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase
          .from("products")
          .select("*, category:categories(*)")
          .eq("status", "published")
          .order("download_count", { ascending: false }),
      ]);

      setCategories(catData as Category[] ?? []);
      setProducts(prodData as unknown as Product[] ?? []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory) {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat) result = result.filter((p) => p.category_id === cat.id);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case "prix-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "prix-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "recent":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        result.sort((a, b) => b.download_count - a.download_count);
    }

    return result;
  }, [products, categories, selectedCategory, searchQuery, sortBy]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam("q", searchInput);
  }

  function clearFilters() {
    setSearchParams({});
    setSearchInput("");
  }

  const hasFilters = selectedCategory || searchQuery;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-display font-extrabold text-3xl text-ink-900 mb-2">Boutique</h1>
          <p className="text-ink-500">
            Templates cosplay, patrons EVA Foam, fichiers 3D et tutoriels vidéo par des créateurs d'Afrique.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
            <input
              type="text"
              placeholder="Rechercher un produit, un tag..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-field pl-11"
            />
            {searchInput && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                onClick={() => {
                  setSearchInput("");
                  updateParam("q", "");
                }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
          <select
            value={sortBy}
            onChange={(e) => updateParam("tri", e.target.value)}
            className="input-field sm:w-48 cursor-pointer"
          >
            <option value="popularite">Popularité</option>
            <option value="recent">Plus récents</option>
            <option value="prix-asc">Prix croissant</option>
            <option value="prix-desc">Prix décroissant</option>
          </select>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              !selectedCategory
                ? "bg-ink-900 text-white"
                : "bg-white border border-ink-200 text-ink-600 hover:border-ink-300"
            }`}
            onClick={() => updateParam("categorie", "")}
          >
            Tous les produits
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                selectedCategory === cat.slug
                  ? "bg-ink-900 text-white"
                  : "bg-white border border-ink-200 text-ink-600 hover:border-ink-300"
              }`}
              onClick={() => updateParam("categorie", cat.slug)}
            >
              {cat.name}
            </button>
          ))}
          {hasFilters && (
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-error-600 hover:bg-error-50 transition-colors ml-auto"
              onClick={clearFilters}
            >
              <X className="w-3.5 h-3.5" /> Effacer les filtres
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-ink-500 mb-4">
          {loading ? "Chargement..." : `${filteredProducts.length} produit${filteredProducts.length > 1 ? "s" : ""} trouvé${filteredProducts.length > 1 ? "s" : ""}`}
        </p>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-ink-100 flex items-center justify-center mx-auto mb-4">
              <SlidersHorizontal className="w-8 h-8 text-ink-300" />
            </div>
            <h3 className="font-display font-semibold text-lg text-ink-900 mb-2">Aucun produit trouvé</h3>
            <p className="text-ink-500 mb-4">Essayez de modifier vos critères de recherche.</p>
            <button className="btn-outline" onClick={clearFilters}>
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
