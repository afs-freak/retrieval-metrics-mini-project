
const fs = require('fs');

function loadTestSet(path) {
  const lines = fs.readFileSync(path, 'utf8').trim().split('\n').slice(1);

  return lines.map(line => {
    const [query, ids] = line.split(',');
    return {
      query,
      correctIds: ids.split(';').map(Number)
    };
  });
}

const testSet = loadTestSet('test-set.csv');
const results = JSON.parse(fs.readFileSync('search-results.json', 'utf8'));

// Calculate the 1-based rank of the first correct result.
function rankOf(rankedIds, correctIds) {
  const correctSet = new Set(correctIds);
  const index = rankedIds.slice(0, 10).findIndex(id => correctSet.has(id));

  return index === -1 ? null : index + 1;
}

// Calculate reciprocal rank.
function reciprocalRank(rankedIds, correctIds) {
  const rank = rankOf(rankedIds, correctIds);
  return rank === null ? 0 : 1 / rank;
}

// Evaluate both search systems.
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

  if (keywordRR > 0) keywordHits++;
  if (semanticRR > 0) semanticHits++;

  queryScores.push({ query, keywordRank, semanticRank });
}

const totalQueries = testSet.length;

const keywordMRR = keywordTotalRR / totalQueries;
const semanticMRR = semanticTotalRR / totalQueries;

const keywordRecall = keywordHits / totalQueries;
const semanticRecall = semanticHits / totalQueries;

// Print the Markdown comparison table.
console.log('| Query | Keyword rank | Semantic rank |');
console.log('|---|---|---|');

for (const { query, keywordRank, semanticRank } of queryScores) {
  console.log(`| ${query} | ${keywordRank ?? 'miss'} | ${semanticRank ?? 'miss'} |`);
}

console.log(
  `| **Summary** | **MRR ${keywordMRR.toFixed(2)} · Recall@10 ${keywordRecall.toFixed(2)}** | **MRR ${semanticMRR.toFixed(2)} · Recall@10 ${semanticRecall.toFixed(2)}** |`
);