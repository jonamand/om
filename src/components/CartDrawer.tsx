import { Link } from "react-router-dom";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "../lib/cart";
import { formatPrice } from "../lib/format";

export default function CartDrawer() {
  const { items, isOpen, setOpen, removeItem, updateQuantity, total, count } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 bg-ink-950/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />
      <div
        className={`fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-ink-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-sakura-500" />
            <h2 className="font-display font-bold text-lg">Panier {count > 0 && `(${count})`}</h2>
          </div>
          <button
            className="p-2 hover:bg-ink-100 rounded-xl transition-colors"
            onClick={() => setOpen(false)}
          >
            <X className="w-5 h-5 text-ink-600" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-20 h-20 rounded-2xl bg-ink-100 flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-ink-300" />
            </div>
            <p className="text-ink-500 text-center">Votre panier est vide</p>
            <Link to="/boutique" className="btn-primary" onClick={() => setOpen(false)}>
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3 group">
                  <Link
                    to={`/boutique/${item.product.slug}`}
                    className="w-20 h-20 rounded-xl overflow-hidden bg-ink-100 flex-shrink-0"
                    onClick={() => setOpen(false)}
                  >
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/boutique/${item.product.slug}`}
                      className="font-medium text-sm text-ink-900 hover:text-sakura-600 line-clamp-2"
                      onClick={() => setOpen(false)}
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sakura-600 font-bold text-sm mt-1">
                      {Number(item.product.price) === 0 ? "Gratuit" : formatPrice(item.product.price, item.product.currency)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        className="w-7 h-7 rounded-lg border border-ink-200 flex items-center justify-center hover:bg-ink-50"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        className="w-7 h-7 rounded-lg border border-ink-200 flex items-center justify-center hover:bg-ink-50"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        className="ml-auto p-1.5 text-ink-400 hover:text-error-600"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-ink-100 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-ink-600 font-medium">Total</span>
                <span className="font-display font-bold text-xl text-ink-900">
                  {formatPrice(total)}
                </span>
              </div>
              <Link
                to="/panier"
                className="btn-outline w-full"
                onClick={() => setOpen(false)}
              >
                Voir le panier
              </Link>
              <Link
                to="/checkout"
                className="btn-primary w-full"
                onClick={() => setOpen(false)}
              >
                Passer commande
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
