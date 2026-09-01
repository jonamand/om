import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, type Product, type EventItem, type NewsArticle } from "../lib/supabase";
import { ProductCard, ProductCardSkeleton } from "../components/ProductCard";
import { EventCard, EventCardSkeleton } from "../components/EventCard";
import { formatDate } from "../lib/format";
import {
  Sparkles,
  ShoppingBag,
  Calendar,
  Users,
  ArrowRight,
  Star,
  Download,
  Ticket,
  MessageCircle,
  Send,
  Zap,
  Shield,
  Globe,
} from "lucide-react";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: prodData }, { data: eventData }, { data: newsData }] = await Promise.all([
        supabase
          .from("products")
          .select("*, category:categories(*)")
          .eq("status", "published")
          .order("download_count", { ascending: false })
          .limit(4),
        supabase
          .from("events")
          .select("*")
          .eq("status", "published")
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true })
          .limit(3),
        supabase
          .from("news_articles")
          .select("*")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(2),
      ]);

      setProducts(prodData as unknown as Product[] ?? []);
      setEvents(eventData as unknown as EventItem[] ?? []);
      setNews(newsData as unknown as NewsArticle[] ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-sakura-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-6 animate-slide-down">
              <Sparkles className="w-4 h-4 text-sakura-400" />
              La plateforme geek #1 d'Afrique de l'Ouest
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-balance animate-slide-up">
              Achetez, célébrez et connectez-vous avec la{" "}
              <span className="text-sakura-400">communauté otaku</span> d'Afrique
            </h1>

            <p className="mt-6 text-lg text-ink-300 max-w-2xl leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Templates cosplay, fichiers 3D, tutoriels vidéo, conventions, concours et tournois e-sport.
              Tout l'écosystème geek réuni sur une seule plateforme, pensée pour le mobile et les paiements locaux.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Link to="/boutique" className="btn-primary text-base px-6 py-3">
                <ShoppingBag className="w-5 h-5" />
                Explorer la boutique
              </Link>
              <Link to="/evenements" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all">
                <Calendar className="w-5 h-5" />
                Voir les événements
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <div>
                <p className="text-3xl font-display font-bold text-white">500K+</p>
                <p className="text-sm text-ink-400">Fans potentiels</p>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-white">6</p>
                <p className="text-sm text-ink-400">Pays visés</p>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-white">100+</p>
                <p className="text-sm text-ink-400">Produits au lancement</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="bg-white border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sakura-50 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-sakura-500" />
              </div>
              <div>
                <h3 className="font-semibold text-ink-900">Optimisé 3G</h3>
                <p className="text-sm text-ink-500">Chargement rapide même sur connexion lente</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-matcha-50 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-matcha-600" />
              </div>
              <div>
                <h3 className="font-semibold text-ink-900">Paiements sécurisés</h3>
                <p className="text-sm text-ink-500">Mobile Money, Wave, Orange, cartes bancaires</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <h3 className="font-semibold text-ink-900">Conçu pour l'Afrique</h3>
                <p className="text-sm text-ink-500">Interface en français, mobile-first</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sakura-600 font-semibold text-sm uppercase tracking-wider mb-2">Boutique</p>
            <h2 className="section-title">Produits populaires</h2>
          </div>
          <Link to="/boutique" className="btn-ghost text-sakura-600 hover:text-sakura-700">
            Tout voir <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="bg-ink-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sky-600 font-semibold text-sm uppercase tracking-wider mb-2">Événements</p>
              <h2 className="section-title">À venir près de chez vous</h2>
            </div>
            <Link to="/evenements" className="btn-ghost text-sky-600 hover:text-sky-700">
              Tout voir <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)
              : events.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      </section>

      {/* Community + News */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Community Hub */}
          <div className="card p-8 bg-gradient-to-br from-ink-950 to-ink-800 text-white border-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-sakura-400" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-white">Rejoignez la communauté</h2>
                <p className="text-sm text-ink-400">Plus de 500 000 fans vous attendent</p>
              </div>
            </div>
            <p className="text-ink-300 mb-6 leading-relaxed">
              Connectez-vous avec la communauté geek et otaku d'Afrique de l'Ouest. Partagez vos créations,
              participez aux événements et échangez avec des milliers de passionnés.
            </p>
            <div className="flex gap-3">
              <a href="#" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] transition-colors font-medium text-sm">
                <MessageCircle className="w-4 h-4" /> Discord
              </a>
              <a href="#" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0088cc] hover:bg-[#006699] transition-colors font-medium text-sm">
                <Send className="w-4 h-4" /> Telegram
              </a>
              <a href="#" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#1da851] transition-colors font-medium text-sm">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>

          {/* News */}
          <div className="space-y-4">
            <div className="flex items-end justify-between mb-2">
              <h2 className="section-title">Actualités</h2>
              <Link to="/communaute" className="btn-ghost text-sm">
                Tout voir <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="card p-5 space-y-3">
                    <div className="h-4 w-24 skeleton" />
                    <div className="h-5 w-full skeleton" />
                    <div className="h-4 w-3/4 skeleton" />
                  </div>
                ))}
              </div>
            ) : (
              news.map((article) => (
                <Link
                  key={article.id}
                  to={`/communaute/${article.slug}`}
                  className="card card-hover p-5 block"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge bg-sakura-50 text-sakura-600">News</span>
                    <span className="text-xs text-ink-400">{formatDate(article.created_at)}</span>
                  </div>
                  <h3 className="font-display font-semibold text-ink-900 mb-1 line-clamp-2">{article.title}</h3>
                  <p className="text-sm text-ink-500 line-clamp-2">{article.excerpt}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-sakura-500 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display font-extrabold text-3xl lg:text-4xl text-white mb-4 text-balance">
            Prêt à rejoindre l'aventure otaku ?
          </h2>
          <p className="text-sakura-100 text-lg mb-8 max-w-2xl mx-auto">
            Créez votre compte gratuitement et accédez à des centaines de produits, événements et à toute la communauté.
          </p>
          <Link to="/inscription" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-sakura-600 font-bold hover:bg-sakura-50 transition-all shadow-lg hover:shadow-xl text-base">
            Créer mon compte <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
