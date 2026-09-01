import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase, type EventItem } from "../lib/supabase";
import { EventCard, EventCardSkeleton } from "../components/EventCard";
import { Search, MapPin, X } from "lucide-react";

const eventTypes = [
  { slug: "convention", label: "Conventions" },
  { slug: "cosplay_contest", label: "Concours Cosplay" },
  { slug: "esport_tournament", label: "Tournois E-Sport" },
  { slug: "screening", label: "Projections" },
  { slug: "workshop", label: "Ateliers" },
];

const cities = ["Abidjan", "Dakar", "Lagos", "Accra"];

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedType = searchParams.get("type") ?? "";
  const selectedCity = searchParams.get("ville") ?? "";
  const searchQuery = searchParams.get("q") ?? "";

  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("status", "published")
        .order("event_date", { ascending: true });

      setEvents(data as unknown as EventItem[] ?? []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const filteredEvents = useMemo(() => {
    let result = events.filter((e) => new Date(e.event_date) >= new Date());

    if (selectedType) result = result.filter((e) => e.event_type === selectedType);
    if (selectedCity) result = result.filter((e) => e.city === selectedCity);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.city.toLowerCase().includes(q)
      );
    }

    return result;
  }, [events, selectedType, selectedCity, searchQuery]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  }

  function clearFilters() {
    setSearchParams({});
    setSearchInput("");
  }

  const hasFilters = selectedType || selectedCity || searchQuery;

  return (
    <div className="animate-fade-in">
      <div className="bg-white border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-display font-extrabold text-3xl text-ink-900 mb-2">Événements</h1>
          <p className="text-ink-500">
            Conventions, concours cosplay, tournois e-sport et ateliers à travers l'Afrique de l'Ouest.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={(e) => { e.preventDefault(); updateParam("q", searchInput); }} className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
          <input
            type="text"
            placeholder="Rechercher un événement..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input-field pl-11"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${!selectedType ? "bg-ink-900 text-white" : "bg-white border border-ink-200 text-ink-600 hover:border-ink-300"}`}
            onClick={() => updateParam("type", "")}
          >
            Tous les types
          </button>
          {eventTypes.map((t) => (
            <button
              key={t.slug}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${selectedType === t.slug ? "bg-ink-900 text-white" : "bg-white border border-ink-200 text-ink-600 hover:border-ink-300"}`}
              onClick={() => updateParam("type", t.slug)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${!selectedCity ? "bg-sky-500 text-white" : "bg-white border border-ink-200 text-ink-600 hover:border-ink-300"}`}
            onClick={() => updateParam("ville", "")}
          >
            Toutes les villes
          </button>
          {cities.map((c) => (
            <button
              key={c}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm transition-all ${selectedCity === c ? "bg-sky-500 text-white" : "bg-white border border-ink-200 text-ink-600 hover:border-ink-300"}`}
              onClick={() => updateParam("ville", c)}
            >
              <MapPin className="w-3.5 h-3.5" /> {c}
            </button>
          ))}
          {hasFilters && (
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-error-600 hover:bg-error-50 ml-auto" onClick={clearFilters}>
              <X className="w-3.5 h-3.5" /> Effacer
            </button>
          )}
        </div>

        <p className="text-sm text-ink-500 mb-4">
          {loading ? "Chargement..." : `${filteredEvents.length} événement${filteredEvents.length > 1 ? "s" : ""} à venir`}
        </p>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-ink-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-ink-300" />
            </div>
            <h3 className="font-display font-semibold text-lg text-ink-900 mb-2">Aucun événement trouvé</h3>
            <p className="text-ink-500 mb-4">Essayez d'élargir vos critères de recherche.</p>
            <button className="btn-outline" onClick={clearFilters}>Réinitialiser</button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </div>
    </div>
  );
}
