import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase, type Product, type Review } from "../lib/supabase";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { formatPrice, timeAgo } from "../lib/format";
import VideoPlayer, { LockedVideoPlayer } from "../components/VideoPlayer";
import {
  ShoppingCart,
  Download,
  Star,
  ArrowLeft,
  Tag,
  FileText,
  Video,
  Check,
  Loader2,
} from "lucide-react";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { session, profile } = useAuth();
  const isAdmin = profile && ["super_admin", "admin_content", "admin_moderation"].includes(profile.role);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("*, category:categories(*)")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (data) {
        setProduct(data as unknown as Product);
        const { data: revData } = await supabase
          .from("reviews")
          .select("*, profile:profiles(*)")
          .eq("product_id", data.id)
          .eq("status", "approved")
          .order("created_at", { ascending: false });
        setReviews(revData as unknown as Review[] ?? []);

        if (session) {
          const { data: purchaseData } = await supabase
            .from("order_items")
            .select("order:orders(status)")
            .eq("product_id", data.id)
            .eq("order.user_id", session.user.id);
          const purchased = (purchaseData as unknown as { order: { status: string } }[] | null)?.some(
            (item) => item.order?.status === "paid"
          ) ?? false;
          setHasPurchased(purchased);
        }
      }
      setLoading(false);
    })();
  }, [slug, session]);

  function handleAddToCart() {
    if (!product) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const isVideo = product?.file_type === "mp4";
  const hasFileUrl = Boolean(product?.file_url && product.file_url !== "#");
  const hasDownloadableFile = !isVideo && hasFileUrl;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square skeleton rounded-2xl" />
          <div className="space-y-4">
            <div className="h-6 w-32 skeleton" />
            <div className="h-8 w-full skeleton" />
            <div className="h-4 w-3/4 skeleton" />
            <div className="h-10 w-32 skeleton" />
            <div className="h-32 w-full skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display font-bold text-2xl text-ink-900 mb-2">Produit introuvable</h1>
        <p className="text-ink-500 mb-6">Ce produit n'existe pas ou n'est plus disponible.</p>
        <Link to="/boutique" className="btn-primary">Retour à la boutique</Link>
      </div>
    );
  }

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/boutique" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à la boutique
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image or Video */}
          {isVideo && hasFileUrl ? (
            hasPurchased ? (
              <VideoPlayer src={product.file_url} poster={product.image_url} title={product.name} />
            ) : (
              <LockedVideoPlayer
                poster={product.image_url}
                title={product.name}
                unlockLabel="Ajouter au panier"
                onUnlock={() => !isAdmin && handleAddToCart()}
              />
            )
          ) : (
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-ink-100 shadow-sm">
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              <span className="absolute top-4 left-4 badge bg-white/90 backdrop-blur-sm text-ink-700 uppercase">
                {isVideo ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />} {product.file_type}
              </span>
            </div>
          )}

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              {product.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="badge bg-sakura-50 text-sakura-600">
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>

            <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-900 mb-3">{product.name}</h1>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(avgRating) ? "fill-sun-400 text-sun-400" : "text-ink-200"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-ink-500">
                  {reviews.length > 0 ? `${avgRating.toFixed(1)} (${reviews.length} avis)` : "Pas encore d'avis"}
                </span>
              </div>
              <span className="text-sm text-ink-400">·</span>
              <span className="text-sm text-ink-500">{product.download_count} téléchargements</span>
            </div>

            <p className="font-display font-extrabold text-3xl text-ink-900 mb-6">
              {Number(product.price) === 0 ? "Gratuit" : formatPrice(product.price, product.currency)}
            </p>

            <p className="text-ink-600 leading-relaxed mb-6">{product.description}</p>

            <div className="card p-4 bg-ink-50 border-ink-100 mb-6">
              <h3 className="font-semibold text-sm text-ink-900 mb-3">Ce que vous obtenez</h3>
              <ul className="space-y-2 text-sm text-ink-600">
                {isVideo && hasFileUrl ? (
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-matcha-500" /> Vidéo tutoriel HD en streaming après achat</li>
                ) : (
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-matcha-500" /> Fichier {product.file_type.toUpperCase()} téléchargeable immédiatement</li>
                )}
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-matcha-500" /> Accès à vie dans « Mes achats »</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-matcha-500" /> Support communautaire via Discord</li>
              </ul>
            </div>

            {isAdmin ? (
              <div className="card p-4 bg-ink-50 border-ink-100 mt-auto">
                <p className="text-sm text-ink-500 text-center">Les administrateurs ne peuvent pas passer de commandes.</p>
              </div>
            ) : (
              <div className="space-y-3 mt-auto">
                {hasPurchased && hasDownloadableFile && (
                  <a
                    href={product.file_url}
                    download
                    className="btn-secondary w-full text-base py-3"
                  >
                    <Download className="w-5 h-5" /> Télécharger le fichier
                  </a>
                )}
                {hasPurchased && isVideo && hasFileUrl && (
                  <a
                    href={product.file_url}
                    download
                    className="btn-secondary w-full text-base py-3"
                  >
                    <Download className="w-5 h-5" /> Télécharger la vidéo
                  </a>
                )}
                {!hasPurchased && (
                  <div className="flex gap-3">
                    <button className="btn-primary flex-1 text-base py-3" onClick={handleAddToCart} disabled={added}>
                      {added ? <><Check className="w-5 h-5" /> Ajouté !</> : <><ShoppingCart className="w-5 h-5" /> Ajouter au panier</>}
                    </button>
                    <button
                      className="btn-secondary text-base py-3"
                      onClick={() => {
                        if (!session) {
                          navigate("/connexion");
                          return;
                        }
                        handleAddToCart();
                        navigate("/checkout");
                      }}
                    >
                      <Download className="w-5 h-5" /> {Number(product.price) === 0 ? "Obtenir" : "Acheter"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-16">
          <h2 className="section-title mb-6">Avis de la communauté</h2>
          {reviews.length === 0 ? (
            <div className="card p-8 text-center">
              <Star className="w-10 h-10 text-ink-200 mx-auto mb-3" />
              <p className="text-ink-500">Aucun avis pour le moment. Soyez le premier à donner votre avis après achat !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sakura-400 to-sakura-600 flex items-center justify-center text-white font-bold text-sm">
                        {review.profile?.username?.[0]?.toUpperCase() ?? "U"}
                      </div>
                      <div>
                        <p className="font-medium text-ink-900 text-sm">{review.profile?.username ?? "Utilisateur"}</p>
                        <p className="text-xs text-ink-400">{timeAgo(review.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-sun-400 text-sun-400" : "text-ink-200"}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-ink-600 leading-relaxed">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
