import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
  supabase,
  type Product,
  type EventItem,
  type Category,
  type Review,
  type Profile,
  type NewsArticle,
  type AuditLog,
  type AdminOrder,
  type AdminTicket,
} from "../lib/supabase";
import { formatPrice, formatDate, formatDateShort, timeAgo, slugify } from "../lib/format";
import {
  LayoutDashboard,
  Package,
  Calendar,
  Users,
  Star,
  Newspaper,
  ShoppingCart,
  ScrollText,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Check,
  Search,
  DollarSign,
  TrendingUp,
  Ticket as TicketIcon,
  CheckCircle2,
  XCircle,
  Ban,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ImagePlus,
  FileUp,
  ShieldCheck,
  ExternalLink,
  Settings,
  HelpCircle,
  Menu,
} from "lucide-react";

type Tab = "overview" | "products" | "events" | "users" | "reviews" | "news" | "orders" | "logs";

export default function AdminPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [
      { data: prodData },
      { data: eventData },
      { data: catData },
      { data: revData },
      { data: profData },
      { data: newsData },
      { data: orderData },
      { data: ticketData },
      { data: logData },
    ] = await Promise.all([
      supabase.from("products").select("*, category:categories(*)").order("created_at", { ascending: false }),
      supabase.from("events").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("reviews").select("*, profile:profiles(*)").order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("news_articles").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*, profile:profiles(*)").order("created_at", { ascending: false }).limit(50),
      supabase.from("tickets").select("*, event:events(*), profile:profiles(*)").order("created_at", { ascending: false }).limit(50),
      supabase.from("audit_logs").select("*, admin:profiles(*)").order("created_at", { ascending: false }).limit(50),
    ]);

    setProducts(prodData as unknown as Product[] ?? []);
    setEvents(eventData as unknown as EventItem[] ?? []);
    setCategories(catData as Category[] ?? []);
    setReviews(revData as unknown as Review[] ?? []);
    setProfiles(profData as Profile[] ?? []);
    setNews(newsData as unknown as NewsArticle[] ?? []);
    setOrders(orderData as unknown as AdminOrder[] ?? []);
    setTickets(ticketData as unknown as AdminTicket[] ?? []);
    setLogs(logData as unknown as AuditLog[] ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function logAction(action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) {
    if (!profile) return;
    await supabase.from("audit_logs").insert({
      admin_id: profile.id,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      details: details ?? null,
    });
  }

  const tabs: { id: Tab; label: string; icon: typeof Package; badge?: number }[] = [
    { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: "products", label: "Produits", icon: Package },
    { id: "events", label: "Événements", icon: Calendar },
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "reviews", label: "Avis", icon: Star, badge: reviews.filter((r) => r.status === "pending").length },
    { id: "news", label: "Actualités", icon: Newspaper },
    { id: "orders", label: "Commandes", icon: ShoppingCart },
    { id: "logs", label: "Journal", icon: ScrollText },
  ];

  const primaryTabs = tabs.filter((item) => ["overview", "products", "orders", "news", "users"].includes(item.id));
  const secondaryTabs = tabs.filter((item) => ["events", "reviews", "logs"].includes(item.id));
  const activeLabel = tabs.find((item) => item.id === tab)?.label ?? "Vue d'ensemble";

  function renderTabButton(item: (typeof tabs)[number]) {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        className={`admin-nav-item ${tab === item.id ? "admin-nav-item-active" : ""}`}
        onClick={() => setTab(item.id)}
      >
        <Icon className="w-[18px] h-[18px]" />
        <span>{item.label}</span>
        {item.badge && item.badge > 0 ? <span className="admin-nav-badge">{item.badge}</span> : null}
      </button>
    );
  }

  return (
    <div className="admin-shell min-h-[calc(100vh-4rem)] animate-fade-in">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark"><ShieldCheck className="w-6 h-6" /></div>
          <div>
            <p className="admin-brand-kicker">OTAKU MANIA</p>
            <p className="admin-brand-title">Console Admin</p>
          </div>
        </div>
        <div className="admin-sidebar-scroll">
          <p className="admin-nav-label">Navigation</p>
          <nav className="space-y-1">{primaryTabs.map(renderTabButton)}</nav>
          <p className="admin-nav-label mt-8">Communauté</p>
          <nav className="space-y-1">{secondaryTabs.map(renderTabButton)}</nav>
        </div>
        <div className="admin-help-card">
          <div className="flex items-center gap-2 text-white"><HelpCircle className="w-4 h-4 text-sky-400" /><span className="font-semibold text-sm">Besoin d'aide ?</span></div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">Consultez les données et gérez votre boutique depuis cette console.</p>
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 mt-3 hover:text-sky-300">Voir le site <ExternalLink className="w-3 h-3" /></Link>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="flex items-center gap-3 min-w-0">
            <button className="admin-mobile-menu lg:hidden" aria-label="Ouvrir le menu"><Menu className="w-5 h-5" /></button>
            <div>
              <p className="admin-eyebrow">ESPACE ADMINISTRATEUR</p>
              <h1 className="admin-page-title">{activeLabel}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-white">{profile?.full_name || profile?.username || "Admin Otaku"}</p>
              <p className="text-xs text-slate-400 capitalize">{profile?.role?.replace("_", " ") || "Administrateur"}</p>
            </div>
            <div className="admin-avatar">{profile?.username?.slice(0, 2).toUpperCase() || "AO"}</div>
          </div>
        </header>
        <div className="admin-mobile-nav lg:hidden">{tabs.map(renderTabButton)}</div>
        <div className="admin-content">
          {loading ? (
            <div className="flex items-center justify-center py-28"><div className="admin-spinner" /></div>
          ) : (
            <>
              {tab === "overview" && <OverviewTab products={products} events={events} orders={orders} reviews={reviews} tickets={tickets} profiles={profiles} />}
              {tab === "products" && <ProductsTab products={products} categories={categories} loadData={loadData} logAction={logAction} />}
              {tab === "events" && <EventsTab events={events} tickets={tickets} loadData={loadData} logAction={logAction} />}
              {tab === "users" && <UsersTab profiles={profiles} orders={orders} tickets={tickets} logAction={logAction} loadData={loadData} />}
              {tab === "reviews" && <ReviewsTab reviews={reviews} loadData={loadData} logAction={logAction} />}
              {tab === "news" && <NewsTab news={news} loadData={loadData} logAction={logAction} />}
              {tab === "orders" && <OrdersTab orders={orders} />}
              {tab === "logs" && <LogsTab logs={logs} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================
// OVERVIEW TAB
// ============================================
function OverviewTab({ products, orders }: {
  products: Product[];
  events: EventItem[];
  orders: AdminOrder[];
  reviews: Review[];
  tickets: AdminTicket[];
  profiles: Profile[];
}) {
  const publishedProducts = products.filter((p) => p.status === "published").length;
  const totalRevenue = orders.filter((o) => o.status === "paid").reduce((s, o) => s + Number(o.total), 0);
  const completedPayments = orders.filter((o) => o.status === "paid" || o.status === "failed").length;
  const successfulPayments = orders.filter((o) => o.status === "paid").length;
  const successRate = completedPayments > 0 ? Math.round((successfulPayments / completedPayments) * 100) : 0;

  const paymentBars = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (11 - i));
    const count = orders.filter((o) => {
      const od = new Date(o.created_at);
      return od.toDateString() === d.toDateString() && o.status === "paid";
    }).length;
    return { label: i + 1, value: Math.max(count * 16 + 18, 18) };
  });

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminMetric icon={Package} value={publishedProducts.toString()} label="Produits publiés" />
        <AdminMetric icon={ShoppingCart} value={orders.length.toString()} label="Commandes totales" />
        <AdminMetric icon={DollarSign} value={formatPrice(totalRevenue)} label="Revenus" />
        <AdminMetric icon={CheckCircle2} value={`${successRate}%`} label="Paiements réussis" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_310px] gap-6">
        <section className="admin-panel overflow-hidden">
          <div className="admin-panel-heading">
            <div>
              <h2 className="admin-section-title">Commandes récentes</h2>
              <p className="admin-section-subtitle">Les dernières transactions de la boutique</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead><tr><th>Référence</th><th>Client</th><th>Montant</th><th>Statut</th></tr></thead>
              <tbody>
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono font-semibold text-white">#{o.id.slice(0, 8).toUpperCase()}</td>
                    <td className="text-white">{o.profile?.full_name || o.profile?.username || "Client"}</td>
                    <td className="font-semibold text-white">{formatPrice(Number(o.total))}</td>
                    <td><AdminStatus status={o.status} /></td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-slate-500">Aucune commande pour le moment</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel p-6">
          <h2 className="admin-section-title">Performance paiements</h2>
          <p className="admin-section-subtitle">Sur les 12 derniers jours</p>
          <div className="admin-bars" aria-label="Performance des paiements">
            {paymentBars.map((bar) => (
              <div key={bar.label} className="admin-bar-column">
                <div className="admin-bar" style={{ height: `${bar.value}%` }} />
                <span>{bar.label}</span>
              </div>
            ))}
          </div>
          <div className="admin-performance-footer"><span>Taux de réussite</span><strong>{successRate}%</strong></div>
        </section>
      </div>
    </div>
  );
}

