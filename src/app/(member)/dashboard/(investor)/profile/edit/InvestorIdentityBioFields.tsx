"use client";

import { useMemo, useState } from "react";
import AddressAutocomplete from "@/app/onboarding/components/AddressAutocomplete";
import { InvestorBioAiAssist } from "@/app/onboarding/components/InvestorBioAiAssist";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  county: string;
  stateCode: string;
  postalCode: string;
  organizationEntity: string;
  bio: string;
};

export default function InvestorIdentityBioFields({
  firstName,
  lastName,
  address,
  city,
  county,
  stateCode,
  postalCode,
  organizationEntity,
  bio,
}: Props) {
  const [firstNameValue, setFirstNameValue] = useState(firstName);
  const [lastNameValue, setLastNameValue] = useState(lastName);
  const [organizationValue, setOrganizationValue] =
    useState(organizationEntity);
  const [bioValue, setBioValue] = useState(bio);
  const [bioAiGenerated, setBioAiGenerated] = useState(false);

  const [location, setLocation] = useState({
    city,
    stateCode,
  });

  const currentLocationLabel = useMemo(() => {
    return [city, stateCode].filter(Boolean).join(", ");
  }, [city, stateCode]);

  const fieldClass =
    "mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#9ed3c3] focus:ring-2 focus:ring-[#9ed3c3]/30";

  return (
    <>
      <input type="hidden" name="existing_city" value={city} />
      <input type="hidden" name="existing_county" value={county} />
      <input type="hidden" name="existing_state_code" value={stateCode} />
      <input type="hidden" name="existing_postal_code" value={postalCode} />

      <input
        type="hidden"
        name="bio_ai_generated"
        value={bioAiGenerated ? "true" : "false"}
      />

      <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-neutral-800">
            First name
          </span>

          <input
            name="first_name"
            value={firstNameValue}
            onChange={(e) => setFirstNameValue(e.target.value)}
            required
            className={fieldClass}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-neutral-800">
            Last name
          </span>

          <input
            name="last_name"
            value={lastNameValue}
            onChange={(e) => setLastNameValue(e.target.value)}
            required
            className={fieldClass}
          />
        </label>
      </div>

      <label className="block pt-4">
        <span className="text-sm font-medium text-neutral-800">
          Investor Address
        </span>

        <AddressAutocomplete
          name="address"
          defaultValue={address}
          placeholder="123 Main St, McAllen, TX 78501"
          helperText="We use this to detect your city and state. Your exact address is not shown to business owners."
          onSelected={(suggestion) => {
            setLocation({
              city: suggestion.city ?? "",
              stateCode: suggestion.stateCode ?? "",
            });
          }}
        />

        {currentLocationLabel && !address && (
          <p className="mt-1.5 text-xs text-neutral-500">
            Current public location: {currentLocationLabel}
          </p>
        )}

        {location.city && location.stateCode && (
          <p className="mt-1.5 text-xs font-medium text-[#4f9f88]">
            Public location will show as: {location.city}, {location.stateCode}
          </p>
        )}
      </label>

      <label className="block pt-4">
        <span className="text-sm font-medium text-neutral-800">
          Organization / Entity
          <span className="font-normal text-neutral-500"> optional</span>
        </span>

        <input
          name="organization_entity"
          value={organizationValue}
          onChange={(e) => setOrganizationValue(e.target.value)}
          className={fieldClass}
          placeholder="Garza Family Investments LLC"
        />
      </label>

      <InvestorBioAiAssist
        firstName={firstNameValue}
        lastName={lastNameValue}
        organizationEntity={organizationValue}
        city={location.city}
        stateCode={location.stateCode}
        onGenerated={(value) => {
          setBioValue(value ?? "");
          setBioAiGenerated(true);
        }}
      />

      <label className="block pt-4">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-neutral-800">
            Investor description
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
                aria-label="Investor description help"
              >
                ⓘ
              </button>
            </TooltipTrigger>

            <TooltipContent className="max-w-xs text-sm leading-snug">
              Describe your investment background, what types of businesses
              you&apos;re drawn to, and how you typically support owners beyond
              capital.
              <br />
              Highlight your experience, preferred deal structures, and what
              makes you a strong long-term partner. Avoid listing confidential
              details or personal identifiers.
            </TooltipContent>
          </Tooltip>
        </div>

        <textarea
          name="bio"
          rows={6}
          value={bioValue}
          onChange={(e) => {
            setBioValue(e.target.value);
            setBioAiGenerated(false);
          }}
          className={`${fieldClass} min-h-36 resize-y leading-relaxed`}
          placeholder={`Experienced small business investor focused on stable, cash-flowing companies in South Texas. I typically look for owner-operated businesses with strong local reputations and room for operational improvements.

Beyond capital, I support owners with strategic planning, financial discipline, and access to a broader professional network. Open to both minority and majority positions where there is strong alignment on long-term goals.`}
        />

        <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
          This bio should help business owners quickly understand your
          background, focus areas, and how you approach conversations.
        </p>
      </label>
    </>
  );
}