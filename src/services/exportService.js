import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';

function isColorDarkHex(hex) {
  if (!hex) return false;
  const clean = String(hex).replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 140;
}

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
  if (!widgets || widgets.length === 0) return false;

  const zip = new JSZip();
  const folder = zip.folder(`${datasetName.replace(/\s+/g, '_')}_Charts`);
  let capturedCount = 0;

  for (let i = 0; i < widgets.length; i++) {
    const w = widgets[i];
    const elementId = `widget-card-${w.id}`;
    const imgDataUrl = await captureElementAsDataUrl(elementId);
    if (imgDataUrl) {
      const base64Data = imgDataUrl.replace(/^data:image\/png;base64,/, '');
      const cleanTitle = (w.title || `Chart_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      folder.file(`${i + 1}_${cleanTitle}.png`, base64Data, { base64: true });
      capturedCount++;
    }
  }

  if (capturedCount === 0) {
    alert('No chart elements could be captured. Please ensure the dashboard tab is active and visible.');
    return false;
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${datasetName.replace(/\s+/g, '_')}_All_Charts.zip`;
  link.click();
  URL.revokeObjectURL(link.href);
  return true;
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
export async function exportPresentationToPptx(slides, capturedImagesMap = {}, meta = {}, brandTemplate = null, outputType = null) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // Standard modern 16:9 widescreen (13.333" x 7.5")
  pptx.author = 'OmniDash Business Intelligence';
  pptx.company = meta.company || (brandTemplate?.name ? `${brandTemplate.name} Intelligence` : 'Enterprise Analytics');
  pptx.title = meta.title || 'Executive Presentation Deck';

  // Resolve colors & fonts from Brand Template or fallback
  const isDark = brandTemplate ? isColorDarkHex(brandTemplate.colors?.background) : meta.theme !== 'light';
  const cleanHex = (h, fallback) => (h ? String(h).replace('#', '').trim() : fallback);

  const bgColor = cleanHex(brandTemplate?.colors?.background, isDark ? '0A0E1A' : 'FFFFFF');
  const surfaceColor = cleanHex(brandTemplate?.colors?.surface, isDark ? '131B2E' : 'F8FAFC');
  const textMainColor = cleanHex(brandTemplate?.colors?.textPrimary, isDark ? 'F8FAFC' : '0F172A');
  const textMutedColor = cleanHex(brandTemplate?.colors?.textMuted, isDark ? '94A3B8' : '64748B');
  const primaryColor = cleanHex(brandTemplate?.colors?.primary, '2563EB');
  const accentColor = cleanHex(brandTemplate?.colors?.accent, '38BDF8');
  const cardBorderColor = isDark ? '2A374A' : 'E2E8F0';
  const badgeBgColor = isDark ? '1E293B' : 'EFF6FF';
  const dividerColor = isDark ? '1E293B' : 'E2E8F0';

  const fontHeading = brandTemplate?.fonts?.heading || 'Arial';
  const fontBody = brandTemplate?.fonts?.body || 'Calibri';
  const logoData = brandTemplate?.logoUrl || null;
  const footerDisclaimer = brandTemplate?.footerDisclaimer || 'Internal Use Only — Strategic Performance Analysis';
  const showAccentStripe = brandTemplate?.showAccentStripe !== false;

  for (let idx = 0; idx < slides.length; idx++) {
    const slide = slides[idx];
    const s = pptx.addSlide();
    s.background = { color: bgColor };

    // Presenter speaker notes
    if (slide.speakerNotes) {
      s.notes = slide.speakerNotes;
    }

    // Top Master Accent Stripe
    if (showAccentStripe) {
      s.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 13.333,
        h: 0.08,
        fill: { color: primaryColor },
        line: { color: primaryColor }
      });
    }

    // Top-Right Brand Logo
    if (logoData) {
      try {
        s.addImage({
          data: logoData,
          x: 10.8,
          y: 0.3,
          w: 1.8,
          h: 0.55,
          sizing: { type: 'contain', w: 1.8, h: 0.55 }
        });
      } catch (err) {
        console.warn('[ExportService] Could not add logo to slide:', err);
      }
    }

    // Master Footer Divider Line
    s.addShape(pptx.ShapeType.line, {
      x: 0.8,
      y: 6.80,
      w: 11.73,
      h: 0,
      line: { color: dividerColor, width: 0.75 }
    });

    // Master Footer (Confidentiality & Slide Pagination)
    s.addText(footerDisclaimer, {
      x: 0.8,
      y: 6.92,
      w: 8.5,
      h: 0.35,
      fontSize: 9,
      color: textMutedColor,
      fontFace: fontBody
    });

    s.addText(`Slide ${idx + 1} of ${slides.length}`, {
      x: 9.8,
      y: 6.92,
      w: 2.73,
      h: 0.35,
      fontSize: 9,
      color: textMutedColor,
      align: 'right',
      fontFace: fontBody
    });

    if (slide.layout === 'title') {
      // Title Slide
      s.addText(slide.title || 'Executive Business Presentation', {
        x: 1.0,
        y: 2.1,
        w: 11.3,
        h: 1.2,
        fontSize: 36,
        bold: true,
        color: textMainColor,
        fontFace: fontHeading
      });

      s.addText(slide.subtitle || 'Strategic Data Review & Growth Insights', {
        x: 1.0,
        y: 3.4,
        w: 11.3,
        h: 0.7,
        fontSize: 18,
        color: textMutedColor,
        fontFace: fontBody
      });

      s.addShape(pptx.ShapeType.line, {
        x: 1.0,
        y: 4.3,
        w: 2.5,
        h: 0,
        line: { color: primaryColor, width: 2 }
      });

      s.addText(`Prepared for: ${meta.company || (brandTemplate?.name ? brandTemplate.name : 'Executive Board')}  |  Date: ${new Date().toLocaleDateString()}`, {
        x: 1.0,
        y: 4.8,
        w: 11.3,
        h: 0.5,
        fontSize: 11,
        color: textMutedColor,
        fontFace: fontBody
      });
    } else {
      // Standard Content Slide Header
      s.addText(slide.title || 'Strategic Overview', {
        x: 0.8,
        y: 0.5,
        w: 9.8,
        h: 0.65,
        fontSize: 24,
        bold: true,
        color: textMainColor,
        fontFace: fontHeading
      });

      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: 0.8,
          y: 1.15,
          w: 9.8,
          h: 0.35,
          fontSize: 12,
          color: textMutedColor,
          fontFace: fontBody
        });
      }

      // Slide Chart Visual
      const chartImg = capturedImagesMap[slide.widgetId];

      if (slide.layout === 'split-visual-insights' || slide.layout === 'full-chart' || slide.layout === 'dual-chart') {
        if (chartImg) {
          s.addImage({
            data: chartImg,
            x: 0.8,
            y: 1.65,
            w: slide.layout === 'full-chart' ? 11.73 : 6.6,
            h: 4.85
          });
        }

        // Key Takeaways & Bullets
        if (slide.layout === 'split-visual-insights' && slide.bullets && slide.bullets.length > 0) {
          const bulletItems = slide.bullets.map(b => ({
            text: b,
            options: {
              fontSize: 13,
              color: textMainColor,
              bullet: { type: 'bullet', code: '2022', color: accentColor },
              breakLine: true,
              paraSpaceAfter: 14
            }
          }));

          s.addText(bulletItems, {
            x: 7.7,
            y: 1.75,
            w: 4.8,
            h: 4.7,
            fontFace: fontBody,
            valign: 'top',
            lineSpacing: 22
          });
        }
      } else if (slide.layout === 'kpi-spotlight') {
        // 4 KPI Scorecard Boxes
        if (slide.kpis && slide.kpis.length > 0) {
          const kpisList = slide.kpis.slice(0, 4);
          const cardWidth = 2.76;
          const totalWidth = 11.73;
          const gap = kpisList.length > 1 ? (totalWidth - (kpisList.length * cardWidth)) / (kpisList.length - 1) : 0;

          kpisList.forEach((k, kIdx) => {
            const xPos = 0.8 + kIdx * (cardWidth + gap);

            // Card background container with rounded corners and soft border
            s.addShape(pptx.ShapeType.roundRect, {
              x: xPos,
              y: 1.65,
              w: cardWidth,
              h: 1.45,
              fill: { color: surfaceColor },
              line: { color: cardBorderColor, width: 1 },
              rectRadius: 0.08
            });

            // Metric label (e.g. "REVENUE")
            s.addText(String(k.label || '').toUpperCase(), {
              x: xPos + 0.22,
              y: 1.78,
              w: cardWidth - 0.44,
              h: 0.25,
              fontSize: 9.5,
              color: textMutedColor,
              fontFace: fontBody,
              bold: true
            });

            // Metric value (e.g. "$19.49M")
            s.addText(String(k.value ?? ''), {
              x: xPos + 0.22,
              y: 2.05,
              w: cardWidth - 0.44,
              h: 0.55,
              fontSize: 24,
              color: textMainColor,
              fontFace: fontHeading,
              bold: true
            });

            // Metric delta pill badge (e.g. "+22% vs prior")
            if (k.delta) {
              const deltaStr = String(k.delta);
              const badgeW = Math.min(2.1, Math.max(1.0, (deltaStr.length * 0.085) + 0.35));
              s.addShape(pptx.ShapeType.roundRect, {
                x: xPos + 0.22,
                y: 2.68,
                w: badgeW,
                h: 0.26,
                fill: { color: badgeBgColor },
                line: { color: isDark ? '334155' : 'DBEAFE', width: 0.5 },
                rectRadius: 0.12
              });

              s.addText(deltaStr, {
                x: xPos + 0.22,
                y: 2.68,
                w: badgeW,
                h: 0.26,
                fontSize: 9,
                color: primaryColor,
                fontFace: fontBody,
                bold: true,
                align: 'center',
                valign: 'middle'
              });
            }
          });
        }

        // Summary bullet points below cards
        if (slide.bullets && slide.bullets.length > 0) {
          const bulletItems = slide.bullets.map(b => ({
            text: b,
            options: {
              fontSize: 13,
              color: textMainColor,
              bullet: { type: 'bullet', code: '2022', color: accentColor },
              breakLine: true,
              paraSpaceAfter: 12
            }
          }));

          s.addText(bulletItems, {
            x: 0.8,
            y: 3.45,
            w: 11.73,
            h: 3.1,
            fontFace: fontBody,
            valign: 'top',
            lineSpacing: 22
          });
        }
      } else if (slide.layout === 'conclusions') {
        // Executive Directives badge
        s.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: 1.6,
          w: 1.85,
          h: 0.30,
          fill: { color: primaryColor },
          rectRadius: 0.15
        });

        s.addText('Executive Directives', {
          x: 0.8,
          y: 1.6,
          w: 1.85,
          h: 0.30,
          fontSize: 9.5,
          bold: true,
          color: 'FFFFFF',
          align: 'center',
          valign: 'middle',
          fontFace: fontBody
        });

        if (slide.bullets && slide.bullets.length > 0) {
          slide.bullets.slice(0, 4).forEach((b, bIdx) => {
            const cardY = 2.10 + bIdx * 1.10;
            s.addShape(pptx.ShapeType.roundRect, {
              x: 0.8,
              y: cardY,
              w: 11.73,
              h: 0.95,
              fill: { color: surfaceColor },
              line: { color: cardBorderColor, width: 1 },
              rectRadius: 0.08
            });

            // Number badge circle
            s.addShape(pptx.ShapeType.ellipse, {
              x: 1.05,
              y: cardY + 0.25,
              w: 0.45,
              h: 0.45,
              fill: { color: badgeBgColor },
              line: { color: primaryColor, width: 1 }
            });

            s.addText(String(bIdx + 1), {
              x: 1.05,
              y: cardY + 0.25,
              w: 0.45,
              h: 0.45,
              fontSize: 11,
              bold: true,
              color: primaryColor,
              align: 'center',
              valign: 'middle',
              fontFace: fontHeading
            });

            // Directive description text
            s.addText(b, {
              x: 1.7,
              y: cardY + 0.15,
              w: 10.6,
              h: 0.65,
              fontSize: 13,
              color: textMainColor,
              fontFace: fontBody,
              valign: 'middle'
            });
          });
        }
      }
    }
  }

  if (outputType) {
    return await pptx.write({ outputType });
  }

  const fileName = `${(meta.title || 'Executive_Presentation').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pptx`;
  await pptx.writeFile({ fileName });
}

/**
 * Exports slides to a 16:9 PDF presentation deck
 */
export async function exportPresentationToPdf(slideElementsOrIds, presentationTitle = 'Presentation_Deck') {
  if (!slideElementsOrIds || slideElementsOrIds.length === 0) return;

  const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape 16:9 approximate
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  let pageAdded = false;

  for (let i = 0; i < slideElementsOrIds.length; i++) {
    const item = slideElementsOrIds[i];
    const element = typeof item === 'string' ? document.getElementById(item) : item;
    if (element) {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null
      });

      const imgData = canvas.toDataURL('image/png');
      if (pageAdded) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      pageAdded = true;
    }
  }

  pdf.save(`${presentationTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
