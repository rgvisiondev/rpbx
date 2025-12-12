// import OpenAI from "openai";
// const client = new OpenAI();

import { convert } from 'html-to-text';
import * as cheerio from 'cheerio';


// async function getTextFromURL(url) {
//   try {
//     const response = await fetch(url);
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const text = await response.text();
//     return text;
//   } catch (error) {
//     console.error("Error fetching URL:", error);
//     return null;
//   }
// }

const baseUrl = "https://rioplexbizx.com";

const text = []

const $ = await cheerio.fromURL(baseUrl);

text.push(textCleanup($));
console.log(text);

const aboutLinks = $('a').filter((_, el) => {
    const text = $(el).text().toLocaleLowerCase();
    return text.includes('about');
});

const hrefs = aboutLinks
    .map((_, el) => $(el).attr('href'))
    .get()
    .filter((href) => href && !href.startsWith("#") && !href.startsWith("mailto:") && !href.startsWith("tel:"));

console.log(hrefs);

for (const href of hrefs){

    const newUrl = new URL(href, baseUrl).toString();
    const $page = await cheerio.fromURL(newUrl);
    const cleanedText = textCleanup($page);
    text.push(cleanedText);
    console.log(text);
}

function textCleanup($page){

    $page('script, style, noscript').remove();

    const $root = $page('main').length ? $page('main') : $('body');

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


// function convertHTMLtoText(html){

//     const options = {
//         baseElements: {
//             selectors: ['body']
//         }
//     };

//     return convert(html, options);

// }

// const options = {
//     baseElements: {
//         selectors: ['body']
//     }
// };

// const newSiteText = convert(siteText, options);

// const loaded = cheerio.load(newSiteText);

// const response = await client.responses.create({
//     model: "gpt-5-nano",
//     tools: [
//         { type: "web_search"},
//     ],
//     input: "Write a 300 word description on rgvisionmedia.com as a business that wants to sell itself"
// });

// console.log(response.output_text);