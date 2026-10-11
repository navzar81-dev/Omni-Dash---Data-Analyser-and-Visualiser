import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker if available in browser
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
}

/**
 * Normalizes an array of raw objects/rows into a clean tabular dataset
 */
export function cleanAndProfileDataset(rows, datasetName = 'Imported Dataset') {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('No valid tabular data rows found.');
  }

  // 1. Filter out completely empty objects and extract all unique headers iteratively
  const filtered = [];
  const columnSet = new Set();
  const totalRawRows = rows.length;

  for (let i = 0; i < totalRawRows; i++) {
    const r = rows[i];
    if (!r || typeof r !== 'object') continue;

    let hasNonEmpty = false;
    const keys = Object.keys(r);
    const keyCount = keys.length;

    for (let k = 0; k < keyCount; k++) {
      const key = keys[k];
      const val = r[key];
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        hasNonEmpty = true;
      }
      const cleanKey = String(key).trim();
      if (cleanKey && !cleanKey.startsWith('__EMPTY')) {
        columnSet.add(cleanKey);
      }
    }

    if (hasNonEmpty) {
      filtered.push(r);
    }
  }

  if (filtered.length === 0) {
    throw new Error('Dataset contains only empty rows.');
  }

  const columns = Array.from(columnSet);
  if (columns.length === 0) {
    throw new Error('Could not identify any valid column headers.');
  }

  const numCols = columns.length;
  const numRows = filtered.length;

  // 2. Initialize column statistic accumulators for a single-pass profiling
  const colStats = new Array(numCols);
  for (let c = 0; c < numCols; c++) {
    colStats[c] = {
      name: columns[c],
      numericCount: 0,
      totalNonEmpty: 0,
      sampleValues: [],
      distinctValues: new Set()
    };
  }

  // 3. Iteratively normalize rows and profile columns in a single pass
  const normalizedData = new Array(numRows);

  for (let i = 0; i < numRows; i++) {
    const row = filtered[i];
    const cleanRow = {};

    for (let c = 0; c < numCols; c++) {
      const col = columns[c];
      const val = row[col];
      let cleanVal = null;

      if (val === undefined || val === null || val === '') {
        cleanVal = null;
      } else if (typeof val === 'number') {
        cleanVal = val;
      } else {
        const strVal = String(val).trim();
        // Check if string is a number (handling currency symbols, percentages, commas)
        const numericCandidate = strVal.replace(/[$,€£%]/g, '').replace(/,/g, '');
        if (numericCandidate !== '' && !isNaN(Number(numericCandidate))) {
          cleanVal = Number(numericCandidate);
        } else {
          cleanVal = strVal;
        }
      }

      cleanRow[col] = cleanVal;

      // Update column profile stats iteratively
      if (cleanVal !== null) {
        const stats = colStats[c];
        stats.totalNonEmpty++;
        if (typeof cleanVal === 'number' && !isNaN(cleanVal)) {
          stats.numericCount++;
        }
        if (stats.sampleValues.length < 5) {
          stats.sampleValues.push(cleanVal);
        }
        // Bound distinct tracking at 5000 to prevent high memory consumption on large ID columns
        if (stats.distinctValues.size < 5000) {
          stats.distinctValues.add(cleanVal);
        }
      }
    }

    normalizedData[i] = cleanRow;
  }

  // 4. Construct final column profiles
  const columnProfiles = new Array(numCols);
  for (let c = 0; c < numCols; c++) {
    const stats = colStats[c];
    const isNumeric = stats.totalNonEmpty > 0 && (stats.numericCount / stats.totalNonEmpty) >= 0.7;

    let isDate = false;
    if (!isNumeric && stats.sampleValues.length > 0) {
      const sample = String(stats.sampleValues[0]);
      isDate = !isNaN(Date.parse(sample)) && (sample.includes('-') || sample.includes('/') || sample.includes('202'));
    }

    columnProfiles[c] = {
      name: stats.name,
      type: isNumeric ? 'measure' : (isDate ? 'date' : 'dimension'),
      sampleValues: stats.sampleValues,
      distinctCount: stats.distinctValues.size,
      missingCount: numRows - stats.totalNonEmpty,
      isNumeric
    };
  }

  return {
    name: datasetName,
    columns,
    columnProfiles,
    data: normalizedData,
    rowCount: numRows,
    dateColumn: columnProfiles.find(c => c.type === 'date')?.name || columns[0]
  };
}

