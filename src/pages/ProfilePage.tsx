import { useState, useRef } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { User, Save, Loader2, Check, AtSign, Camera, Crown, Shield, Zap, Star } from "lucide-react";

const roleBadgeConfig: Record<string, { icon: typeof Crown; label: string; color: string; bg: string }> = {
  super_admin: { icon: Crown, label: "Super Admin", color: "text-sun-300", bg: "bg-sun-500/15" },
  admin_content: { icon: Shield, label: "Admin Contenu", color: "text-cyan-300", bg: "bg-cyan-500/15" },
  admin_moderation: { icon: Zap, label: "Modérateur", color: "text-matcha-300", bg: "bg-matcha-500/15" },
  creator: { icon: Star, label: "Créateur", color: "text-sakura-300", bg: "bg-sakura-500/15" },
  organizer: { icon: Star, label: "Organisateur", color: "text-white/80", bg: "bg-white/5" },
  user: { icon: Star, label: "Membre Otaku", color: "text-white/70", bg: "bg-white/5" },
};

export default function ProfilePage() {
  const { profile, session, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !session) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${session.user.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      alert("Erreur lors du téléversement de l'image.");
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", session.user.id);

    setAvatarUrl(publicUrl);
    await refreshProfile();
    setUploadingAvatar(false);
  }

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

  const roleKey = profile?.role ?? "user";
  const badge = roleBadgeConfig[roleKey] ?? roleBadgeConfig.user;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="font-display font-extrabold text-2xl text-white mb-6">Mon profil</h1>

      {/* Profile card with avatar + badge */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-sakura-400 to-sakura-600 flex items-center justify-center text-white font-bold text-2xl transition-all hover:opacity-80"
              title="Changer l'avatar"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={profile?.username ?? "Avatar"} className="w-full h-full object-cover" />
              ) : (
                profile?.username?.[0]?.toUpperCase() ?? "U"
              )}
            </button>
            <div className="absolute inset-0 rounded-2xl bg-night-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Camera className="w-6 h-6 text-white" />
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-2xl bg-night-950/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <p className="font-display font-bold text-lg text-white">{profile?.full_name}</p>
            <p className="text-sm text-white/70">@{profile?.username}</p>
            <span className={`badge mt-1.5 ${badge.bg} ${badge.color}`}>
              <badge.icon className="w-3.5 h-3.5" /> {badge.label}
            </span>
          </div>
        </div>
        <p className="text-xs text-white/55 mt-3 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5" /> Cliquez sur la photo pour changer votre avatar (max 5 Mo)
        </p>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-4">
        <h2 className="font-display font-bold text-lg text-white">Modifier mes informations</h2>

        <div>
          <label className="block text-sm font-medium text-white/90 mb-1.5">Nom d'utilisateur</label>
          <div className="relative">
            <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/55" />
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
          <label className="block text-sm font-medium text-white/90 mb-1.5">Nom complet</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/55" />
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
          <label className="block text-sm font-medium text-white/90 mb-1.5">Bio</label>
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
