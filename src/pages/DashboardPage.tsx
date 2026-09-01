import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { supabase, type Order, type Ticket, type Product } from "../lib/supabase";
import { formatPrice, formatDate } from "../lib/format";
import VideoPlayer from "../components/VideoPlayer";
import {
  Download,
  Ticket as TicketIcon,
  ShoppingBag,
  Calendar,
  QrCode,
  Package,
  TrendingUp,
  PlayCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { profile, session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [videoProducts, setVideoProducts] = useState<Product[]>([]);
  const [activeVideo, setActiveVideo] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const [{ data: orderData }, { data: ticketData }] = await Promise.all([
        supabase
          .from("orders")
          .select("*, items:order_items(*)")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("tickets")
          .select("*, event:events(*)")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
      ]);
      setOrders(orderData as unknown as Order[] ?? []);
      setTickets(ticketData as unknown as Ticket[] ?? []);

      const paidOrders = (orderData as unknown as Order[] | null)?.filter((o) => o.status === "paid") ?? [];
      const productIds = paidOrders.flatMap((o) => o.items?.map((i) => i.product_id) ?? []);
      if (productIds.length > 0) {
        const { data: prodData } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds)
          .eq("file_type", "mp4")
          .neq("file_url", "#");
        setVideoProducts(prodData as unknown as Product[] ?? []);
      }

      setLoading(false);
    })();
  }, [session]);

  const totalSpent = orders.filter((o) => o.status === "paid").reduce((s, o) => s + Number(o.total), 0);
  const activeTickets = tickets.filter((t) => t.status === "valid");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-ink-900">Mon espace</h1>
          <p className="text-ink-500 text-sm mt-1">Bienvenue, {profile?.full_name ?? profile?.username}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sakura-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-sakura-500" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-ink-900">{orders.length}</p>
              <p className="text-xs text-ink-400">Commandes</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-matcha-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-matcha-600" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-ink-900">{formatPrice(totalSpent)}</p>
              <p className="text-xs text-ink-400">Total dépensé</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <TicketIcon className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-ink-900">{activeTickets.length}</p>
              <p className="text-xs text-ink-400">Billets actifs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-sakura-500" />
            <h2 className="font-display font-bold text-lg text-ink-900">Mes achats</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 skeleton" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-10 h-10 text-ink-200 mx-auto mb-3" />
              <p className="text-sm text-ink-500 mb-3">Aucun achat pour le moment</p>
              <Link to="/boutique" className="btn-outline text-sm">Découvrir la boutique</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-ink-50">
                  <div>
                    <p className="font-mono text-sm font-bold text-ink-900">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-ink-400">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ink-900">{formatPrice(Number(order.total))}</p>
                    <span className={`badge ${order.status === "paid" ? "bg-matcha-50 text-matcha-600" : "bg-sun-50 text-sun-600"}`}>
                      {order.status === "paid" ? "Payé" : order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tickets */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TicketIcon className="w-5 h-5 text-sky-500" />
            <h2 className="font-display font-bold text-lg text-ink-900">Mes billets</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 skeleton" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-ink-200 mx-auto mb-3" />
              <p className="text-sm text-ink-500 mb-3">Aucun billet pour le moment</p>
              <Link to="/evenements" className="btn-outline text-sm">Voir les événements</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="p-4 rounded-xl bg-ink-50 border border-ink-100">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm text-ink-900">{ticket.event?.title ?? "Événement"}</p>
                      <p className="text-xs text-ink-400">{ticket.event ? formatDate(ticket.event.event_date) : ""}</p>
                    </div>
                    <span className={`badge ${ticket.status === "valid" ? "bg-matcha-50 text-matcha-600" : "bg-ink-100 text-ink-500"}`}>
                      {ticket.status === "valid" ? "Valide" : ticket.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-ink-100">
                    <QrCode className="w-4 h-4 text-ink-500" />
                    <span className="font-mono text-xs font-bold text-ink-700">{ticket.ticket_code}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Download section */}
      {orders.length > 0 && (
        <div className="card p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5 text-matcha-600" />
            <h2 className="font-display font-bold text-lg text-ink-900">Téléchargements</h2>
          </div>
          <p className="text-sm text-ink-500">
            Vos fichiers achetés sont disponibles immédiatement. Cliquez sur un produit pour télécharger son contenu.
          </p>
        </div>
      )}

      {/* Video Tutorials */}
      {videoProducts.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <PlayCircle className="w-5 h-5 text-sakura-500" />
            <h2 className="font-display font-bold text-lg text-ink-900">Tutoriels vidéo</h2>
          </div>
          {activeVideo ? (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-ink-900">{activeVideo.name}</h3>
                <button className="btn-ghost text-sm" onClick={() => setActiveVideo(null)}>Retour à la liste</button>
              </div>
              <VideoPlayer src={activeVideo.file_url} poster={activeVideo.image_url} title={activeVideo.name} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videoProducts.map((v) => (
                <button
                  key={v.id}
                  className="card overflow-hidden card-hover text-left"
                  onClick={() => setActiveVideo(v)}
                >
                  <div className="relative aspect-video bg-ink-100 overflow-hidden">
                    <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-ink-950/20 flex items-center justify-center">
                      <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-ink-900 line-clamp-1">{v.name}</p>
                    <p className="text-xs text-ink-400 mt-1">Tutoriel vidéo · HD</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
