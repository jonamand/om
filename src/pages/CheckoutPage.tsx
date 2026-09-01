import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { formatPrice } from "../lib/format";
import { Lock, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const { session } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (!session) return;
    setProcessing(true);
    setError(null);

    try {
      const externalId = `CMD-${Date.now()}`;
      const returnUrl = `${window.location.origin}/paiement/retour?ref=${externalId}`;
      const cancelUrl = `${window.location.origin}/paiement/retour?ref=${externalId}&cancelled=1`;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: session.user.id,
          total,
          currency: "USD",
          status: "pending",
          payment_method: "kpay",
          payment_external_id: externalId,
        })
        .select()
        .maybeSingle();

      if (orderError || !order) {
        setError("Impossible de créer la commande. Veuillez réessayer.");
        setProcessing(false);
        return;
      }

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        price: item.product.price,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) {
        setError("Impossible d'enregistrer les articles de la commande. Veuillez réessayer.");
        setProcessing(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kpay-init`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            amount: Math.round(total),
            externalId,
            description: `Commande OtakuMania #${order.id.slice(0, 8).toUpperCase()}`,
            returnUrl,
          }),
        },
      );

      if (!response.ok) {
        setError("Le service de paiement est indisponible. Veuillez réessayer.");
        setProcessing(false);
        return;
      }

      const data = await response.json();

      if (typeof data.gatewayUrl === "string" && typeof data.id === "string") {
        const { error: paymentLinkError } = await supabase
          .from("orders")
          .update({ payment_id: data.id })
          .eq("id", order.id);
        if (paymentLinkError) {
          setError("Impossible de relier la commande au paiement. Veuillez réessayer.");
          setProcessing(false);
          return;
        }
        sessionStorage.setItem("pending_order_id", order.id);
        sessionStorage.setItem("pending_order_external", externalId);
        sessionStorage.setItem("pending_payment_id", data.id);
        window.location.href = data.gatewayUrl;
      } else {
        setError("La page de paiement n'a pas pu être chargée. Veuillez réessayer.");
        setProcessing(false);
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setProcessing(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display font-bold text-2xl text-ink-900 mb-2">Panier vide</h1>
        <p className="text-ink-500 mb-6">Ajoutez des produits avant de passer commande.</p>
        <Link to="/boutique" className="btn-primary">Aller à la boutique</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <Link to="/panier" className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour au panier
      </Link>

      <h1 className="font-display font-extrabold text-2xl text-ink-900 mb-6">Paiement</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-matcha-600" />
              <div>
                <h2 className="font-display font-bold text-lg text-ink-900">Paiement sécurisé via K-Pay</h2>
                <p className="text-sm text-ink-400">Mobile Money, carte bancaire et PayPal</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-ink-50">
                <div className="w-10 h-10 rounded-xl bg-matcha-100 flex items-center justify-center text-lg">📱</div>
                <div>
                  <p className="font-semibold text-ink-900 text-sm">Mobile Money</p>
                  <p className="text-xs text-ink-400">MTN, Orange, Wave, MoMo, M-Pesa et plus</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-ink-50">
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-lg">💳</div>
                <div>
                  <p className="font-semibold text-ink-900 text-sm">Carte bancaire</p>
                  <p className="text-xs text-ink-400">Visa, Mastercard</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-ink-50">
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-lg">🅿️</div>
                <div>
                  <p className="font-semibold text-ink-900 text-sm">PayPal</p>
                  <p className="text-xs text-ink-400">Paiement international</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="card p-4 bg-error-50 border-error-100">
              <p className="text-sm text-error-600">{error}</p>
            </div>
          )}

          <div className="card p-4 flex items-center gap-3 bg-matcha-50 border-matcha-100">
            <Lock className="w-5 h-5 text-matcha-600 flex-shrink-0" />
            <p className="text-sm text-matcha-700">
              Vous serez redirigé vers la page sécurisée K-Pay pour finaliser votre paiement.
            </p>
          </div>
        </div>

        <div className="card p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-display font-bold text-lg text-ink-900 mb-4">Récapitulatif</h2>
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={item.product.id} className="flex gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-ink-100 flex-shrink-0">
                  <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 line-clamp-1">{item.product.name}</p>
                  <p className="text-xs text-ink-400">Quantité: {item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-ink-900">{formatPrice(item.product.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-ink-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Sous-total</span>
              <span className="font-medium">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Livraison</span>
              <span className="font-medium text-matcha-600">Gratuit</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-ink-100">
              <span className="font-display font-bold text-lg">Total</span>
              <span className="font-display font-extrabold text-xl text-ink-900">{formatPrice(total)}</span>
            </div>
          </div>
          <button className="btn-primary w-full mt-5 text-base py-3" onClick={handleCheckout} disabled={processing}>
            {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirection...</> : <>Payer {formatPrice(total)}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
