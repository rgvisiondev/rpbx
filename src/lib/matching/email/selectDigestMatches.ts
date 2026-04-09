// lib/matching/selectDigestMatches.ts

export type MatchTier = "excellent" | "strong" | "weak";

export type DigestCandidate<T> = {
  entity: T;
  score: number;
  tier: MatchTier;
  reasons: string[];
  reasonCodes?: string[];
  createdAt?: string | null;
  updatedAt?: string | null;

  /**
   * Phase 1:
   * default false if not supplied
   * later this can come from exposure tracking
   */
  isPreviouslySeen?: boolean;

  /**
   * Optional identifier for future dedupe / tracking.
   * Example:
   * - listing.id
   * - investor.id
   * - `${listingId}:${investorId}`
   */
  dedupeKey?: string;

  /**
   * Optional grouping context.
   * Useful for business owners with multiple listings.
   * Example:
   * - listingId that caused the investor match
   */
  contextKey?: string;
};

export type SelectedDigestMatch<T> = DigestCandidate<T> & {
  isFeatured: boolean;
  rank: number;
};

export type DigestSelectionResult<T> = {
  shouldSend: boolean;
  featuredMatch: SelectedDigestMatch<T> | null;
  matches: SelectedDigestMatch<T>[];
  totalQualified: number;
};

type Options<T> = {
  maxMatches?: number;
  excellentThreshold?: number;
  strongThreshold?: number;

  /**
   * If true, prefer previously unseen items first.
   * Safe default for Phase 1.
   */
  preferUnseen?: boolean;

  /**
   * Optional custom dedupe logic.
   * If omitted, dedupeKey is used when present.
   */
  dedupeBy?: (candidate: DigestCandidate<T>) => string | null | undefined;
};

const DEFAULTS = {
  maxMatches: 3,
  excellentThreshold: 80,
  strongThreshold: 60,
  preferUnseen: true,
};

function toTimestamp(dateLike?: string | null): number {
  if (!dateLike) return 0;
  const ts = new Date(dateLike).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function dedupeCandidates<T>(
  candidates: DigestCandidate<T>[],
  getKey?: (candidate: DigestCandidate<T>) => string | null | undefined
): DigestCandidate<T>[] {
  const seen = new Map<string, DigestCandidate<T>>();
  const noKey: DigestCandidate<T>[] = [];

  for (const candidate of candidates) {
    const key = getKey?.(candidate) ?? candidate.dedupeKey;

    if (!key) {
      noKey.push(candidate);
      continue;
    }

    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, candidate);
      continue;
    }

    // Keep the better candidate
    const existingUpdated = toTimestamp(existing.updatedAt ?? existing.createdAt);
    const candidateUpdated = toTimestamp(candidate.updatedAt ?? candidate.createdAt);

    const shouldReplace =
      candidate.score > existing.score ||
      (candidate.score === existing.score && candidateUpdated > existingUpdated);

    if (shouldReplace) {
      seen.set(key, candidate);
    }
  }

  return [...seen.values(), ...noKey];
}

function rankCandidates<T>(
  a: DigestCandidate<T>,
  b: DigestCandidate<T>,
  preferUnseen: boolean
): number {
  // 1) unseen first
  if (preferUnseen) {
    const aSeen = a.isPreviouslySeen === true ? 1 : 0;
    const bSeen = b.isPreviouslySeen === true ? 1 : 0;
    if (aSeen !== bSeen) return aSeen - bSeen;
  }

  // 2) higher tier first
  const tierWeight = (tier: MatchTier) =>
    tier === "excellent" ? 2 : tier === "strong" ? 1 : 0;

  const tierDiff = tierWeight(b.tier) - tierWeight(a.tier);
  if (tierDiff !== 0) return tierDiff;

  // 3) higher score first
  const scoreDiff = b.score - a.score;
  if (scoreDiff !== 0) return scoreDiff;

  // 4) more recently updated first
  const aUpdated = toTimestamp(a.updatedAt ?? a.createdAt);
  const bUpdated = toTimestamp(b.updatedAt ?? b.createdAt);
  return bUpdated - aUpdated;
}

function qualifyCandidates<T>(
  candidates: DigestCandidate<T>[],
  strongThreshold: number,
  excellentThreshold: number
): DigestCandidate<T>[] {
  return candidates
    .map((candidate) => {
      let tier = candidate.tier;
      if (!tier || tier === "weak") {
        if (candidate.score >= excellentThreshold) tier = "excellent";
        else if (candidate.score >= strongThreshold) tier = "strong";
        else tier = "weak";
      }

      return {
        ...candidate,
        tier,
      };
    })
    .filter((candidate) => candidate.tier === "excellent" || candidate.tier === "strong");
}

export function selectDigestMatches<T>(
  input: DigestCandidate<T>[],
  options: Options<T> = {}
): DigestSelectionResult<T> {
  const {
    maxMatches = DEFAULTS.maxMatches,
    excellentThreshold = DEFAULTS.excellentThreshold,
    strongThreshold = DEFAULTS.strongThreshold,
    preferUnseen = DEFAULTS.preferUnseen,
    dedupeBy,
  } = options;

  if (!Array.isArray(input) || input.length === 0) {
    return {
      shouldSend: false,
      featuredMatch: null,
      matches: [],
      totalQualified: 0,
    };
  }

  const qualified = qualifyCandidates(input, strongThreshold, excellentThreshold);
  const deduped = dedupeCandidates(qualified, dedupeBy);

  const ranked = [...deduped].sort((a, b) => rankCandidates(a, b, preferUnseen));

  const selectedBase = ranked.slice(0, maxMatches);

  if (selectedBase.length === 0) {
    return {
      shouldSend: false,
      featuredMatch: null,
      matches: [],
      totalQualified: qualified.length,
    };
  }

  // Feature the first excellent match if present, otherwise feature the top ranked match
  let featuredIndex = selectedBase.findIndex((m) => m.tier === "excellent");
  if (featuredIndex === -1) featuredIndex = 0;

  const matches: SelectedDigestMatch<T>[] = selectedBase.map((match, index) => ({
    ...match,
    isFeatured: index === featuredIndex,
    rank: index + 1,
  }));

  const featuredMatch = matches.find((m) => m.isFeatured) ?? null;

  return {
    shouldSend: matches.length > 0,
    featuredMatch,
    matches,
    totalQualified: qualified.length,
  };
}