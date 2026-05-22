//import { NextResponse } from "next/server";
import OpenAI from "openai";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

export type InvestorBioInput = {
  firstName?: string;
  lastName?: string;
  organizationEntity?: string;
  city?: string;
  stateCode?: string;
  professionalSummary?: string;
  investmentFocus?: string;
  preferredIndustries?: string[];
  experienceLevel?: string;
  goals?: string;
  willingToSignNda?: boolean | null;
};

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey });
}

function textCleanup($page: CheerioAPI) {
  $page("script, style, noscript").remove();

  const $root = $page("main").length ? $page("main") : $page("body");

  let pageText = $root.text();

  const sentinels = ["self.__next_f", "static/chunks", "window.__NEXT_DATA__"];
  for (const marker of sentinels) {
    const idx = pageText.indexOf(marker);
    if (idx !== -1) {
      pageText = pageText.slice(0, idx);
      break;
    }
  }

  const clean = pageText.replace(/\s+/g, " ").trim();
  const limited = clean.slice(0, 10000);

  return limited;
}

function collectHrefs($: CheerioAPI) {
  const aboutLinks = $("a").filter((_, el) => {
    const text = $(el).text().toLowerCase();
    return text.includes("about");
  });

  const hrefs = aboutLinks
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter(
      (href) =>
        href &&
        !href.startsWith("#") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("tel:"),
    );

  return hrefs;
}

export async function getBusinessDescriptionFromSite(
  url: string,
  address: string,
  business_name: string,
): Promise<string> {
  const client = getOpenAIClient();

  const text: string[] = [];

  const $ = await cheerio.fromURL(url);

  text.push(textCleanup($));

  const finalHrefs = collectHrefs($);

  for (const href of finalHrefs) {
    const newUrl = new URL(href, url).toString();
    const $page = await cheerio.fromURL(newUrl);
    const cleanedText = textCleanup($page);
    text.push(cleanedText);
  }

  const finalText = text.join(" ");

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: `Using the information below, write a clear, polished 4–6 sentence business description suitable for ${business_name}

            Your goal is to summarize the business in a way that highlights its strengths, long-term value, and what makes it an appealing opportunity for investors.

            Follow these rules:
            - Focus on the business story, what it offers, and what makes it unique.
            - Highlight strengths such as experience, customer loyalty, operational quality, demand, or growth (only if supported by the text).
            - DO NOT include confidential names, exact addresses, sensitive details, or anything too specific about individuals.
            - Do NOT include the business name or speculate about it. Business listing descriptions must remain confidential and focus only on the business itself.
            - Keep the tone professional, concise, and opportunity-focused.
            - Do not mention that the description was generated from scraped text.

            Business website content:
            ---
            ${finalText}
            ---

            General business location:
            ${address}

            Now write the final 4–6 sentence business description.`,
  });

  return response.output_text;
}

// Investor Description Functions

function cleanInput(value: unknown, max = 3000) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export async function getInvestorBioFromProfile(
  input: InvestorBioInput,
): Promise<string> {
  const client = getOpenAIClient();

  const firstName = cleanInput(input.firstName, 80);
  const lastName = cleanInput(input.lastName, 80);
  const organizationEntity = cleanInput(input.organizationEntity, 120);
  const city = cleanInput(input.city, 80);
  const stateCode = cleanInput(input.stateCode, 20);
  const professionalSummary = cleanInput(input.professionalSummary, 4000);
  const investmentFocus = cleanInput(input.investmentFocus, 2000);
  const experienceLevel = cleanInput(input.experienceLevel, 500);
  const goals = cleanInput(input.goals, 1200);

  const preferredIndustries = Array.isArray(input.preferredIndustries)
    ? input.preferredIndustries
        .filter((x): x is string => typeof x === "string")
        .map((x) => cleanInput(x, 80))
        .filter(Boolean)
        .slice(0, 8)
    : [];

  const location = [city, stateCode].filter(Boolean).join(", ");

  const response = await client.responses.create({
    model: process.env.OPENAI_TEXT_MODEL ?? "gpt-4.1-mini",
    input: `
Write a polished 4-6 sentence investor bio for a RioPlex Business Exchange investor profile.

The bio should be written in first person, as if the investor is introducing themselves to business owners.

Follow these rules:
- Keep the tone professional, approachable, and locally/community minded.
- Focus on credibility, investment interests, relationship-building, and what types of opportunities the investor is interested in.
- Do not make guarantees about funding, deal closings, returns, or qualifications.
- Do not claim the investor is accredited unless the provided information explicitly says so.
- Do not include exact home addresses, private personal details, phone numbers, or sensitive financial information.
- Do not mention LinkedIn, scraping, AI, or that the text was generated.
- Do not invent job titles, certifications, company history, or investment experience that is not supported by the input.
- Output only the final bio text.

Investor information:
---
First name: ${firstName || "Not provided"}
Last name: ${lastName || "Not provided"}
Organization/entity: ${organizationEntity || "Not provided"}
General location: ${location || "Not provided"}
Professional summary provided by user: ${professionalSummary || "Not provided"}
Investment focus: ${investmentFocus || "Not provided"}
Preferred industries: ${preferredIndustries.length ? preferredIndustries.join(", ") : "Not provided"}
Experience level: ${experienceLevel || "Not provided"}
Goals: ${goals || "Not provided"}
Willing to sign NDA: ${input.willingToSignNda === true ? "Yes" : "Not provided"}
---

Now write the final 4-6 sentence investor bio.
    `.trim(),
  });

  return response.output_text.trim();
}
