"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";

type Suggestion = {
  id: string;
  address: string;
  city: string | null;
  county: string | null;
  stateCode: string | null;
  postalCode: string | null;
  lat: number | null;
  lon: number | null;
};

type Props = {
  defaultValue?: {
    label?: string;
    city?: string;
    stateCode?: string;
    postalCode?: string;
  };
};

export default function BusinessLocationAutocompleteFilter({
  defaultValue,
}: Props) {
  const [query, setQuery] = useState(defaultValue?.label ?? "");
  const [selected, setSelected] = useState<Suggestion | null>(() => {
    if (!defaultValue?.label) return null;

    return {
      id: "default",
      address: defaultValue.label,
      city: defaultValue.city ?? null,
      county: null,
      stateCode: defaultValue.stateCode ?? null,
      postalCode: defaultValue.postalCode ?? null,
      lat: null,
      lon: null,
    };
  });

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          q: query,
          limit: "5",
        });

        const res = await fetch(`/api/tomtom/fuzzy-search?${params.toString()}`);

        if (!res.ok) {
          setSuggestions([]);
          setIsOpen(false);
          return;
        }

        const data = await res.json();
        const nextSuggestions: Suggestion[] = data.suggestions ?? [];

        setSuggestions(nextSuggestions);
        setIsOpen(nextSuggestions.length > 0);
      } catch (err) {
        console.error("Error fetching TomTom suggestions", err);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(s: Suggestion) {
    skipNextFetchRef.current = true;
    setSelected(s);
    setQuery(s.address);
    setSuggestions([]);
    setIsOpen(false);
  }

  function handleClear() {
    setSelected(null);
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative mb-4">
      <input type="hidden" name="locationLabel" value={selected?.address ?? ""} />
      <input type="hidden" name="city" value={selected?.city ?? ""} />
      <input type="hidden" name="state_code" value={selected?.stateCode ?? ""} />
      <input type="hidden" name="postal_code" value={selected?.postalCode ?? ""} />

      <label className="block mb-1 text-md" htmlFor="business-location-filter">
        Location
      </label>

      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

        <input
          id="business-location-filter"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          placeholder="City, state, or ZIP"
          className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-9 py-2.5 pr-16 text-sm outline-none transition focus:border-[#9ed3c3] focus:ring-2 focus:ring-[#9ed3c3]/30"
          autoComplete="off"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
            aria-label="Clear location filter"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {isLoading && !query && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
            Searching...
          </div>
        )}
      </div>

      {selected?.city && (
        <p className="mt-1.5 text-xs font-medium text-[#4f9f88]">
          Filtering by: {selected.city}
          {selected.stateCode ? `, ${selected.stateCode}` : ""}
          {selected.postalCode ? ` ${selected.postalCode}` : ""}
        </p>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
          {suggestions.map((s) => (
            <li
              key={s.id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
              className="cursor-pointer px-3 py-2.5 text-sm hover:bg-[#9ed3c3]/10"
            >
              <p className="font-medium text-neutral-800">{s.address}</p>

              {(s.city || s.stateCode || s.postalCode) && (
                <p className="text-xs text-neutral-500">
                  {[s.city, s.stateCode, s.postalCode].filter(Boolean).join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}