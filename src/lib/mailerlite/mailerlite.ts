// lib/mailerlite/mailerlite.ts

export type MembershipRole = "business" | "investor" | null;
export type SyncSource = "newsletter" | "incomplete" | "subscription";

const MAILERLITE_API = "https://connect.mailerlite.com/api";

function mlHeaders() {
  const apiKey = process.env.NEWSLETTER_NON_MEMBERS_API_KEY;
  if (!apiKey) throw new Error("Missing NEWSLETTER_NON_MEMBERS_API_KEY");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

function getGroupIds() {
  const MASTER = process.env.ML_GROUP_MASTER;
  const NON_SUB = process.env.ML_GROUP_NON_SUB; // newsletter-only
  const INCOMPLETE = process.env.ML_GROUP_INCOMPLETE; // started signup, not subscribed yet
  const BUSINESS = process.env.ML_GROUP_BUSINESS;
  const INVESTOR = process.env.ML_GROUP_INVESTOR;

  if (!MASTER || !NON_SUB || !INCOMPLETE || !BUSINESS || !INVESTOR) {
    throw new Error(
      "Missing one or more MailerLite group env vars: ML_GROUP_MASTER, ML_GROUP_NON_SUB, ML_GROUP_INCOMPLETE, ML_GROUP_BUSINESS, ML_GROUP_INVESTOR",
    );
  }

  return { MASTER, NON_SUB, INCOMPLETE, BUSINESS, INVESTOR };
}

export async function getOrCreateSubscriber(
  email: string,
  name?: string,
): Promise<string> {
  const getRes = await fetch(
    `${MAILERLITE_API}/subscribers/${encodeURIComponent(email)}`,
    { headers: mlHeaders() },
  );

  if (getRes.ok) {
    const data = await getRes.json();
    return data.data.id as string;
  }

  if (getRes.status !== 404) {
    const text = await getRes.text();
    throw new Error(`MailerLite GET failed (${getRes.status}): ${text}`);
  }

  const createRes = await fetch(`${MAILERLITE_API}/subscribers`, {
    method: "POST",
    headers: mlHeaders(),
    body: JSON.stringify({
      email,
      ...(name ? { name } : {}),
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`MailerLite CREATE failed (${createRes.status}): ${text}`);
  }

  const created = await createRes.json();
  return created.data.id as string;
}

export async function addSubscriberToGroup(subscriberId: string, groupId: string) {
  const res = await fetch(
    `${MAILERLITE_API}/subscribers/${subscriberId}/groups/${groupId}`,
    { method: "POST", headers: mlHeaders() },
  );

  if (!res.ok && res.status !== 409) {
    const text = await res.text();
    throw new Error(`Add group failed (${res.status}): ${text}`);
  }
}

export async function removeSubscriberFromGroup(subscriberId: string, groupId: string) {
  const res = await fetch(
    `${MAILERLITE_API}/subscribers/${subscriberId}/groups/${groupId}`,
    { method: "DELETE", headers: mlHeaders() },
  );

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Remove group failed (${res.status}): ${text}`);
  }
}

/**
 * Rules:
 * - Always: MASTER
 * - Newsletter signup: add NON_SUB, remove INCOMPLETE + BUSINESS + INVESTOR
 * - Incomplete signup: add INCOMPLETE, remove NON_SUB + BUSINESS + INVESTOR
 * - Subscription (business/investor): add BUSINESS/INVESTOR, remove NON_SUB + INCOMPLETE
 */
export async function syncMailerLiteGroups(
  email: string,
  role: MembershipRole,
  name?: string,
  source: SyncSource = "subscription",
) {
  const subscriberId = await getOrCreateSubscriber(email, name);
  const GROUPS = getGroupIds();

  // Always in master
  await addSubscriberToGroup(subscriberId, GROUPS.MASTER);

  // --- Newsletter-only (public form) ---
  if (source === "newsletter") {
    await addSubscriberToGroup(subscriberId, GROUPS.NON_SUB);
    await removeSubscriberFromGroup(subscriberId, GROUPS.INCOMPLETE);
    await removeSubscriberFromGroup(subscriberId, GROUPS.BUSINESS);
    await removeSubscriberFromGroup(subscriberId, GROUPS.INVESTOR);
    return;
  }

  // --- Incomplete signup (created auth user, pre-checkout) ---
  if (source === "incomplete") {
    await addSubscriberToGroup(subscriberId, GROUPS.INCOMPLETE);
    await removeSubscriberFromGroup(subscriberId, GROUPS.NON_SUB);
    await removeSubscriberFromGroup(subscriberId, GROUPS.BUSINESS);
    await removeSubscriberFromGroup(subscriberId, GROUPS.INVESTOR);
    return;
  }

  // --- Subscription path ---
  if (!role) {
    // If this ever happens, do nothing besides MASTER to avoid wrong grouping.
    return;
  }

  await removeSubscriberFromGroup(subscriberId, GROUPS.NON_SUB);
  await removeSubscriberFromGroup(subscriberId, GROUPS.INCOMPLETE);

  if (role === "business") {
    await addSubscriberToGroup(subscriberId, GROUPS.BUSINESS);
    await removeSubscriberFromGroup(subscriberId, GROUPS.INVESTOR);
  } else {
    await addSubscriberToGroup(subscriberId, GROUPS.INVESTOR);
    await removeSubscriberFromGroup(subscriberId, GROUPS.BUSINESS);
  }
}
