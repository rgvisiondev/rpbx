"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function ListingVisibilityToggle({
  listingId,
  initialHidden,
  setHiddenAction,
}: {
  listingId: string;
  initialHidden: boolean;
  setHiddenAction: (listingId: string, hidden: boolean) => Promise<void>;
}) {
  const [hidden, setHidden] = React.useState(initialHidden);
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="mt-4 flex items-center justify-between rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-2">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-black">
          Visible to investors
        </span>
        <span className="text-xs text-neutral-800">
          Turn off to hide this listing.
        </span>
      </div>

      <Switch
        className="data-[state=checked]:bg-[var(--color-primary)]"
        checked={!hidden} // visible when is_hidden = false
        disabled={pending}
        onCheckedChange={(isVisible) => {
          const nextHidden = !isVisible;

          // optimistic UI
          setHidden(nextHidden);

          startTransition(async () => {
            try {
              await setHiddenAction(listingId, nextHidden);

              toast.success(
                nextHidden ? "Listing hidden" : "Listing is now visible",
                {
                  action: {
                    label: "Undo",
                    onClick: () => {
                      const undoHidden = !nextHidden;
                      setHidden(undoHidden);

                      startTransition(async () => {
                        try {
                          await setHiddenAction(listingId, undoHidden);
                          toast.message("Reverted.");
                        } catch {
                          setHidden(nextHidden);
                          toast.error("Couldn't undo. Try again.");
                        }
                      });
                    },
                  },
                },
              );
            } catch {
              // revert optimistic change
              setHidden(!nextHidden);
              toast.error("Couldn't update visibility. Try again.");
            }
          });
        }}
      />
    </div>
  );
}
