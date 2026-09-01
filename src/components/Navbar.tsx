import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  Calendar,
  Users,
  Search,
  Menu,
  X,
  ShoppingCart,
  User,
  LogOut,
  Shield,
  Sparkles,
} from "lucide-react";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { count, setOpen } = useCart();
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const isAdmin = profile && ["super_admin", "admin_content", "admin_moderation"].includes(profile.role);

  const navLinks = [
    { to: "/boutique", label: "Boutique", icon: ShoppingBag },
    { to: "/evenements", label: "Événements", icon: Calendar },
    { to: "/communaute", label: "Communauté", icon: Users },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-sm" : "bg-white border-b border-ink-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -ml-2 text-ink-600 hover:text-ink-900"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-ink-900 flex items-center justify-center transition-transform group-hover:scale-105">
                <Sparkles className="w-5 h-5 text-sakura-400" />
              </div>
              <span className="font-display font-extrabold text-lg text-ink-900 tracking-tight">
                Otaku<span className="text-sakura-500">Mania</span>
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                  location.pathname.startsWith(link.to)
                    ? "text-sakura-600 bg-sakura-50"
                    : "text-ink-600 hover:text-ink-900 hover:bg-ink-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              className="p-2 text-ink-600 hover:text-ink-900 hover:bg-ink-100 rounded-xl transition-all hidden sm:block"
              aria-label="Rechercher"
            >
              <Search className="w-5 h-5" />
            </button>

            {!isAdmin && (
              <button
                className="relative p-2 text-ink-600 hover:text-ink-900 hover:bg-ink-100 rounded-xl transition-all"
                onClick={() => setOpen(true)}
                aria-label="Panier"
              >
                <ShoppingCart className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-sakura-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                    {count}
                  </span>
                )}
              </button>
            )}

            {session ? (
              <div className="relative">
                <button
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-ink-100 transition-all"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sakura-400 to-sakura-600 flex items-center justify-center text-white text-xs font-bold">
                    {profile?.username?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-ink-700">
                    {profile?.username}
                  </span>
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-ink-100 py-2 z-50 animate-slide-down">
                      <div className="px-4 py-2 border-b border-ink-100">
                        <p className="text-sm font-semibold text-ink-900">{profile?.full_name}</p>
                        <p className="text-xs text-ink-400">{profile?.role.replace("_", " ")}</p>
                      </div>
                      {isAdmin ? (
                        <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50">
                          <Shield className="w-4 h-4" /> Administration
                        </Link>
                      ) : (
                        <Link to="/profil" className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50">
                          <User className="w-4 h-4" /> Mon profil
                        </Link>
                      )}
                      <button
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-error-600 hover:bg-error-50 w-full"
                        onClick={() => {
                          signOut();
                          navigate("/");
                        }}
                      >
                        <LogOut className="w-4 h-4" /> Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/connexion" className="btn-primary text-sm py-2 px-4 hidden sm:inline-flex">
                Connexion
              </Link>
            )}

            {!session && (
              <Link to="/inscription" className="btn-outline text-sm py-2 px-4 hidden sm:inline-flex">
                S'inscrire
              </Link>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden py-4 border-t border-ink-100 animate-slide-down">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-ink-700 hover:bg-ink-50 font-medium"
                >
                  <link.icon className="w-5 h-5 text-ink-400" />
                  {link.label}
                </Link>
              ))}
              {!session && (
                <div className="flex gap-2 px-4 pt-3">
                  <Link to="/connexion" className="btn-primary flex-1 text-sm">Connexion</Link>
                  <Link to="/inscription" className="btn-outline flex-1 text-sm">S'inscrire</Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
