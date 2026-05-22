"use client";

import { useState } from "react";
import Button from "../../../components/Button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AddressAutocomplete from "@/app/onboarding/components/AddressAutocomplete";
import { InvestorBioAiAssist } from "@/app/onboarding/components/InvestorBioAiAssist";
import { Building2, Mail, UserRound } from "lucide-react";

type InvestorDraft = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  address: string | null;
  city: string | null;
  state_code: string | null;
  county: string | null;
  organization_entity: string | null;
  contact_email: string | null;
  bio: string | null;
  avatar_path: string | null;
  status: string | null;
} | null;

type Props = {
  draft: InvestorDraft;
  userEmail: string;
  authFirst: string;
  authLast: string;
  previewUrl: string | null;
  save: (formData: FormData) => Promise<void>;
};

export default function InvestorContactFormClient({
  draft,
  userEmail,
  authFirst,
  authLast,
  previewUrl,
  save,
}: Props) {
  const [firstName, setFirstName] = useState(draft?.first_name ?? authFirst ?? "");
  const [lastName, setLastName] = useState(draft?.last_name ?? authLast ?? "");
  const [organizationEntity, setOrganizationEntity] = useState(
    draft?.organization_entity ?? "",
  );
  const [bio, setBio] = useState(draft?.bio ?? "");

  const [location, setLocation] = useState({
    city: draft?.city ?? "",
    stateCode: draft?.state_code ?? "",
  });

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center p-5">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-700">Profile 0% Complete</p>
          <p className="text-xs text-neutral-500">Step 1 of 3</p>
        </div>
        <Progress value={0} />
      </div>

      <div className="mx-auto my-5 w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-5 rounded-2xl bg-gradient-to-br from-[#9ed3c3]/25 to-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4f9f88]">
            Investor onboarding
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-950">
            Introduce Yourself
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Share the basics business owners need to feel comfortable reaching out.
            Your exact address is only used to detect your city and state.
          </p>
        </div>

        <form action={save}>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-neutral-800">First name</span>
              <div className="relative mt-1">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  name="first_name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-9 py-2.5 text-sm outline-none transition focus:border-[#9ed3c3] focus:ring-2 focus:ring-[#9ed3c3]/30"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-neutral-800">Last name</span>
              <input
                name="last_name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#9ed3c3] focus:ring-2 focus:ring-[#9ed3c3]/30"
              />
            </label>
          </div>

          <label className="block pt-4">
            <span className="text-sm font-medium text-neutral-800">Contact Email</span>
            <div className="relative mt-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                name="email"
                defaultValue={draft?.contact_email ?? userEmail}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-9 py-2.5 text-sm text-neutral-600 outline-none"
              />
            </div>
          </label>

          <label className="block pt-4">
            <span className="text-sm font-medium text-neutral-800">Investor Address</span>
            <AddressAutocomplete
              name="address"
              required
              defaultValue={draft?.address ?? ""}
              placeholder="123 Main St, McAllen, TX 78501"
              helperText="Used to detect your city and state. Your exact address is not shown publicly."
              onSelected={(s) => {
                setLocation({
                  city: s.city ?? "",
                  stateCode: s.stateCode ?? "",
                });
              }}
            />
          </label>

          <label className="block pt-4">
            <span className="text-sm font-medium text-neutral-800">
              Organization / Entity
              <span className="font-normal text-neutral-500"> optional</span>
            </span>
            <div className="relative mt-1">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                name="org"
                value={organizationEntity}
                onChange={(e) => setOrganizationEntity(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-9 py-2.5 text-sm outline-none transition focus:border-[#9ed3c3] focus:ring-2 focus:ring-[#9ed3c3]/30"
                placeholder="Example: Ramirez Holdings, LLC"
              />
            </div>
          </label>

          <label className="block pt-4">
            <span className="text-sm font-medium text-neutral-800">Profile Photo</span>
            <input
              name="avatar"
              type="file"
              accept="image/*"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm hover:cursor-pointer"
            />

            {previewUrl && (
              <img
                src={previewUrl}
                alt="Profile photo preview"
                className="mt-3 h-28 w-28 rounded-full border border-neutral-200 object-cover"
              />
            )}
          </label>

          <InvestorBioAiAssist
            firstName={firstName}
            lastName={lastName}
            organizationEntity={organizationEntity}
            city={location.city}
            stateCode={location.stateCode}
            onGenerated={(value) => setBio(value ?? "")}
          />

          <label className="block pt-4">
            <span className="text-sm font-medium text-neutral-800">Bio </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-xs text-neutral-500 hover:text-neutral-700"
                  aria-label="What to include in your bio"
                >
                  ⓘ
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm leading-snug">
                Share a brief overview of your background, investment interests,
                and the types of business opportunities you are open to reviewing.
                Avoid sensitive personal details.
              </TooltipContent>
            </Tooltip>

            <textarea
              name="bio"
              rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#9ed3c3] focus:ring-2 focus:ring-[#9ed3c3]/30"
              placeholder="I am an investor focused on established regional businesses with strong owner relationships and clear growth potential. I value confidentiality, thoughtful conversations, and opportunities where both sides can explore fit before moving forward."
            />
          </label>

          <div className="mt-5 flex gap-3">
            <Button type="submit" className="w-full">
              Save & Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}