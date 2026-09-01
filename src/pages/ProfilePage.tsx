import { useState } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { User, Save, Loader2, Check, AtSign } from "lucide-react";

export default function ProfilePage() {
  const { profile, session, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ username, full_name: fullName, bio })
      .eq("id", session.user.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="font-display font-extrabold text-2xl text-ink-900 mb-6">Mon profil</h1>

      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sakura-400 to-sakura-600 flex items-center justify-center text-white font-bold text-2xl">
            {profile?.username?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="font-display font-bold text-lg text-ink-900">{profile?.full_name}</p>
            <p className="text-sm text-ink-500">@{profile?.username}</p>
            <span className="badge bg-sakura-50 text-sakura-600 mt-1">
              {profile?.role.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-4">
        <h2 className="font-display font-bold text-lg text-ink-900">Modifier mes informations</h2>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Nom d'utilisateur</label>
          <div className="relative">
            <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              className="input-field pl-11"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Parlez-nous de vous, de vos cosplays préférés..."
            rows={4}
            className="input-field resize-none"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <><Check className="w-5 h-5" /> Enregistré</> : <><Save className="w-5 h-5" /> Enregistrer</>}
        </button>
      </form>
    </div>
  );
}
