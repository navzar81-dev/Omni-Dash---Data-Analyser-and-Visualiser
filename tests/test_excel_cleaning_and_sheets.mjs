import assert from 'node:assert';
import * as XLSX from 'xlsx';
import {
  sanitizeAndCleanValue,
  detectTrueHeaderAndData,
  cleanAndProfileDataset,
  parseWorkbookSheet,
  combineWorkbookSheets
} from '../src/services/fileParsers.js';

console.log('========================================');
console.log('--- 1. Testing Value Sanitization & Resilient Cleaning ---');
console.log('========================================\n');

// 1. Accounting Negatives
const audit1 = { cleanedNegativesCount: 0, sanitizedErrorsCount: 0 };
assert.strictEqual(sanitizeAndCleanValue('(1,234.56)', audit1), -1234.56, 'Parentheses accounting negative parsed');
assert.strictEqual(sanitizeAndCleanValue('($5,000.00)', audit1), -5000, 'Currency parentheses accounting negative parsed');
assert.strictEqual(sanitizeAndCleanValue('( 250 )', audit1), -250, 'Spaced parentheses accounting negative parsed');
assert.strictEqual(audit1.cleanedNegativesCount, 3, 'Recorded 3 cleaned negatives');
console.log('  ✓ Accounting negatives (e.g. ($1,234.56)) correctly normalized to negative numbers');

// 2. Excel Formula Errors
const audit2 = { sanitizedErrorsCount: 0 };
assert.strictEqual(sanitizeAndCleanValue('#REF!', audit2), null, '#REF! converted to null');
assert.strictEqual(sanitizeAndCleanValue('#DIV/0!', audit2), null, '#DIV/0! converted to null');
assert.strictEqual(sanitizeAndCleanValue('#N/A', audit2), null, '#N/A converted to null');
assert.strictEqual(sanitizeAndCleanValue('#VALUE!', audit2), null, '#VALUE! converted to null');
assert.strictEqual(sanitizeAndCleanValue('#NAME?', audit2), null, '#NAME? converted to null');
assert.strictEqual(audit2.sanitizedErrorsCount, 5, 'Recorded 5 sanitized errors');
console.log('  ✓ Excel formula errors (#REF!, #DIV/0!, #N/A, #VALUE!) converted cleanly to null');

// 3. Currency Symbols & Formatting
assert.strictEqual(sanitizeAndCleanValue('$12,450.75'), 12450.75, 'USD currency parsed');
assert.strictEqual(sanitizeAndCleanValue('€ 8,200.00'), 8200, 'EUR currency parsed');
assert.strictEqual(sanitizeAndCleanValue('18.5%'), 18.5, 'Percentage parsed');
assert.strictEqual(sanitizeAndCleanValue('North Region\u00A0'), 'North Region', 'Non-breaking space stripped');
console.log('  ✓ Currency symbols, percentages, and unicode whitespace stripped correctly');

console.log('\n========================================');
console.log('--- 2. Testing Smart Banner Header Detection ---');
console.log('========================================\n');

// Matrix with top title banners (rows 0 and 1) before the actual table header on row 2
const rawMatrixWithBanner = [
  ['ACME GLOBAL ENTERPRISE FINANCIAL REPORT', null, null, null],
  ['Confidential - For Board Members Only', null, null, null],
  ['Region', 'Revenue', 'Operating_Cost', 'Quarter'],
  ['North', '$10,000', '(2,500)', 'Q1'],
  ['South', '$14,500', '(3,200)', 'Q1'],
  ['East', '$12,000', '(1,800)', 'Q1'],
  ['West', '$16,000', '(4,000)', 'Q1'],
  ['Total / Summary', '$52,500', '(11,500)', null] // Summary footer row
];

const auditBanner = {};
const detected = detectTrueHeaderAndData(rawMatrixWithBanner, null, auditBanner);

assert.strictEqual(detected.bestHeaderIndex, 2, 'Accurately pinpointed row 2 as true header row');
assert.strictEqual(detected.detectedTitle, 'ACME GLOBAL ENTERPRISE FINANCIAL REPORT', 'Extracted top banner as report title');
assert.strictEqual(auditBanner.skippedBannerRows, 2, 'Logged 2 skipped banner rows');
assert.deepStrictEqual(detected.headers, ['Region', 'Revenue', 'Operating_Cost', 'Quarter'], 'Clean headers extracted');
assert.strictEqual(detected.dataRows.length, 4, 'Extracted 4 clean data rows (excluding footer total)');
assert.strictEqual(auditBanner.excludedSummaryRowsCount, 1, 'Excluded grand total footer row from data');
console.log('  ✓ Automatically skipped 2 title banner rows and aligned true table headers');
console.log('  ✓ Detected and isolated "Total / Summary" footer row to prevent double-counting');

