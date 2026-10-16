import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { supabase, type Order, type Ticket, type Product } from "../lib/supabase";
import { formatPrice, formatDate } from "../lib/format";
import VideoPlayer from "../components/VideoPlayer";
import { QRCodeSVG } from "qrcode.react";
import {
  Download,
  Ticket as TicketIcon,
  ShoppingBag,
  Calendar,
  QrCode,
  Package,
  TrendingUp,
  PlayCircle,
  Crown,
  Shield,
  Zap,
  Star,
  X,
} from "lucide-react";

const roleBadgeConfig: Record<string, { icon: typeof Crown; label: string; color: string; bg: string }> = {
  super_admin: { icon: Crown, label: "Super Admin", color: "text-sun-300", bg: "bg-sun-500/15" },
  admin_content: { icon: Shield, label: "Admin Contenu", color: "text-cyan-300", bg: "bg-cyan-500/15" },
  admin_moderation: { icon: Zap, label: "Modérateur", color: "text-matcha-300", bg: "bg-matcha-500/15" },
  creator: { icon: Star, label: "Créateur", color: "text-sakura-300", bg: "bg-sakura-500/15" },
  organizer: { icon: Star, label: "Organisateur", color: "text-white/80", bg: "bg-white/5" },
  user: { icon: Star, label: "Membre Otaku", color: "text-white/70", bg: "bg-white/5" },
};

