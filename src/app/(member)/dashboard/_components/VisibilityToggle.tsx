"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type Props = {
  id: string;
  initialHidden: boolean;
  setHiddenAction: (id: string, hidden: boolean) => Promise<void>;

  // text on the left
  labelVisible: string;
  labelHidden?: string;
  helper?: string;

  // toast copy
  toastHidden: string;
  toastVisible: string;
};

export function VisibilityToggle({
  id,
  initialHidden,
  setHiddenAction,
  labelVisible,
  labelHidden,
  helper = "Turn off to hide.",
  toastHidden,
  toastVisible,
}: Props) {
  const [hidden, setHidden] = React.useState(initialHidden);
  const [pending, startTransition] = React.useTransition();

  const isVisible = !hidden;

  return (
    <div className="mt-4 flex items-center justify-between rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-2">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-black">
          {isVisible ? labelVisible : (labelHidden ?? labelVisible)}
        </span>
        <span className="text-xs text-neutral-800">{helper}</span>
      </div>

      <Switch
        className="data-[state=checked]:bg-[var(--color-primary)]"
        checked={isVisible} // visible when is_hidden = false
        disabled={pending}
        onCheckedChange={(nextVisible) => {
          const nextHidden = !nextVisible;

          // optimistic UI
          setHidden(nextHidden);

          startTransition(async () => {
            try {
              await setHiddenAction(id, nextHidden);

              toast.success(nextHidden ? toastHidden : toastVisible, {
                action: {
                  label: "Undo",
                  onClick: () => {
                    const undoHidden = !nextHidden;
                    setHidden(undoHidden);

                    startTransition(async () => {
                      try {
                        await setHiddenAction(id, undoHidden);
                        toast.message("Reverted.");
                      } catch {
                        setHidden(nextHidden);
                        toast.error("Couldn't undo. Try again.");
                      }
                    });
                  },
                },
              });
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