console.log('\n========================================');
console.log('--- 3. Testing Multi-Worksheet Ingestion & Switching ---');
console.log('========================================\n');

// Create a mock multi-sheet Excel workbook using SheetJS
const wb = XLSX.utils.book_new();

const q1Data = [
  ['Quarter', 'Region', 'Revenue', 'Profit'],
  ['Q1', 'North', 10000, 2500],
  ['Q1', 'South', 15000, 3500]
];
const q1Sheet = XLSX.utils.aoa_to_sheet(q1Data);
XLSX.utils.book_append_sheet(wb, q1Sheet, 'Q1_Sales');

const q2Data = [
  ['Quarter', 'Region', 'Revenue', 'Profit'],
  ['Q2', 'North', 12000, 3000],
  ['Q2', 'South', 18000, 4200]
];
const q2Sheet = XLSX.utils.aoa_to_sheet(q2Data);
XLSX.utils.book_append_sheet(wb, q2Sheet, 'Q2_Sales');

const dimCustomers = [
  ['CustomerID', 'CustomerName', 'Segment'],
  ['C101', 'Alpha Corp', 'Enterprise'],
  ['C102', 'Beta LLC', 'Mid-Market']
];
const customersSheet = XLSX.utils.aoa_to_sheet(dimCustomers);
XLSX.utils.book_append_sheet(wb, customersSheet, 'Dim_Customers');

// 1. Verify workbook has 3 distinct sheets
assert.strictEqual(wb.SheetNames.length, 3, 'Workbook has 3 sheets');
assert.deepStrictEqual(wb.SheetNames, ['Q1_Sales', 'Q2_Sales', 'Dim_Customers'], 'All 3 sheet names recognized');
console.log('  ✓ Workbook successfully recognized all 3 worksheets: Q1_Sales, Q2_Sales, Dim_Customers');

// 2. Parse individual sheet 0
const q1Dataset = parseWorkbookSheet(wb, 'Q1_Sales', 'Sales_Model.xlsx');
assert.strictEqual(q1Dataset.name, 'Sales_Model (Q1_Sales)');
assert.strictEqual(q1Dataset.rowCount, 2);
assert.strictEqual(q1Dataset.columns.includes('Revenue'), true);
assert.deepStrictEqual(q1Dataset.availableSheets, ['Q1_Sales', 'Q2_Sales', 'Dim_Customers']);
console.log('  ✓ Loaded Q1_Sales individually (2 rows, 4 columns)');

// 3. Switch to sheet 2 (Dim_Customers)
const customerDataset = parseWorkbookSheet(wb, 'Dim_Customers', 'Sales_Model.xlsx');
assert.strictEqual(customerDataset.name, 'Sales_Model (Dim_Customers)');
assert.strictEqual(customerDataset.rowCount, 2);
assert.strictEqual(customerDataset.columns.includes('CustomerName'), true);
console.log('  ✓ Switched to Dim_Customers (2 rows, CustomerName column)');

// 4. Combine / Union compatible sheets (Q1_Sales + Q2_Sales)
const unionDataset = combineWorkbookSheets(wb, ['Q1_Sales', 'Q2_Sales'], 'Sales_Model.xlsx');
assert.strictEqual(unionDataset.rowCount, 4, 'Combined dataset has 4 rows (2 from Q1 + 2 from Q2)');
assert.strictEqual(unionDataset.columns.includes('_SheetName'), true, 'Added _SheetName provenance column');
assert.strictEqual(unionDataset.data[0]._SheetName, 'Q1_Sales');
assert.strictEqual(unionDataset.data[2]._SheetName, 'Q2_Sales');
console.log('  ✓ Unioned Q1_Sales and Q2_Sales into single dataset (4 total rows with _SheetName provenance)');

console.log('\n========================================');
console.log('ALL EXCEL MULTI-SHEET & CLEANING TESTS PASSED (10/10)');
console.log('========================================\n');
