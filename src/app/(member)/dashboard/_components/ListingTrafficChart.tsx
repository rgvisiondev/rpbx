"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

type Props = {
  title: string;
  description: string;
  pagePaths: string[];                 // GA4 pagePath values to chart as series
  seriesLabels?: Record<string, string>; // map pagePath -> nice label
  months?: number;                     // default 6
  emptyNote?: string;                  // optional custom copy for empty state
};

type PageviewsRequest = { pagePaths: string[]; months: number };
type ChartRow = { month: string } & Partial<Record<`/${string}`, number>>;
type PageviewsResponse = { data: ChartRow[] };

const postJson = async (url: string, body: PageviewsRequest): Promise<PageviewsResponse> => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Analytics request failed: ${res.status}`);
  return res.json() as Promise<PageviewsResponse>;
};

function monthLabels(count: number): string[] {
  const today = new Date();
  const labels: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    labels.push(d.toLocaleString("en-US", { month: "long" }));
  }
  return labels;
}

export default function ListingTrafficChart({
  title,
  description,
  pagePaths,
  seriesLabels,
  months = 6,
  emptyNote = "No data yet — check back soon after visitors land on these pages.",
}: Props) {
  const swrKey =
    pagePaths.length > 0
      ? (["/api/analytics/pageviews", { pagePaths, months }] as const)
      : null;

  const { data, error, isLoading } = useSWR<PageviewsResponse, Error, typeof swrKey>(
    swrKey,
    (key) => {
      const [url, body] = key;
      return postJson(url, body);
    },
    { revalidateOnFocus: false }
  );

  const chartData: ChartRow[] = data?.data ?? [];

  // 1) Collect all series keys that ever appear across all rows
  const keys = useMemo(() => {
    const keySet = new Set<string>();
    chartData.forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (k !== "month") keySet.add(k);
      });
    });
    return Array.from(keySet);
  }, [chartData]);

  // 2) Build config dynamically for detected series
  const chartConfig: ChartConfig = useMemo(() => {
    const cfg: ChartConfig = {};
    keys.forEach((k, idx) => {
      cfg[k] = {
        label: seriesLabels?.[k] ?? k,
        color: `var(--chart-${(idx % 8) + 1})`,
      };
    });
    return cfg;
  }, [keys, seriesLabels]);

  // 3) Empty state detection remains the same
  const isEmpty =
    !pagePaths.length ||                       // nothing to track yet
    isLoading ||                               // still fetching – show skeleton
    (!!pagePaths.length && chartData.length === 0); // no GA rows returned

  // 4) Placeholder rows for skeleton only (no series / Areas)
  const placeholderData: ChartRow[] = useMemo(
    () => monthLabels(months).map((m) => ({ month: m })),
    [months]
  );

  // 5) When we *do* have data, pad out the months on X so you always see full window
  const paddedData: ChartRow[] = useMemo(() => {
    if (!chartData.length) return [];
    const labels = monthLabels(months);

    return labels.map((label) => {
      const existing = chartData.find((row) => row.month === label);
      if (existing) return existing;

      // Fill missing months with 0s so the line extends across the full range
      const row: ChartRow = { month: label };
      keys.forEach((k) => {
        row[k as `/${string}`] = 0;
      });
      return row;
    });
  }, [chartData, months, keys]);

  const dataToRender = isEmpty ? placeholderData : paddedData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="relative">
        {isEmpty && (
          <div
            className="absolute right-2 top-2 text-xs rounded-md px-2 py-1 bg-neutral-100 text-neutral-700 border border-neutral-200"
            title={emptyNote}
          >
            ℹ️ {emptyNote}
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm mb-2">
            Failed to load analytics.
          </div>
        )}

        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={dataToRender}
            margin={{ left: 12, right: 12, top: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v: unknown) =>
                (typeof v === "string" ? v : String(v)).slice(0, 3)
              }
            />

            {/* New: Y-axis with a bit of headroom */}
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              domain={[0, (dataMax: number) =>
                dataMax <= 5 ? 5 : Math.ceil(dataMax * 1.2)
              ]}
            />

            {!isEmpty && (
              <>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                {keys.map((k) => (
                  <Area
                    key={k}
                    dataKey={k}
                    type="monotone"
                    fill={`var(--color-${k})`}
                    fillOpacity={0.2} // a bit lighter so it doesn't look like a solid block
                    stroke={`var(--color-${k})`}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    className={`[--color-${k}:var(${chartConfig[k]?.color || "black"})]`}
                  />
                ))}
                <ChartLegend content={<ChartLegendContent />} />
              </>
            )}
          </AreaChart>
        </ChartContainer>

        {isLoading && (
          <div className="text-xs text-neutral-500 mt-2">Loading…</div>
        )}
      </CardContent>
    </Card>
  );
}
