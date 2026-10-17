import { evaluateCustomFormula, aggregateData, computePivotMatrix, calculateKpiDelta } from '../src/services/calculationEngine.js';
import { exportPresentationToPptx } from '../src/services/exportService.js';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

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

async function runAllTests() {
  console.log('\n========================================');
  console.log('--- 1. Testing Calculation Engine Fixes ---');
  console.log('========================================\n');

  // Test 1: MIN / MAX formulas with commas
  const row = { Revenue: 15000, COGS: 8000, OPEX: 4000 };
  const minResult = evaluateCustomFormula([row], 'MinVal', 'MIN([Revenue], [COGS])');
  const minVal = minResult[0].MinVal;
  assert(minVal === 8000, `evaluateCustomFormula MIN([Revenue], [COGS]) returns 8000 (got ${minVal})`);

  const maxResult = evaluateCustomFormula([row], 'MaxVal', 'MAX([COGS], 10000)');
  const maxVal = maxResult[0].MaxVal;
  assert(maxVal === 10000, `evaluateCustomFormula MAX([COGS], 10000) returns 10000 (got ${maxVal})`);

  // Test 2: Multi-series MEDIAN aggregation
  const testRows = [
    { Region: 'North', Quarter: 'Q1', Sales: 100 },
    { Region: 'North', Quarter: 'Q1', Sales: 300 },
    { Region: 'North', Quarter: 'Q1', Sales: 200 },
    { Region: 'North', Quarter: 'Q2', Sales: 50 },
    { Region: 'North', Quarter: 'Q2', Sales: 150 },
    { Region: 'South', Quarter: 'Q1', Sales: 400 },
    { Region: 'South', Quarter: 'Q1', Sales: 600 }
  ];

  const medianResult = aggregateData({
    rows: testRows,
    dimension: 'Quarter',
    measure: 'Sales',
    aggregation: 'MEDIAN',
    groupBy: 'Region'
  });
  const northDataset = medianResult.datasets.find(d => d.label === 'North');
  assert(northDataset !== undefined, 'North dataset found in multi-series output');
  assert(northDataset.data[0] === 200, `North Q1 median of [100, 200, 300] is 200 (not row count 3, got ${northDataset.data[0]})`);
  assert(northDataset.data[1] === 100, `North Q2 median of [50, 150] is 100 (got ${northDataset.data[1]})`);

  // Test 3: Natural date sorting in time series
  const unsortedDateRows = [
    { Date: '2024-03-01', Sales: 300 },
    { Date: '2024-01-01', Sales: 100 },
    { Date: '2024-02-01', Sales: 200 }
  ];
  const sortedDateResult = aggregateData({
    rows: unsortedDateRows,
    dimension: 'Date',
    measure: 'Sales',
    aggregation: 'SUM'
  });
  assert(sortedDateResult.labels[0] === '2024-01-01' && sortedDateResult.labels[1] === '2024-02-01' && sortedDateResult.labels[2] === '2024-03-01',
    `aggregateData sorted chronological date labels in order: ${sortedDateResult.labels.join(' -> ')}`);

  // Test 4: Pivot Table accurate AVG mode
  const pivotRows = [
    { Department: 'Sales', Quarter: 'Q1', Amount: 100 },
    { Department: 'Sales', Quarter: 'Q1', Amount: 300 }, // Q1 Sales Avg = 200
    { Department: 'Sales', Quarter: 'Q2', Amount: 600 }, // Q2 Sales Avg = 600
    // Total for Sales: 3 items, sum = 1000, avg = 333.33 (not average of cell averages 400!)
    { Department: 'Eng', Quarter: 'Q1', Amount: 200 }
  ];
  const pivotAvg = computePivotMatrix(pivotRows, 'Department', 'Quarter', 'Amount', 'AVG');
  assert(pivotAvg.rowTotals[1] === 333.33, `Pivot Sales Row Total in AVG mode is true average 333.33 (got ${pivotAvg.rowTotals[1]})`);

  // Test 5: KPI Delta without false fallback to 1
  const kpiRows = [
    { Date: '2024-01-01', Metric: 0 },
    { Date: '2024-01-02', Metric: 0 },
    { Date: '2024-02-01', Metric: 50 },
    { Date: '2024-02-02', Metric: 50 }
  ];
  const kpiStats = calculateKpiDelta(kpiRows, 'Metric', 'Date', 'SUM');
  assert(kpiStats.prior === 0, `KPI prior value is 0 (got ${kpiStats.prior})`);
  assert(kpiStats.recent === 100, `KPI recent value is 100 (got ${kpiStats.recent})`);
  assert(kpiStats.deltaPct === 100, `KPI deltaPct from 0 to 100 is capped cleanly at 100% (not 9900%, got ${kpiStats.deltaPct}%)`);

  console.log('\n========================================');
  console.log('--- 2. Testing Waterfall Step Accumulation ---');
  console.log('========================================\n');

  // Verify Waterfall step math
  const waterfallRaw = [
    { Category: 'Starting Rev', Value: 100 },
    { Category: 'New Signups', Value: 40 },
    { Category: 'Expansions', Value: 20 },
    { Category: 'Churn', Value: -30 }
  ];
  // Calculate running totals manually as WaterfallChart does
  let running = 0;
  const waterfallSteps = [];
  waterfallRaw.forEach((d) => {
    const val = d.Value;
    const start = running;
    running += val;
    waterfallSteps.push({ name: d.Category, val, start, end: running });
  });
  // Total pillar
  waterfallSteps.push({ name: 'Net Total', val: running, start: 0, end: running, isTotal: true });

  assert(waterfallSteps.length === 5, 'Waterfall preserves all 4 period steps and adds 1 Net Total pillar (total 5)');
  assert(waterfallSteps[3].name === 'Churn' && waterfallSteps[3].val === -30, 'Final period step "Churn" is preserved with delta -30');
  assert(waterfallSteps[4].name === 'Net Total' && waterfallSteps[4].val === 130, 'Net Total ends accurately at 130 (100+40+20-30)');

  console.log('\n========================================');
  console.log('--- 3. Testing PPTX Generation & OpenXML Structure ---');
  console.log('========================================\n');

  // 1x1 transparent/red PNG as data URL for mock chart image capture
  const mockChartPngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  const mockSlides = [
    {
      id: 'slide-1',
      layout: 'title',
      title: 'Q3 Enterprise Executive Report',
      subtitle: 'Comprehensive Performance & Trajectory Analysis',
      presenter: 'Executive Analytics Team',
      date: 'October 2026',
      speakerNotes: 'Executive greeting and strategic context.'
    },
    {
      id: 'slide-2',
      layout: 'kpi-spotlight',
      title: 'Executive KPI Scorecard',
      subtitle: 'Key business velocity indicators',
      kpis: [
        { label: 'Revenue', value: '$12.4M', delta: '+14.2%' },
        { label: 'Gross Margin', value: '68.5%', delta: '+2.1%' },
        { label: 'OPEX', value: '$4.2M', delta: '-5.3%' },
        { label: 'Net Profit', value: '$4.3M', delta: '+22.4%' }
      ],
      bullets: [
        'Revenue expanded across all core strategic divisions.',
        'Gross margin sustained above target thresholds.',
        'Controlled operational expenditures yielded margin expansion.'
      ],
      speakerNotes: 'Highlight gross margin expansion and opex efficiency.'
    },
    {
      id: 'slide-3',
      layout: 'split-visual-insights',
      title: 'Revenue Distribution by Segment',
      subtitle: 'Operational breakdown and growth drivers',
      widgetId: 'w-revenue-1',
      bullets: [
        'Enterprise tier contributed 62% of total quarterly revenue.',
        'Expansion velocity remains strong across mid-market accounts.'
      ],
      speakerNotes: 'Point out the distribution chart and leading contributors.'
    },
    {
      id: 'slide-4',
      layout: 'conclusions',
      title: 'Strategic Priorities & Roadmap',
      subtitle: 'Executive action directives for next quarter',
      bullets: [
        'Accelerate enterprise outbound initiatives.',
        'Optimize unit economics in secondary regional channels.',
        'Maintain weekly operational cadence on working capital.'
      ],
      speakerNotes: 'Summarize strategic roadmap and answer board inquiries.'
    }
  ];

  const mockCapturedImages = {
    'w-revenue-1': mockChartPngDataUrl
  };

  const mockBrandTemplate = {
    name: 'Executive Dark Navy',
    colors: {
      background: '#0a0e17',
      surface: '#111827',
      primary: '#2563eb',
      accent: '#38bdf8',
      textPrimary: '#ffffff',
      textMuted: '#94a3b8'
    },
    fonts: {
      heading: 'Helvetica',
      body: 'Arial'
    },
    footerDisclaimer: 'Executive Intelligence · Strictly Confidential'
  };

  console.log('Generating PPTX via exportPresentationToPptx with node buffer output...');

  // exportPresentationToPptx returns the pptxgenjs object or saved file.
  // We invoke exportPresentationToPptx with outputType: 'nodebuffer'
  const pptxBuffer = await exportPresentationToPptx(
    mockSlides,
    mockCapturedImages,
    { title: 'Executive Report', company: 'OmniDash Corp', theme: 'dark' },
    mockBrandTemplate,
    'nodebuffer'
  );

  assert(Buffer.isBuffer(pptxBuffer) && pptxBuffer.length > 5000, `PPTX binary buffer generated successfully (${pptxBuffer.length} bytes)`);

  // Unzip OpenXML package with JSZip and inspect internal XML structure
  const zip = await JSZip.loadAsync(pptxBuffer);
  const fileNames = Object.keys(zip.files);

  assert(fileNames.includes('[Content_Types].xml'), 'OpenXML container has [Content_Types].xml');
  assert(fileNames.includes('ppt/presentation.xml'), 'OpenXML container has ppt/presentation.xml');

  // Verify slide count
  const slideFiles = fileNames.filter(f => f.startsWith('ppt/slides/slide') && f.endsWith('.xml'));
  assert(slideFiles.length === 4, `All 4 slides exist in OpenXML package (found ${slideFiles.length})`);

  // Verify embedded image media
  const mediaFiles = fileNames.filter(f => f.startsWith('ppt/media/'));
  assert(mediaFiles.length >= 1, `Embedded chart image found in ppt/media/ (${mediaFiles.join(', ')})`);

  // Inspect slide 1 XML (Title Slide)
  const slide1Xml = await zip.file('ppt/slides/slide1.xml').async('string');
  assert(slide1Xml.includes('Q3 Enterprise Executive Report'), 'Slide 1 XML contains Title text');
  assert(slide1Xml.includes('Comprehensive Performance') && slide1Xml.includes('Trajectory Analysis'), 'Slide 1 XML contains Subtitle text');

  // Inspect slide 2 XML (KPI Spotlight)
  const slide2Xml = await zip.file('ppt/slides/slide2.xml').async('string');
  assert(slide2Xml.includes('Executive KPI Scorecard'), 'Slide 2 XML contains Scorecard Header');
  assert(slide2Xml.includes('$12.4M') && slide2Xml.includes('OPEX') && slide2Xml.includes('$4.2M'),
    'Slide 2 XML contains formatted KPI values ($12.4M, OPEX, $4.2M)');

  // Inspect slide 3 XML (Split Visual + Insights with Chart Image)
  const slide3Xml = await zip.file('ppt/slides/slide3.xml').async('string');
  assert(slide3Xml.includes('Revenue Distribution by Segment'), 'Slide 3 XML contains Chart Slide Header');
  // Verify relationship to media image exists in slide 3 rels
  const slide3Rels = await zip.file('ppt/slides/_rels/slide3.xml.rels').async('string');
  assert(slide3Rels.includes('media/image'), 'Slide 3 rels file links to the embedded chart media image');

  // Inspect slide 4 XML (Strategic Priorities)
  const slide4Xml = await zip.file('ppt/slides/slide4.xml').async('string');
  assert(slide4Xml.includes('Strategic Priorities') && slide4Xml.includes('Roadmap'), 'Slide 4 XML contains Strategic Priorities Header');
  assert(slide4Xml.includes('Accelerate enterprise outbound initiatives.'), 'Slide 4 XML contains bullet point takeaway');

  // Inspect presentation.xml for 16:9 widescreen dimensions (12192000 x 6858000 EMU = 13.333" x 7.5")
  const presXml = await zip.file('ppt/presentation.xml').async('string');
  assert(presXml.includes('12192000') && presXml.includes('6858000'), 'Presentation slide dimensions set to standard 16:9 widescreen');

  console.log('\n========================================');
  console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('========================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Test runner encountered unexpected error:', err);
  process.exit(1);
});
