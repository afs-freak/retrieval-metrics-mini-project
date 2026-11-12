// eval.js starter. Fill in the four TODOs, then run: node eval.js
// You should not need any libraries. Plain Node.js is enough.
const fs = require('fs');

// --- 1. Load the inputs (already done for you) -----------------------------
// test-set.csv has a header row, then: query,correct_post_ids
// correct_post_ids may be a semicolon list, e.g. "1024;1025".
function loadTestSet(path) {
  const lines = fs.readFileSync(path, 'utf8').trim().split('\n').slice(1);
  return lines.map(line => {
    const [query, ids] = line.split(',');
    return { query, correctIds: ids.split(';').map(Number) };
  });
}
const testSet = loadTestSet('test-set.csv');

// search-results.json maps each query to the top-10 ranked post_id lists that
// each system returned: { "<query>": { keyword: [...], semantic: [...] } }
const results = JSON.parse(fs.readFileSync('search-results.json', 'utf8'));

// --- 2. TODO: Reciprocal Rank ----------------------------------------------
// Return 1 / (rank of the FIRST correct id in rankedIds). Return 0 if none of
// the correct ids appear in rankedIds. Rank is 1-based (first result = rank 1).
function reciprocalRank(rankedIds, correctIds) {
  const rank = rankOf(rankedIds, correctIds);
  return rank === null ? 0 : 1 / rank;
}

// Helper: the 1-based rank of the first correct id, or null if it is a miss.
function rankOf(rankedIds, correctIds) {
  const correctIdSet = new Set(correctIds);
  const index = rankedIds.slice(0, 10).findIndex(id => correctIdSet.has(id));
  return index === -1 ? null : index + 1;
}

// --- 3. TODO: run the evaluation loop --------------------------------------
// For every query: look up its keyword and semantic ranked lists, compute the
// reciprocal rank of each, accumulate the RRs, and count a "hit" whenever the
// correct answer was found in the top 10 (RR > 0).
// Then compute:
//   keywordMRR, semanticMRR         = average RR across all queries
//   keywordRecall, semanticRecall   = hits / number of queries
let keywordTotalRR = 0;
let semanticTotalRR = 0;
let keywordHits = 0;
let semanticHits = 0;
const queryScores = [];

for (const { query, correctIds } of testSet) {
  const { keyword, semantic } = results[query];
  const keywordRank = rankOf(keyword, correctIds);
  const semanticRank = rankOf(semantic, correctIds);
  const keywordRR = reciprocalRank(keyword, correctIds);
  const semanticRR = reciprocalRank(semantic, correctIds);

  keywordTotalRR += keywordRR;
  semanticTotalRR += semanticRR;
  keywordHits += keywordRR > 0 ? 1 : 0;
  semanticHits += semanticRR > 0 ? 1 : 0;
  queryScores.push({ query, keywordRank, semanticRank });
}

const totalQueries = testSet.length;
const keywordMRR = keywordTotalRR / totalQueries;
const semanticMRR = semanticTotalRR / totalQueries;
const keywordRecall = keywordHits / totalQueries;
const semanticRecall = semanticHits / totalQueries;

// --- 4. TODO: print a markdown comparison table ----------------------------
// Print one row per query: | query | keyword rank | semantic rank |  (use "miss"
// when the answer was not in the top 10), then a final **Summary** row with
// MRR and Recall@10 for each system, each rounded to 2 decimals.
console.log('| Query | Keyword rank | Semantic rank |');
console.log('|---|---|---|');

for (const { query, keywordRank, semanticRank } of queryScores) {
  console.log(`| ${query} | ${keywordRank ?? 'miss'} | ${semanticRank ?? 'miss'} |`);
}

console.log(
  `| **Summary** | **MRR ${keywordMRR.toFixed(2)} · Recall@10 ${keywordRecall.toFixed(2)}** | **MRR ${semanticMRR.toFixed(2)} · Recall@10 ${semanticRecall.toFixed(2)}** |`
);