/**
 * Parse CSV, TSV, or TXT
 */
export async function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      transformHeader: h => String(h || '').trim(),
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            reject(new Error('CSV file has no data.'));
            return;
          }
          const clean = cleanAndProfileDataset(results.data, file.name.replace(/\.[^/.]+$/, ''));
          resolve(clean);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(new Error(`Failed to parse CSV: ${err.message}`))
    });
  });
}

/**
 * Parse Excel (.xlsx, .xls)
 */
export async function parseExcelFile(file, sheetIndex = 0) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Excel workbook contains no sheets.');
  }

  const sheetName = workbook.SheetNames[sheetIndex] || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert worksheet to JSON array of objects
  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    defval: null,
    raw: false,
    dateNF: 'yyyy-mm-dd'
  });

  const dataset = cleanAndProfileDataset(rawRows, `${file.name.replace(/\.[^/.]+$/, '')} (${sheetName})`);
  dataset.availableSheets = workbook.SheetNames;
  dataset.selectedSheet = sheetName;
  return dataset;
}

/**
 * Parse Word Document (.docx) - extracts embedded tables
 */
export async function parseDocxFile(file) {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  
  const documentXmlFile = zip.file('word/document.xml');
  if (!documentXmlFile) {
    throw new Error('Not a valid DOCX file: word/document.xml missing.');
  }

  const documentXml = await documentXmlFile.async('string');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(documentXml, 'text/xml');

  // Look for <w:tbl> elements
  const tables = xmlDoc.getElementsByTagName('w:tbl');
  if (!tables || tables.length === 0) {
    // If no tables, parse paragraphs with delimited text (e.g. colon or commas)
    return parseDocxParagraphsFallback(xmlDoc, file.name);
  }

  // Extract the largest table or first table
  let bestRows = [];
  for (let i = 0; i < tables.length; i++) {
    const tbl = tables[i];
    const rows = [];
    const trList = tbl.getElementsByTagName('w:tr');
    
    for (let r = 0; r < trList.length; r++) {
      const row = [];
      const tcList = trList[r].getElementsByTagName('w:tc');
      for (let c = 0; c < tcList.length; c++) {
        // Collect all text inside this cell
        const texts = [];
        const tList = tcList[c].getElementsByTagName('w:t');
        for (let t = 0; t < tList.length; t++) {
          texts.push(tList[t].textContent);
        }
        row.push(texts.join(' ').trim());
      }
      if (row.some(cell => cell.length > 0)) {
        rows.push(row);
      }
    }

    if (rows.length > bestRows.length) {
      bestRows = rows;
    }
  }

  if (bestRows.length < 2) {
    throw new Error('Found table in Word document, but it has fewer than 2 rows (header + data).');
  }

  const headers = bestRows[0].map((h, idx) => h || `Column_${idx + 1}`);
  const dataRows = [];

  for (let i = 1; i < bestRows.length; i++) {
    const r = bestRows[i];
    const obj = {};
    headers.forEach((h, colIdx) => {
      obj[h] = r[colIdx] || null;
    });
    dataRows.push(obj);
  }

  return cleanAndProfileDataset(dataRows, file.name.replace(/\.[^/.]+$/, ''));
}

function parseDocxParagraphsFallback(xmlDoc, fileName) {
  const pList = xmlDoc.getElementsByTagName('w:p');
  const lines = [];
  for (let i = 0; i < pList.length; i++) {
    const tList = pList[i].getElementsByTagName('w:t');
    const text = Array.from(tList).map(t => t.textContent).join('').trim();
    if (text) lines.push(text);
  }

  // Try parsing lines as CSV/TSV
  const parsed = Papa.parse(lines.join('\n'), { header: true, dynamicTyping: true });
  if (parsed.data && parsed.data.length > 1) {
    return cleanAndProfileDataset(parsed.data, fileName.replace(/\.[^/.]+$/, ''));
  }

  throw new Error('Word document does not contain readable tables or structured data.');
}

/**
 * Parse PowerPoint (.pptx) - extracts tables and structured metrics from slides
 */