function AdminMetric({ icon: Icon, value, label }: { icon: typeof Package; value: string; label: string }) {
  return (
    <div className="admin-metric">
      <div className="admin-metric-icon"><Icon className="w-5 h-5" /></div>
      <div>
        <p className="admin-metric-value">{value}</p>
        <p className="admin-metric-label">{label}</p>
      </div>
    </div>
  );
}

function AdminStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "admin-status-success",
    pending: "admin-status-pending",
    failed: "admin-status-failed",
    refunded: "admin-status-neutral",
  };
  const labels: Record<string, string> = {
    paid: "Payé",
    pending: "En attente",
    failed: "Échoué",
    refunded: "Remboursé",
  };
  return <span className={`admin-status ${styles[status] ?? styles.pending}`}>{labels[status] ?? status}</span>;
}

// ============================================
// PRODUCTS TAB
// ============================================
function ProductsTab({ products, categories, loadData, logAction }: {
  products: Product[];
  categories: Category[];
  loadData: () => Promise<void>;
  logAction: (action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showCatModal, setShowCatModal] = useState(false);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    await supabase.from("products").delete().eq("id", id);
    await logAction("delete", "product", id, { name });
    loadData();
  }

  async function togglePublish(p: Product) {
    const newStatus = p.status === "published" ? "draft" : "published";
    await supabase.from("products").update({ status: newStatus }).eq("id", p.id);
    await logAction(newStatus === "published" ? "publish" : "unpublish", "product", p.id, { name: p.name });
    loadData();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 flex-1 w-full">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input type="text" placeholder="Rechercher un produit..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 py-2 text-sm" />
          </div>
          <span className="text-sm text-ink-400 hidden sm:block">{filtered.length} produit{filtered.length > 1 ? "s" : ""}</span>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline text-sm" onClick={() => setShowCatModal(true)}>
            Catégories
          </button>
          <button className="btn-primary text-sm" onClick={() => { setEditing(null); setShowModal(true); }}>
            <Plus className="w-4 h-4" /> Nouveau produit
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-ink-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Produit</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Catégorie</th>
                <th className="text-left px-4 py-3 font-semibold">Prix</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Télécharg.</th>
                <th className="text-left px-4 py-3 font-semibold">Statut</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-ink-100 overflow-hidden flex-shrink-0">
                        <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-ink-900 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-ink-400">{p.file_type.toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-500 hidden sm:table-cell">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-bold text-ink-900">{formatPrice(p.price, p.currency)}</td>
                  <td className="px-4 py-3 text-ink-500 hidden md:table-cell">{p.download_count}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublish(p)}
                      className={`badge transition-all hover:opacity-80 ${p.status === "published" ? "bg-matcha-50 text-matcha-600" : "bg-ink-100 text-ink-500"}`}
                    >
                      {p.status === "published" ? "Publié" : "Brouillon"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 rounded-lg text-ink-500 hover:bg-ink-100" onClick={() => { setEditing(p); setShowModal(true); }} title="Modifier">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg text-error-600 hover:bg-error-50" onClick={() => handleDelete(p.id, p.name)} title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ProductModal product={editing} categories={categories} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); loadData(); }} logAction={logAction} />
      )}
      {showCatModal && (
        <CategoryModal categories={categories} onClose={() => setShowCatModal(false)} onSaved={() => { setShowCatModal(false); loadData(); }} logAction={logAction} />
      )}
    </div>
  );
}

