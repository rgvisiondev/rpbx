import { NextRequest, NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data"
import build from "next/dist/build";
import { exit } from "process";

type PageViewsRequest = { pagePaths: string[]; months?: number };
type ChartRow = { month: string } & Partial<Record<`/${string}`, number>>;

// GA client
const analyticsClient = new BetaAnalyticsDataClient({
    //this keeps keys server side only
    credentials: process.env.GA_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.GA_SERVICE_ACCOUNT_KEY)
        : undefined,
});

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

const MONTH_NAMES = [
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

function computeDateRange(months: number){
    const end = new Date();

    //start at first day of (months - 1) months ago
    const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);
    const fmt = (d: Date) => d.toISOString().slice(0,10);
    return { startDate: fmt(start), endDate: fmt(end) };
}

function buildMonthKey(d: Date){
    return `{d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthLabel(d: Date){
    return `{MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export async function POST(req: NextRequest){
    try {
        if (!PROPERTY_ID) {
            console.error("Missing GA4_PROPERTY_ID env var");
            return NextResponse.json(
                {data: [], error: "missing_property_id"},
                {status: 500}
            );
        }

        const body = (await req.json()) as PageViewsRequest;
        const pagePaths = body.pagePaths ?? [];
        const months = body.months ?? 6;

        if (!Array.isArray(pagePaths) || pagePaths.length === 0){
            return NextResponse.json({data: [] });
        }

        const {startDate, endDate } = computeDateRange(months);

        //pre-seed a map with all months in range, missing months become 0

        const rowsByYearMonth = new Map<string, ChartRow>();
        const now = new Date();

        for (let i = months - 1; i >= 0; i--){
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const ymKey = buildMonthKey(d);
            rowsByYearMonth.set(ymKey, { month: buildMonthLabel(d) });
        }
        
        //GA4 Data API: yearMonth + pagePath with metric views

        const [report] = await analyticsClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [
                { name: "yearMonth" },
                { name: "pagePath "},
            ],
            metrics: [{ name: "views" }],
            dimensionFilter: {
                filter: {
                    fieldName: "pagePath",
                    inListFilter: { values: pagePaths },
                },
            },
            orderBys: [{ dimension: { dimensionName: "yearMonth" } }],
        });

        for (const row of report.rows ?? []) {
            const ym = row.dimensionValues?.[0]?.value;
            const path = row.dimensionValues?.[1]?.value;
            const viewStr = row.metricValues?.[0]?.value ?? "0";
            const views = Number(viewStr) || 0;
            
            if (!ym || !path) continue;
            const existing = rowsByYearMonth.get(ym);
            if (!existing) continue;

            //Each path becomes a series column
            (existing as any)[path] = views;
        }

        const data: ChartRow[] = Array.from(rowsByYearMonth.values());

        return NextResponse.json({ data });
    } catch (err){
        console.error("GA4 analytics error", err);
        return NextResponse.json(
            {data: [], error: "analytics_error"},
            {status: 500}
        );
    }
}