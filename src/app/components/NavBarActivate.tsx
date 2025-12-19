"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function NavBarActivate() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10); // change color after 10px scroll
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-[900000] transition-all duration-300
        ${scrolled ? "bg-white shadow-md" : "bg-transparent shadow-none"}
      `}
    >
      <div className="mx-auto w-full lg:max-w-[1140px] px-4 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src={
              scrolled
                ? "/images/logos/svg/Rio-Plex-Logo-Main-Mint-&-Charcoal.svg"
                : "/images/logos/svg/Rio-Plex-Logo-Main-Mint-&-White.svg"
            }
            width={150}
            height={140}
            alt="RioPlex Logo"
            className="h-auto w-[150px]"
          />
        </Link>

        {/* Button */}
        <Link
          href="/subscribe/business_monthly?trial=30"
          className="px-4 py-2 rounded-full text-white font-medium bg-[var(--color-button)] hover:opacity-90 transition"
        >
          Start 30 Days Free
        </Link>

      </div>
    </nav>
  );
}