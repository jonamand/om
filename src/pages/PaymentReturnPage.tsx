import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCart } from "../lib/cart";
import { Check, X, Loader2, Download, AlertCircle } from "lucide-react";

type Status = "loading" | "success" | "failed" | "pending";

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const { clear } = useCart();
  const [status, setStatus] = useState<Status>("loading");
  const [orderId, setOrderId] = useState<string>("");

  useEffect(() => {
    async function verifyPayment() {
      const externalId = searchParams.get("ref");
      const isFree = searchParams.get("free") === "1";

      // Free order: already marked as paid during checkout, skip K-Pay verification
      if (isFree && externalId) {
        setOrderId(externalId);
        clear();
        setStatus("success");
        return;
      }

      const storedOrderId = sessionStorage.getItem("pending_order_id");
      const storedExternal = sessionStorage.getItem("pending_order_external");
      const paymentId = sessionStorage.getItem("pending_payment_id");

      if (!externalId || !storedOrderId || !storedExternal || !paymentId) {
        setStatus("failed");
        return;
      }

      try {
        let attempts = 0;
        let paymentStatus: string | null = null;

        while (attempts < 5) {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kpay-status?id=${encodeURIComponent(paymentId)}`,
            {
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
            },
          );

          if (response.ok) {
            const data = await response.json();
            paymentStatus = data.status;
            if (data.status === "COMPLETED") {
              break;
            } else if (data.status === "FAILED" || data.status === "CANCELLED") {
              break;
            }
          }

          attempts++;
          if (attempts < 5) {
            await new Promise((r) => setTimeout(r, 2000));
          }
        }

        if (paymentStatus === "COMPLETED") {
          setOrderId(storedOrderId);
          clear();
          sessionStorage.removeItem("pending_order_id");
          sessionStorage.removeItem("pending_order_external");
          sessionStorage.removeItem("pending_payment_id");
          setStatus("success");
        } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
          sessionStorage.removeItem("pending_order_id");
          sessionStorage.removeItem("pending_order_external");
          sessionStorage.removeItem("pending_payment_id");
          setStatus("failed");
        } else {
          setStatus("pending");
        }
      } catch {
        setStatus("failed");
      }
    }

    verifyPayment();
  }, [searchParams, clear]);

  if (status === "loading") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-sakura-50 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-8 h-8 text-sakura-500 animate-spin" />
        </div>
        <h1 className="font-display font-extrabold text-xl text-ink-900 mb-2">Vérification du paiement...</h1>
        <p className="text-ink-500">Nous confirmons votre transaction auprès de K-Pay.</p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-sun-50 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-sun-500" />
        </div>
        <h1 className="font-display font-extrabold text-xl text-ink-900 mb-2">Paiement en cours de traitement</h1>
        <p className="text-ink-500 mb-6">Votre paiement est en cours de confirmation. Vous pouvez vérifier le statut dans votre espace.</p>
        <Link to="/mon-espace" className="btn-primary">Voir mes commandes</Link>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-error-50 flex items-center justify-center mx-auto mb-6 animate-scale-in">
          <X className="w-8 h-8 text-error-600" />
        </div>
        <h1 className="font-display font-extrabold text-xl text-ink-900 mb-2">Paiement échoué</h1>
        <p className="text-ink-500 mb-6">La transaction n'a pas abouti. Aucun montant n'a été débité.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/panier" className="btn-primary">Réessayer</Link>
          <Link to="/boutique" className="btn-outline">Retour à la boutique</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-matcha-50 flex items-center justify-center mx-auto mb-6 animate-scale-in">
        <Check className="w-10 h-10 text-matcha-600" />
      </div>
      <h1 className="font-display font-extrabold text-2xl text-ink-900 mb-2">Paiement confirmé !</h1>
      <p className="text-ink-500 mb-6">
        Merci pour votre achat. Vos fichiers sont maintenant disponibles dans votre espace.
      </p>
      {orderId && (
        <div className="card p-5 mb-6 text-left">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-500">N° de commande</span>
            <span className="font-mono font-bold text-ink-900">#{orderId.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      )}
      <div className="flex gap-3 justify-center">
        <Link to="/mon-espace" className="btn-primary">
          <Download className="w-5 h-5" /> Télécharger mes fichiers
        </Link>
        <Link to="/boutique" className="btn-outline">Continuer mes achats</Link>
      </div>
    </div>
  );
}