// ============================================
// EVENTS TAB
// ============================================
function EventsTab({ events, tickets, loadData, logAction }: {
  events: EventItem[];
  tickets: AdminTicket[];
  loadData: () => Promise<void>;
  logAction: (action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [viewing, setViewing] = useState<EventItem | null>(null);

  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) || e.city.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    await supabase.from("events").delete().eq("id", id);
    await logAction("delete", "event", id, { title });
    loadData();
  }

  async function togglePublish(e: EventItem) {
    const newStatus = e.status === "published" ? "draft" : "published";
    await supabase.from("events").update({ status: newStatus }).eq("id", e.id);
    await logAction(newStatus === "published" ? "publish" : "unpublish", "event", e.id, { title: e.title });
    loadData();
  }

  const eventTickets = viewing ? tickets.filter((t) => t.event_id === viewing.id) : [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 flex-1 w-full">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input type="text" placeholder="Rechercher un événement..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 py-2 text-sm" />
          </div>
          <span className="text-sm text-ink-400 hidden sm:block">{filtered.length} événement{filtered.length > 1 ? "s" : ""}</span>
        </div>
        <button className="btn-primary text-sm" onClick={() => { setEditing(null); setShowModal(true); }}>
          <Plus className="w-4 h-4" /> Nouvel événement
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-ink-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Événement</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Ville</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Inscrits</th>
                <th className="text-left px-4 py-3 font-semibold">Statut</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-ink-100 overflow-hidden flex-shrink-0">
                        <img src={e.cover_image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <p className="font-medium text-ink-900 line-clamp-1">{e.title}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-500 hidden sm:table-cell">{formatDateShort(e.event_date)}</td>
                  <td className="px-4 py-3 text-ink-500 hidden md:table-cell">{e.city}</td>
                  <td className="px-4 py-3 text-ink-500 hidden lg:table-cell">{e.registered_count}/{e.capacity}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublish(e)}
                      className={`badge transition-all hover:opacity-80 ${e.status === "published" ? "bg-matcha-50 text-matcha-600" : "bg-ink-100 text-ink-500"}`}
                    >
                      {e.status === "published" ? "Publié" : "Brouillon"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 rounded-lg text-sky-600 hover:bg-sky-50" onClick={() => setViewing(e)} title="Participants">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg text-ink-500 hover:bg-ink-100" onClick={() => { setEditing(e); setShowModal(true); }} title="Modifier">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg text-error-600 hover:bg-error-50" onClick={() => handleDelete(e.id, e.title)} title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <EventModal event={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); loadData(); }} logAction={logAction} />
      )}
      {viewing && (
        <EventParticipantsModal event={viewing} tickets={eventTickets} onClose={() => setViewing(null)} loadData={loadData} logAction={logAction} />
      )}
    </div>
  );
}

