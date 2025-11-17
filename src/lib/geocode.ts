const TOMTOM_BASE_URL = "https://api.tomtom.com/search/2/geocode";

export type GeocodeResult = {
    city: string | null;
    county: string | null;
    stateCode: string | null;
    countryCode: string | null;
    postalCode: string | null;
    lat: number | null;
    lng: number | null;
    placeId: string | null;
    confidence: number | null;
};

export async function geocodeAddresssTomTom( address: string ): Promise<GeocodeResult | null> {

    const apiKey = process.env.TOMTOM_API_KEY;
    if (!apiKey){
        console.error("Missing TOMTOM_API_KEY env var");
        return null;
    }

    if (!address.trim()) return null;

    const query = encodeURIComponent(address.trim());
    const url = 
        `${TOMTOM_BASE_URL}/${query}.json` +
        `?key=${apiKey}` + 
        `&limit=1` + 
        `&countrySet=US` + 
        `$language=en-US`;
    
    const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
    });

    if (!res.ok){
        console.error("TomTom geocode error:", res.status, await res.text());
        return null;
    }

    const json = await res.json() as {
        results?: Array<{
            id?: string;
            matchConfidence?: { score?: number };
            address?: {
                municipality?: string;
                municipalitySubdivision?: string;
                countrySecondarySubdivision?: string;
                countrySubdivision?: string;
                postalCode?: string;
                countryCode?: string;
            };
            position?: { lat?: number, lon?: number };
        }>;
    }

    const best = json.results?.[0];
    if (!best) return null;

    const addr = best.address ?? {};
    const pos = best.position ?? {};

    const city =
        addr.municipality ||
        addr.municipalitySubdivision ||
        null;
    
    const result:  GeocodeResult = {
        city,
        county: addr.countrySecondarySubdivision || null,
        stateCode: addr.countrySubdivision || null,
        countryCode: addr.countryCode || null,
        postalCode: addr.postalCode || null,
        lat: typeof pos.lat === "number" ? pos.lat : null,
        lng: typeof pos.lon === "number" ? pos.lon : null,
        placeId: best.id || null,
        confidence:
            typeof best.matchConfidence?.score === "number"
                ? best.matchConfidence.score
                : null,
    };

    return result;
}