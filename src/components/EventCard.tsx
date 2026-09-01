import { Link } from "react-router-dom";
import type { EventItem } from "../lib/supabase";
import { formatPrice, formatDate, formatDateShort } from "../lib/format";
import { Calendar, MapPin, Users, Ticket } from "lucide-react";

const eventTypeLabels: Record<string, string> = {
  convention: "Convention",
  cosplay_contest: "Concours Cosplay",
  esport_tournament: "Tournoi E-Sport",
  screening: "Projection",
  workshop: "Atelier",
};

const eventTypeColors: Record<string, string> = {
  convention: "bg-sakura-50 text-sakura-600",
  cosplay_contest: "bg-matcha-50 text-matcha-600",
  esport_tournament: "bg-sky-50 text-sky-600",
  screening: "bg-sun-50 text-sun-600",
  workshop: "bg-ink-100 text-ink-600",
};

export function EventCard({ event }: { event: EventItem }) {
  const spotsLeft = event.capacity - event.registered_count;
  const isPast = new Date(event.event_date) < new Date();

  return (
    <Link
      to={`/evenements/${event.slug}`}
      className="card card-hover group flex flex-col sm:flex-row overflow-hidden"
    >
      <div className="relative sm:w-48 aspect-[16/10] sm:aspect-auto overflow-hidden bg-ink-100 flex-shrink-0">
        <img
          src={event.cover_image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 bg-white rounded-xl px-3 py-1.5 text-center shadow-sm">
          <p className="text-[10px] uppercase font-semibold text-ink-400 leading-none">
            {formatDateShort(event.event_date).split(" ")[1]}
          </p>
          <p className="text-xl font-bold text-ink-900 leading-none mt-0.5">
            {formatDateShort(event.event_date).split(" ")[0]}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`badge ${eventTypeColors[event.event_type] ?? "bg-ink-100 text-ink-600"}`}>
            {eventTypeLabels[event.event_type] ?? event.event_type}
          </span>
          {event.is_free ? (
            <span className="badge bg-matcha-50 text-matcha-600">Gratuit</span>
          ) : (
            <span className="text-sakura-600 font-bold text-sm">
              {formatPrice(event.price, event.currency)}
            </span>
          )}
        </div>

        <h3 className="font-display font-semibold text-ink-900 line-clamp-2 group-hover:text-sakura-600 transition-colors">
          {event.title}
        </h3>

        <div className="mt-3 space-y-1.5 text-sm text-ink-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-ink-400 flex-shrink-0" />
            <span>{formatDate(event.event_date, { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-ink-400 flex-shrink-0" />
            <span className="line-clamp-1">{event.venue}, {event.city}</span>
          </div>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between">
          {!isPast && spotsLeft > 0 ? (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-ink-400" />
              <span className="text-ink-600">
                {spotsLeft} place{spotsLeft > 1 ? "s" : ""} restante{spotsLeft > 1 ? "s" : ""}
              </span>
            </div>
          ) : isPast ? (
            <span className="text-sm text-ink-400">Événement passé</span>
          ) : (
            <span className="text-sm text-error-600 font-medium">Complet</span>
          )}
          <span className="flex items-center gap-1.5 text-sm font-medium text-sakura-600 group-hover:gap-2.5 transition-all">
            <Ticket className="w-4 h-4" />
            Détails
          </span>
        </div>
      </div>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="card flex flex-col sm:flex-row overflow-hidden">
      <div className="sm:w-48 aspect-[16/10] sm:aspect-auto skeleton" />
      <div className="p-5 flex-1 space-y-3">
        <div className="h-5 w-32 skeleton" />
        <div className="h-6 w-full skeleton" />
        <div className="h-4 w-48 skeleton" />
        <div className="h-4 w-40 skeleton" />
        <div className="flex justify-between pt-2">
          <div className="h-4 w-28 skeleton" />
          <div className="h-4 w-16 skeleton" />
        </div>
      </div>
    </div>
  );
}
