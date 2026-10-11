/**
 * Data Modeling & Transformation Service
 * Multi-Table Joins, Custom Bucket Grouping, Numeric Binning, and Advanced SQL-like Predicates.
 */

/**
 * Performs a relational join between two tabular datasets
 * @param {Object} params
 * @param {Array<Object>} params.tableA - Left / Primary dataset
 * @param {Array<Object>} params.tableB - Right / Secondary dataset
 * @param {string} params.keyA - Join key column in Table A
 * @param {string} params.keyB - Join key column in Table B
 * @param {'LEFT' | 'INNER' | 'FULL' | 'CROSS'} params.joinType - Join algorithm
 * @param {string} [params.prefixB] - Prefix for colliding columns from Table B
 * @returns {{ data: Array<Object>, stats: Object }}
 */
export function performTableJoin({
  tableA = [],
  tableB = [],
  keyA,
  keyB,
  joinType = 'LEFT',
  prefixB = 'B_'
}) {
  if (!Array.isArray(tableA) || tableA.length === 0) {
    throw new Error('Primary Table A has no rows to join.');
  }
  if (!Array.isArray(tableB) || tableB.length === 0) {
    throw new Error('Secondary Table B has no rows to join.');
  }
  if (joinType !== 'CROSS' && (!keyA || !keyB)) {
    throw new Error('Both join key columns (Key A and Key B) must be specified.');
  }

  // Identify column sets and collision names
  const colsA = Object.keys(tableA[0] || {});
  const colsB = Object.keys(tableB[0] || {});
  const setA = new Set(colsA);

  const colMappingB = {};
  for (const col of colsB) {
    if (col === keyB && joinType !== 'CROSS') {
      // Keep key identical if possible, else skip duplicate key column
      colMappingB[col] = setA.has(col) && col !== keyA ? `${prefixB}${col}` : null;
    } else if (setA.has(col)) {
      colMappingB[col] = `${prefixB}${col}`;
    } else {
      colMappingB[col] = col;
    }
  }

  // Cross join special case
  if (joinType === 'CROSS') {
    const merged = [];
    const maxRows = Math.min(tableA.length * tableB.length, 50000); // Safety limit for memory
    let count = 0;
    for (let i = 0; i < tableA.length; i++) {
      for (let j = 0; j < tableB.length; j++) {
        if (count >= maxRows) break;
        const row = { ...tableA[i] };
        for (const col of colsB) {
          const target = colMappingB[col] || `${prefixB}${col}`;
          row[target] = tableB[j][col] ?? null;
        }
        merged.push(row);
        count++;
      }
      if (count >= maxRows) break;
    }
    return {
      data: merged,
      stats: {
        totalRows: merged.length,
        matchedRows: merged.length,
        unmatchedA: 0,
        unmatchedB: 0,
        type: 'CROSS'
      }
    };
  }

  // Index Table B by stringified key for O(N + M) join performance
  const indexB = new Map();
  for (let j = 0; j < tableB.length; j++) {
    const rB = tableB[j];
    const rawVal = rB[keyB];
    if (rawVal === undefined || rawVal === null) continue;
    const lookupKey = String(rawVal).trim().toLowerCase();
    if (!indexB.has(lookupKey)) {
      indexB.set(lookupKey, []);
    }
    indexB.get(lookupKey).push(rB);
  }

  const merged = [];
  const visitedKeysB = new Set();
  let matchedRows = 0;
  let unmatchedA = 0;

  // Process rows from Table A
  for (let i = 0; i < tableA.length; i++) {
    const rA = tableA[i];
    const valA = rA[keyA];
    const lookupKey = valA !== undefined && valA !== null ? String(valA).trim().toLowerCase() : '';
    const matches = lookupKey ? indexB.get(lookupKey) : null;

    if (matches && matches.length > 0) {
      visitedKeysB.add(lookupKey);
      matchedRows++;
      for (const mB of matches) {
        const newRow = { ...rA };
        for (const col of colsB) {
          const target = colMappingB[col];
          if (target) {
            newRow[target] = mB[col] ?? null;
          }
        }
        merged.push(newRow);
      }
    } else {
      unmatchedA++;
      if (joinType === 'LEFT' || joinType === 'FULL') {
        const newRow = { ...rA };
        for (const col of colsB) {
          const target = colMappingB[col];
          if (target) {
            newRow[target] = null;
          }
        }
        merged.push(newRow);
      }
    }
  }

  // Full Outer Join: append unmatched rows from Table B
  let unmatchedB = 0;
  if (joinType === 'FULL') {
    for (const [kStr, rows] of indexB.entries()) {
      if (!visitedKeysB.has(kStr)) {
        unmatchedB += rows.length;
        for (const rB of rows) {
          const newRow = {};
          // Fill A columns with null
          for (const col of colsA) {
            newRow[col] = col === keyA ? rB[keyB] : null;
          }
          // Fill B columns
          for (const col of colsB) {
            const target = colMappingB[col];
            if (target) {
              newRow[target] = rB[col] ?? null;
            }
          }
          merged.push(newRow);
        }
      }
    }
  }

  return {
    data: merged,
    stats: {
      totalRows: merged.length,
      matchedRows,
      unmatchedA,
      unmatchedB,
      type: joinType
    }
  };
}

