'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import LogoLoader from './LogoLoader';
import LogoLoaderDark from './LogoLoaderDark';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { TooltipProvider } from '@radix-ui/react-tooltip';

type NormalizedPrice = {
  id: string;
  lookup_key: string | null;
  currency: string;
  unit_amount: number | null;
  interval: 'day' | 'week' | 'month' | 'year' | null;
  interval_count: number | null;
  productId: string;
  productName: string;
  productDescription: string | null;
  features: string[];
  metadata: Record<string, string>;
  popular?: boolean;
  sortOrder?: number;
};

interface PricingTabProps {
  yearly: boolean;
  popular?: boolean;
  planName: string;
  price: { monthly: number | null; yearly: number | null };
  planDescription: string;
  features: string[];
  trialDays?: number;
  // unauth deep-link
  checkoutLookup?: string | null;
  // auth direct checkout
  priceIdMonthly?: string | null;
  priceIdYearly?: string | null;
  isFree?: boolean;
  loggedIn: boolean;
  onCheckout: (priceId: string, trialDays?: number) => Promise<void>;
}

interface PricingTableProps {
  dark?: boolean;
  loggedIn: boolean;
}

function PricingTab(props: PricingTabProps) {

  const trialDays = typeof props.trialDays === 'number' ? props.trialDays : 0;
  const isTrial = trialDays > 0;

  const displayCents = props.yearly
    ? (props.price.yearly ?? props.price.monthly)
    : (props.price.monthly ?? props.price.yearly);

  const period = props.yearly
    ? (props.price.yearly != null ? '/yr' : props.price.monthly != null ? '/mo' : '')
    : (props.price.monthly != null ? '/mo' : props.price.yearly != null ? '/yr' : '');

  // --- FIX: For logged-in users, fallback to whichever priceId exists (so free plans work on either tab)
  const chosenPriceId = props.loggedIn
    ? (props.yearly
        ? (props.priceIdYearly ?? props.priceIdMonthly ?? null)
        : (props.priceIdMonthly ?? props.priceIdYearly ?? null))
    : null;

  // For unauth users, href is provided by parent; we keep it as-is
  const href = props.checkoutLookup ? `/subscribe/${encodeURIComponent(props.checkoutLookup)}${isTrial ? `?trial=${trialDays}` : ''}` : '#';

  const canCheckout = props.loggedIn ? !!chosenPriceId : !!props.checkoutLookup;

  const headlineNumber = displayCents != null ? (displayCents / 100).toFixed(0) : props.isFree ? '0' : '-'

  const periodLabel = (props.isFree && displayCents == null ? '' : period);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (!props.loggedIn) {
      if (!props.checkoutLookup) e.preventDefault();
      return;
    }
    e.preventDefault();
    if (!chosenPriceId) return;
    await props.onCheckout(chosenPriceId, trialDays);
  };

  return (
    <div className={`w-full lg:w-1/3`}>
      <div className="relative flex flex-col h-full p-6 rounded-2xl bg-white border border-slate-200 shadow shadow-slate-950/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
        {props.popular && (
          <div className="absolute top-0 right-0 mr-6 -mt-4">
            <div className="inline-flex items-center text-xs font-semibold py-1.5 px-3 bg-[#60BC9B] text-white rounded-full shadow-sm shadow-slate-950/5">
              Most Popular
            </div>
          </div>
        )}

        <div className="mb-5">
          <div className="text-slate-900 font-semibold mb-2"><h4>{props.planName}</h4></div>
          <TooltipProvider>
            <div className="inline-flex items-baseline mb-1 pb-3">
              <span className="text-slate-900 font-bold text-3xl">$</span>
              <span className="text-slate-900 font-bold text-4xl">
                {headlineNumber}
              </span>
              <span className="text-slate-500 font-medium">
                {periodLabel}{" "}

                {isTrial && (
                  <Tooltip>
                    <TooltipTrigger>
                      ⓘ
                    </TooltipTrigger>
                    <TooltipContent>
                      <strong>Start with a 30-day free trial.</strong><br/>Your plan will renew at the regular monthly rate afterward. You can cancel anytime.
                    </TooltipContent>
                  </Tooltip>
                )}
                
              </span>
            </div>
          </TooltipProvider>

          <Link
            href={href}
            onClick={handleClick}
            aria-disabled={!canCheckout}
            className={`w-full inline-flex justify-center whitespace-nowrap rounded-full px-3.5 py-2.5 text-sm font-medium text-white transition-colors duration-150 ${
              canCheckout
                ? 'bg-[#60BC9B] hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-[#60BC9B]'
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            {isTrial ? 'Start Free Trial' : (props.loggedIn ? 'Continue to Checkout' : 'Purchase Plan')}
          </Link>
        </div>

        <div className="text-slate-900 font-medium mb-3"><p className='font-semibold'>Includes:</p></div>
        <ul className="text-slate-600 text-sm space-y-3 grow">
          {(props.features.length ? props.features : ['Feature A', 'Feature B', 'Feature C']).map((feature, i) => (
            <li key={i} className="flex items-center">
              <svg className="w-3 h-3 fill-[#60BC9B] mr-3 shrink-0" viewBox="0 0 12 12">
                <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
              </svg>
              <span><p className='text-grey'>{feature}</p></span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function PricingTable({ dark, loggedIn }: PricingTableProps) {
  const [isAnnual, setIsAnnual] = useState(false); // Monthly by default
  const [prices, setPrices] = useState<NormalizedPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/pricing', { cache: 'no-store' });
        const data: NormalizedPrice[] = await res.json();
        setPrices(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  type Group = {
    planName: string;
    planDescription: string;
    monthly: number | null;
    yearly: number | null;
    lookupMonthly: string | null;
    lookupYearly: string | null;
    priceIdMonthly: string | null;
    priceIdYearly: string | null;
    features: string[];
    popular: boolean;
    isFree: boolean;
    sortOrder: number;
    trialDays?: number;
  };

  const plans = useMemo(() => {
      const map = new Map<string, Group>();

      for (const p of prices) {
        const stem = 
          (p.lookup_key?.replace(/_(monthly|yearly)$/i, '') || 
          p.productName.toLowerCase().replace(/\s+/g, '_')) ?? 'plan';

        const existing = map.get(stem);

        const isPopular = 
          (typeof p.popular === 'boolean' && p.popular) ||
          ((p.metadata?.popular || '').toLowerCase() === 'true');

        const isFree = (p.unit_amount ?? 0) === 0;

        const rawOrder = 
          (p.sortOrder as number | undefined) ?? 
          parseInt((p.metadata?.sort_order ?? p.metadata?.order ?? ''), 10);
        const order = Number.isFinite(rawOrder as number) ? (rawOrder as number) : 999;

        const g: Group = 
        existing ?? {
          planName: p.productName,
          planDescription: p.productDescription ?? '',
          monthly: null,
          yearly: null,
          lookupMonthly: null,
          lookupYearly: null,
          priceIdMonthly: null,
          priceIdYearly: null,
          features: p.features ?? [],
          popular: false,
          isFree,
          sortOrder: order,
        };

        if (p.interval === 'month'){
          g.monthly = p.unit_amount;
          g.lookupMonthly = p.lookup_key ?? null;
          g.priceIdMonthly = p.id;
        }
        if (p.interval === 'year'){
          g.yearly = p.unit_amount;
          g.lookupYearly = p.lookup_key ?? null;
          g.priceIdYearly = p.id;
        }

        g.popular = g.popular || isPopular;
        g.isFree = g.isFree || isFree;
        g.sortOrder = Math.min(g.sortOrder, order);

        if (!g.features.length && p.metadata?.features){
          g.features = p.metadata.features.split('|').map(s => s.trim()).filter(Boolean);
        }

        map.set(stem, g);
      }


      const arr = Array.from(map.values());

      for (const g of arr){
        if (g.planName === "Business Owner Legacy" && g.monthly != null){
          g.trialDays = 30;
        }
      }
        return arr.sort(
          (a, b) => (a.sortOrder - b.sortOrder) || a.planName.localeCompare(b.planName)
        );
      }, [prices]);

  // Show free always; otherwise require interval for selected tab
  const visiblePlans = useMemo(() => {
    return plans
      .filter(p => p.planName !== 'Boosted Listing' && p.planName !== 'Business Owner Lite (old)')
      .filter(p => {
        const isLite = p.planName === 'Business Owner Lite';
        if (isLite) return !isAnnual;          // only show on Monthly toggle
        return p.isFree ? true : (isAnnual ? p.yearly != null : p.monthly != null);
      });
  }, [plans, isAnnual]);

  // POST to /api/checkout for logged-in users
  const onCheckout = useCallback(async (priceId: string, trialDays?: number) => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          priceId,
          purpose: 'base_membership',
          trialDays,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        alert(txt || 'Checkout error');
        return;
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (e) {
      console.error(e);
      alert('Checkout error');
    }
  }, []);

  if (loading) return <div>{dark ? <LogoLoaderDark /> : <LogoLoader />}</div>;

  return (
    <div>
      {/* Toggle */}
      <div className="flex justify-center max-w-[18rem] m-auto mb-8 lg:mb-16">
        <div className="relative flex w-full p-1 bg-white rounded-full">
          <span className="absolute inset-0 m-1 pointer-events-none" aria-hidden="true">
            <span
              className={`absolute inset-0 w-1/2 bg-[#60BC9B] rounded-full shadow-sm shadow-[#60BC9B] transition-transform duration-150 ease-in-out  ${
                !isAnnual ? 'translate-x-0' : 'translate-x-full'
              }`}
            />
          </span>

          <button
            className={`relative flex-1 text-sm font-medium h-8 rounded-full  ${
              !isAnnual ? 'text-white' : 'text-slate-500 hover:text-[#60BC9B] cursor-pointer'
            }`}
            onClick={() => setIsAnnual(false)}
            aria-pressed={!isAnnual}
          >
            Monthly
          </button>

          <button
            className={`relative flex-1 text-sm font-medium h-8 rounded-full ${
              isAnnual ? 'text-white' : 'text-slate-500 hover:text-[#60BC9B] cursor-pointer'
            }`}
            onClick={() => setIsAnnual(true)}
            aria-pressed={isAnnual}
          >
            Annual <span className={isAnnual ? 'text-[#E5FFF8]' : 'text-[#60BC9B]'}>Save 20%</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-[1140px] mx-auto">
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          {visiblePlans.map((p) => (
            <PricingTab
              key={`${p.planName}-${isAnnual ? 'year' : 'month'}`}
              yearly={isAnnual}
              popular={p.popular}
              planName={p.planName}
              planDescription={p.planDescription}
              price={{ monthly: p.monthly, yearly: p.yearly }}
              features={p.features}
              trialDays={!isAnnual ? p.trialDays: undefined}
              // --- FIX: For unauth users, free plan falls back to whichever lookup exists
              checkoutLookup={
                p.isFree
                  ? (p.lookupMonthly ?? p.lookupYearly ?? null)
                  : (isAnnual ? p.lookupYearly : p.lookupMonthly)
              }
              // pass priceIds for auth flow (with free fallback handled in the child)
              priceIdMonthly={p.priceIdMonthly}
              priceIdYearly={p.priceIdYearly}
              isFree={p.isFree}
              loggedIn={loggedIn}
              onCheckout={onCheckout}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
