import { KEYWORD_ALIASES } from "../types/keywords";

const searchText = "Gaming Created via chat assistant";

for (const [keyword, aliases] of Object.entries(KEYWORD_ALIASES)) {
  const wordRe = new RegExp(`\\b${keyword}\\b`, "i");
  if (wordRe.test(searchText)) {
    console.log(`MATCHED KEYWORD: "${keyword}", ALIASES:`, aliases);
  }
}
