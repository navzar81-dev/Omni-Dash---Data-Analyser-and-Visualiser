import { buildWorkspacePackage, parseWorkspacePackage } from '../src/services/driveSyncService.js';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

async function runDriveSyncTests() {
  console.log('\n========================================');
  console.log('--- 4. Testing Drive Sync & .omnidash Package Serialization ---');
  console.log('========================================\n');

  const mockState = {
    datasetMeta: { id: 'sales-2024', name: 'Global Sales 2024' },
    rawData: [
      { Region: 'EMEA', Revenue: 50000, Profit: 12000, Date: '2024-01-15' },
      { Region: 'APAC', Revenue: 75000, Profit: 24000, Date: '2024-01-20' }
    ],
    columns: ['Region', 'Revenue', 'Profit', 'Date'],
    columnProfiles: {
      Region: { type: 'dimension', uniqueCount: 2 },
      Revenue: { type: 'measure', min: 50000, max: 75000 }
    },
    dateColumn: 'Date',
    kpiCards: [
      { id: 'k1', column: 'Revenue', label: 'Total Revenue', aggregation: 'SUM', format: 'currency' }
    ],
    widgets: [
      { id: 'w1', title: 'Revenue by Region', chartType: 'bar', dimension: 'Region', measure: 'Revenue' }
    ],
    branding: { title: 'Acme Corp BI', accentColor: '#6366f1' },
    compoundRules: [
      { column: 'Revenue', operator: 'GREATER_THAN', value: '40000' }
    ],
    compoundLogicOperator: 'AND',
    searchTerm: 'EMEA',
    activeFilters: { Region: 'EMEA' }
  };

  // 1. Serialization
  const pkg = buildWorkspacePackage(mockState);
  assert(pkg.format === 'omnidash_workspace', 'Package has correct format header "omnidash_workspace"');
  assert(pkg.version === '2.0.0', 'Package format version is 2.0.0');
  assert(pkg.datasetMeta.name === 'Global Sales 2024', 'Dataset metadata preserved in package');
  assert(pkg.rawData.length === 2, 'Raw dataset rows preserved in package');
  assert(pkg.kpiCards.length === 1 && pkg.kpiCards[0].column === 'Revenue', 'KPI cards preserved');
  assert(pkg.widgets.length === 1 && pkg.widgets[0].title === 'Revenue by Region', 'Custom widgets preserved');
  assert(pkg.branding.accentColor === '#6366f1', 'Brand styling and accents preserved');
  assert(pkg.compoundRules.length === 1, 'Compound logic rules preserved');

  // 2. Round-trip string serialization & parsing
  const jsonStr = JSON.stringify(pkg);
  const parsed = parseWorkspacePackage(jsonStr);
  assert(parsed.format === 'omnidash_workspace', 'Parsed JSON string has valid format header');
  assert(parsed.rawData.length === 2, 'Parsed package restored all raw data rows');
  assert(parsed.branding.title === 'Acme Corp BI', 'Parsed package restored branding title');

  // 3. Backward compatibility with legacy view layout JSON
  const legacyView = {
    widgets: [{ id: 'leg-1', title: 'Old Widget' }],
    kpiCards: [{ id: 'leg-k', column: 'Sales' }]
  };
  const parsedLegacy = parseWorkspacePackage(JSON.stringify(legacyView));
  assert(parsedLegacy.isLegacyView === true, 'Gracefully recognized legacy view JSON export');
  assert(parsedLegacy.widgets[0].title === 'Old Widget', 'Legacy widgets restored correctly');

  // 4. Reject corrupt data
  let threwError = false;
  try {
    parseWorkspacePackage('{ corrupt json ...');
  } catch (err) {
    threwError = true;
  }
  assert(threwError, 'Correctly throws exception on corrupt/malformed JSON string');

  console.log(`\n========================================`);
  console.log(`DRIVE SYNC TESTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log(`========================================\n`);

  if (failCount > 0) process.exit(1);
}

runDriveSyncTests();
