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
 * Parses user natural language query into a dashboard widget recommendation
 */
export function parseNaturalLanguageQuery(query, columnProfiles) {
  if (!query || typeof query !== 'string') return null;
  const q = query.toLowerCase();

  const measures = columnProfiles.filter(c => c.type === 'measure').map(c => c.name);
  const dimensions = columnProfiles.filter(c => c.type !== 'measure').map(c => c.name);

  // Find mentioned measure
  let matchedMeasure = measures.find(m => q.includes(m.toLowerCase()));
  if (!matchedMeasure && measures.length > 0) {
    // Check keywords like revenue, profit, cost, sales, mrr, churn
    const keywords = ['revenue', 'profit', 'cost', 'ebitda', 'mrr', 'sales', 'lead', 'rate', 'price'];
    for (const kw of keywords) {
      if (q.includes(kw)) {
        matchedMeasure = measures.find(m => m.toLowerCase().includes(kw)) || measures[0];
        break;
      }
    }
  }

  // Find mentioned dimension
  let matchedDimension = dimensions.find(d => q.includes(d.toLowerCase()));
  if (!matchedDimension && dimensions.length > 0) {
    const dimKeywords = ['quarter', 'month', 'date', 'region', 'tier', 'supplier', 'unit', 'country'];
    for (const kw of dimKeywords) {
      if (q.includes(kw)) {
        matchedDimension = dimensions.find(d => d.toLowerCase().includes(kw)) || dimensions[0];
        break;
      }
    }
  }

  // Determine chart type
  let chartType = 'bar';
  if (q.includes('trend') || q.includes('time') || q.includes('month') || q.includes('over time') || q.includes('line')) {
    chartType = 'line';
  } else if (q.includes('share') || q.includes('proportion') || q.includes('donut') || q.includes('pie') || q.includes('breakdown')) {
    chartType = 'donut';
  } else if (q.includes('cumulative') || q.includes('area')) {
    chartType = 'area';
  } else if (q.includes('matrix') || q.includes('pivot')) {
    chartType = 'pivot';
  } else if (q.includes('waterfall') || q.includes('walk')) {
    chartType = 'waterfall';
  } else if (q.includes('radar') || q.includes('spider')) {
    chartType = 'radar';
  }

  // Determine modifier
  let modifier = 'RAW';
  if (q.includes('cumulative') || q.includes('running total')) modifier = 'CUMULATIVE';
  if (q.includes('growth') || q.includes('mom') || q.includes('rate')) modifier = 'GROWTH_PCT';
  if (q.includes('percent of total') || q.includes('share of total') || q.includes('pct')) modifier = 'SHARE_OF_TOTAL';
  if (q.includes('moving average') || q.includes('rolling')) modifier = 'ROLLING_AVG_3';

  return {
    title: `${matchedMeasure || 'Performance'} by ${matchedDimension || 'Category'}`,
    chartType,
    dimension: matchedDimension || dimensions[0] || 'Category',
    measure: matchedMeasure || measures[0] || 'Value',
    aggregation: 'SUM',
    modifier
  };
}
