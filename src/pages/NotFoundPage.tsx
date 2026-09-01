import { Link } from "react-router-dom";
import { Sparkles, Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="text-center max-w-md">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-3xl bg-ink-900 flex items-center justify-center mx-auto">
            <Sparkles className="w-12 h-12 text-sakura-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-sakura-500 flex items-center justify-center text-white font-bold text-sm animate-float">
            404
          </div>
        </div>
        <h1 className="font-display font-extrabold text-3xl text-ink-900 mb-3">Page introuvable</h1>
        <p className="text-ink-500 mb-8">
          Cette page n'existe pas ou a été déplacée. Retournons à la communauté !
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-primary">
            <Home className="w-5 h-5" /> Accueil
          </Link>
          <Link to="/boutique" className="btn-outline">
            <ArrowLeft className="w-5 h-5" /> Boutique
          </Link>
        </div>
      </div>
    </div>
  );
}
