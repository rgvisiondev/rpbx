import Link from "next/link";

export default function OnboardingStatusBanner({
  show,
  label,
  message,
  href,
  ctaLabel,
}: {
  show: boolean;
  label: string;
  message: string;
  href: string;
  ctaLabel: string;
}) {
  if (!show) return null;

  return (
    <div className="mb-4 rounded-2xl border border-[#cfe9e0] bg-[#f4fbf8] px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center rounded-full bg-[#dff3ec] px-2.5 py-1 text-xs font-semibold text-[#2f6f61]">
            {label}
          </span>
          <p className="text-sm text-[#2f4f47]">{message}</p>
        </div>

        <Link
          href={href}
          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          style={{ backgroundColor: "#60BC9B" }}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}