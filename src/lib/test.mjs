import { getBusinessDescriptionFromSite } from "./openai-query.ts";

const output = await getBusinessDescriptionFromSite(
  "https://rioplexbizx.com",
  "100 E Nolana Ave #130, McAllen, TX 78504",
  "RioPlex Business Exchange"
);

console.log(output);
