import { Link } from "react-router-dom";
import { Sparkles, Mail, MessageCircle, Send, Instagram, Twitter, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-ink-950 text-ink-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-sakura-400" />
              </div>
              <span className="font-display font-extrabold text-lg text-white tracking-tight">
                Otaku<span className="text-sakura-400">Mania</span>
              </span>
            </div>
            <p className="text-sm text-ink-400 leading-relaxed">
              La première plateforme geek et otaku d'Afrique de l'Ouest. Boutique, événements et communauté réunis en un seul lieu.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Explorer</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/boutique" className="hover:text-sakura-400 transition-colors">Boutique</Link></li>
              <li><Link to="/evenements" className="hover:text-sakura-400 transition-colors">Événements</Link></li>
              <li><Link to="/communaute" className="hover:text-sakura-400 transition-colors">Communauté</Link></li>
              <li><Link to="/mon-espace" className="hover:text-sakura-400 transition-colors">Mon espace</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Support</h3>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-sakura-400 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-sakura-400 transition-colors">Conditions générales</a></li>
              <li><a href="#" className="hover:text-sakura-400 transition-colors">Politique de confidentialité</a></li>
              <li><a href="#" className="hover:text-sakura-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Rejoignez la communauté</h3>
            <div className="flex gap-2">
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-sakura-500 flex items-center justify-center transition-colors" aria-label="Discord">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-sky-500 flex items-center justify-center transition-colors" aria-label="Telegram">
                <Send className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-matcha-500 flex items-center justify-center transition-colors" aria-label="WhatsApp">
                <Mail className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-sakura-500 flex items-center justify-center transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-sky-500 flex items-center justify-center transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-error-600 flex items-center justify-center transition-colors" aria-label="YouTube">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-ink-400">© 2026 Otaku Mania. Tous droits réservés.</p>
          <p className="text-xs text-ink-400">Fait avec passion pour la communauté geek d'Afrique</p>
        </div>
      </div>
    </footer>
  );
}
