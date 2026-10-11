import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';

/**
 * Captures an HTML DOM element as a high-resolution base64 PNG data URL
 */
export async function captureElementAsDataUrl(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return null;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: null
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Failed to capture element:', err);
    return null;
  }
}

/**
 * Downloads a single widget card as high-res PNG
 */
export async function exportWidgetToPng(elementId, fileName = 'Chart') {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#0a0e17'
  });

  const link = document.createElement('a');
  link.download = `${fileName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Exports all active dashboard widgets as a ZIP file of PNG images
 */
export async function exportAllWidgetsAsZip(widgets, datasetName = 'Dashboard') {
  if (!widgets || widgets.length === 0) return;

  const zip = new JSZip();
  const folder = zip.folder(`${datasetName.replace(/\s+/g, '_')}_Charts`);

  for (let i = 0; i < widgets.length; i++) {
    const w = widgets[i];
    const elementId = `widget-card-${w.id}`;
    const imgDataUrl = await captureElementAsDataUrl(elementId);
    if (imgDataUrl) {
      const base64Data = imgDataUrl.replace(/^data:image\/png;base64,/, '');
      const cleanTitle = (w.title || `Chart_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      folder.file(`${i + 1}_${cleanTitle}.png`, base64Data, { base64: true });
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${datasetName.replace(/\s+/g, '_')}_All_Charts.zip`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Exports data array to Excel (.xlsx)
 */
export function exportToExcel(data, fileName = 'Business_Report') {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Exports data array to CSV
 */
export function exportToCsv(data, fileName = 'Business_Report') {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Captures dashboard DOM element and exports as high-res PDF Executive Dossier
 */
export async function exportDashboardToPdf(elementId, reportTitle = 'Executive Business Report') {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#07090e'
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth - 20; // 10mm margins
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10;

  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Downloads dashboard screenshot as PNG
 */
export async function exportDashboardToPng(elementId, fileName = 'Dashboard_Snapshot') {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#07090e'
  });

  const link = document.createElement('a');
  link.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Generates and downloads a real PowerPoint (.pptx) Presentation deck from slides
 */
export async function exportPresentationToPptx(slides, capturedImagesMap = {}, meta = {}) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'OmniDash Business Intelligence';
  pptx.company = meta.company || 'Enterprise Analytics';
  pptx.title = meta.title || 'Executive Presentation Deck';

  const isDark = meta.theme !== 'light';
  const bgColor = isDark ? '0A0E1A' : 'F8FAFC';
  const textMainColor = isDark ? 'F8FAFC' : '0F172A';
  const textMutedColor = isDark ? '94A3B8' : '64748B';
  const accentColor = '6366F1';

  for (const slide of slides) {
    const s = pptx.addSlide();
    s.background = { color: bgColor };

    // Presenter speaker notes
    if (slide.speakerNotes) {
      s.notes = slide.speakerNotes;
    }

    if (slide.layout === 'title') {
      // Title Slide
      s.addText(slide.title || 'Executive Business Presentation', {
        x: 1.0,
        y: 2.2,
        w: 11.3,
        h: 1.2,
        fontSize: 36,
        bold: true,
        color: textMainColor,
        fontFace: 'Arial'
      });

      s.addText(slide.subtitle || 'Strategic Data Review & Growth Insights', {
        x: 1.0,
        y: 3.5,
        w: 11.3,
        h: 0.8,
        fontSize: 20,
        color: accentColor,
        fontFace: 'Arial'
      });

      s.addText(`Prepared for: ${meta.company || 'Executive Board'}  |  Date: ${new Date().toLocaleDateString()}`, {
        x: 1.0,
        y: 5.5,
        w: 11.3,
        h: 0.5,
        fontSize: 12,
        color: textMutedColor,
        fontFace: 'Arial'
      });
    } else {
      // Standard Content Slide Header
      s.addText(slide.title || 'Strategic Overview', {
        x: 0.8,
        y: 0.5,
        w: 11.5,
        h: 0.7,
        fontSize: 24,
        bold: true,
        color: textMainColor,
        fontFace: 'Arial'
      });

      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: 0.8,
          y: 1.15,
          w: 11.5,
          h: 0.4,
          fontSize: 13,
          color: textMutedColor,
          fontFace: 'Arial'
        });
      }

      // Slide Chart Visual
      const chartImg = capturedImagesMap[slide.widgetId];

      if (slide.layout === 'split-visual-insights' || slide.layout === 'full-chart' || slide.layout === 'dual-chart') {
        if (chartImg) {
          s.addImage({
            data: chartImg,
            x: 0.8,
            y: 1.7,
            w: slide.layout === 'full-chart' ? 11.5 : 6.4,
            h: 4.8
          });
        }

        // Key Takeaways & Bullets
        if (slide.layout === 'split-visual-insights' && slide.bullets && slide.bullets.length > 0) {
          const bulletItems = slide.bullets.map(b => ({
            text: b,
            options: {
              fontSize: 13,
              color: textMainColor,
              bullet: true,
              breakLine: true,
              paraSpaceAfter: 12
            }
          }));

          s.addText(bulletItems, {
            x: 7.5,
            y: 1.8,
            w: 4.8,
            h: 4.5,
            fontFace: 'Arial'
          });
        }
      } else if (slide.layout === 'kpi-spotlight') {
        // KPI metrics boxes
        if (slide.kpis && slide.kpis.length > 0) {
          slide.kpis.slice(0, 4).forEach((k, idx) => {
            const xPos = 0.8 + idx * 2.9;
            s.addShape(pptx.ShapeType.rect, {
              x: xPos,
              y: 2.0,
              w: 2.7,
              h: 2.2,
              fill: { color: isDark ? '131B2E' : 'FFFFFF' },
              line: { color: accentColor, width: 1 }
            });

            s.addText(k.label, {
              x: xPos + 0.2,
              y: 2.2,
              w: 2.3,
              h: 0.4,
              fontSize: 11,
              color: textMutedColor,
              bold: true
            });

            s.addText(String(k.value), {
              x: xPos + 0.2,
              y: 2.7,
              w: 2.3,
              h: 0.7,
              fontSize: 22,
              color: textMainColor,
              bold: true
            });

            s.addText(k.delta || '', {
              x: xPos + 0.2,
              y: 3.5,
              w: 2.3,
              h: 0.4,
              fontSize: 11,
              color: '10B981',
              bold: true
            });
          });
        }

        // Summary paragraphs
        if (slide.bullets && slide.bullets.length > 0) {
          const bulletItems = slide.bullets.map(b => ({
            text: b,
            options: { fontSize: 13, color: textMainColor, bullet: true, breakLine: true, paraSpaceAfter: 8 }
          }));

          s.addText(bulletItems, {
            x: 0.8,
            y: 4.6,
            w: 11.5,
            h: 2.2,
            fontFace: 'Arial'
          });
        }
      } else if (slide.layout === 'conclusions') {
        // Strategic recommendations
        if (slide.bullets && slide.bullets.length > 0) {
          const bulletItems = slide.bullets.map(b => ({
            text: b,
            options: { fontSize: 14, color: textMainColor, bullet: true, breakLine: true, paraSpaceAfter: 16 }
          }));

          s.addText(bulletItems, {
            x: 1.0,
            y: 2.0,
            w: 11.0,
            h: 4.8,
            fontFace: 'Arial'
          });
        }
      }
    }
  }

  const fileName = `${(meta.title || 'Executive_Presentation').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pptx`;
  await pptx.writeFile({ fileName });
}

/**
 * Exports slides to a 16:9 PDF presentation deck
 */
export async function exportPresentationToPdf(slideElementIds, presentationTitle = 'Presentation_Deck') {
  if (!slideElementIds || slideElementIds.length === 0) return;

  const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape 16:9 approximate
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < slideElementIds.length; i++) {
    const elId = slideElementIds[i];
    const element = document.getElementById(elId);
    if (element) {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0a0e17'
      });

      const imgData = canvas.toDataURL('image/png');
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
    }
  }

  pdf.save(`${presentationTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
