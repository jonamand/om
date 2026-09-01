import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase, type NewsArticle } from "../lib/supabase";
import { formatDate } from "../lib/format";
import { ArrowLeft, Calendar, Share2 } from "lucide-react";

export default function NewsDetailPage() {
  const { slug } = useParams();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("news_articles")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      setArticle(data as unknown as NewsArticle ?? null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="aspect-[2/1] skeleton rounded-2xl mb-6" />
        <div className="h-8 w-2/3 skeleton mb-4" />
        <div className="h-4 w-full skeleton mb-2" />
        <div className="h-4 w-3/4 skeleton" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display font-bold text-2xl text-ink-900 mb-2">Article introuvable</h1>
        <Link to="/communaute" className="btn-primary mt-4">Retour à la communauté</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/communaute" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à la communauté
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <span className="badge bg-sakura-50 text-sakura-600">News</span>
          <span className="flex items-center gap-1.5 text-sm text-ink-400">
            <Calendar className="w-3.5 h-3.5" /> {formatDate(article.created_at)}
          </span>
        </div>

        <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-900 mb-6 text-balance">{article.title}</h1>

        <div className="aspect-[2/1] rounded-2xl overflow-hidden bg-ink-100 mb-8 shadow-sm">
          <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover" />
        </div>

        <div className="prose prose-sm max-w-none">
          <p className="text-ink-600 leading-relaxed whitespace-pre-line text-base">{article.content}</p>
        </div>

        <div className="mt-8 pt-6 border-t border-ink-100 flex items-center justify-between">
          <Link to="/communaute" className="btn-outline text-sm">
            <ArrowLeft className="w-4 h-4" /> Autres actualités
          </Link>
          <button className="btn-ghost text-sm">
            <Share2 className="w-4 h-4" /> Partager
          </button>
        </div>
      </div>
    </div>
  );
}
