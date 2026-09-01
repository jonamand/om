import { Link } from "react-router-dom";
import type { Product } from "../lib/supabase";
import { formatPrice } from "../lib/format";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { ShoppingCart, Star, Download } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { profile } = useAuth();
  const isAdmin = profile && ["super_admin", "admin_content", "admin_moderation"].includes(profile.role);

  const avgRating =
    product.reviews && product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0;

  return (
    <div className="card card-hover group flex flex-col overflow-hidden">
      <Link to={`/boutique/${product.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-ink-100">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute top-3 left-3 badge bg-white/90 backdrop-blur-sm text-ink-700 uppercase">
          {product.file_type}
        </span>
        {product.download_count > 200 && (
          <span className="absolute top-3 right-3 badge bg-sun-400 text-ink-900">
            <Download className="w-3 h-3" /> Populaire
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-2">
          {product.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="badge bg-sakura-50 text-sakura-600">
              {tag}
            </span>
          ))}
        </div>

        <Link to={`/boutique/${product.slug}`}>
          <h3 className="font-display font-semibold text-ink-900 line-clamp-2 group-hover:text-sakura-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mt-2">
          {avgRating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-sun-400 text-sun-400" />
              <span className="text-xs font-medium text-ink-600">{avgRating.toFixed(1)}</span>
            </div>
          )}
          <span className="text-xs text-ink-400">{product.download_count} téléchargements</span>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="font-display font-bold text-lg text-ink-900">
            {formatPrice(product.price, product.currency)}
          </span>
          {!isAdmin && (
            <button
              className="p-2.5 rounded-xl bg-sakura-50 text-sakura-600 hover:bg-sakura-500 hover:text-white transition-all"
              onClick={(e) => {
                e.preventDefault();
                addItem(product);
              }}
              aria-label="Ajouter au panier"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-24 skeleton" />
        <div className="h-5 w-full skeleton" />
        <div className="h-4 w-32 skeleton" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 w-16 skeleton" />
          <div className="h-9 w-9 rounded-xl skeleton" />
        </div>
      </div>
    </div>
  );
}
