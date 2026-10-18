/**
 * Smart Insights Engine: Understands data patterns, correlations, anomalies, and natural language queries
 */

export function generateDatasetInsights(dataset, columns, columnProfiles) {
  if (!dataset || dataset.length === 0 || !columns || columns.length === 0) {
    return [];
  }

  const insights = [];
  const measures = columnProfiles.filter(c => c.type === 'measure').map(c => c.name);
  const dimensions = columnProfiles.filter(c => c.type === 'dimension').map(c => c.name);
  const dateCol = columnProfiles.find(c => c.type === 'date')?.name;

  // 1. Dominant Dimension & Pareto Contribution
  if (dimensions.length > 0 && measures.length > 0) {
    const dim = dimensions[0];
    const measure = measures[0];
    const groupTotals = {};

    dataset.forEach(row => {
      const d = String(row[dim] || 'Other');
      const m = Number(row[measure]) || 0;
      groupTotals[d] = (groupTotals[d] || 0) + m;
    });

    const sortedGroups = Object.entries(groupTotals).sort((a, b) => b[1] - a[1]);
    const grandTotal = sortedGroups.reduce((acc, [, val]) => acc + val, 0) || 1;

    if (sortedGroups.length > 0) {
      const topGroup = sortedGroups[0];
      const topPct = Math.round((topGroup[1] / grandTotal) * 100);
      insights.push({
        id: 'top-contributor',
        type: 'dominance',
        severity: 'info',
        title: `Top Contributor in ${measure}`,
        text: `"${topGroup[0]}" represents ${topPct}% of aggregate ${measure} (${formatValue(topGroup[1])} of ${formatValue(grandTotal)}).`,
        metric: measure,
        dimension: dim
      });
    }
  }

  // 2. Trend & Growth Trajectory
  if (dateCol && measures.length > 0) {
    const measure = measures[0];
    const sorted = [...dataset].sort((a, b) => String(a[dateCol]).localeCompare(String(b[dateCol])));
    const half = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, half).reduce((sum, r) => sum + (Number(r[measure]) || 0), 0);
    const secondHalf = sorted.slice(half).reduce((sum, r) => sum + (Number(r[measure]) || 0), 0);

    if (firstHalf > 0) {
      const growthPct = Math.round(((secondHalf - firstHalf) / firstHalf) * 1000) / 10;
      const isPositive = growthPct >= 0;
      insights.push({
        id: 'trend-velocity',
        type: isPositive ? 'growth' : 'warning',
        severity: isPositive ? 'success' : 'warning',
        title: `${measure} Trajectory (${isPositive ? '+' : ''}${growthPct}%)`,
        text: `${measure} displayed a ${isPositive ? 'positive acceleration' : 'softening trajectory'} of ${growthPct}% in the second half of the observed period.`,
        metric: measure
      });
    }
  }

  // 3. Statistical Correlation Analysis between Measures
  if (measures.length >= 2) {
    const m1 = measures[0];
    const m2 = measures[1];
    const correlation = calculatePearsonCorrelation(dataset, m1, m2);

    if (Math.abs(correlation) >= 0.5) {
      const isPositive = correlation > 0;
      insights.push({
        id: 'metric-correlation',
        type: 'correlation',
        severity: 'info',
        title: `Correlation: ${m1} vs ${m2}`,
        text: `Observed a ${Math.abs(correlation) > 0.8 ? 'strong' : 'moderate'} ${isPositive ? 'positive' : 'inverse'} relationship (r = ${correlation.toFixed(2)}) between ${m1} and ${m2}.`,
        metric: m1,
        secondaryMetric: m2
      });
    }
  }

  // 4. Anomaly / Outlier Detection
  measures.slice(0, 3).forEach(measure => {
    const vals = dataset.map(r => Number(r[measure]) || 0);
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length || 1);
    const stdDev = Math.sqrt(variance);

    if (stdDev > 0) {
      const outliers = dataset.filter(r => Math.abs((Number(r[measure]) || 0) - mean) > 2.2 * stdDev);
      if (outliers.length > 0) {
        insights.push({
          id: `outlier-${measure}`,
          type: 'anomaly',
          severity: 'warning',
          title: `Statistical Outlier Detected in ${measure}`,
          text: `Found ${outliers.length} records exceeding 2.2 standard deviations from the mean (${formatValue(mean)} ± ${formatValue(stdDev)}).`,
          metric: measure
        });
      }
    }
  });

  return insights;
}