export default function DashboardPage() {
  const { profile, session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [videoProducts, setVideoProducts] = useState<Product[]>([]);
  const [downloadProducts, setDownloadProducts] = useState<Product[]>([]);
  const [activeVideo, setActiveVideo] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

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
          .neq("file_url", "#");
        const all = prodData as unknown as Product[] ?? [];
        setVideoProducts(all.filter((p) => p.file_type === "mp4"));
        setDownloadProducts(all.filter((p) => p.file_type !== "mp4"));
      }

      setLoading(false);
    })();
  }, [session]);

  const totalSpent = orders.filter((o) => o.status === "paid").reduce((s, o) => s + Number(o.total), 0);
  const activeTickets = tickets.filter((t) => t.status === "valid");

  const roleKey = profile?.role ?? "user";
  const badge = roleBadgeConfig[roleKey] ?? roleBadgeConfig.user;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sakura-400 to-sakura-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile?.username ?? ""} className="w-full h-full object-cover" />
            ) : (
              profile?.username?.[0]?.toUpperCase() ?? "U"
            )}
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl text-white">Mon espace</h1>
            <p className="text-white/70 text-sm mt-0.5">Bienvenue, {profile?.full_name ?? profile?.username}</p>
            <span className={`badge mt-1 ${badge.bg} ${badge.color}`}>
              <badge.icon className="w-3.5 h-3.5" /> {badge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sakura-500/15 flex items-center justify-center">
              <Package className="w-5 h-5 text-sakura-400" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-white">{orders.length}</p>
              <p className="text-xs text-white/55">Commandes</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-matcha-500/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-matcha-300" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-white">{formatPrice(totalSpent)}</p>
              <p className="text-xs text-white/55">Total dépensé</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center">
              <TicketIcon className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-white">{activeTickets.length}</p>
              <p className="text-xs text-white/55">Billets actifs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-sakura-400" />
            <h2 className="font-display font-bold text-lg text-white">Mes achats</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 skeleton" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-10 h-10 text-white/35 mx-auto mb-3" />
              <p className="text-sm text-white/70 mb-3">Aucun achat pour le moment</p>
              <Link to="/boutique" className="btn-outline text-sm">Découvrir la boutique</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-night-400/50">
                  <div>
                    <p className="font-mono text-sm font-bold text-white">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-white/55">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{formatPrice(Number(order.total))}</p>
                    <span className={`badge ${order.status === "paid" ? "bg-matcha-500/15 text-matcha-300" : "bg-sun-500/15 text-sun-300"}`}>
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
            <h2 className="font-display font-bold text-lg text-white">Mes billets</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 skeleton" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-white/35 mx-auto mb-3" />
              <p className="text-sm text-white/70 mb-3">Aucun billet pour le moment</p>
              <Link to="/evenements" className="btn-outline text-sm">Voir les événements</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="w-full text-left p-4 rounded-xl bg-night-400/50 border border-white/5 hover:border-sakura-200 hover:bg-sakura-500/150/15/30 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm text-white">{ticket.event?.title ?? "Événement"}</p>
                      <p className="text-xs text-white/55">{ticket.event ? formatDate(ticket.event.event_date) : ""}</p>
                    </div>
                    <span className={`badge ${ticket.status === "valid" ? "bg-matcha-500/15 text-matcha-300" : "bg-white/5 text-white/70"}`}>
                      {ticket.status === "valid" ? "Valide" : ticket.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                    <QrCode className="w-4 h-4 text-white/70" />
                    <span className="font-mono text-xs font-bold text-white/90">{ticket.ticket_code}</span>
                    <span className="ml-auto text-xs text-sakura-300 font-medium">Voir le billet</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Download section */}
      {downloadProducts.length > 0 && (
        <div className="card p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5 text-matcha-300" />
            <h2 className="font-display font-bold text-lg text-white">Mes fichiers téléchargeables</h2>
          </div>
          <div className="space-y-3">
            {downloadProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-night-400/50">
                <div className="w-10 h-10 rounded-xl bg-white/5 overflow-hidden flex-shrink-0">
                  <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-white line-clamp-1">{p.name}</p>
                  <p className="text-xs text-white/55 uppercase">{p.file_type}</p>
                </div>
                <a href={p.file_url} download className="btn-outline text-sm py-2">
                  <Download className="w-4 h-4" /> Télécharger
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Tutorials */}
      {videoProducts.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <PlayCircle className="w-5 h-5 text-sakura-400" />
            <h2 className="font-display font-bold text-lg text-white">Tutoriels vidéo</h2>
          </div>
          {activeVideo ? (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-white">{activeVideo.name}</h3>
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
                  <div className="relative aspect-video bg-white/5 overflow-hidden">
                    <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-night-950/20 flex items-center justify-center">
                      <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-white line-clamp-1">{v.name}</p>
                    <p className="text-xs text-white/55 mt-1">Tutoriel vidéo · HD</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ticket QR Code Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/60 backdrop-blur-sm animate-fade-in p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="bg-white/5 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-display font-bold text-lg text-white">Mon billet</h3>
              <button onClick={() => setSelectedTicket(null)} className="p-2 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
            <div className="p-6 text-center">
              <p className="font-display font-bold text-xl text-white mb-1">{selectedTicket.event?.title ?? "Événement"}</p>
              <p className="text-sm text-white/70 mb-4">
                {selectedTicket.event ? formatDate(selectedTicket.event.event_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
              </p>
              <p className="text-sm text-white/80 mb-4">{selectedTicket.event?.venue}, {selectedTicket.event?.city}</p>

              <div className="inline-flex p-4 bg-white/5 rounded-2xl border-2 border-white/5 mb-4">
                <QRCodeSVG
                  value={selectedTicket.qr_data}
                  size={180}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div className="bg-night-400/50 rounded-xl p-3 mb-4">
                <p className="text-xs text-white/55 mb-1">Code unique</p>
                <p className="font-mono font-bold text-white text-sm">{selectedTicket.ticket_code}</p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className={`badge ${selectedTicket.status === "valid" ? "bg-matcha-500/15 text-matcha-300" : "bg-white/5 text-white/70"}`}>
                  {selectedTicket.status === "valid" ? "Valide" : selectedTicket.status}
                </span>
                <span className="text-xs text-white/55">Acheteur: {profile?.full_name ?? profile?.username}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