/**
 * Generates custom numeric bucket bins for a continuous measure
 * @param {Array<Object>} data
 * @param {string} measureColumn
 * @param {Array<{ label: string, min: number, max: number }>} bins
 * @param {string} newColumnName
 * @returns {Array<Object>}
 */
export function createNumericBins(data, measureColumn, bins = [], newColumnName) {
  if (!Array.isArray(data) || !measureColumn || !newColumnName) return data;
  if (!bins || bins.length === 0) return data;

  return data.map(row => {
    const raw = row[measureColumn];
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^0-9.-]/g, ''));

    if (isNaN(num)) {
      return { ...row, [newColumnName]: 'Unknown / N/A' };
    }

    let assignedBin = 'Other';
    for (let b = 0; b < bins.length; b++) {
      const { label, min, max } = bins[b];
      const satisfiesMin = min === undefined || min === null || num >= min;
      const satisfiesMax = max === undefined || max === null || (b === bins.length - 1 ? num <= max : num < max);
      if (satisfiesMin && satisfiesMax) {
        assignedBin = label;
        break;
      }
    }

    return {
      ...row,
      [newColumnName]: assignedBin
    };
  });
}

/**
 * Groups categorical dimension values into custom high-level buckets
 * @param {Array<Object>} data
 * @param {string} dimensionColumn
 * @param {Object.<string, string>} groupMap - { [distinctValue]: 'BucketName' }
 * @param {string} defaultGroup - Fallback bucket e.g. 'Other'
 * @param {string} newColumnName
 * @returns {Array<Object>}
 */
export function createCategoricalGroups(data, dimensionColumn, groupMap = {}, defaultGroup = 'Other', newColumnName) {
  if (!Array.isArray(data) || !dimensionColumn || !newColumnName) return data;

  return data.map(row => {
    const val = row[dimensionColumn];
    const key = val !== undefined && val !== null ? String(val).trim() : '';
    const bucket = groupMap[key] || defaultGroup || key || 'N/A';

    return {
      ...row,
      [newColumnName]: bucket
    };
  });
}

/**
 * Suggests smart quantile intervals (e.g. 4 quartiles or custom count) for a measure
 * @param {Array<Object>} data
 * @param {string} measureColumn
 * @param {number} numBins
 * @returns {Array<{ label: string, min: number, max: number }>}
 */
