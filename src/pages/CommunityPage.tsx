import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, type NewsArticle } from "../lib/supabase";
import { formatDate } from "../lib/format";
import { MessageCircle, Send, Mail, Instagram, Twitter, Users, ArrowRight, Newspaper } from "lucide-react";

export default function CommunityPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("news_articles")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      setArticles(data as unknown as NewsArticle[] ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 -right-20 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm font-medium mb-6">
              <Users className="w-4 h-4 text-sakura-400" /> Hub Communautaire
            </div>
            <h1 className="font-display font-extrabold text-3xl lg:text-4xl text-white mb-4 text-balance">
              La communauté geek d'Afrique, réunie
            </h1>
            <p className="text-ink-300 leading-relaxed mb-6">
              Suivez les actualités, rejoignez nos canaux sociaux et échangez avec des milliers de passionnés
              d'animé, de cosplay, de gaming et de culture pop.
            </p>
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] transition-colors">
              <MessageCircle className="w-5 h-5" />
              <div><p className="font-semibold text-sm">Discord</p><p className="text-xs text-white/70">Rejoindre</p></div>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0088cc] hover:bg-[#006699] transition-colors">
              <Send className="w-5 h-5" />
              <div><p className="font-semibold text-sm">Telegram</p><p className="text-xs text-white/70">Canal officiel</p></div>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#1da851] transition-colors">
              <Mail className="w-5 h-5" />
              <div><p className="font-semibold text-sm">WhatsApp</p><p className="text-xs text-white/70">Groupe</p></div>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <Instagram className="w-5 h-5" />
              <div><p className="font-semibold text-sm">Instagram</p><p className="text-xs text-white/70">Suivre</p></div>
            </a>
          </div>
        </div>
      </section>

      {/* News */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Newspaper className="w-6 h-6 text-sakura-500" />
          <h2 className="section-title">Actualités & Annonces</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="aspect-[2/1] skeleton" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-24 skeleton" />
                  <div className="h-6 w-full skeleton" />
                  <div className="h-4 w-3/4 skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="card p-12 text-center">
            <Newspaper className="w-12 h-12 text-ink-200 mx-auto mb-3" />
            <p className="text-ink-500">Aucune actualité pour le moment. Revenez bientôt !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <Link key={article.id} to={`/communaute/${article.slug}`} className="card card-hover overflow-hidden group block">
                <div className="aspect-[2/1] overflow-hidden bg-ink-100">
                  <img
                    src={article.cover_image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs text-ink-400 mb-2">{formatDate(article.created_at)}</p>
                  <h3 className="font-display font-semibold text-lg text-ink-900 mb-2 group-hover:text-sakura-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-ink-500 line-clamp-3">{article.excerpt}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-sakura-600 mt-3 group-hover:gap-2.5 transition-all">
                    Lire l'article <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
