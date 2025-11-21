// app/dashboard/_components/RecentActivityList.tsx

type ListingMeta = { listing_id: string; title: string | null; status?: string | null }
type MembershipMeta = { product_name: string; plan_code: string; status: string }
type ProfileMeta = { primary_industry?: string | null; status?: string | null }
type PromoMeta = { listing_id: string; title?: string | null; status?: string | null; ends_at?: string | null }
type EvalMeta = { listing_id: string; title?: string | null; status?: "purchased" | "completed" }

// Known events
type ListingCreated   = { id: string; type: "listing_created";      at: string; meta?: ListingMeta }
type ListingUpdated   = { id: string; type: "listing_updated";      at: string; meta?: ListingMeta }
type MembershipUpdated= { id: string; type: "membership_updated";   at: string; meta?: MembershipMeta }
type ProfileUpdated   = { id: string; type: "profile_updated";      at: string; meta?: ProfileMeta }
type PromoStarted     = { id: string; type: "listing_promo_started";at: string; meta?: PromoMeta }
type PromoCanceled    = { id: string; type: "listing_promo_canceled";at: string; meta?: PromoMeta }
type EvalPurchased    = { id: string; type: "evaluation_purchased"; at: string; meta?: EvalMeta }

// Catch-all (unknown/extra) event
type UnknownActivity  = { id: string; type: string;                 at: string; meta?: Record<string, unknown> }

type Activity =
  | ListingCreated
  | ListingUpdated
  | MembershipUpdated
  | ProfileUpdated
  | PromoStarted
  | PromoCanceled
  | EvalPurchased
  | UnknownActivity

export default function RecentActivityList({ items }: { items: Activity[] }) {
  if (!items?.length) {
    return (
      <ul className="list-disc list-inside space-y-2">
        <li className="text-white/90">You’re all caught up.</li>
      </ul>
    )
  }

  return (
    <ul className="list-disc list-inside space-y-2">
      {items.map((a: Activity) => {
        const when = formatWhen(a.at)
        const { label, detail } = formatLabel(a)
        return (
          <li key={a.id} className="text-white">
            <span className="font-medium">{label}</span>
            {detail ? <> {detail}</> : null}
            <span className="opacity-90"> · {when}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** If it's the same calendar day, show relative (“xh ago”), else show a short date. */
function formatWhen(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    const diffMs = now.getTime() - d.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60)
    if (hours >= 1) return `${hours}h ago`
    if (minutes >= 1) return `${minutes}m ago`
    return "just now"
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

// ---------- Narrowing helpers (no `any`) ----------
function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object"
}

function hasStringProp<K extends string>(obj: unknown, key: K): obj is Record<K, string> {
  return isObject(obj) && typeof (obj as Record<string, unknown>)[key] === "string"
}

function toWords(s: string): string {
  // Safer for older libs than replaceAll; TS knows it returns string
  return s.replace(/_/g, " ")
}

function getStringTitle(meta: unknown, fallback = "Listing"): string {
  if (hasStringProp(meta, "title")) {
    const t = meta.title
    if (t.trim().length > 0) return t
  }
  return fallback
}

/** Turn our typed activity into a friendly label + detail string. */
function formatLabel(a: Activity): { label: string; detail?: string } {
  if (a.type === "listing_created" || a.type === "listing_updated") {
    const title = getStringTitle(a.meta);
    return { label: title, detail: a.type === "listing_created" ? "created" : "updated" }
  }

  if (a.type === "membership_updated") {
    const m = a.meta
    const label: string = typeof m?.product_name === "string" && m.product_name.trim().length > 0
  ? m.product_name
  : "Membership";
    return { label, detail: m?.status ? `status: ${m.status}` : undefined }
  }

  if (a.type === "profile_updated") {
    const p = a.meta
    const detail: string = p?.primary_industry ? `updated (${p.primary_industry})` : "updated"
    return { label: "Investor profile", detail }
  }

  if (a.type === "listing_promo_started") {
    const title = getStringTitle(a.meta)
    return { label: title, detail: "boost activated" }
  }

  if (a.type === "listing_promo_canceled") {
    const title = getStringTitle(a.meta)
    const endIso = hasStringProp(a.meta, "ends_at") ? a.meta.ends_at : undefined
    const when = endIso ? ` (ends ${new Date(endIso).toLocaleDateString()})` : ""
    return { label: title, detail: `boost cancellation scheduled${when}` }
  }

  if (a.type === "evaluation_purchased") {
    const title = getStringTitle(a.meta)
    return { label: title, detail: "evaluation purchased" }
  }

  // Unknown/extra events
  return { label: toWords(a.type) }
}
