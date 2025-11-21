import React, { type ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "charcoal" | "white" | "bland";

type CommonProps = {
  variant?: Variant;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

// When used as a real <button>
type ButtonAsButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: undefined;
  };

// When used as a link (<Link> renders an <a> under the hood)
type ButtonAsLinkProps = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

export default function Button(props: ButtonProps) {
  const { variant = "primary", disabled = false, className = "", children, ...rest } = props;

  const baseStyles = "px-6 py-2 rounded-full font-medium transition inline-flex items-center justify-center hover:cursor-pointer";
  const variantStyles: Record<Variant, string> = {
    primary: "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] hover:border-[var(--color-primary-hover)] text-white",
    secondary: "bg-gray-700 hover:bg-[var(--color-primary-hover)] hover:border-[var(--color-primary-hover)] text-white",
    charcoal: "bg-[#333333] hover:bg-[var(--color-primary-hover)] hover:border-[var(--color-primary-hover)] text-white",
    white: "bg-white hover:bg-[var(--color-primary-hover)] text-black hover:text-white border border-black hover:border-[var(--color-primary-hover)] w-auto px-[15px]",
    bland: "text-center small text-grey px-0 py-0"
  };
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";
  const classes = [baseStyles, variantStyles[variant], disabledStyles, className].filter(Boolean).join(" ");

  // Link version
  if ("href" in props && props.href) {
    const { href, ...linkProps } = rest as Omit<ButtonAsLinkProps, "children" | "variant" | "disabled" | "className">;

    // If "disabled" with a link, render a non-interactive span
    if (disabled) {
      return (
        <span aria-disabled="true" className={classes}>
          {children}
        </span>
      );
    }

    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  // Button version
  const buttonProps = rest as Omit<ButtonAsButtonProps, "children" | "variant" | "className">;
  return (
    <button className={classes} disabled={disabled} {...buttonProps}>
      {children}
    </button>
  );
}
