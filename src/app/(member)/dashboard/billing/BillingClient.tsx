"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BriefcaseBusiness,
  CircleDollarSign,
  Handshake,
  PauseCircle,
  SearchX,
  TrendingDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PausedBillingBanner } from "../_components/PausedBillingBanner";
import { BoostRestoreBanner } from "../_components/BoostRestoreBanner";

type BillingRow = {
  type: "platform" | "boost";
  label: string;
  status: string | null;
  renews: string | null;
  listingId?: string;
  listingTitle?: string | null;
  stripeSubscriptionId?: string | null;
  cancelAt?: string | null;
  cancelAtPeriodEnd?: boolean | null;

  pauseStatus?: string | null;
  pauseStartsAt?: string | null;
  pauseEndsAt?: string | null;
  isPauseEligible?: boolean;
  parentListingSubscriptionId?: string | null;

  pauseCount?: number | null;
  lastPauseStartedAt?: string | null;

  pausedBoostRestorePending?: boolean | null;
  pausedBoostSubscriptionId?: string | null;
  pausedBoostRestoreDismissedAt?: string | null;
  pausedBoostRestoreCompletedAt?: string | null;
};

type CancelReasonOption = {
  value: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

type RowUiState =
  | "active"
  | "trialing"
  | "past_due"
  | "unpaid"
  | "canceling"
  | "pause_scheduled"
  | "paused"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unknown";

const businessReasonOptions: CancelReasonOption[] = [
  {
    value: "sold_business",
    label: "I sold my business",
    description: "I no longer need the platform because my goals were met.",
    icon: Handshake,
  },
  {
    value: "low_traction",
    label: "I didn’t get enough investor interest",
    description: "The visibility or traction wasn’t what I expected.",
    icon: TrendingDown,
  },
  {
    value: "no_fit",
    label: "I didn’t find the right investor fit",
    description:
      "I didn’t connect with the right kind of opportunities or buyers.",
    icon: SearchX,
  },
  {
    value: "too_expensive",
    label: "It’s too expensive right now",
    description: "The cost doesn’t fit where I am right now.",
    icon: CircleDollarSign,
  },
  {
    value: "not_ready",
    label: "I’m not ready yet",
    description: "I may return later, but the timing isn’t right today.",
    icon: PauseCircle,
  },
  {
    value: "other",
    label: "Other",
    description: "Something else influenced my decision.",
    icon: BriefcaseBusiness,
  },
];

const investorReasonOptions: CancelReasonOption[] = [
  {
    value: "not_investing",
    label: "I’m not actively investing right now",
    description: "I’m stepping back for now and may return later.",
    icon: PauseCircle,
  },
  {
    value: "low_inventory",
    label: "There weren’t enough relevant opportunities",
    description: "I wasn’t seeing enough businesses that matched my interests.",
    icon: SearchX,
  },
  {
    value: "no_fit",
    label: "I didn’t find the right businesses",
    description: "The opportunities available weren’t the right fit for me.",
    icon: Handshake,
  },
  {
    value: "too_expensive",
    label: "It’s too expensive right now",
    description: "The cost doesn’t fit where I am right now.",
    icon: CircleDollarSign,
  },
  {
    value: "other",
    label: "Other",
    description: "Something else influenced my decision.",
    icon: BriefcaseBusiness,
  },
];

function deriveRowUiState(row: BillingRow): RowUiState {
  if (row.pauseStatus === "scheduled") return "pause_scheduled";
  if (row.pauseStatus === "active" || row.status === "paused") return "paused";
  if (row.status === "active" && row.cancelAtPeriodEnd) return "canceling";

  switch (row.status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "canceled":
      return "canceled";
    case "incomplete":
      return "incomplete";
    case "incomplete_expired":
      return "incomplete_expired";
    default:
      return "unknown";
  }
}

function formatDisplayStatusFromState(
  uiState: RowUiState,
  fallbackStatus?: string | null,
): string {
  switch (uiState) {
    case "pause_scheduled":
      return "Pause Scheduled";
    case "paused":
      return "Paused";
    case "canceling":
      return "Canceling";
    case "trialing":
      return "Trialing";
    case "active":
      return "Active";
    case "canceled":
      return "Canceled";
    case "incomplete":
      return "Incomplete";
    case "incomplete_expired":
      return "Incomplete (Expired)";
    case "past_due":
      return "Past due";
    case "unpaid":
      return "Unpaid";
    default:
      return fallbackStatus
        ? fallbackStatus.charAt(0).toUpperCase() + fallbackStatus.slice(1)
        : "—";
  }
}

function getStatusClassFromState(uiState: RowUiState): string {
  switch (uiState) {
    case "active":
      return "inline-flex items-center px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs";
    case "trialing":
      return "inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs";
    case "pause_scheduled":
      return "inline-flex items-center px-2 py-1 rounded-full bg-sky-50 text-sky-700 text-xs";
    case "paused":
      return "inline-flex items-center px-2 py-1 rounded-full bg-sky-50 text-sky-700 text-xs";
    case "canceling":
      return "inline-flex items-center px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs";
    case "past_due":
    case "unpaid":
    case "canceled":
      return "inline-flex items-center px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs";
    default:
      return "inline-flex items-center px-2 py-1 rounded-full bg-gray-50 text-gray-700 text-xs";
  }
}

function shouldOfferPause(reason: string) {
  return (
    reason === "too_expensive" ||
    reason === "not_ready" ||
    reason === "not_investing" ||
    reason === "low_inventory" ||
    reason === "no_fit"
  );
}

function formatPauseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function canStillOfferPause(row: BillingRow | null) {
  if (!row) return false;

  const pauseCount = row.pauseCount ?? 0;
  if (pauseCount < 1) return true;

  if (!row.lastPauseStartedAt) return false;

  const lastPauseStartedAt = new Date(row.lastPauseStartedAt);
  if (Number.isNaN(lastPauseStartedAt.getTime())) return false;

  const nextEligibleAt = new Date(lastPauseStartedAt);
  nextEligibleAt.setFullYear(nextEligibleAt.getFullYear() + 1);

  return new Date() >= nextEligibleAt;
}

function isCurrentPlatformContext(
  row: BillingRow,
  rowsBySubscriptionId: Map<string, BillingRow>,
) {
  if (row.type !== "platform") return false;

  const uiState = getEffectiveRowUiState(row, rowsBySubscriptionId);
  return (
    uiState === "active" ||
    uiState === "trialing" ||
    uiState === "past_due" ||
    uiState === "unpaid" ||
    uiState === "canceling" ||
    uiState === "pause_scheduled" ||
    uiState === "paused"
  );
}

function getPlatformContextKey(row: BillingRow) {
  return row.listingId || row.stripeSubscriptionId || row.label;
}

function getEffectiveRowUiState(
  row: BillingRow,
  rowsBySubscriptionId: Map<string, BillingRow>,
): RowUiState {
  if (row.type === "boost" && row.parentListingSubscriptionId) {
    const parentRow = rowsBySubscriptionId.get(row.parentListingSubscriptionId);
    if (parentRow) {
      const parentState = deriveRowUiState(parentRow);
      if (parentState === "pause_scheduled" || parentState === "paused") {
        return parentState;
      }
    }
  }

  return deriveRowUiState(row);
}

export default function BillingClient() {
  const searchParams = useSearchParams();
  const didAutoOpenBoostRestore = useRef(false);

  const [rows, setRows] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
    string | null
  >(null);
  const [selectedRow, setSelectedRow] = useState<BillingRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelFeedback, setCancelFeedback] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [continueLoadingId, setContinueLoadingId] = useState<string | null>(
    null,
  );
  const [resumeLoadingId, setResumeLoadingId] = useState<string | null>(null);

  const [boostRestoreModalOpen, setBoostRestoreModalOpen] = useState(false);
  const [boostRestoreRow, setBoostRestoreRow] = useState<BillingRow | null>(
    null,
  );
  const [restoreBoostLoadingId, setRestoreBoostLoadingId] = useState<
    string | null
  >(null);
  const [dismissBoostLoadingId, setDismissBoostLoadingId] = useState<
    string | null
  >(null);

  useEffect(() => {
    void refreshRows();
  }, []);

  async function refreshRows() {
    try {
      setLoading(true);
      const res = await fetch("/api/billing/rows", { cache: "no-store" });
      const data = await res.json();
      setRows(data.rows ?? []);
      setUserType(data.userType ?? null);
    } catch (e) {
      console.error("Failed to load billing rows", e);
    } finally {
      setLoading(false);
    }
  }

  const rowsBySubscriptionId = useMemo(() => {
    const map = new Map<string, BillingRow>();
    for (const row of rows) {
      if (row.stripeSubscriptionId) {
        map.set(row.stripeSubscriptionId, row);
      }
    }
    return map;
  }, [rows]);

  useEffect(() => {
    if (loading || didAutoOpenBoostRestore.current) return;
    if (searchParams.get("resume") !== "success") return;

    const promptRows = rows.filter(
      (row) =>
        row.type === "platform" &&
        row.pausedBoostRestorePending &&
        !row.pausedBoostRestoreDismissedAt,
    );

    if (promptRows.length !== 1) return;

    const candidate = promptRows[0];
    const livePlatformContexts = new Set(
      rows
        .filter((row) => isCurrentPlatformContext(row, rowsBySubscriptionId))
        .map((row) => getPlatformContextKey(row)),
    );

    if (livePlatformContexts.size <= 1) {
      didAutoOpenBoostRestore.current = true;
      setBoostRestoreRow(candidate);
      setBoostRestoreModalOpen(true);
    }
  }, [loading, rows, rowsBySubscriptionId, searchParams]);

  function resetCancelState() {
    setSelectedSubscriptionId(null);
    setSelectedRow(null);
    setCancelReason("");
    setCancelFeedback("");
    setCancelLoading(false);
    setPauseLoading(false);
  }

  function openCancelModal(row: BillingRow) {
    if (!row.stripeSubscriptionId) return;
    setSelectedSubscriptionId(row.stripeSubscriptionId);
    setSelectedRow(row);
    setCancelReason("");
    setCancelFeedback("");
    setCancelModalOpen(true);
  }

  async function submitCancellation() {
    if (!selectedSubscriptionId) {
      alert("No subscription selected.");
      return;
    }

    if (!cancelReason) {
      alert("Please select a reason for cancellation.");
      return;
    }

    try {
      setCancelLoading(true);

      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: selectedSubscriptionId,
          reason: cancelReason,
          feedback: cancelFeedback,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to cancel subscription.");
        return;
      }

      setCancelModalOpen(false);
      resetCancelState();
      await refreshRows();
    } catch (error) {
      console.error(error);
      alert("Something went wrong canceling your subscription.");
    } finally {
      setCancelLoading(false);
    }
  }

  async function submitPause() {
    if (!selectedSubscriptionId) {
      alert("No subscription selected.");
      return;
    }

    if (!cancelReason) {
      alert("Please select a reason before pausing.");
      return;
    }

    try {
      setPauseLoading(true);

      const res = await fetch("/api/billing/pause", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: selectedSubscriptionId,
          reason: cancelReason,
          feedback: cancelFeedback,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to pause subscription.");
        return;
      }

      setCancelModalOpen(false);
      resetCancelState();
      await refreshRows();
    } catch (error) {
      console.error(error);
      alert("Something went wrong pausing your subscription.");
    } finally {
      setPauseLoading(false);
    }
  }

  async function continueSubscription(subscriptionId: string) {
    try {
      setContinueLoadingId(subscriptionId);

      const res = await fetch("/api/billing/continue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to continue subscription.");
        return;
      }

      await refreshRows();
    } catch (error) {
      console.error(error);
      alert("Something went wrong continuing your subscription.");
    } finally {
      setContinueLoadingId(null);
    }
  }

  async function resumePausedSubscription(subscriptionId: string) {
    try {
      setResumeLoadingId(subscriptionId);

      const res = await fetch("/api/billing/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to resume subscription.");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      await refreshRows();
    } catch (error) {
      console.error(error);
      alert("Something went wrong resuming your subscription.");
    } finally {
      setResumeLoadingId(null);
    }
  }

  async function restoreBoost(subscriptionId: string) {
    try {
      setRestoreBoostLoadingId(subscriptionId);

      const res = await fetch("/api/billing/restore-boost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to restore boost.");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      await refreshRows();
    } catch (error) {
      console.error(error);
      alert("Something went wrong restoring your boosted listing.");
    } finally {
      setRestoreBoostLoadingId(null);
    }
  }

  async function dismissBoostRestore(subscriptionId: string) {
    try {
      setDismissBoostLoadingId(subscriptionId);

      const res = await fetch("/api/billing/dismiss-boost-restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to dismiss boost restore prompt.");
        return;
      }

      if (boostRestoreRow?.stripeSubscriptionId === subscriptionId) {
        setBoostRestoreModalOpen(false);
        setBoostRestoreRow(null);
      }

      await refreshRows();
    } catch (error) {
      console.error(error);
      alert("Something went wrong saving your preference.");
    } finally {
      setDismissBoostLoadingId(null);
    }
  }

  async function openPortal() {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const { url, error } = await res.json();
    if (error) {
      alert(error);
    } else {
      window.location.href = url;
    }
  }

  async function manageSubscription(subscriptionId: string, action: "update") {
    try {
      const res = await fetch("/api/billing/subscription-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, action }),
      });

      const { url, error } = await res.json();
      if (error) {
        alert(error);
      } else if (url) {
        window.location.href = url;
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong creating the billing portal session.");
    }
  }

  const reasonOptions = useMemo(() => {
    return userType === "business"
      ? businessReasonOptions
      : investorReasonOptions;
  }, [userType]);

  const selectedRowHasDependentBoost = useMemo(() => {
    if (!selectedRow?.stripeSubscriptionId || !selectedRow.listingId) {
      return false;
    }

    return rows.some(
      (row) =>
        row.type === "boost" &&
        row.parentListingSubscriptionId === selectedRow.stripeSubscriptionId,
    );
  }, [rows, selectedRow]);

  const selectedRowCanPause =
    !!selectedRow?.isPauseEligible &&
    selectedRow?.type === "platform" &&
    canStillOfferPause(selectedRow);

  const offerPause = selectedRowCanPause && shouldOfferPause(cancelReason);
  const showSuccessMessage = cancelReason === "sold_business";

  const pausedRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.type === "platform" &&
          getEffectiveRowUiState(row, rowsBySubscriptionId) === "paused",
      ),
    [rows, rowsBySubscriptionId],
  );

  const scheduledPauseRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.type === "platform" &&
          getEffectiveRowUiState(row, rowsBySubscriptionId) ===
            "pause_scheduled",
      ),
    [rows, rowsBySubscriptionId],
  );

  const pausedBannerMode = useMemo(() => {
    if (pausedRows.length > 0) return "paused" as const;
    if (scheduledPauseRows.length > 0) return "pause_scheduled" as const;
    return null;
  }, [pausedRows.length, scheduledPauseRows.length]);

  const pausedBannerCount = useMemo(() => {
    if (pausedRows.length > 0) return pausedRows.length;
    if (scheduledPauseRows.length > 0) return scheduledPauseRows.length;
    return 0;
  }, [pausedRows.length, scheduledPauseRows.length]);

  const boostRestorePromptRows = useMemo(() => {
    return rows.filter(
      (row) =>
        row.type === "platform" &&
        row.pausedBoostRestorePending &&
        !row.pausedBoostRestoreDismissedAt,
    );
  }, [rows]);

  const inlineBoostRestoreRows = useMemo(() => {
    return boostRestorePromptRows.filter(
      (row) =>
        !(
          boostRestoreModalOpen &&
          boostRestoreRow?.stripeSubscriptionId === row.stripeSubscriptionId
        ),
    );
  }, [boostRestorePromptRows, boostRestoreModalOpen, boostRestoreRow]);

  function renderActions(row: BillingRow, mobile = false) {
    const uiState = getEffectiveRowUiState(row, rowsBySubscriptionId);

    const primaryBtn = mobile
      ? "w-full px-3 py-2 rounded-full bg-[var(--color-primary)] text-white text-sm hover:cursor-pointer hover:bg-[var(--color-primary-hover)] transition disabled:opacity-60"
      : "px-3 py-1 rounded-full bg-[var(--color-primary)] text-white text-xs hover:cursor-pointer hover:bg-[var(--color-primary-hover)] transition disabled:opacity-60";

    const borderBtn = mobile
      ? "w-full px-3 py-2 rounded-full border text-sm hover:cursor-pointer hover:bg-gray-50 transition"
      : "px-3 py-1 rounded-full border text-xs hover:cursor-pointer hover:bg-gray-50 transition";

    const dangerBtn = mobile
      ? "w-full px-3 py-2 rounded-full bg-red-500 text-white text-sm hover:cursor-pointer hover:bg-red-600 transition"
      : "px-3 py-1 rounded-full bg-red-500 text-white text-xs hover:cursor-pointer hover:bg-red-600 transition";

    if (!row.stripeSubscriptionId) {
      return <span className="text-xs text-gray-400">—</span>;
    }

    const parentRow = row.parentListingSubscriptionId
      ? rowsBySubscriptionId.get(row.parentListingSubscriptionId)
      : null;
    const parentUiState = parentRow
      ? getEffectiveRowUiState(parentRow, rowsBySubscriptionId)
      : null;
    const parentPauseLike =
      parentUiState === "pause_scheduled" || parentUiState === "paused";

    if (row.type === "boost" && parentPauseLike) {
      return (
        <div className={mobile ? "flex flex-col gap-2" : "space-x-2"}>
          <div className="text-xs text-sky-700">
            This add-on follows the main listing subscription and will pause
            with it.
          </div>
          <button onClick={openPortal} className={borderBtn}>
            Manage
          </button>
        </div>
      );
    }

    if (uiState === "pause_scheduled") {
      return (
        <>
          <button
            onClick={() =>
              resumePausedSubscription(row.stripeSubscriptionId as string)
            }
            disabled={resumeLoadingId === row.stripeSubscriptionId}
            className={primaryBtn}
          >
            {resumeLoadingId === row.stripeSubscriptionId
              ? "Keeping Active..."
              : "Keep Active"}
          </button>

          <button
            onClick={() =>
              manageSubscription(row.stripeSubscriptionId as string, "update")
            }
            className={borderBtn}
          >
            Manage Payment
          </button>
        </>
      );
    }

    if (uiState === "paused") {
      return (
        <>
          <button
            onClick={() =>
              resumePausedSubscription(row.stripeSubscriptionId as string)
            }
            disabled={resumeLoadingId === row.stripeSubscriptionId}
            className={primaryBtn}
          >
            {resumeLoadingId === row.stripeSubscriptionId
              ? "Resuming..."
              : "Resume Subscription"}
          </button>

          <button onClick={openPortal} className={borderBtn}>
            Manage
          </button>
        </>
      );
    }

    if (uiState === "canceling") {
      return (
        <>
          <button
            onClick={() =>
              continueSubscription(row.stripeSubscriptionId as string)
            }
            disabled={continueLoadingId === row.stripeSubscriptionId}
            className={primaryBtn}
          >
            {continueLoadingId === row.stripeSubscriptionId
              ? "Continuing..."
              : "Continue Subscription"}
          </button>

          <button
            onClick={() =>
              manageSubscription(row.stripeSubscriptionId as string, "update")
            }
            className={borderBtn}
          >
            Manage Payment
          </button>
        </>
      );
    }

    if (
      uiState === "active" ||
      uiState === "trialing" ||
      uiState === "past_due"
    ) {
      return (
        <>
          <button
            onClick={() =>
              manageSubscription(row.stripeSubscriptionId as string, "update")
            }
            className={borderBtn}
          >
            Manage Payment
          </button>

          <button onClick={() => openCancelModal(row)} className={dangerBtn}>
            Cancel
          </button>
        </>
      );
    }

    if (
      uiState === "canceled" ||
      uiState === "unpaid" ||
      uiState === "incomplete_expired"
    ) {
      return (
        <button onClick={openPortal} className={borderBtn}>
          Renew / Manage
        </button>
      );
    }

    return (
      <button onClick={openPortal} className={borderBtn}>
        Manage
      </button>
    );
  }

  return (
    <>
      <div className="mx-auto w-full px-5 py-10 lg:max-w-[1140px] lg:px-2">
        <h1 className="mb-4">Manage Subscription</h1>
        <p className="mb-2 text-sm text-gray-600">
          Use the customer portal to update payment methods, view invoices, or
          manage plans.
        </p>
        <p className="mb-6 text-xs text-gray-500">
          If you need a temporary break, start with cancel and we’ll show pause
          options when they’re available.
        </p>

        <div className="rounded-xl border bg-white p-4">
          {pausedBannerMode && (
            <PausedBillingBanner
              mode={pausedBannerMode}
              count={pausedBannerCount}
            />
          )}

          {inlineBoostRestoreRows.map((row) => (
            <BoostRestoreBanner
              key={row.stripeSubscriptionId}
              listingTitle={row.listingTitle}
              onRestore={() =>
                row.stripeSubscriptionId &&
                restoreBoost(row.stripeSubscriptionId)
              }
              onDismiss={() =>
                row.stripeSubscriptionId &&
                dismissBoostRestore(row.stripeSubscriptionId)
              }
              restoring={restoreBoostLoadingId === row.stripeSubscriptionId}
              dismissing={dismissBoostLoadingId === row.stripeSubscriptionId}
            />
          ))}

          {loading ? (
            <p className="text-sm text-gray-500">Loading subscriptions…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500">
              You don&apos;t have any active subscriptions yet.
            </p>
          ) : (
            <>
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="py-2">Type</th>
                      <th className="py-2">Label</th>
                      {userType === "business" && (
                        <th className="py-2">Listing</th>
                      )}
                      <th className="py-2">Status</th>
                      <th className="py-2">Renews</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const uiState = getEffectiveRowUiState(
                        r,
                        rowsBySubscriptionId,
                      );
                      const statusClass = getStatusClassFromState(uiState);
                      const displayStatus = formatDisplayStatusFromState(
                        uiState,
                        r.status,
                      );
                      const pauseEndLabel =
                        uiState === "pause_scheduled"
                          ? formatPauseDate(r.pauseStartsAt)
                          : uiState === "paused"
                            ? formatPauseDate(r.pauseEndsAt)
                            : null;

                      return (
                        <tr
                          key={i}
                          className={[
                            "border-t align-middle",
                            r.type === "boost" ? "bg-gray-50/70" : "",
                          ].join(" ")}
                        >
                          <td
                            className={
                              r.type === "boost" ? "py-2 pl-6" : "py-2"
                            }
                          >
                            {r.type === "platform"
                              ? "Platform"
                              : "Boost Add-on"}
                          </td>

                          <td className="py-2">
                            <div className="flex flex-col">
                              <span className="text-gray-900">{r.label}</span>
                              {r.type === "boost" && (
                                <span className="text-xs text-gray-500">
                                  Attached to this listing membership
                                </span>
                              )}
                            </div>
                          </td>

                          {userType === "business" && (
                            <td className="py-2">
                              {r.listingTitle ? (
                                r.listingId ? (
                                  <Link
                                    href={`/business-listing/${r.listingId}`}
                                    className="text-[var(--color-primary)] underline underline-offset-2"
                                  >
                                    {r.listingTitle}
                                  </Link>
                                ) : (
                                  r.listingTitle
                                )
                              ) : (
                                "—"
                              )}
                            </td>
                          )}

                          <td className="py-2">
                            <div className="flex flex-col items-start gap-1">
                              <span className={statusClass}>
                                {displayStatus}
                              </span>

                              {uiState === "pause_scheduled" &&
                                pauseEndLabel && (
                                  <span className="text-xs text-sky-700">
                                    Starts {pauseEndLabel}
                                  </span>
                                )}

                              {uiState === "paused" && pauseEndLabel && (
                                <span className="text-xs text-sky-700">
                                  Until {pauseEndLabel}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-2">{r.renews ?? "—"}</td>

                          <td className="space-x-2 py-2 text-right">
                            {renderActions(r, false)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {rows.map((r, i) => {
                  const uiState = getEffectiveRowUiState(
                    r,
                    rowsBySubscriptionId,
                  );
                  const statusClass = getStatusClassFromState(uiState);
                  const displayStatus = formatDisplayStatusFromState(
                    uiState,
                    r.status,
                  );
                  const pauseEndLabel =
                    uiState === "pause_scheduled"
                      ? formatPauseDate(r.pauseStartsAt)
                      : uiState === "paused"
                        ? formatPauseDate(r.pauseEndsAt)
                        : null;

                  return (
                    <div
                      key={i}
                      className={[
                        "rounded-xl border p-4 shadow-sm",
                        r.type === "boost"
                          ? "border-gray-200 bg-gray-50"
                          : "border-gray-200 bg-white",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            {r.type === "platform"
                              ? "Platform"
                              : "Boost Add-on"}
                          </div>
                          <div className="mt-1 break-words text-sm font-semibold text-gray-900">
                            {r.label}
                          </div>
                          {r.type === "boost" && (
                            <div className="mt-1 text-xs text-gray-500">
                              Attached to this listing membership
                            </div>
                          )}
                        </div>

                        <span className={statusClass}>{displayStatus}</span>
                      </div>

                      {pauseEndLabel && (
                        <div className="mt-2 text-xs text-sky-700">
                          {uiState === "pause_scheduled"
                            ? `Pause starts ${pauseEndLabel}`
                            : `Paused until ${pauseEndLabel}`}
                        </div>
                      )}

                      <div className="mt-4 space-y-2 text-sm">
                        {userType === "business" && (
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-gray-500">Listing</span>
                            <div className="text-right text-gray-900">
                              {r.listingTitle ? (
                                r.listingId ? (
                                  <Link
                                    href={`/business-listing/${r.listingId}`}
                                    className="text-[var(--color-primary)] underline underline-offset-2"
                                  >
                                    {r.listingTitle}
                                  </Link>
                                ) : (
                                  r.listingTitle
                                )
                              ) : (
                                "—"
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3">
                          <span className="text-gray-500">Renews</span>
                          <span className="text-right text-gray-900">
                            {r.renews ?? "—"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2">
                        {renderActions(r, true)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <button
            onClick={openPortal}
            className="mt-4 rounded-full bg-[var(--color-primary)] px-4 py-2 text-white transition hover:cursor-pointer hover:bg-[var(--color-primary-hover)]"
          >
            Open Billing Portal
          </button>
        </div>
      </div>

      <Dialog
        open={cancelModalOpen}
        onOpenChange={(open) => {
          setCancelModalOpen(open);
          if (!open) resetCancelState();
        }}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100%-1rem)] max-w-xl overflow-hidden rounded-2xl border border-gray-200 p-0 shadow-2xl sm:w-full">
          <DialogHeader className="shrink-0 border-b border-gray-100 px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
            <DialogTitle className="text-lg font-semibold text-gray-900 sm:text-xl">
              Before you cancel
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-relaxed text-gray-600">
              Your subscription will remain active until the end of your current
              billing period. Let us know what’s driving your decision so we can
              keep improving RPBX.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-900">
                  What best describes why you’re leaving?
                </div>

                <div className="grid gap-3">
                  {reasonOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = cancelReason === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setCancelReason(option.value)}
                        className={[
                          "w-full rounded-xl border p-4 text-left transition-all duration-200 hover:cursor-pointer",
                          "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2",
                          isSelected
                            ? "border-[var(--color-primary)] bg-[#f4fbf8] shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                        ].join(" ")}
                        aria-pressed={isSelected}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={[
                              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                              isSelected
                                ? "bg-[var(--color-primary)]/20 text-gray-900"
                                : "bg-gray-100 text-gray-600",
                            ].join(" ")}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {option.label}
                            </div>
                            <div className="mt-1 text-xs leading-relaxed text-gray-500">
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {showSuccessMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="text-sm font-semibold text-emerald-900">
                    Congratulations on your next chapter
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-emerald-800">
                    If you’ve successfully sold all or part of your business,
                    that’s a meaningful milestone. We’re glad RPBX could be part
                    of the journey.
                  </div>
                </div>
              )}

              {offerPause && (
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4">
                  <div className="text-sm font-semibold text-sky-900">
                    Not ready to cancel?
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-sky-800">
                    You can pause this subscription and come back anytime. If
                    this is temporary, pausing keeps the path back simpler than
                    canceling.
                  </div>

                  {selectedRowHasDependentBoost && (
                    <div className="mt-3 rounded-lg border border-sky-200 bg-white/70 px-3 py-2 text-xs leading-relaxed text-sky-900">
                      This listing also has a Boosted Listing add-on. If you
                      pause the main listing subscription, the boost will pause
                      with it. When you come back, you can decide whether you
                      want to restore the boost too.
                    </div>
                  )}

                  <div className="mt-4">
                    <Button
                      onClick={submitPause}
                      disabled={pauseLoading}
                      className="rounded-full bg-sky-600 hover:cursor-pointer hover:bg-sky-700"
                    >
                      {pauseLoading ? "Pausing..." : "Pause Instead"}
                    </Button>
                  </div>
                </div>
              )}

              {cancelReason && !selectedRowCanPause && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="text-sm font-semibold text-amber-900">
                    Pause isn’t available right now
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-amber-800">
                    This membership already used a recent pause. You’ll be able
                    to pause it again 12 months after the last pause began.
                  </div>
                </div>
              )}

              {cancelReason && (
                <div className="space-y-2 pb-1">
                  <label
                    htmlFor="cancel-feedback"
                    className="text-sm font-medium text-gray-900"
                  >
                    Anything else you’d like us to know?{" "}
                    <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    id="cancel-feedback"
                    value={cancelFeedback}
                    onChange={(e) => setCancelFeedback(e.target.value)}
                    placeholder="Share any context that would help us improve the experience."
                    className="min-h-[110px] w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    rows={4}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-gray-100 px-4 py-4 sm:justify-between sm:px-6">
            <div className="hidden max-w-[300px] text-xs leading-relaxed text-gray-500 sm:block">
              You can continue using your membership until your current billing
              period ends.
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                onClick={() => {
                  setCancelModalOpen(false);
                  resetCancelState();
                }}
                className="rounded-full bg-[var(--color-primary)] text-white hover:cursor-pointer hover:bg-[var(--color-primary-hover)]"
              >
                Keep Membership
              </Button>

              <Button
                onClick={submitCancellation}
                disabled={cancelLoading || !cancelReason}
                className="rounded-full border border-gray-300 bg-gray-100 text-gray-700 hover:cursor-pointer hover:bg-gray-200 disabled:opacity-50"
              >
                {cancelLoading ? "Confirming..." : "Confirm Cancellation"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={boostRestoreModalOpen}
        onOpenChange={(open) => {
          setBoostRestoreModalOpen(open);
          if (!open) {
            setBoostRestoreRow(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100%-1rem)] max-w-lg rounded-2xl border border-gray-200 p-0 shadow-2xl sm:w-full">
          <DialogHeader className="border-b border-gray-100 px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
            <DialogTitle className="text-lg font-semibold text-gray-900 sm:text-xl">
              Bring your boost back?
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-relaxed text-gray-600">
              Your membership is active again. If you want, you can also restore
              the Boosted Listing add-on that was paused with it.
            </DialogDescription>
          </DialogHeader>

          <div className="px-4 py-5 sm:px-6">
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4">
              <div className="text-sm font-semibold text-sky-950">
                {boostRestoreRow?.listingTitle
                  ? `Restore boost for "${boostRestoreRow.listingTitle}"`
                  : "Restore this boosted listing"}
              </div>
              <div className="mt-1 text-sm leading-relaxed text-sky-900">
                Restoring the boost will create a new billing checkout for the
                add-on, while your main membership stays exactly as it is.
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-gray-500">
              Not now is okay too. You can always restore it later from billing.
            </p>
          </div>

          <DialogFooter className="border-t border-gray-100 px-4 py-4 sm:px-6">
            <Button
              variant="outline"
              className="rounded-full hover:cursor-pointer"
              onClick={() => {
                if (boostRestoreRow?.stripeSubscriptionId) {
                  void dismissBoostRestore(
                    boostRestoreRow.stripeSubscriptionId,
                  );
                }
              }}
              disabled={
                !boostRestoreRow?.stripeSubscriptionId ||
                dismissBoostLoadingId ===
                  boostRestoreRow.stripeSubscriptionId ||
                restoreBoostLoadingId === boostRestoreRow.stripeSubscriptionId
              }
            >
              {dismissBoostLoadingId === boostRestoreRow?.stripeSubscriptionId
                ? "Saving..."
                : "Maybe Later"}
            </Button>

            <Button
              className="rounded-full hover:cursor-pointer"
              style={{ backgroundColor: "#9ed3c3" }}
              onClick={() => {
                if (boostRestoreRow?.stripeSubscriptionId) {
                  void restoreBoost(boostRestoreRow.stripeSubscriptionId);
                }
              }}
              disabled={
                !boostRestoreRow?.stripeSubscriptionId ||
                restoreBoostLoadingId ===
                  boostRestoreRow.stripeSubscriptionId ||
                dismissBoostLoadingId === boostRestoreRow.stripeSubscriptionId
              }
            >
              {restoreBoostLoadingId === boostRestoreRow?.stripeSubscriptionId
                ? "Restoring..."
                : "Restore Boost"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}