import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Mail, Lock, User, AtSign, Loader2, Sparkles, AlertCircle, Check } from "lucide-react";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    const { error: err } = await signUp(email, password, username, fullName);
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      navigate("/mon-espace");
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-ink-900 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-sakura-400" />
            </div>
            <span className="font-display font-extrabold text-xl text-ink-900">
              Otaku<span className="text-sakura-500">Mania</span>
            </span>
          </Link>
          <h1 className="font-display font-extrabold text-2xl text-ink-900 mb-2">Créer un compte</h1>
          <p className="text-ink-500">Rejoignez la communauté otaku d'Afrique de l'Ouest</p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-error-50 text-error-700 text-sm mb-4 animate-slide-down">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Nom d'utilisateur</label>
                <div className="relative">
                  <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="otaku_dakar"
                    className="input-field pl-11"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aïssatou Diallo"
                    className="input-field pl-11"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 caractères minimum"
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-ink-400">
              <Check className="w-4 h-4 text-matcha-500 flex-shrink-0 mt-0.5" />
              <span>En créant un compte, vous acceptez nos conditions générales et notre politique de confidentialité.</span>
            </div>

            <button type="submit" className="btn-primary w-full text-base py-3" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-4">
            Déjà inscrit ?{" "}
            <Link to="/connexion" className="text-sakura-600 font-medium hover:text-sakura-700">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