export async function parsePptxFile(file) {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  
  // Find all slide XML files
  const slideFiles = Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name));
  if (slideFiles.length === 0) {
    throw new Error('Not a valid PPTX presentation or no slides found.');
  }

  const parser = new DOMParser();
  let extractedTableRows = [];

  for (const slidePath of slideFiles) {
    const slideXml = await zip.file(slidePath).async('string');
    const doc = parser.parseFromString(slideXml, 'text/xml');
    
    // Look for <a:tbl> in DrawingML
    const tables = doc.getElementsByTagName('a:tbl');
    for (let t = 0; t < tables.length; t++) {
      const tbl = tables[t];
      const trList = tbl.getElementsByTagName('a:tr');
      const tableRows = [];
      
      for (let r = 0; r < trList.length; r++) {
        const row = [];
        const tcList = trList[r].getElementsByTagName('a:tc');
        for (let c = 0; c < tcList.length; c++) {
          const tList = tcList[c].getElementsByTagName('a:t');
          const cellText = Array.from(tList).map(node => node.textContent).join(' ').trim();
          row.push(cellText);
        }
        if (row.some(Boolean)) tableRows.push(row);
      }

      if (tableRows.length > extractedTableRows.length) {
        extractedTableRows = tableRows;
      }
    }
  }

  if (extractedTableRows.length < 2) {
    throw new Error('PowerPoint presentation did not contain structured table objects.');
  }

  const headers = extractedTableRows[0].map((h, i) => h || `Col_${i + 1}`);
  const dataRows = [];

  for (let i = 1; i < extractedTableRows.length; i++) {
    const r = extractedTableRows[i];
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = r[idx] || null;
    });
    dataRows.push(rowObj);
  }

  return cleanAndProfileDataset(dataRows, file.name.replace(/\.[^/.]+$/, ''));
}

/**
 * Parse PDF (.pdf) - extracts text lines and reconstructs tabular records
 */
export async function parsePdfFile(file) {
  const buffer = await file.arrayBuffer();
  let pdf;
  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    pdf = await loadingTask.promise;
  } catch (e) {
    throw new Error(`Unable to load PDF document: ${e.message}`);
  }

  const numPages = pdf.numPages;
  const allLines = [];

  for (let pageNum = 1; pageNum <= Math.min(numPages, 15); pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Group text items by their vertical Y coordinate
    const lineMap = new Map();
    textContent.items.forEach(item => {
      // transform[5] is Y coordinate
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) {
        lineMap.set(y, []);
      }
      lineMap.get(y).push({ x: item.transform[4], str: item.str });
    });

    // Sort descending by Y (top of page first)
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
    sortedY.forEach(y => {
      const items = lineMap.get(y).sort((a, b) => a.x - b.x);
      // Construct line string, inserting comma/tab when space between items is significant
      const segments = [];
      items.forEach(it => {
        if (it.str.trim()) segments.push(it.str.trim());
      });
      if (segments.length > 1) {
        allLines.push(segments.join(','));
      }
    });
  }

  if (allLines.length < 2) {
    throw new Error('Could not identify tabular data or records in this PDF.');
  }

  // Parse candidate lines with PapaParse
  const parsed = Papa.parse(allLines.join('\n'), {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  });

  if (!parsed.data || parsed.data.length === 0) {
    throw new Error('Could not convert PDF content to structured dataset.');
  }

  return cleanAndProfileDataset(parsed.data, file.name.replace(/\.[^/.]+$/, ''));
}

/**
 * Main dispatcher to parse any supported business file
 */
export async function parseUploadedFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  switch (ext) {
    case 'csv':
    case 'tsv':
    case 'txt':
      return await parseCsvFile(file);
    case 'xlsx':
    case 'xls':
      return await parseExcelFile(file);
    case 'docx':
      return await parseDocxFile(file);
    case 'pptx':
      return await parsePptxFile(file);
    case 'pdf':
      return await parsePdfFile(file);
    default:
      // Try CSV parser as fallback for generic text
      try {
        return await parseCsvFile(file);
      } catch (err) {
        throw new Error(`Unsupported file extension: .${ext}. Please upload Excel (.xlsx, .xls), CSV, Word (.docx), PowerPoint (.pptx), or PDF.`);
      }
  }
}
