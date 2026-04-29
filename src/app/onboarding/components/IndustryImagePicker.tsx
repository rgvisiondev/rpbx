"use client";

import * as React from "react";
import { INDUSTRY_IMAGES, toSlug, imageUrl } from "@/lib/industryImages";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  allIndustries: string[];
  defaultIndustry?: string | null;
  defaultSecondaryIndustry?: string | null;
  defaultImageKey?: string | null;
};

export default function IndustryImagePicker({
  allIndustries,
  defaultIndustry,
  defaultSecondaryIndustry,
  defaultImageKey,
}: Props) {
  const [industry, setIndustry] = React.useState<string>(defaultIndustry ?? "");
  const [secondaryIndustry, setSecondaryIndustry] = React.useState<string>(
    defaultSecondaryIndustry ?? "",
  );
  const [selectedKey, setSelectedKey] = React.useState<string | undefined>(
    defaultImageKey ?? undefined,
  );

  const slug = toSlug(industry || "");
  const keys = slug ? (INDUSTRY_IMAGES[slug] ?? []) : [];

  React.useEffect(() => {
    if (selectedKey && (!slug || !keys.includes(selectedKey))) {
      setSelectedKey(undefined);
    }
  }, [slug, keys, selectedKey]);

  React.useEffect(() => {
    if (secondaryIndustry && secondaryIndustry === industry) {
      setSecondaryIndustry("");
    }
  }, [industry, secondaryIndustry]);

  return (
    <div className="space-y-5">
      <label className="block pt-4">
        <span className="text-sm font-medium text-neutral-900">
          Primary Industry
        </span>

        <select
          name="industry"
          required
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm hover:cursor-pointer focus:border-[#9ed3c3] focus:outline-none focus:ring-2 focus:ring-[#9ed3c3]/30"
        >
          <option value="" disabled>
            Choose an industry…
          </option>

          {allIndustries.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="block rounded-xl border border-[#9ed3c3]/40 bg-[#f7fbfa] p-4 shadow-sm">
        <span className="text-sm font-medium text-neutral-900">
          Secondary Industry{" "}
          <span className="font-normal text-neutral-500">(Optional) </span>
          <Tooltip>
            <TooltipTrigger>ⓘ</TooltipTrigger>
            <TooltipContent>
              Add a second category if your business naturally fits into another
              industry. <br />
              This helps investors discover listings through more relevant
              searches.
            </TooltipContent>
          </Tooltip>
        </span>
        <select
          name="secondary_industry"
          value={secondaryIndustry}
          onChange={(e) => setSecondaryIndustry(e.target.value)}
          className="mt-3 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm hover:cursor-pointer focus:border-[#9ed3c3] focus:outline-none focus:ring-2 focus:ring-[#9ed3c3]/30"
        >
          <option value="">No secondary industry</option>

          {allIndustries
            .filter((label) => label !== industry)
            .map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
        </select>

        <p className="mt-2 text-xs text-neutral-500">
          Your primary industry still controls the default listing category and
          cover image options.
        </p>
      </label>

      {slug && (
        <div className="pt-2">
          <div className="mb-2 text-sm font-medium text-neutral-700">
            Choose a cover image
          </div>

          {keys.length ? (
            <div className="grid grid-cols-2 gap-3">
              {keys.map((key) => {
                const checked = selectedKey === key;

                return (
                  <label
                    key={key}
                    className={`relative overflow-hidden rounded-lg border transition hover:cursor-pointer hover:shadow-sm ${
                      checked
                        ? "border-transparent ring-2 ring-[#9ed3c3]"
                        : "border-neutral-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="listing_image_choice"
                      value={key}
                      className="sr-only"
                      checked={checked}
                      onChange={() => setSelectedKey(key)}
                    />

                    <img
                      src={imageUrl(key)}
                      alt={`${industry} business listing cover image`}
                      className="h-40 w-full object-cover"
                    />

                    <div
                      className={`pointer-events-none absolute inset-0 ${
                        checked ? "ring-inset ring-2 ring-[#7fb8a9]" : ""
                      }`}
                    />
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-neutral-500">
              No catalog images defined for this industry yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
