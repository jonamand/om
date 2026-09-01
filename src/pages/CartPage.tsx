import { Link } from "react-router-dom";
import { useCart } from "../lib/cart";
import { formatPrice } from "../lib/format";
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, count, clear } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-ink-100 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10 text-ink-300" />
        </div>
        <h1 className="font-display font-bold text-2xl text-ink-900 mb-2">Votre panier est vide</h1>
        <p className="text-ink-500 mb-6">Découvrez nos templates cosplay, fichiers 3D et tutoriels.</p>
        <Link to="/boutique" className="btn-primary">Explorer la boutique</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-2xl text-ink-900">Mon panier ({count})</h1>
        <button className="text-sm text-ink-500 hover:text-error-600 transition-colors" onClick={clear}>
          Vider le panier
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.product.id} className="card p-4 flex gap-4">
            <Link to={`/boutique/${item.product.slug}`} className="w-24 h-24 rounded-xl overflow-hidden bg-ink-100 flex-shrink-0">
              <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/boutique/${item.product.slug}`} className="font-medium text-ink-900 hover:text-sakura-600 line-clamp-2">
                {item.product.name}
              </Link>
              <p className="text-sm text-ink-400 mt-0.5">{item.product.file_type.toUpperCase()} · {item.product.tags[0]}</p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 rounded-lg border border-ink-200 flex items-center justify-center hover:bg-ink-50" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-medium w-8 text-center">{item.quantity}</span>
                  <button className="w-8 h-8 rounded-lg border border-ink-200 flex items-center justify-center hover:bg-ink-50" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button className="text-ink-400 hover:text-error-600 transition-colors" onClick={() => removeItem(item.product.id)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-lg text-ink-900">{formatPrice(item.product.price * item.quantity, item.product.currency)}</p>
              <p className="text-xs text-ink-400">{formatPrice(item.product.price, item.product.currency)} / unité</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-ink-600">Sous-total</span>
          <span className="font-medium">{formatPrice(total)}</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-ink-600">Frais de livraison</span>
          <span className="font-medium text-matcha-600">Numérique — gratuit</span>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-ink-100">
          <span className="font-display font-bold text-lg">Total</span>
          <span className="font-display font-extrabold text-xl text-ink-900">{formatPrice(total)}</span>
        </div>
        <Link to="/checkout" className="btn-primary w-full mt-5 text-base py-3">
          Passer commande <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
