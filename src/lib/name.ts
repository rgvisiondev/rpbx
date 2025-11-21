export type NameParts = { first: string; last: string };

export function splitName(full: string): NameParts {
    const clean = full.trim().replace(/\s+/g, " ");
    if (!clean) return { first: "", last: "" };
    
    const stripped = clean.replace(/\s+(Jr\.?|Sr\.?|II|III|IV)$/i, "");

    const parts = stripped.split(" ");

    if (parts.length === 1) return { first: parts[0], last: "" };
    return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1]};
}