/**
 * Calculates Pearson Correlation Coefficient r
 */
function calculatePearsonCorrelation(dataset, colX, colY) {
  const pairs = dataset
    .map(r => [Number(r[colX]), Number(r[colY])])
    .filter(([x, y]) => !isNaN(x) && !isNaN(y));

  if (pairs.length < 3) return 0;

  const n = pairs.length;
  const sumX = pairs.reduce((acc, [x]) => acc + x, 0);
  const sumY = pairs.reduce((acc, [, y]) => acc + y, 0);
  const sumX2 = pairs.reduce((acc, [x]) => acc + x * x, 0);
  const sumY2 = pairs.reduce((acc, [, y]) => acc + y * y, 0);
  const sumXY = pairs.reduce((acc, [x, y]) => acc + x * y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

function formatValue(val) {
  if (typeof val !== 'number') return String(val);
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return val.toFixed(1);
}

/**
 * Normalizes text for robust semantic matching (removes underscores, punctuation, extra spaces)
 */
export function normalizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/[_\-.]+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether a column is likely a unique transaction/row identifier rather than an analytical grouping dimension
 */
export function isIdentifierColumn(colName) {
  if (!colName) return false;
  const normalized = normalizeText(colName);
  return (
    /^(transaction|shipment|order|record|row|invoice|item|cust|user|account)?\s*id$/.test(normalized) ||
    /^(id|uuid|guid|pk|fk|index|key|hash|code|num|no)$/.test(normalized) ||
    /_id$|^id_|_key$|^key_/i.test(colName)
  );
}

/**
 * Comprehensive business synonym mapping for measures and dimensions
 */
const MEASURE_SYNONYMS = {
  profit: ['profit', 'gross profit', 'operating profit', 'net profit', 'net income', 'ebitda', 'operating income', 'margin'],
  revenue: ['revenue', 'sales', 'turnover', 'gross revenue', 'bookings', 'income', 'topline'],
  cost: ['cost', 'cogs', 'opex', 'expense', 'expenses', 'spend', 'expenditure', 'freight cost', 'unit cost', 'shipping cost'],
  price: ['price', 'unit price', 'rate', 'tariff', 'fee'],
  quantity: ['quantity', 'units', 'volume', 'headcount', 'count', 'subscribers', 'signups', 'active subscribers', 'units shipped'],
  lead_time: ['lead time', 'duration', 'days', 'latency'],
  satisfaction: ['customer satisfaction', 'csat', 'nps', 'score', 'rating'],
  ratio: ['ratio', 'cac', 'ltv', 'ltv cac ratio', 'rate pct', 'churn rate', 'defect rate']
};

const DIMENSION_SYNONYMS = {
  category: ['category', 'product category', 'type', 'tier', 'plan tier', 'business unit', 'group', 'segment', 'department'],
  product: ['product', 'product name', 'item', 'sku', 'service', 'hardware', 'app'],
  region: ['region', 'country', 'origin country', 'territory', 'location', 'geography', 'geo', 'city', 'state', 'hub', 'warehouse hub'],
  supplier: ['supplier', 'vendor', 'partner', 'carrier', 'origin'],
  customer: ['customer', 'client', 'account', 'user', 'rep', 'salesperson', 'agent'],
  time: ['date', 'quarter', 'month', 'year', 'week', 'period', 'day', 'time'],
  mode: ['transport mode', 'channel', 'mode', 'source', 'status']
};

/**
 * Computes semantic relevance score between user query and column name
 */
function scoreColumnMatch(queryNorm, colName, synonymsMap) {
  const colNorm = normalizeText(colName);
  if (!colNorm) return -1;

  // 1. Exact full-name substring match (e.g. "product category" in query)
  if (queryNorm.includes(colNorm)) {
    return 100 + colNorm.length;
  }

  // 2. Tokenized match: every word in the column name appears in the query
  const colWords = colNorm.split(' ').filter(w => w.length > 1);
  if (colWords.length > 0 && colWords.every(w => queryNorm.includes(w))) {
    return 80 + (colWords.length * 10);
  }

  // 3. Significant word intersection
  const queryWords = queryNorm.split(' ').filter(w => w.length > 2);
  let matchingWords = 0;
  for (const qw of queryWords) {
    if (colWords.includes(qw)) {
      matchingWords++;
    }
  }
  let score = matchingWords > 0 ? (35 + matchingWords * 15) : 0;

  // 4. Synonym / Semantic Concept match
  if (synonymsMap) {
    for (const [concept, syns] of Object.entries(synonymsMap)) {
      const queryMatches = syns.some(s => queryNorm.includes(s));
      const colMatches = syns.some(s => colNorm.includes(s));
      if (queryMatches && colMatches) {
        score = Math.max(score, 60);
      }
    }
  }

  return score;
}

/**
 * Parses user natural language query into a dashboard widget recommendation
 */
export function parseNaturalLanguageQuery(query, columnProfiles) {
  if (!query || typeof query !== 'string') return null;
  const qNorm = normalizeText(query);
  if (qNorm.length < 3) return null;

  const measures = (columnProfiles || []).filter(c => c.type === 'measure').map(c => c.name);
  const dimensions = (columnProfiles || []).filter(c => c.type !== 'measure').map(c => c.name);

  // 1. Match Best Measure
  let matchedMeasure = null;
  let bestMeasureScore = 0;
  for (const m of measures) {
    const score = scoreColumnMatch(qNorm, m, MEASURE_SYNONYMS);
    if (score > bestMeasureScore) {
      bestMeasureScore = score;
      matchedMeasure = m;
    }
  }

  // Fallback: If no measure explicitly matched, select the first sensible primary measure
  if (!matchedMeasure && measures.length > 0) {
    matchedMeasure = measures[0];
  }

  // 2. Match Best Dimension (and optionally Secondary Dimension)
  let matchedDimension = null;
  let secondaryDimension = null;
  let bestDimScore = 0;

  const rankedDimensions = dimensions.map(d => {
    let score = scoreColumnMatch(qNorm, d, DIMENSION_SYNONYMS);
    // Severe penalty for pure identifier columns if not explicitly asked by name
    if (isIdentifierColumn(d) && !qNorm.includes(normalizeText(d))) {
      score -= 50;
    }
    const dNorm = normalizeText(d);
    const indexInQuery = dNorm && qNorm.includes(dNorm) ? qNorm.indexOf(dNorm) : 999;
    return { name: d, score, indexInQuery };
  }).sort((a, b) => {
    // If both are strong matches, order by their appearance in the user query (first mentioned = primary)
    if (Math.abs(b.score - a.score) <= 20 && a.indexInQuery !== b.indexInQuery && a.indexInQuery < 999 && b.indexInQuery < 999) {
      return a.indexInQuery - b.indexInQuery;
    }
    return b.score - a.score;
  });

  if (rankedDimensions.length > 0 && rankedDimensions[0].score > 0) {
    matchedDimension = rankedDimensions[0].name;

    // Only assign secondaryDimension if query explicitly indicates a multi-dimensional breakdown
    // (e.g. "by Region and Quarter", "split by", "across", "broken down by")
    const hasMultiDimIndicator = /\b(and|across|split by|broken down by)\b/i.test(qNorm);
    if (hasMultiDimIndicator && rankedDimensions.length > 1 && rankedDimensions[1].score >= 60) {
      const primWords = normalizeText(matchedDimension).split(' ');
      const secWords = normalizeText(rankedDimensions[1].name).split(' ');
      const hasUniqueWords = secWords.some(w => !primWords.includes(w) && qNorm.includes(w));

      if (hasUniqueWords) {
        secondaryDimension = rankedDimensions[1].name;
      }
    }
  }

  // Fallback: If no dimension explicitly matched in query, choose the most sensible non-ID dimension
  if (!matchedDimension && dimensions.length > 0) {
    const sensibleDimensions = dimensions.filter(d => !isIdentifierColumn(d));
    matchedDimension = sensibleDimensions[0] || dimensions[0];
  }

  // 3. Determine Chart Type
  let chartType = 'bar';
  if (qNorm.includes('trend') || qNorm.includes('time') || qNorm.includes('month') || qNorm.includes('over time') || qNorm.includes('trajectory') || qNorm.includes('line')) {
    chartType = 'line';
  } else if (qNorm.includes('share') || qNorm.includes('proportion') || qNorm.includes('donut') || qNorm.includes('pie') || qNorm.includes('breakdown')) {
    chartType = 'donut';
  } else if (qNorm.includes('cumulative') || qNorm.includes('running') || qNorm.includes('area')) {
    chartType = 'area';
  } else if (qNorm.includes('matrix') || qNorm.includes('pivot') || qNorm.includes('cross tab')) {
    chartType = 'pivot';
  } else if (qNorm.includes('waterfall') || qNorm.includes('walk') || qNorm.includes('bridge') || qNorm.includes('variance')) {
    chartType = 'waterfall';
  } else if (qNorm.includes('gauge') || qNorm.includes('target') || qNorm.includes('kpi') || qNorm.includes('meter')) {
    chartType = 'gauge';
  } else if (qNorm.includes('radar') || qNorm.includes('spider')) {
    chartType = 'radar';
  } else if (secondaryDimension) {
    chartType = 'stackedBar';
  }

  // 4. Determine Aggregation
  let aggregation = 'SUM';
  if (qNorm.includes('average') || qNorm.includes('avg') || qNorm.includes('mean')) {
    aggregation = 'AVG';
  } else if (qNorm.includes('median')) {
    aggregation = 'MEDIAN';
  } else if (qNorm.includes('count') || qNorm.includes('number of')) {
    aggregation = 'COUNT';
  } else if (qNorm.includes('lowest') || qNorm.includes('minimum') || qNorm.includes('min')) {
    aggregation = 'MIN';
  } else if (qNorm.includes('highest') || qNorm.includes('maximum') || qNorm.includes('max') || qNorm.includes('peak')) {
    aggregation = 'MAX';
  }

  // 5. Determine Modifier
  let modifier = 'RAW';
  if (qNorm.includes('cumulative') || qNorm.includes('running total')) modifier = 'CUMULATIVE';
  if (qNorm.includes('growth') || qNorm.includes('mom') || qNorm.includes('rate') || qNorm.includes('delta')) modifier = 'GROWTH_PCT';
  if (qNorm.includes('percent of total') || qNorm.includes('share of total') || qNorm.includes('pct') || qNorm.includes('share')) modifier = 'SHARE_OF_TOTAL';
  if (qNorm.includes('moving average') || qNorm.includes('rolling')) modifier = 'ROLLING_AVG_3';

  const displayDimension = matchedDimension || 'Category';
  const displayMeasure = matchedMeasure || 'Value';

  return {
    title: secondaryDimension
      ? `${displayMeasure} by ${displayDimension} & ${secondaryDimension}`
      : `${displayMeasure} by ${displayDimension}`,
    chartType,
    dimension: displayDimension,
    secondaryDimension: secondaryDimension || null,
    measure: displayMeasure,
    aggregation,
    modifier
  };
}
