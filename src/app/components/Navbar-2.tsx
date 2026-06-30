"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import Button from "./Button";
import { createPortal } from "react-dom";
import { BIZEQUITY_VALUATION_LINK, VALUATION_MODE } from "@/lib/valuation-config";

type UserType = "business" | "investor" | "admin" | null;

export default function Navbar({ userType, isValuationEnabled = true }: { userType: UserType; isValuationEnabled?: boolean }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isInvestor = userType === "investor";
  const isBusiness = userType === "business";
  const isAdmin = userType === "admin";

  const toggleMobileMenu = () => setIsMobileMenuOpen((s) => !s);

  useEffect(() => {
    setMounted(true);

    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    { name: "Business Listings", href: "/business-listing", show: !isBusiness || isAdmin },
    { name: "Browse Investors", href: "/investor-listing", show: !isInvestor || isAdmin },
    { name: "Blog", href: "/blog" },
    { name: "Events", href: "/events" },
    {
      name: "Free Valuation",
      href: BIZEQUITY_VALUATION_LINK,
      show: isBusiness && VALUATION_MODE === "free" && isValuationEnabled,
      external: true,
    },
  ].filter((i) => i.show !== false);

  const rightActions = {
    showListings: isBusiness || isAdmin,
    showViewProfile: isInvestor || isAdmin,
  };

  const mobileMenu = (
    <>
      {isMobileMenuOpen && (
        <button
          aria-label="Close Mobile Menu Overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
        />
      )}

      <div
        className={`fixed top-0 left-0 min-h-screen w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out will-change-transform
          lg:hidden z-50
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <Link href="/dashboard" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
            <Image
              src="/images/logos/svg/RPBX.svg"
              width={120}
              height={160}
              alt="RioPlex logo"
              className="h-auto w-[120px]"
            />
          </Link>
          <button
            onClick={toggleMobileMenu}
            aria-label="Close Mobile Menu"
            className="text-slate-600 hover:text-red-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul className="flex flex-col gap-4 p-4">
          {navItems.map((item) => (
            <li key={item.href}>
              {item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-lg text-slate-600 hover:text-red-500"
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-lg text-slate-600 hover:text-red-500"
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
          <li>
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="green-nav block">
              Dashboard
            </Link>
          </li>

          {rightActions.showViewProfile && (
            <li>
              <Link href="/dashboard/profile/edit" onClick={() => setIsMobileMenuOpen(false)} className="green-nav block">
                View Profile
              </Link>
            </li>
          )}

          {rightActions.showListings && (
            <li>
              <Link href="/dashboard/listings" onClick={() => setIsMobileMenuOpen(false)} className="green-nav block">
                Your Listings
              </Link>
            </li>
          )}
          <li>
            <form action="/signout" method="post">
              <Button type="submit">Log Out</Button>
            </form>
          </li>
        </ul>
      </div>
    </>
  );

  return (
    <nav className="sticky top-0 z-30 w-full py-10 backdrop-saturate-150 px-5 lg:px-2 ">
      <div className="mx-auto w-full lg:max-w-[1140px] lg:px-10 px-7 py-2 bg-white rounded-full shadow-md">
        <div className="flex flex-wrap items-center justify-between text-slate-800">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/images/logos/svg/RPBX.svg"
              width={150}
              height={200}
              alt="RioPlex logo"
              className="h-auto w-[80px]"
              priority
            />
          </Link>

          <div className="lg:hidden">
            <button
              onClick={toggleMobileMenu}
              type="button"
              aria-label="Toggle Mobile Menu"
              aria-expanded={isMobileMenuOpen}
              className="relative ml-auto h-10 w-10 rounded-md text-inherit transition-all hover:bg-gray-100 focus:outline-none flex items-center justify-center -mb-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <div className="hidden lg:block">
            <ul className="flex items-center gap-6">
              {navItems.map((item) => (
                <li key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[18px] font-medium hover:text-[var(--color-button)]"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-[18px] font-medium hover:text-[var(--color-button)]"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
              <li>|</li>
              <li>
                <a href="/dashboard" className="green-nav">Dashboard</a>
              </li>
              {rightActions.showViewProfile && (
                <li>
                  <Link href="/dashboard/profile/edit" onClick={() => setIsMobileMenuOpen(false)} className="green-nav block">
                    View Profile
                  </Link>
                </li>
              )}
              {rightActions.showListings && (
                <li>
                  <Link href="/dashboard/listings" onClick={() => setIsMobileMenuOpen(false)} className="green-nav block">
                    Your Listings
                  </Link>
                </li>
              )}
              <form action="/signout" method="post">
                <Button type="submit">Log Out</Button>
              </form>
            </ul>
          </div>
        </div>
      </div>

      {mounted && createPortal(mobileMenu, document.body)}
    </nav>
  );
}