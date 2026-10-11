/**
 * Advanced Business Calculation & Formula Engine
 */

/**
 * Safe iterative min calculation that never spreads into Math.min
 */
export function safeMin(arr, defaultVal = Infinity) {
  if (!arr || arr.length === 0) return defaultVal;
  let min = defaultVal;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (typeof v === 'number' && !isNaN(v) && v < min) {
      min = v;
    }
  }
  return min === Infinity ? (defaultVal === Infinity ? 0 : defaultVal) : min;
}

/**
 * Safe iterative max calculation that never spreads into Math.max
 */
export function safeMax(arr, defaultVal = -Infinity) {
  if (!arr || arr.length === 0) return defaultVal;
  let max = defaultVal;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (typeof v === 'number' && !isNaN(v) && v > max) {
      max = v;
    }
  }
  return max === -Infinity ? (defaultVal === -Infinity ? 0 : defaultVal) : max;
}


/**
 * Evaluates an arithmetic formula across a dataset.
 * Supports formulas like: "[Revenue] - [COGS]" or "([EBITDA] / [Revenue]) * 100"
 */
export function evaluateCustomFormula(dataset, formulaName, formulaExpression) {
  if (!dataset || !Array.isArray(dataset)) return [];
  if (!formulaExpression || !formulaName) return dataset;

  return dataset.map(row => {
    try {
      // Replace [ColumnName] with actual row value
      let expr = formulaExpression.replace(/\[([^\]]+)\]/g, (match, colName) => {
        const val = row[colName];
        if (val === undefined || val === null || isNaN(Number(val))) {
          return '0';
        }
        return `(${Number(val)})`;
      });

      // Support IF(condition, trueVal, falseVal)
      expr = expr.replace(/IF\s*\(([^,]+),([^,]+),([^)]+)\)/gi, '($1 ? $2 : $3)');

      // Support safe math functions
      expr = expr
        .replace(/LOG\s*\(/gi, 'Math.log10(')
        .replace(/LN\s*\(/gi, 'Math.log(')
        .replace(/SQRT\s*\(/gi, 'Math.sqrt(')
        .replace(/ABS\s*\(/gi, 'Math.abs(')
        .replace(/ROUND\s*\(/gi, 'Math.round(')
        .replace(/MIN\s*\(/gi, 'Math.min(')
        .replace(/MAX\s*\(/gi, 'Math.max(');

      // Validate allowed characters to prevent unsafe code injection
      if (!/^[0-9+\-*/().?:><=!\sMath.log10sqrtabsroundminmaxeE]+$/.test(expr)) {
        return { ...row, [formulaName]: null };
      }

      // Safe evaluation using Function
      // eslint-disable-next-line no-new-func
      const result = new Function(`return (${expr});`)();
      const numResult = typeof result === 'number' && !isNaN(result) && isFinite(result)
        ? Math.round(result * 100) / 100
        : null;

      return {
        ...row,
        [formulaName]: numResult
      };
    } catch (err) {
      return { ...row, [formulaName]: null };
    }
  });
}

/**
 * Standard statistical metrics for any numeric column
 */
export function calculateColumnStats(rows, column) {
  if (!rows || rows.length === 0) return null;

  const values = rows
    .map(r => r[column])
    .filter(v => typeof v === 'number' && !isNaN(v))
    .sort((a, b) => a - b);

  if (values.length === 0) return null;

  const count = values.length;
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / count;
  const min = values[0];
  const max = values[values.length - 1];

  // Median
  const mid = Math.floor(count / 2);
  const median = count % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;

  // Standard Deviation
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  // Outliers (IQR method)
  const q1 = values[Math.floor(count * 0.25)];
  const q3 = values[Math.floor(count * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliers = values.filter(v => v < lowerBound || v > upperBound);

  return {
    count,
    sum: Math.round(sum * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    min,
    max,
    stdDev: Math.round(stdDev * 100) / 100,
    outlierCount: outliers.length
  };
}

export const COMPLEX_MODIFIERS = [
  {
    category: 'Standard',
    options: [
      { id: 'RAW', label: 'Standard Aggregation', desc: 'Direct aggregated value without post-processing' }
    ]
  },
  {
    category: 'Time Series & Rolling Trends',
    options: [
      { id: 'CUMULATIVE', label: 'Cumulative / Running Total', desc: 'Rolls up values sequentially across periods' },
      { id: 'ROLLING_AVG_3', label: '3-Period Moving Average', desc: 'Smooths short-term fluctuations across a 3-period sliding window' },
      { id: 'ROLLING_AVG_6', label: '6-Period Moving Average', desc: 'Medium-term smoothing across a 6-period sliding window' }
    ]
  },
  {
    category: 'Growth & Variance Analysis',
    options: [
      { id: 'GROWTH_PCT', label: 'Period Growth Rate (%)', desc: 'Percentage change compared to preceding period (Period-over-Period)' },
      { id: 'GROWTH_ABS', label: 'Absolute Period Delta', desc: 'Raw unit/dollar change compared to preceding period' },
      { id: 'DIFF_FROM_AVG', label: 'Variance from Mean', desc: 'Deviation of each data point from the overall average' }
    ]
  },
  {
    category: 'Composition & Relative Benchmarks',
    options: [
      { id: 'SHARE_OF_TOTAL', label: 'Share of Total (%)', desc: 'Percentage contribution of each item to the grand total (100% total)' },
      { id: 'PARETO_CUMULATIVE_PCT', label: 'Pareto Cumulative Share (%)', desc: 'Running percentage share of grand total for 80/20 analysis' },
      { id: 'PCT_OF_MAX', label: '% of Peak / Maximum', desc: 'Normalized percentage relative to the highest record in the series' },
      { id: 'PCT_OF_FIRST', label: 'Index to Baseline (% of Period 1)', desc: 'Indexed relative to the initial period (Period 1 = 100%)' }
    ]
  }
];

export function applyModifierToSeries(values, modifier) {
  if (!values || values.length === 0 || modifier === 'RAW' || !modifier) {
    return values;
  }

  if (modifier === 'CUMULATIVE') {
    let runningSum = 0;
    return values.map(v => {
      runningSum += v;
      return Math.round(runningSum * 100) / 100;
    });
  }

  if (modifier === 'GROWTH_PCT') {
    return values.map((v, i) => {
      if (i === 0 || values[i - 1] === 0) return 0;
      const prev = values[i - 1];
      const pct = ((v - prev) / Math.abs(prev)) * 100;
      return Math.round(pct * 10) / 10;
    });
  }

  if (modifier === 'GROWTH_ABS') {
    return values.map((v, i) => {
      if (i === 0) return 0;
      return Math.round((v - values[i - 1]) * 100) / 100;
    });
  }

  if (modifier === 'SHARE_OF_TOTAL') {
    const grandTotal = values.reduce((a, b) => a + b, 0) || 1;
    return values.map(v => Math.round((v / grandTotal) * 1000) / 10);
  }

  if (modifier === 'ROLLING_AVG_3') {
    return values.map((v, i) => {
      const start = Math.max(0, i - 2);
      const window = values.slice(start, i + 1);
      const avg = window.reduce((a, b) => a + b, 0) / window.length;
      return Math.round(avg * 100) / 100;
    });
  }

  if (modifier === 'ROLLING_AVG_6') {
    return values.map((v, i) => {
      const start = Math.max(0, i - 5);
      const window = values.slice(start, i + 1);
      const avg = window.reduce((a, b) => a + b, 0) / window.length;
      return Math.round(avg * 100) / 100;
    });
  }

  if (modifier === 'DIFF_FROM_AVG') {
    const mean = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length) : 0;
    return values.map(v => Math.round((v - mean) * 100) / 100);
  }

  if (modifier === 'PCT_OF_MAX') {
    const maxVal = safeMax(values, 0.000001);
    return values.map(v => Math.round((v / maxVal) * 1000) / 10);
  }

  if (modifier === 'PCT_OF_FIRST') {
    const baseVal = values.length > 0 && values[0] !== 0 ? values[0] : 1;
    return values.map(v => Math.round((v / baseVal) * 1000) / 10);
  }

  if (modifier === 'PARETO_CUMULATIVE_PCT') {
    const grandTotal = values.reduce((a, b) => a + b, 0) || 1;
    let run = 0;
    return values.map(v => {
      run += v;
      return Math.round((run / grandTotal) * 1000) / 10;
    });
  }

  return values;
}

/**
 * Aggregates a list of records by Dimension and computes Measure with complex calculation modifier
 */
export function aggregateData({
  rows,
  dimension,
  measure,
  aggregation = 'SUM', // 'SUM' | 'AVG' | 'MEDIAN' | 'MIN' | 'MAX' | 'COUNT'
  modifier = 'RAW',
  groupBy = null, // Optional secondary dimension for multi-bar / grouped lines
  sortBy = 'none' // 'asc' | 'desc' | 'none'
}) {
  if (!rows || rows.length === 0 || !dimension) {
    return { labels: [], datasets: [] };
  }

  // If no secondary groupBy, simple single-series aggregation
  if (!groupBy) {
    const groups = new Map();

    rows.forEach(r => {
      const dimVal = r[dimension] !== undefined && r[dimension] !== null ? String(r[dimension]) : '(Blank)';
      const mVal = typeof r[measure] === 'number' ? r[measure] : (Number(r[measure]) || 0);

      if (!groups.has(dimVal)) {
        groups.set(dimVal, []);
      }
      groups.get(dimVal).push(mVal);
    });

    let entries = Array.from(groups.entries()).map(([label, vals]) => {
      let aggregatedVal = 0;
      if (aggregation === 'SUM') {
        aggregatedVal = vals.reduce((a, b) => a + b, 0);
      } else if (aggregation === 'AVG') {
        aggregatedVal = vals.reduce((a, b) => a + b, 0) / vals.length;
      } else if (aggregation === 'MIN') {
        aggregatedVal = safeMin(vals, 0);
      } else if (aggregation === 'MAX') {
        aggregatedVal = safeMax(vals, 0);
      } else if (aggregation === 'COUNT') {
        aggregatedVal = vals.length;
      } else if (aggregation === 'MEDIAN') {
        const sorted = [...vals].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        aggregatedVal = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      }
      return { label, value: Math.round(aggregatedVal * 100) / 100 };
    });

    // Sorting
    if (sortBy === 'asc') {
      entries.sort((a, b) => a.value - b.value);
    } else if (sortBy === 'desc') {
      entries.sort((a, b) => b.value - a.value);
    }

    const labels = entries.map(e => e.label);
    const rawValues = entries.map(e => e.value);
    const modifiedValues = applyModifierToSeries(rawValues, modifier);

    return {
      labels,
      datasets: [
        {
          label: `${measure} (${aggregation}${modifier !== 'RAW' ? ` · ${modifier}` : ''})`,
          data: modifiedValues,
          rawValues
        }
      ]
    };
  }

  // Multi-series aggregation with secondary groupBy
  const dimSet = new Set();
  const groupSet = new Set();
  const matrix = new Map(); // key: `${dim}:::${grp}` -> list of values

  rows.forEach(r => {
    const dimVal = r[dimension] !== undefined && r[dimension] !== null ? String(r[dimension]) : '(Blank)';
    const grpVal = r[groupBy] !== undefined && r[groupBy] !== null ? String(r[groupBy]) : '(Other)';
    const mVal = typeof r[measure] === 'number' ? r[measure] : (Number(r[measure]) || 0);

    dimSet.add(dimVal);
    groupSet.add(grpVal);

    const key = `${dimVal}:::${grpVal}`;
    if (!matrix.has(key)) matrix.set(key, []);
    matrix.get(key).push(mVal);
  });

  const labels = Array.from(dimSet);
  const groupNames = Array.from(groupSet);

  const datasets = groupNames.map(grp => {
    let vals = labels.map(dim => {
      const key = `${dim}:::${grp}`;
      const bucket = matrix.get(key) || [];
      if (bucket.length === 0) return 0;
      if (aggregation === 'SUM') return bucket.reduce((a, b) => a + b, 0);
      if (aggregation === 'AVG') return bucket.reduce((a, b) => a + b, 0) / bucket.length;
      if (aggregation === 'MIN') return safeMin(bucket, 0);
      if (aggregation === 'MAX') return safeMax(bucket, 0);
      return bucket.length;
    });

    vals = applyModifierToSeries(vals, modifier);

    return {
      label: grp,
      data: vals.map(v => Math.round(v * 100) / 100)
    };
  });

  return { labels, datasets };
}

/**
 * Computes a Pivot Table Matrix (Row Dimension x Column Dimension)
 */
export function computePivotMatrix(rows, rowDim, colDim, valMeasure, agg = 'SUM') {
  if (!rows || rows.length === 0 || !rowDim || !colDim || !valMeasure) {
    return { rowHeaders: [], colHeaders: [], matrix: [], rowTotals: [], colTotals: [], grandTotal: 0 };
  }

  const rowSet = new Set();
  const colSet = new Set();
  const cellMap = new Map();

  rows.forEach(r => {
    const rVal = String(r[rowDim] ?? '(Blank)');
    const cVal = String(r[colDim] ?? '(Blank)');
    const num = Number(r[valMeasure]) || 0;

    rowSet.add(rVal);
    colSet.add(cVal);

    const key = `${rVal}:::${cVal}`;
    if (!cellMap.has(key)) cellMap.set(key, []);
    cellMap.get(key).push(num);
  });

  const rowHeaders = Array.from(rowSet).sort();
  const colHeaders = Array.from(colSet).sort();

  const matrix = [];
  const rowTotals = [];
  const colTotals = new Array(colHeaders.length).fill(0);
  let grandTotal = 0;

  rowHeaders.forEach((rHead, rIdx) => {
    const rowCells = [];
    let rSum = 0;

    colHeaders.forEach((cHead, cIdx) => {
      const key = `${rHead}:::${cHead}`;
      const vals = cellMap.get(key) || [];
      let val = 0;
      if (vals.length > 0) {
        val = agg === 'SUM' ? vals.reduce((a, b) => a + b, 0) : vals.reduce((a, b) => a + b, 0) / vals.length;
      }
      val = Math.round(val * 100) / 100;
      rowCells.push(val);
      rSum += val;
      colTotals[cIdx] += val;
      grandTotal += val;
    });

    matrix.push(rowCells);
    rowTotals.push(Math.round(rSum * 100) / 100);
  });

  return {
    rowHeaders,
    colHeaders,
    matrix,
    rowTotals,
    colTotals: colTotals.map(t => Math.round(t * 100) / 100),
    grandTotal: Math.round(grandTotal * 100) / 100
  };
}

/**
 * Calculates period-over-period delta and percentage for KPI cards
 */
export function calculateKpiDelta(rows, measureCol, dateCol, aggregation = 'SUM') {
  if (!rows || rows.length === 0 || !measureCol) {
    return { current: 0, prior: 0, delta: 0, deltaPct: 0, trend: [], total: 0 };
  }

  // If dateCol available, sort by dateCol
  let sorted = [...rows];
  if (dateCol) {
    sorted.sort((a, b) => String(a[dateCol]).localeCompare(String(b[dateCol])));
  }

  const values = sorted.map(r => Number(r[measureCol]) || 0);

  const computeAgg = (arr) => {
    if (!arr || arr.length === 0) return 0;
    if (aggregation === 'AVG') return arr.reduce((a, b) => a + b, 0) / arr.length;
    if (aggregation === 'MAX') return safeMax(arr, 0);
    if (aggregation === 'MIN') return safeMin(arr, 0);
    if (aggregation === 'COUNT') return arr.length;
    return arr.reduce((a, b) => a + b, 0); // SUM
  };

  const total = computeAgg(values);

  // Split into recent half vs prior half for trend calculation
  const half = Math.floor(values.length / 2);
  const priorHalf = values.slice(0, half);
  const recentHalf = values.slice(half);

  const priorVal = computeAgg(priorHalf) || 1;
  const recentVal = computeAgg(recentHalf);

  const delta = recentVal - priorVal;
  const deltaPct = Math.round(((recentVal - priorVal) / Math.abs(priorVal)) * 1000) / 10;

  return {
    total: Math.round(total * 100) / 100,
    recent: Math.round(recentVal * 100) / 100,
    prior: Math.round(priorVal * 100) / 100,
    delta: Math.round(delta * 100) / 100,
    deltaPct,
    trend: values.slice(-12) // Sparkline points
  };
}
