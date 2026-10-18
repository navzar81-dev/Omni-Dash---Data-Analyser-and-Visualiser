import assert from 'assert';
import { parseNaturalLanguageQuery, isIdentifierColumn, normalizeText } from '../src/services/smartInsights.js';

console.log('========================================');
console.log('--- 1. Testing Identifier Column Detection ---');
console.log('========================================');

assert.strictEqual(isIdentifierColumn('Transaction_ID'), true);
assert.strictEqual(isIdentifierColumn('transaction_id'), true);
assert.strictEqual(isIdentifierColumn('Shipment_ID'), true);
assert.strictEqual(isIdentifierColumn('Order ID'), true);
assert.strictEqual(isIdentifierColumn('id'), true);
assert.strictEqual(isIdentifierColumn('UUID'), true);
assert.strictEqual(isIdentifierColumn('Product_Category'), false);
assert.strictEqual(isIdentifierColumn('Region'), false);
assert.strictEqual(isIdentifierColumn('Supplier'), false);
console.log('  ✓ Identified ID columns accurately vs meaningful categories');

console.log('\n========================================');
console.log('--- 2. Testing Exact User Scenario: "Operating profit grouped by Product Category" ---');
console.log('========================================');

const mockColumnsWithOperatingProfit = [
  { name: 'Transaction_ID', type: 'dimension' },
  { name: 'Product_Category', type: 'dimension' },
  { name: 'Product_Name', type: 'dimension' },
  { name: 'Unit_Cost', type: 'measure' },
  { name: 'Gross_Profit', type: 'measure' },
  { name: 'Operating_Profit', type: 'measure' }
];

const res1 = parseNaturalLanguageQuery('Operating profit grouped by Product Category', mockColumnsWithOperatingProfit);
console.log('  Parsed config:', JSON.stringify(res1));
assert.strictEqual(res1.dimension, 'Product_Category', 'Should match Product_Category instead of Transaction_ID');
assert.strictEqual(res1.measure, 'Operating_Profit', 'Should match Operating_Profit');
assert.strictEqual(res1.chartType, 'bar');
console.log('  ✓ Matched Product_Category dimension and Operating_Profit measure');

// Test fallback to Gross_Profit if Operating_Profit is not in dataset
const mockColumnsWithGrossProfitOnly = [
  { name: 'Transaction_ID', type: 'dimension' },
  { name: 'Product_Category', type: 'dimension' },
  { name: 'Product_Name', type: 'dimension' },
  { name: 'Unit_Cost', type: 'measure' },
  { name: 'Gross_Profit', type: 'measure' }
];

const res2 = parseNaturalLanguageQuery('Operating profit grouped by Product Category', mockColumnsWithGrossProfitOnly);
console.log('  Parsed config (Gross_Profit fallback):', JSON.stringify(res2));
assert.strictEqual(res2.dimension, 'Product_Category', 'Should match Product_Category');
assert.strictEqual(res2.measure, 'Gross_Profit', 'Should fallback to available profit measure Gross_Profit');
console.log('  ✓ Correctly resolved to closest available profit metric (Gross_Profit)');

console.log('\n========================================');
console.log('--- 3. Testing Semantic Matching Across Variations ---');
console.log('========================================');

// Test lowercase with spaces vs underscores
const res3 = parseNaturalLanguageQuery('average unit cost by product name', mockColumnsWithOperatingProfit);
assert.strictEqual(res3.dimension, 'Product_Name');
assert.strictEqual(res3.measure, 'Unit_Cost');
assert.strictEqual(res3.aggregation, 'AVG');
console.log('  ✓ Recognized AVG aggregation and resolved "unit cost by product name"');

// Test multi-dimensional query: Region and Quarter
const mockMultiDim = [
  { name: 'Transaction_ID', type: 'dimension' },
  { name: 'Region', type: 'dimension' },
  { name: 'Quarter', type: 'dimension' },
  { name: 'Revenue', type: 'measure' }
];
const res4 = parseNaturalLanguageQuery('Revenue by Region and Quarter', mockMultiDim);
assert.strictEqual(res4.dimension, 'Region');
assert.strictEqual(res4.secondaryDimension, 'Quarter');
assert.strictEqual(res4.chartType, 'stackedBar');
console.log('  ✓ Detected primary dimension "Region", secondary dimension "Quarter", and stackedBar chart');

// Test ID column deprioritization when no dimension is mentioned in prompt
const res5 = parseNaturalLanguageQuery('Show Revenue', mockMultiDim);
assert.strictEqual(res5.dimension, 'Region', 'Should pick Region over Transaction_ID as default grouping');
console.log('  ✓ Deprioritized Transaction_ID and selected meaningful categorical dimension "Region"');

console.log('\n========================================');
console.log('ALL SMART QUERY PARSER TESTS PASSED (100%)');
console.log('========================================\n');