// ============================================
// USERS TAB
// ============================================
function UsersTab({ profiles, orders, tickets, logAction, loadData }: {
  profiles: Profile[];
  orders: AdminOrder[];
  tickets: AdminTicket[];
  logAction: (action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) => Promise<void>;
  loadData: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Profile | null>(null);

  const filtered = profiles.filter((p) =>
    p.username.toLowerCase().includes(search.toLowerCase()) ||
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const roleColors: Record<string, string> = {
    super_admin: "bg-sakura-50 text-sakura-600",
    admin_content: "bg-sky-50 text-sky-600",
    admin_moderation: "bg-sun-50 text-sun-600",
    creator: "bg-matcha-50 text-matcha-600",
    organizer: "bg-ink-100 text-ink-600",
    user: "bg-ink-100 text-ink-500",
  };

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    admin_content: "Admin Contenu",
    admin_moderation: "Modération",
    creator: "Créateur",
    organizer: "Organisateur",
    user: "Utilisateur",
  };

  async function updateRole(p: Profile, newRole: Profile["role"]) {
    const { error } = await supabase.rpc("set_user_role", {
      p_target_user: p.id,
      p_new_role: newRole,
    });
    if (error) {
      alert("Vous n'avez pas l'autorisation de changer ce rôle.");
      setEditing(null);
      return;
    }
    await logAction("update_role", "profile", p.id, { from: p.role, to: newRole, username: p.username });
    setEditing(null);
    loadData();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input type="text" placeholder="Rechercher un utilisateur..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 py-2 text-sm" />
        </div>
        <span className="text-sm text-ink-400">{filtered.length} utilisateur{filtered.length > 1 ? "s" : ""}</span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-ink-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Utilisateur</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Inscrit le</th>
                <th className="text-left px-4 py-3 font-semibold">Rôle</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Commandes</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Billets</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((p) => {
                const userOrders = orders.filter((o) => o.user_id === p.id).length;
                const userTickets = tickets.filter((t) => t.user_id === p.id).length;
                return (
                  <tr key={p.id} className="hover:bg-ink-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sakura-400 to-sakura-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {p.username?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-ink-900 line-clamp-1">{p.full_name}</p>
                          <p className="text-xs text-ink-400">@{p.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-500 hidden sm:table-cell">{formatDateShort(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${roleColors[p.role] ?? roleColors.user}`}>{roleLabels[p.role] ?? p.role}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-500 hidden md:table-cell">{userOrders}</td>
                    <td className="px-4 py-3 text-ink-500 hidden md:table-cell">{userTickets}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-2 rounded-lg text-ink-500 hover:bg-ink-100 ml-auto" onClick={() => setEditing(p)} title="Modifier le rôle">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <RoleModal profile={editing} onClose={() => setEditing(null)} onSave={updateRole} />
      )}
    </div>
  );
}

// ============================================
// REVIEWS TAB
// ============================================
function ReviewsTab({ reviews, loadData, logAction }: {
  reviews: Review[];
  loadData: () => Promise<void>;
  logAction: (action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) => Promise<void>;
}) {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const filtered = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);

  async function moderateReview(r: Review, newStatus: "approved" | "rejected") {
    await supabase.from("reviews").update({ status: newStatus }).eq("id", r.id);
    await logAction(newStatus === "approved" ? "approve_review" : "reject_review", "review", r.id, { product_id: r.product_id });
    loadData();
  }

  async function deleteReview(id: string) {
    if (!confirm("Supprimer cet avis ?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    await logAction("delete_review", "review", id);
    loadData();
  }

  const counts = {
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
    all: reviews.length,
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              filter === f ? "bg-ink-900 text-white" : "bg-white border border-ink-200 text-ink-600 hover:border-ink-300"
            }`}
            onClick={() => setFilter(f)}
          >
            {f === "pending" ? "En attente" : f === "approved" ? "Approuvés" : f === "rejected" ? "Rejetés" : "Tous"}
            <span className="ml-1.5 text-xs opacity-60">({counts[f]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Star className="w-10 h-10 text-ink-200 mx-auto mb-3" />
          <p className="text-ink-400">Aucun avis dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sakura-400 to-sakura-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {r.profile?.username?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-ink-900 text-sm">{r.profile?.username ?? "Utilisateur"}</p>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-sun-400 text-sun-400" : "text-ink-200"}`} />
                        ))}
                      </div>
                      <span className={`badge text-[10px] ${
                        r.status === "approved" ? "bg-matcha-50 text-matcha-600" :
                        r.status === "pending" ? "bg-sun-50 text-sun-600" :
                        "bg-error-50 text-error-600"
                      }`}>
                        {r.status === "approved" ? "Approuvé" : r.status === "pending" ? "En attente" : "Rejeté"}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm text-ink-600 leading-relaxed">{r.comment}</p>}
                    <p className="text-xs text-ink-400 mt-1">{timeAgo(r.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {r.status !== "approved" && (
                    <button className="p-2 rounded-lg text-matcha-600 hover:bg-matcha-50" onClick={() => moderateReview(r, "approved")} title="Approuver">
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button className="p-2 rounded-lg text-error-600 hover:bg-error-50" onClick={() => moderateReview(r, "rejected")} title="Rejeter">
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button className="p-2 rounded-lg text-ink-400 hover:bg-error-50 hover:text-error-600" onClick={() => deleteReview(r.id)} title="Supprimer">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// NEWS TAB
// ============================================
function NewsTab({ news, loadData, logAction }: {
  news: NewsArticle[];
  loadData: () => Promise<void>;
  logAction: (action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) => Promise<void>;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NewsArticle | null>(null);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    await supabase.from("news_articles").delete().eq("id", id);
    await logAction("delete", "news", id, { title });
    loadData();
  }

  async function togglePublish(a: NewsArticle) {
    const newStatus = a.status === "published" ? "draft" : "published";
    await supabase.from("news_articles").update({ status: newStatus }).eq("id", a.id);
    await logAction(newStatus === "published" ? "publish" : "unpublish", "news", a.id, { title: a.title });
    loadData();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-ink-400">{news.length} article{news.length > 1 ? "s" : ""}</span>
        <button className="btn-primary text-sm" onClick={() => { setEditing(null); setShowModal(true); }}>
          <Plus className="w-4 h-4" /> Nouvel article
        </button>
      </div>

      {news.length === 0 ? (
        <div className="card p-12 text-center">
          <Newspaper className="w-10 h-10 text-ink-200 mx-auto mb-3" />
          <p className="text-ink-400">Aucun article pour le moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.map((a) => (
            <div key={a.id} className="card overflow-hidden flex flex-col">
              {a.cover_image && (
                <div className="aspect-[2/1] bg-ink-100 overflow-hidden">
                  <img src={a.cover_image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge ${a.status === "published" ? "bg-matcha-50 text-matcha-600" : "bg-ink-100 text-ink-500"}`}>
                    {a.status === "published" ? "Publié" : "Brouillon"}
                  </span>
                  <span className="text-xs text-ink-400">{formatDateShort(a.created_at)}</span>
                </div>
                <h3 className="font-display font-semibold text-ink-900 mb-1 line-clamp-2">{a.title}</h3>
                <p className="text-sm text-ink-500 line-clamp-2 flex-1">{a.excerpt}</p>
                <div className="flex items-center gap-1 mt-4 pt-3 border-t border-ink-100">
                  <button className="p-2 rounded-lg text-ink-500 hover:bg-ink-100" onClick={() => { setEditing(a); setShowModal(true); }} title="Modifier">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg text-ink-500 hover:bg-ink-100" onClick={() => togglePublish(a)} title={a.status === "published" ? "Dépublier" : "Publier"}>
                    {a.status === "published" ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button className="p-2 rounded-lg text-error-600 hover:bg-error-50 ml-auto" onClick={() => handleDelete(a.id, a.title)} title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NewsModal article={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); loadData(); }} logAction={logAction} />
      )}
    </div>
  );
}

// ============================================
// ORDERS TAB
// ============================================
function OrdersTab({ orders }: { orders: AdminOrder[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "failed" | "refunded">("all");

  const filtered = orders.filter((o) => {
    const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.profile?.username?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders.filter((o) => o.status === "paid").reduce((s, o) => s + Number(o.total), 0);

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Revenu" value={formatPrice(totalRevenue)} sub="payé" color="matcha" />
        <StatCard icon={ShoppingCart} label="Commandes" value={orders.length.toString()} sub="total" color="sakura" />
        <StatCard icon={CheckCircle2} label="Payées" value={orders.filter((o) => o.status === "paid").length.toString()} sub="abouties" color="sky" />
        <StatCard icon={Clock} label="En attente" value={orders.filter((o) => o.status === "pending").length.toString()} sub="à traiter" color="sun" />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input type="text" placeholder="Rechercher par ID ou utilisateur..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 py-2 text-sm" />
        </div>
        <div className="flex gap-2">
          {(["all", "paid", "pending", "failed", "refunded"] as const).map((s) => (
            <button
              key={s}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                statusFilter === s ? "bg-ink-900 text-white" : "bg-white border border-ink-200 text-ink-600 hover:border-ink-300"
              }`}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "Toutes" : s === "paid" ? "Payées" : s === "pending" ? "En attente" : s === "failed" ? "Échouées" : "Remboursées"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingCart className="w-10 h-10 text-ink-200 mx-auto mb-3" />
          <p className="text-ink-400">Aucune commande trouvée</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">N° Commande</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Client</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Paiement</th>
                  <th className="text-left px-4 py-3 font-semibold">Montant</th>
                  <th className="text-left px-4 py-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-ink-50">
                    <td className="px-4 py-3 font-mono font-bold text-ink-900">#{o.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sakura-400 to-sakura-600 flex items-center justify-center text-white font-bold text-[10px]">
                          {o.profile?.username?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <span className="text-ink-700">{o.profile?.username ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-500 hidden md:table-cell">{formatDateShort(o.created_at)}</td>
                    <td className="px-4 py-3 text-ink-500 hidden md:table-cell capitalize">{o.payment_method}</td>
                    <td className="px-4 py-3 font-bold text-ink-900">{formatPrice(Number(o.total))}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        o.status === "paid" ? "bg-matcha-50 text-matcha-600" :
                        o.status === "pending" ? "bg-sun-50 text-sun-600" :
                        o.status === "failed" ? "bg-error-50 text-error-600" :
                        "bg-ink-100 text-ink-500"
                      }`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// LOGS TAB
// ============================================
function LogsTab({ logs }: { logs: AuditLog[] }) {
  const actionColors: Record<string, string> = {
    delete: "text-error-600 bg-error-50",
    publish: "text-matcha-600 bg-matcha-50",
    unpublish: "text-ink-500 bg-ink-100",
    update_role: "text-sky-600 bg-sky-50",
    create: "text-matcha-600 bg-matcha-50",
    update: "text-sun-600 bg-sun-50",
    approve_review: "text-matcha-600 bg-matcha-50",
    reject_review: "text-error-600 bg-error-50",
    delete_review: "text-error-600 bg-error-50",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-ink-400">{logs.length} entrée{logs.length > 1 ? "s" : ""} de journal</span>
      </div>

      {logs.length === 0 ? (
        <div className="card p-12 text-center">
          <ScrollText className="w-10 h-10 text-ink-200 mx-auto mb-3" />
          <p className="text-ink-400">Aucune action enregistrée pour le moment</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-ink-100">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-ink-50">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${actionColors[log.action] ?? "bg-ink-100 text-ink-500"}`}>
                  {log.action.startsWith("delete") ? <Trash2 className="w-4 h-4" /> :
                   log.action.startsWith("publish") ? <Check className="w-4 h-4" /> :
                   log.action.startsWith("create") ? <Plus className="w-4 h-4" /> :
                   log.action.startsWith("update") ? <Pencil className="w-4 h-4" /> :
                   <ScrollText className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-ink-900">{log.action.replace(/_/g, " ")}</span>
                    <span className="badge bg-ink-100 text-ink-500 text-[10px]">{log.entity_type}</span>
                    {log.entity_id && <span className="font-mono text-xs text-ink-400">#{log.entity_id.slice(0, 8)}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-ink-400">par {log.admin?.username ?? "admin"}</span>
                    <span className="text-xs text-ink-300">·</span>
                    <span className="text-xs text-ink-400">{timeAgo(log.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// SHARED COMPONENTS
// ============================================
function StatCard({ icon: Icon, label, value, sub, color, trend, trendUp }: {
  icon: typeof Package;
  label: string;
  value: string;
  sub: string;
  color: string;
  trend?: string;
  trendUp?: boolean;
}) {
  const colorMap: Record<string, string> = {
    sakura: "bg-sakura-50 text-sakura-500",
    sky: "bg-sky-50 text-sky-600",
    matcha: "bg-matcha-50 text-matcha-600",
    sun: "bg-sun-50 text-sun-600",
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trendUp ? "text-matcha-600" : "text-error-600"}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-display font-bold text-ink-900">{value}</p>
      <p className="text-sm text-ink-500">{label}</p>
      <p className="text-xs text-ink-400 mt-1">{sub}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ImageUploadField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5 Mo");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("admin-images")
      .upload(fileName, file, { contentType: file.type });
    if (uploadError) {
      alert("Erreur lors du téléchargement de l'image");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("admin-images").getPublicUrl(fileName);
    onChange(urlData.publicUrl);
    setUploading(false);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1.5">{label}</label>
      <div className="flex items-start gap-3">
        {value ? (
          <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-ink-100 flex-shrink-0 group">
            <img src={value} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-ink-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onChange("")}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-ink-200 flex items-center justify-center bg-ink-50 flex-shrink-0">
            {uploading ? <Loader2 className="w-6 h-6 text-ink-400 animate-spin" /> : <ImagePlus className="w-7 h-7 text-ink-300" />}
          </div>
        )}
        <div className="flex-1 pt-1">
          <button
            type="button"
            className="btn-outline text-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            {value ? "Changer l'image" : "Choisir une image"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <p className="text-xs text-ink-400 mt-1.5">JPG, PNG ou WEBP — 5 Mo max</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MODALS
// ============================================
function ProductModal({ product, categories, onClose, onSaved, logAction }: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
  logAction: (action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) => Promise<void>;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? "");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [fileType, setFileType] = useState(product?.file_type ?? "pdf");
  const [fileUrl, setFileUrl] = useState(product?.file_url && product.file_url !== "#" ? product.file_url : "");
  const [tags, setTags] = useState(product?.tags?.join(", ") ?? "");
  const [status, setStatus] = useState(product?.status ?? "draft");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name, slug: slugify(name), description,
      price: parseFloat(price) || 0, currency: "USD",
      category_id: categoryId || null,
      image_url: imageUrl, file_url: fileType === "mp4" ? (fileUrl || "#") : "#", file_type: fileType,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      status,
    };
    if (product) {
      await supabase.from("products").update(payload).eq("id", product.id);
      await logAction("update", "product", product.id, { name });
    } else {
      const { data } = await supabase.from("products").insert(payload).select().maybeSingle();
      if (data) await logAction("create", "product", data.id, { name });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <ModalShell title={product ? "Modifier le produit" : "Nouveau produit"} onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        <Field label="Nom"><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input-field" /></Field>
        <Field label="Description"><textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field resize-none" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prix (USD)"><input type="number" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} className="input-field" /></Field>
          <Field label="Type de fichier">
            <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="input-field">
              <option value="pdf">PDF</option>
              <option value="stl">STL (3D)</option>
              <option value="mp4">Vidéo MP4</option>
              <option value="zip">ZIP</option>
            </select>
          </Field>
        </div>
        <Field label="Catégorie">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        {fileType === "mp4" && (
          <Field label="Lien de la vidéo (URL MP4)">
            <input type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." className="input-field" />
            <p className="text-xs text-ink-400 mt-1.5">Collez le lien direct vers le fichier vidéo MP4. La vidéo sera débloquée après achat.</p>
          </Field>
        )}
        <ImageUploadField label="Image du produit" value={imageUrl} onChange={setImageUrl} />
        <Field label="Tags (séparés par virgules)"><input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="naruto, cosplay, patron" className="input-field" /></Field>
        <Field label="Statut">
          <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className="input-field">
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
          </select>
        </Field>
        <ModalFooter onClose={onClose} saving={saving} />
      </form>
    </ModalShell>
  );
}

function EventModal({ event, onClose, onSaved, logAction }: {
  event: EventItem | null;
  onClose: () => void;
  onSaved: () => void;
  logAction: (action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) => Promise<void>;
}) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [city, setCity] = useState(event?.city ?? "Abidjan");
  const [country, setCountry] = useState(event?.country ?? "Côte d'Ivoire");
  const [venue, setVenue] = useState(event?.venue ?? "");
  const [eventDate, setEventDate] = useState(event?.event_date?.slice(0, 16) ?? "");
  const [eventType, setEventType] = useState(event?.event_type ?? "convention");
  const [isFree, setIsFree] = useState(event?.is_free ?? false);
  const [price, setPrice] = useState(event?.price?.toString() ?? "0");
  const [capacity, setCapacity] = useState(event?.capacity?.toString() ?? "100");
  const [coverImage, setCoverImage] = useState(event?.cover_image ?? "");
  const [status, setStatus] = useState(event?.status ?? "draft");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title, slug: slugify(title), description, city, country, venue,
      event_date: new Date(eventDate).toISOString(),
      event_type: eventType, is_free: isFree,
      price: parseFloat(price) || 0, currency: "USD",
      capacity: parseInt(capacity) || 100,
      cover_image: coverImage, status,
    };
    if (event) {
      await supabase.from("events").update(payload).eq("id", event.id);
      await logAction("update", "event", event.id, { title });
    } else {
      const { data } = await supabase.from("events").insert(payload).select().maybeSingle();
      if (data) await logAction("create", "event", data.id, { title });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <ModalShell title={event ? "Modifier l'événement" : "Nouvel événement"} onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        <Field label="Titre"><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" /></Field>
        <Field label="Description"><textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field resize-none" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ville"><input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="input-field" /></Field>
          <Field label="Pays"><input type="text" required value={country} onChange={(e) => setCountry(e.target.value)} className="input-field" /></Field>
        </div>
        <Field label="Lieu"><input type="text" required value={venue} onChange={(e) => setVenue(e.target.value)} className="input-field" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date et heure"><input type="datetime-local" required value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input-field" /></Field>
          <Field label="Type">
            <select value={eventType} onChange={(e) => setEventType(e.target.value as EventItem["event_type"])} className="input-field">
              <option value="convention">Convention</option>
              <option value="cosplay_contest">Concours Cosplay</option>
              <option value="esport_tournament">Tournoi E-Sport</option>
              <option value="screening">Projection</option>
              <option value="workshop">Atelier</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Gratuit">
            <select value={isFree ? "yes" : "no"} onChange={(e) => setIsFree(e.target.value === "yes")} className="input-field">
              <option value="no">Payant</option>
              <option value="yes">Gratuit</option>
            </select>
          </Field>
          <Field label="Prix"><input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} disabled={isFree} className="input-field disabled:opacity-50" /></Field>
          <Field label="Capacité"><input type="number" required value={capacity} onChange={(e) => setCapacity(e.target.value)} className="input-field" /></Field>
        </div>
        <ImageUploadField label="Image de couverture" value={coverImage} onChange={setCoverImage} />
        <Field label="Statut">
          <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className="input-field">
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
          </select>
        </Field>
        <ModalFooter onClose={onClose} saving={saving} />
      </form>
    </ModalShell>
  );
}

function EventParticipantsModal({ event, tickets, onClose, loadData, logAction }: {
  event: EventItem;
  tickets: AdminTicket[];
  onClose: () => void;
  loadData: () => Promise<void>;
  logAction: (action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) => Promise<void>;
}) {
  async function updateTicketStatus(ticketId: string, newStatus: "valid" | "used" | "cancelled") {
    await supabase.from("tickets").update({ status: newStatus }).eq("id", ticketId);
    await logAction("update_ticket", "ticket", ticketId, { event_id: event.id, new_status: newStatus });
    loadData();
  }

  return (
    <ModalShell title={`Participants — ${event.title}`} onClose={onClose} wide>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="card p-3 bg-ink-50 border-ink-100">
          <p className="text-2xl font-bold text-ink-900">{tickets.length}</p>
          <p className="text-xs text-ink-400">Total inscrits</p>
        </div>
        <div className="card p-3 bg-matcha-50 border-matcha-100">
          <p className="text-2xl font-bold text-matcha-600">{tickets.filter((t) => t.status === "valid").length}</p>
          <p className="text-xs text-matcha-700">Valides</p>
        </div>
        <div className="card p-3 bg-sky-50 border-sky-100">
          <p className="text-2xl font-bold text-sky-600">{tickets.filter((t) => t.status === "used").length}</p>
          <p className="text-xs text-sky-700">Utilisés</p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-8">
          <TicketIcon className="w-10 h-10 text-ink-200 mx-auto mb-2" />
          <p className="text-ink-400">Aucun participant inscrit</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {tickets.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-ink-50">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sakura-400 to-sakura-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {t.profile?.username?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-ink-900">{t.profile?.username ?? "Utilisateur"}</p>
                <p className="font-mono text-xs text-ink-400">{t.ticket_code}</p>
              </div>
              <span className={`badge flex-shrink-0 ${
                t.status === "valid" ? "bg-matcha-50 text-matcha-600" :
                t.status === "used" ? "bg-sky-50 text-sky-600" :
                "bg-error-50 text-error-600"
              }`}>{t.status}</span>
              <div className="flex gap-1 flex-shrink-0">
                {t.status === "valid" && (
                  <button className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50" onClick={() => updateTicketStatus(t.id, "used")} title="Marquer utilisé">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                {t.status !== "cancelled" && (
                  <button className="p-1.5 rounded-lg text-error-600 hover:bg-error-50" onClick={() => updateTicketStatus(t.id, "cancelled")} title="Annuler">
                    <Ban className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

function RoleModal({ profile, onClose, onSave }: {
  profile: Profile;
  onClose: () => void;
  onSave: (p: Profile, newRole: Profile["role"]) => Promise<void>;
}) {
  const [role, setRole] = useState(profile.role);
  const [saving, setSaving] = useState(false);

  const roles: { value: Profile["role"]; label: string; desc: string }[] = [
    { value: "user", label: "Utilisateur", desc: "Achète, télécharge, participe aux événements" },
    { value: "creator", label: "Créateur", desc: "Soumet des produits, suit ses ventes" },
    { value: "organizer", label: "Organisateur", desc: "Crée et gère ses événements" },
    { value: "admin_content", label: "Admin Contenu", desc: "Gère le catalogue, médias et actualités" },
    { value: "admin_moderation", label: "Admin Modération", desc: "Modère avis, profils et contenus signalés" },
    { value: "super_admin", label: "Super Admin", desc: "Contrôle total, gestion des rôles" },
  ];

  async function handleSave() {
    setSaving(true);
    await onSave(profile, role);
    setSaving(false);
  }

  return (
    <ModalShell title={`Modifier le rôle — ${profile.username}`} onClose={onClose}>
      <div className="space-y-2">
        {roles.map((r) => (
          <button
            key={r.value}
            className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              role === r.value ? "border-sakura-400 bg-sakura-50" : "border-ink-200 hover:border-ink-300"
            }`}
            onClick={() => setRole(r.value)}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${role === r.value ? "border-sakura-500 bg-sakura-500" : "border-ink-300"}`}>
              {role === r.value && <Check className="w-3 h-3 text-white mx-auto mt-0.5" />}
            </div>
            <div>
              <p className="font-semibold text-ink-900 text-sm">{r.label}</p>
              <p className="text-xs text-ink-400">{r.desc}</p>
            </div>
          </button>
        ))}
      </div>
      <ModalFooter onClose={onClose} saving={saving} onSave={handleSave} />
    </ModalShell>
  );
}

function NewsModal({ article, onClose, onSaved, logAction }: {
  article: NewsArticle | null;
  onClose: () => void;
  onSaved: () => void;
  logAction: (action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) => Promise<void>;
}) {
  const [title, setTitle] = useState(article?.title ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [coverImage, setCoverImage] = useState(article?.cover_image ?? "");
  const [status, setStatus] = useState(article?.status ?? "draft");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title, slug: slugify(title), excerpt, content,
      cover_image: coverImage, status,
    };
    if (article) {
      await supabase.from("news_articles").update(payload).eq("id", article.id);
      await logAction("update", "news", article.id, { title });
    } else {
      const { data } = await supabase.from("news_articles").insert(payload).select().maybeSingle();
      if (data) await logAction("create", "news", data.id, { title });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <ModalShell title={article ? "Modifier l'article" : "Nouvel article"} onClose={onClose} wide>
      <form onSubmit={handleSave} className="space-y-4">
        <Field label="Titre"><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" /></Field>
        <Field label="Extrait (résumé court)"><textarea required value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className="input-field resize-none" /></Field>
        <Field label="Contenu"><textarea required value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="input-field resize-none" /></Field>
        <ImageUploadField label="Image de couverture" value={coverImage} onChange={setCoverImage} />
        <Field label="Statut">
          <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className="input-field">
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
          </select>
        </Field>
        <ModalFooter onClose={onClose} saving={saving} />
      </form>
    </ModalShell>
  );
}

function CategoryModal({ categories, onClose, onSaved, logAction }: {
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
  logAction: (action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Package");
  const [saving, setSaving] = useState(false);
  const [catList, setCatList] = useState(categories);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const { data } = await supabase.from("categories").insert({ name: name.trim(), slug: slugify(name), icon }).select().maybeSingle();
    if (data) {
      await logAction("create", "category", data.id, { name });
      setCatList([...catList, data]);
      setName("");
    }
    setSaving(false);
  }

  async function handleDelete(id: string, catName: string) {
    if (!confirm(`Supprimer la catégorie "${catName}" ?`)) return;
    await supabase.from("categories").delete().eq("id", id);
    await logAction("delete", "category", id, { name: catName });
    setCatList(catList.filter((c) => c.id !== id));
  }

  return (
    <ModalShell title="Gestion des catégories" onClose={onClose}>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input type="text" placeholder="Nom de la catégorie" value={name} onChange={(e) => setName(e.target.value)} className="input-field flex-1" />
        <button type="submit" className="btn-primary" disabled={saving || !name.trim()}>
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
        </button>
      </form>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {catList.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-ink-50">
            <span className="font-medium text-sm text-ink-900">{c.name}</span>
            <button className="p-1.5 rounded-lg text-error-600 hover:bg-error-50" onClick={() => handleDelete(c.id, c.name)}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-4">
        <button className="btn-outline" onClick={onSaved}>Fermer</button>
      </div>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-ink-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto animate-scale-in`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-ink-100 sticky top-0 bg-white z-10">
          <h2 className="font-display font-bold text-lg text-ink-900">{title}</h2>
          <button className="p-2 hover:bg-ink-100 rounded-xl" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onClose, saving, onSave }: { onClose: () => void; saving: boolean; onSave?: () => void }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type={onSave ? "button" : "button"} className="btn-outline flex-1" onClick={onClose}>Annuler</button>
      <button type={onSave ? "button" : "submit"} className="btn-primary flex-1" disabled={saving} onClick={onSave}>
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Enregistrer</>}
      </button>
    </div>
  );
}
