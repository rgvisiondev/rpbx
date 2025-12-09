import { NextRequest, NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

type PageviewsRequest = {
  pagePaths: string[];
  months?: number;
};

// This is the shape your chart expects:
export type ChartRow = { month: string } & Partial<Record<`/${string}`, number>>;

// ---- GA client setup using a single JSON env ----
const PROPERTY_ID = process.env.GA4_PROPERTY_ID;          // e.g. "508465674"
const RAW_KEY = process.env.GA_SERVICE_ACCOUNT_KEY;       // full JSON string

let analyticsDataClient: BetaAnalyticsDataClient | null = null;

if (!PROPERTY_ID) {
  console.warn("[GA4] Missing GA4_PROPERTY_ID env var");
}

if (!RAW_KEY) {
  console.warn("[GA4] Missing GA_SERVICE_ACCOUNT_KEY env var");
} else {
  try {
    const credentials = JSON.parse(RAW_KEY);
    analyticsDataClient = new BetaAnalyticsDataClient({ credentials });
  } catch (err) {
    console.error("[GA4] Failed to parse GA_SERVICE_ACCOUNT_KEY JSON:", err);
  }
}

function getStartDate(months: number): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  return start.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export async function POST(req: NextRequest) {
  try {
    if (!analyticsDataClient || !PROPERTY_ID) {
      return NextResponse.json(
        { error: "Analytics client not configured", data: [] },
        { status: 500 }
      );
    }

    const body = (await req.json()) as PageviewsRequest;
    const pagePaths = body.pagePaths ?? [];
    const months = body.months ?? 6;

    if (!Array.isArray(pagePaths) || pagePaths.length === 0) {
      return NextResponse.json<{ data: ChartRow[] }>({ data: [] });
    }

    const startDate = getStartDate(months);
    const endDate = "today";

    console.log("[GA4] runReport request", {
      property: `properties/${PROPERTY_ID}`,
      startDate,
      endDate,
      pagePaths,
    });

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: "date" },     // YYYYMMDD
        { name: "pagePath" }, // URL path
      ],
      metrics: [{ name: "screenPageViews" }], // correct metric name
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          inListFilter: {
            values: pagePaths,
          },
        },
      },
      orderBys: [
        {
          dimension: { dimensionName: "date" },
        },
      ],
    });

    const rows = response.rows ?? [];

    // monthLabel -> path -> [views...]
    const monthMap = new Map<string, Map<string, number[]>>();

    for (const row of rows) {
      const dateStr = row.dimensionValues?.[0]?.value || ""; // "20251119"
      const path = row.dimensionValues?.[1]?.value || "";
      const viewsStr = row.metricValues?.[0]?.value || "0";
      const views = Number(viewsStr) || 0;

      if (!dateStr || !path) continue;

      const year = Number(dateStr.slice(0, 4));
      const month = Number(dateStr.slice(4, 6)) - 1;

      const monthLabel = new Date(year, month, 1).toLocaleString("en-US", {
        month: "long",
      });

      if (!monthMap.has(monthLabel)) {
        monthMap.set(monthLabel, new Map());
      }
      const series = monthMap.get(monthLabel)!;

      if (!series.has(path)) series.set(path, []);
      series.get(path)!.push(views);
    }

    // Convert to ChartRow[]: { month, "/path1": avg, "/path2": avg, ... }
    const data: ChartRow[] = Array.from(monthMap.entries()).map(
      ([monthLabel, pathMap]) => {
        const row: ChartRow = { month: monthLabel };
        for (const [path, values] of pathMap.entries()) {
          const avg =
            values.reduce((sum, v) => sum + v, 0) / (values.length || 1);
          row[path as `/${string}`] = Math.round(avg); // or keep as avg if you want floats
        }
        return row;
      }
    );

    // Sort by calendar month order
    const monthOrder = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    data.sort(
      (a, b) =>
        monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
    );

    return NextResponse.json<{ data: ChartRow[] }>({ data });
  } catch (err: unknown) {
    console.error("GA4 analytics error", err);

    // Safe narrowing for error info
    const message = err instanceof Error ? err.message : "Unknown error";

    const code =
      typeof err === "object" &&
        err !== null &&
        "code" in err
        ? (err as { code?: unknown }).code
        : undefined;

    const details =
      typeof err === "object" &&
        err !== null &&
        "details" in err
        ? (err as { details?: unknown }).details
        : undefined;

    return NextResponse.json(
      {
        error: "Analytics query failed",
        message,
        code,
        details,
      },
      { status: 500 }
    );
  }
}
