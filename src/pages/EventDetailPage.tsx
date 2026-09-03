import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase, type EventItem } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { formatPrice, formatDate } from "../lib/format";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Ticket,
  Check,
  Loader2,
  QrCode,
  Share2,
} from "lucide-react";

const eventTypeLabels: Record<string, string> = {
  convention: "Convention",
  cosplay_contest: "Concours Cosplay",
  esport_tournament: "Tournoi E-Sport",
  screening: "Projection",
  workshop: "Atelier",
};

export default function EventDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [ticketCode, setTicketCode] = useState<string>("");

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      setEvent(data as unknown as EventItem ?? null);
      setLoading(false);
    })();
  }, [slug]);

  async function handleRegister() {
    if (!session) {
      navigate("/connexion");
      return;
    }
    if (!event) return;

    setRegistering(true);

    const { data: existing } = await supabase
      .from("tickets")
      .select("id")
      .eq("event_id", event.id)
      .eq("user_id", session.user.id)
      .neq("status", "cancelled")
      .maybeSingle();

    if (existing) {
      alert("Vous êtes déjà inscrit à cet événement.");
      setRegistering(false);
      return;
    }

    const code = `OM-${event.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const qrData = `otakumania:event:${event.id}:user:${session.user.id}:code:${code}`;

    const { error } = await supabase.from("tickets").insert({
      event_id: event.id,
      user_id: session.user.id,
      ticket_code: code,
      qr_data: qrData,
      status: "valid",
    });

    if (!error) {
      await supabase.rpc("increment_registered_count", { p_event_id: event.id });
      setEvent({ ...event, registered_count: event.registered_count + 1 });
      setTicketCode(code);
      setRegistered(true);
    }
    setRegistering(false);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="aspect-[2/1] skeleton rounded-2xl mb-6" />
        <div className="h-8 w-2/3 skeleton mb-4" />
        <div className="h-4 w-full skeleton mb-2" />
        <div className="h-4 w-3/4 skeleton" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display font-bold text-2xl text-ink-900 mb-2">Événement introuvable</h1>
        <Link to="/evenements" className="btn-primary mt-4">Retour aux événements</Link>
      </div>
    );
  }

  const spotsLeft = event.capacity - event.registered_count;
  const isPast = new Date(event.event_date) < new Date();
  const isFull = spotsLeft <= 0;

  return (
    <div className="animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/evenements" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour aux événements
        </Link>

        {/* Cover */}
        <div className="relative aspect-[2/1] rounded-2xl overflow-hidden bg-ink-100 mb-6 shadow-sm">
          <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="badge bg-white/90 backdrop-blur-sm text-ink-700">
              {eventTypeLabels[event.event_type]}
            </span>
            {event.is_free && <span className="badge bg-matcha-500 text-white">Gratuit</span>}
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-900 mb-4">{event.title}</h1>

        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="card p-4 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-sakura-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-ink-400">Date</p>
              <p className="font-semibold text-ink-900 text-sm">{formatDate(event.event_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-sakura-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-ink-400">Heure</p>
              <p className="font-semibold text-ink-900 text-sm">
                {new Date(event.event_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                {event.end_date && ` — ${new Date(event.end_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
              </p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-sky-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-ink-400">Lieu</p>
              <p className="font-semibold text-ink-900 text-sm">{event.venue}, {event.city}, {event.country}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-matcha-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-ink-400">Capacité</p>
              <p className="font-semibold text-ink-900 text-sm">{event.registered_count} / {event.capacity} inscrits</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="prose prose-sm max-w-none mb-8">
          <h2 className="font-display font-bold text-lg text-ink-900 mb-3">À propos de cet événement</h2>
          <p className="text-ink-600 leading-relaxed whitespace-pre-line">{event.description}</p>
        </div>

        {/* Registration */}
        <div className="card p-6 sticky bottom-4 shadow-lg">
          {registered ? (
            <div className="text-center animate-scale-in">
              <div className="w-16 h-16 rounded-2xl bg-matcha-50 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-matcha-600" />
              </div>
              <h3 className="font-display font-bold text-lg text-ink-900 mb-1">Inscription confirmée !</h3>
              <p className="text-sm text-ink-500 mb-4">Votre billet a été généré. Retrouvez-le dans « Mes achats ».</p>
              <div className="bg-ink-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <QrCode className="w-5 h-5 text-ink-600" />
                  <span className="font-mono font-bold text-ink-900">{ticketCode}</span>
                </div>
                <p className="text-xs text-ink-400">Code unique à présenter le jour J</p>
              </div>
              <Link to="/mon-espace" className="btn-primary w-full">Voir mes billets</Link>
            </div>
          ) : isPast ? (
            <div className="text-center">
              <p className="text-ink-500 mb-3">Cet événement est passé.</p>
            </div>
          ) : isFull ? (
            <div className="text-center">
              <p className="text-error-600 font-semibold mb-3">Désolé, cet événement est complet.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-ink-500">Prix</p>
                  <p className="font-display font-extrabold text-2xl text-ink-900">
                    {event.is_free ? "Gratuit" : formatPrice(event.price, event.currency)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-ink-500">Places restantes</p>
                  <p className="font-display font-bold text-xl text-matcha-600">{spotsLeft}</p>
                </div>
              </div>
              <button className="btn-primary w-full text-base py-3" onClick={handleRegister} disabled={registering}>
                {registering ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Inscription...</>
                ) : event.is_free ? (
                  <><Ticket className="w-5 h-5" /> S'inscrire gratuitement</>
                ) : (
                  <><Ticket className="w-5 h-5" /> Acheter un billet — {formatPrice(event.price, event.currency)}</>
                )}
              </button>
              {!session && (
                <p className="text-xs text-ink-400 text-center mt-3">Connexion requise pour s'inscrire</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
