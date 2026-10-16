import { Link } from "react-router-dom";
import { useCart } from "../lib/cart";
import { formatPrice } from "../lib/format";
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, count, clear } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10 text-white/45" />
        </div>
        <h1 className="font-display font-bold text-2xl text-white mb-2">Votre panier est vide</h1>
        <p className="text-white/70 mb-6">Découvrez nos templates cosplay, fichiers 3D et tutoriels.</p>
        <Link to="/boutique" className="btn-primary">Explorer la boutique</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-2xl text-white">Mon panier ({count})</h1>
        <button className="text-sm text-white/70 hover:text-error-500 transition-colors" onClick={clear}>
          Vider le panier
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.product.id} className="card p-4 flex gap-4">
            <Link to={`/boutique/${item.product.slug}`} className="w-24 h-24 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
              <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/boutique/${item.product.slug}`} className="font-medium text-white hover:text-sakura-300 line-clamp-2">
                {item.product.name}
              </Link>
              <p className="text-sm text-white/55 mt-0.5">{item.product.file_type.toUpperCase()} · {item.product.tags[0]}</p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-medium w-8 text-center">{item.quantity}</span>
                  <button className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button className="text-white/55 hover:text-error-500 transition-colors" onClick={() => removeItem(item.product.id)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-lg text-white">{Number(item.product.price) === 0 ? "Gratuit" : formatPrice(item.product.price * item.quantity, item.product.currency)}</p>
              <p className="text-xs text-white/55">{Number(item.product.price) === 0 ? "Gratuit" : formatPrice(item.product.price, item.product.currency)} / unité</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/80">Sous-total</span>
          <span className="font-medium">{formatPrice(total)}</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/80">Frais de livraison</span>
          <span className="font-medium text-matcha-300">Numérique — gratuit</span>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <span className="font-display font-bold text-lg">Total</span>
          <span className="font-display font-extrabold text-xl text-white">{formatPrice(total)}</span>
        </div>
        <Link to="/checkout" className="btn-primary w-full mt-5 text-base py-3">
          Passer commande <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