export function generateAutoIntervalBins(data, measureColumn, numBins = 4) {
  if (!Array.isArray(data) || !measureColumn) return [];
  const nums = [];
  for (let i = 0; i < data.length; i++) {
    const v = data[i][measureColumn];
    if (typeof v === 'number' && !isNaN(v)) {
      nums.push(v);
    }
  }

  if (nums.length === 0) return [];
  nums.sort((a, b) => a - b);

  const minVal = nums[0];
  const maxVal = nums[nums.length - 1];

  if (minVal === maxVal) {
    return [{ label: `${minVal}`, min: minVal, max: maxVal }];
  }

  const bins = [];
  const step = (maxVal - minVal) / numBins;

  for (let i = 0; i < numBins; i++) {
    const start = Math.round((minVal + i * step) * 100) / 100;
    const end = Math.round((minVal + (i + 1) * step) * 100) / 100;
    const isLast = i === numBins - 1;
    bins.push({
      label: `${start} to ${end}${isLast ? ' (High)' : ''}`,
      min: start,
      max: end
    });
  }

  return bins;
}

/**
 * Advanced Compound Predicate Filtering Engine (SQL-like)
 * Supports nested rules with: EQUALS, NOT_EQUALS, GREATER, LESS, GTE, LTE,
 * BETWEEN, CONTAINS, NOT_CONTAINS, STARTS_WITH, IN, IS_NULL, IS_NOT_NULL
 * @param {Array<Object>} data
 * @param {Array<Object>} rules
 * @param {'AND' | 'OR'} [logicalOperator='AND']
 * @returns {Array<Object>}
 */
export function evaluateCompoundFilters(data, rules = [], logicalOperator = 'AND') {
  if (!Array.isArray(data) || data.length === 0) return [];
  if (!Array.isArray(rules) || rules.length === 0) return data;

  const validRules = rules.filter(r => r && r.column && r.operator);
  if (validRules.length === 0) return data;

  return data.filter(row => {
    const matchesRule = (rule) => {
      const { column, operator, value, value2 } = rule;
      const cell = row[column];

      switch (operator) {
        case 'EQUALS':
        case '=':
          return cell !== null && cell !== undefined && String(cell).toLowerCase() === String(value).toLowerCase();

        case 'NOT_EQUALS':
        case '!=':
        case '<>':
          return cell === null || cell === undefined || String(cell).toLowerCase() !== String(value).toLowerCase();

        case 'GREATER':
        case '>':
          return typeof cell === 'number' && cell > Number(value);

        case 'LESS':
        case '<':
          return typeof cell === 'number' && cell < Number(value);

        case 'GREATER_EQUAL':
        case '>=':
          return typeof cell === 'number' && cell >= Number(value);

        case 'LESS_EQUAL':
        case '<=':
          return typeof cell === 'number' && cell <= Number(value);

        case 'BETWEEN':
          return typeof cell === 'number' && cell >= Number(value) && cell <= Number(value2);

        case 'CONTAINS':
          return cell !== null && cell !== undefined && String(cell).toLowerCase().includes(String(value).toLowerCase());

        case 'NOT_CONTAINS':
          return cell === null || cell === undefined || !String(cell).toLowerCase().includes(String(value).toLowerCase());

        case 'STARTS_WITH':
          return cell !== null && cell !== undefined && String(cell).toLowerCase().startsWith(String(value).toLowerCase());

        case 'IN': {
          const list = Array.isArray(value)
            ? value.map(v => String(v).trim().toLowerCase())
            : String(value).split(',').map(v => v.trim().toLowerCase());
          return cell !== null && cell !== undefined && list.includes(String(cell).toLowerCase());
        }

        case 'IS_NULL':
        case 'IS_EMPTY':
          return cell === null || cell === undefined || String(cell).trim() === '';

        case 'IS_NOT_NULL':
        case 'IS_NOT_EMPTY':
          return cell !== null && cell !== undefined && String(cell).trim() !== '';

        default:
          return true;
      }
    };

    if (logicalOperator === 'OR') {
      return validRules.some(matchesRule);
    }
    return validRules.every(matchesRule);
  });
}
