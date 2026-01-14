//import { NextResponse } from "next/server";
import OpenAI from "openai";
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';

function textCleanup($page: CheerioAPI){

    $page('script, style, noscript').remove();

    const $root = $page('main').length ? $page('main') : $page('body');

    let pageText = $root.text();

    const sentinels = ['self.__next_f', 'static/chunks', 'window.__NEXT_DATA__'];
    for (const marker of sentinels) {
        const idx = pageText.indexOf(marker);
        if (idx !== -1){
            pageText = pageText.slice(0, idx);
            break;
        }
    }

    const clean = pageText.replace(/\s+/g, ' ').trim();
    const limited = clean.slice(0, 10000);

    return limited;

}

function collectHrefs($: CheerioAPI){

    const aboutLinks = $('a').filter((_, el) => {
        const text = $(el).text().toLowerCase();
        return text.includes('about');
    });
    
    const hrefs = aboutLinks
        .map((_, el) => $(el).attr('href'))
        .get()
        .filter((href) => href && !href.startsWith("#") && !href.startsWith("mailto:") && !href.startsWith("tel:"));

    return hrefs;

}



export async function getBusinessDescriptionFromSite(url: string, address: string, business_name: string): Promise<string>{

    const client = new OpenAI();
    
    const text: string[] = []
    
    const $ = await cheerio.fromURL(url);
    
    text.push(textCleanup($));
    
    const finalHrefs = collectHrefs($);
    
    for (const href of finalHrefs){
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

            Now write the final 4–6 sentence business description.`
    });

    return response.output_text;

}