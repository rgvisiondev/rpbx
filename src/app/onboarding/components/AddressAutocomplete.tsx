"use client";

import { useEffect, useRef, useState } from "react";

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
  name: string;
  defaultValue?: string;
  placeholder?: string;
};

export default function AddressAutocomplete({
  name,
  defaultValue = "",
  placeholder = "123 Main St, McAllen, TX 78501",
}: Props) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // close dropdown on outside click
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Only search after 3+ chars
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
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
        setSuggestions(data.suggestions ?? []);
        setIsOpen((data.suggestions ?? []).length > 0);
      } catch (err) {
        console.error("Error fetching TomTom suggestions", err);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 250); // debounce 250ms

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  function handleSelect(s: Suggestion) {
    setQuery(s.address);
    setSuggestions([]);
    setIsOpen(false);
    // (OPTIONAL) You could stash lat/lon/city/county into hidden inputs here,
    // and then read them in your server action instead of re-geocoding.
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        name={name}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full border rounded px-3 py-2"
        autoComplete="off"
      />
      {isLoading && (
        <div className="absolute right-3 top-2.5 text-xs text-gray-400">
          Searching...
        </div>
      )}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow">
          {suggestions.map((s) => (
            <li
              key={s.id}
              // use onMouseDown so the click fires before input blur
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
            >
              {s.address}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
