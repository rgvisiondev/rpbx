"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

  // add these from rows route
  pauseCount?: number | null;
  lastPauseStartedAt?: string | null;
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

function formatDisplayStatus(row: BillingRow): string {
  const uiState = deriveRowUiState(row);

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
      return row.status
        ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
        : "—";
  }
}

function getStatusClass(row: BillingRow): string {
  const uiState = deriveRowUiState(row);

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
  return (row.pauseCount ?? 0) < 1;
}

export default function BillingClient() {
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

  async function openPortal() {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const { url, error } = await res.json();
    if (error) alert(error);
    else window.location.href = url;
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

  const rowsBySubscriptionId = useMemo(() => {
    const map = new Map<string, BillingRow>();
    for (const row of rows) {
      if (row.stripeSubscriptionId) {
        map.set(row.stripeSubscriptionId, row);
      }
    }
    return map;
  }, [rows]);

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
    () => rows.filter((row) => deriveRowUiState(row) === "paused"),
    [rows],
  );

  const scheduledPauseRows = useMemo(
    () => rows.filter((row) => deriveRowUiState(row) === "pause_scheduled"),
    [rows],
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

  function renderActions(row: BillingRow, mobile = false) {
    const uiState = deriveRowUiState(row);

    const primaryBtn = mobile
      ? "w-full px-3 py-2 rounded-full bg-[var(--color-primary)] text-white text-sm hover:bg-[var(--color-primary-hover)] transition disabled:opacity-60"
      : "px-3 py-1 rounded-full bg-[var(--color-primary)] text-white text-xs hover:bg-[var(--color-primary-hover)] transition disabled:opacity-60";

    const borderBtn = mobile
      ? "w-full px-3 py-2 rounded-full border text-sm hover:bg-gray-50 transition"
      : "px-3 py-1 rounded-full border text-xs hover:bg-gray-50 transition";

    const dangerBtn = mobile
      ? "w-full px-3 py-2 rounded-full bg-red-500 text-white text-sm hover:bg-red-600 transition"
      : "px-3 py-1 rounded-full bg-red-500 text-white text-xs hover:bg-red-600 transition";

    if (!row.stripeSubscriptionId) {
      return <span className="text-xs text-gray-400">—</span>;
    }

    const parentRow = row.parentListingSubscriptionId
      ? rowsBySubscriptionId.get(row.parentListingSubscriptionId)
      : null;
    const parentUiState = parentRow ? deriveRowUiState(parentRow) : null;
    const parentPauseLike =
      parentUiState === "pause_scheduled" || parentUiState === "paused";

    if (row.type === "boost" && parentPauseLike) {
      return (
        <div className={mobile ? "flex flex-col gap-2" : "space-x-2"}>
          <div className="text-xs text-sky-700">
            This boost follows the main listing subscription and will pause with it.
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
            Manage
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
            Manage
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
            Update
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
      <div className="w-full lg:max-w-[1140px] mx-auto py-10 px-5 lg:px-2">
        <h1 className="mb-4">Manage Subscription</h1>
        <p className="text-sm text-gray-600 mb-2">
          Use the customer portal to update payment methods, view invoices, or
          manage plans.
        </p>
        <p className="text-xs text-gray-500 mb-6">
          If you need a temporary break, start with cancel and we’ll show pause
          options when they’re available.
        </p>

        <div className="bg-white border rounded-xl p-4">
          {pausedBannerMode && (
            <PausedBillingBanner
              mode={pausedBannerMode}
              count={pausedBannerCount}
            />
          )}

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
                      <th className="py-2">Listing</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Renews</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const statusClass = getStatusClass(r);
                      const uiState = deriveRowUiState(r);
                      const pauseEndLabel =
                        uiState === "pause_scheduled"
                          ? formatPauseDate(r.pauseStartsAt)
                          : uiState === "paused"
                            ? formatPauseDate(r.pauseEndsAt)
                            : null;

                      return (
                        <tr key={i} className="border-t align-middle">
                          <td className="py-2">
                            {r.type === "platform"
                              ? "Platform"
                              : "Boosted Listing"}
                          </td>

                          <td className="py-2">{r.label}</td>

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

                          <td className="py-2">
                            <div className="flex flex-col items-start gap-1">
                              <span className={statusClass}>
                                {formatDisplayStatus(r)}
                              </span>

                              {uiState === "pause_scheduled" && pauseEndLabel && (
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

                          <td className="py-2 text-right space-x-2">
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
                  const statusClass = getStatusClass(r);
                  const uiState = deriveRowUiState(r);
                  const pauseEndLabel =
                    uiState === "pause_scheduled"
                      ? formatPauseDate(r.pauseStartsAt)
                      : uiState === "paused"
                        ? formatPauseDate(r.pauseEndsAt)
                        : null;

                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            {r.type === "platform"
                              ? "Platform"
                              : "Boosted Listing"}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-gray-900 break-words">
                            {r.label}
                          </div>
                        </div>

                        <span className={statusClass}>
                          {formatDisplayStatus(r)}
                        </span>
                      </div>

                      {pauseEndLabel && (
                        <div className="mt-2 text-xs text-sky-700">
                          {uiState === "pause_scheduled"
                            ? `Pause starts ${pauseEndLabel}`
                            : `Paused until ${pauseEndLabel}`}
                        </div>
                      )}

                      <div className="mt-4 space-y-2 text-sm">
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
            className="mt-4 px-4 py-2 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] hover:cursor-pointer text-white transition"
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
        <DialogContent className="max-w-xl w-[calc(100%-1rem)] sm:w-full max-h-[90vh] overflow-hidden rounded-2xl border border-gray-200 p-0 shadow-2xl">
          <DialogHeader className="shrink-0 border-b border-gray-100 px-4 pt-5 pb-4 sm:px-6 sm:pt-6">
            <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">
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
                          "w-full rounded-xl border p-4 text-left transition-all duration-200",
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
                      className="rounded-full bg-sky-600 hover:bg-sky-700"
                    >
                      {pauseLoading ? "Pausing..." : "Pause Instead"}
                    </Button>
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

          <DialogFooter className="shrink-0 border-t border-gray-100 px-4 py-4 sm:px-6 sm:justify-between">
            <div className="hidden sm:block max-w-[300px] text-xs leading-relaxed text-gray-500">
              You can continue using your membership until your current billing
              period ends.
            </div>

            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  setCancelModalOpen(false);
                  resetCancelState();
                }}
                className="rounded-full"
              >
                Keep Membership
              </Button>

              <Button
                variant="destructive"
                onClick={submitCancellation}
                disabled={cancelLoading || !cancelReason}
                className="rounded-full"
              >
                {cancelLoading ? "Confirming..." : "Confirm Cancellation"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}