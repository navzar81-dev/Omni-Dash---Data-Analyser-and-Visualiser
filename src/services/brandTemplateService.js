import JSZip from 'jszip';

const STORAGE_KEY = 'omnidash_brand_template';
const UPLOADED_STORAGE_KEY = 'omnidash_brand_uploaded_template';

export function isColorDark(hex) {
  if (!hex) return false;
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
  // ITU-R BT.709 relative luminance
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 140;
}

export function adjustHexBrightness(hex, percent) {
  if (!hex) return hex;
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  let r = parseInt(clean.substring(0, 2), 16);
  let g = parseInt(clean.substring(2, 4), 16);
  let b = parseInt(clean.substring(4, 6), 16);
  r = Math.min(255, Math.max(0, Math.round(r + (255 * percent) / 100)));
  g = Math.min(255, Math.max(0, Math.round(g + (255 * percent) / 100)));
  b = Math.min(255, Math.max(0, Math.round(b + (255 * percent) / 100)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export const BUILTIN_BRAND_PRESETS = [
  {
    id: 'corporate-navy',
    name: 'Executive Navy & Slate',
    category: 'Consulting & Enterprise',
    colors: {
      background: '#0a1120',
      surface: '#131e36',
      primary: '#2563eb',
      accent: '#38bdf8',
      textPrimary: '#f8fafc',
      textMuted: '#94a3b8',
      accentPalette: ['#2563eb', '#38bdf8', '#0ea5e9', '#6366f1', '#10b981', '#f59e0b']
    },
    fonts: {
      heading: 'Arial',
      body: 'Calibri'
    },
    logoUrl: null,
    footerDisclaimer: 'Confidential & Proprietary — For Executive Board Review',
    showAccentStripe: true
  },
  {
    id: 'clean-white-corporate',
    name: 'High-Clarity Corporate Light',
    category: 'Boardroom & Print',
    colors: {
      background: '#ffffff',
      surface: '#f1f5f9',
      primary: '#1e293b',
      accent: '#2563eb',
      textPrimary: '#0f172a',
      textMuted: '#64748b',
      accentPalette: ['#2563eb', '#0284c7', '#0d9488', '#4f46e5', '#d97706', '#dc2626']
    },
    fonts: {
      heading: 'Helvetica',
      body: 'Arial'
    },
    logoUrl: null,
    footerDisclaimer: 'Internal Use Only — Strategic Performance Analysis',
    showAccentStripe: true
  },
  {
    id: 'emerald-financial',
    name: 'Wealth & Financial Green',
    category: 'Banking & P&L',
    colors: {
      background: '#051610',
      surface: '#0c271e',
      primary: '#10b981',
      accent: '#34d399',
      textPrimary: '#ecfdf5',
      textMuted: '#6ee7b7',
      accentPalette: ['#10b981', '#34d399', '#059669', '#14b8a6', '#f59e0b', '#3b82f6']
    },
    fonts: {
      heading: 'Georgia',
      body: 'Calibri'
    },
    logoUrl: null,
    footerDisclaimer: 'Strictly Confidential — Financial Reporting & Statements',
    showAccentStripe: true
  },
  {
    id: 'tech-modern',
    name: 'Silicon Valley Cyber Dark',
    category: 'Tech & SaaS',
    colors: {
      background: '#090d16',
      surface: '#111827',
      primary: '#6366f1',
      accent: '#a855f7',
      textPrimary: '#f9fafb',
      textMuted: '#9ca3af',
      accentPalette: ['#6366f1', '#a855f7', '#ec4899', '#06b6d4', '#10b981', '#eab308']
    },
    fonts: {
      heading: 'Trebuchet MS',
      body: 'Arial'
    },
    logoUrl: null,
    footerDisclaimer: 'Product & Analytics Roadmap — Strictly Confidential',
    showAccentStripe: true
  },
  {
    id: 'obsidian-crimson',
    name: 'Obsidian Crimson Executive',
    category: 'Leadership & Strategy',
    colors: {
      background: '#0c0708',
      surface: '#1a0f12',
      primary: '#f43f5e',
      accent: '#fb7185',
      textPrimary: '#fff1f2',
      textMuted: '#fda4af',
      accentPalette: ['#f43f5e', '#fb7185', '#e11d48', '#f97316', '#a855f7', '#38bdf8']
    },
    fonts: {
      heading: 'Arial',
      body: 'Calibri'
    },
    logoUrl: null,
    footerDisclaimer: 'Executive Steering Committee — Private & Confidential',
    showAccentStripe: true
  },
  {
    id: 'sapphire-ocean',
    name: 'Sapphire Royal Ocean',
    category: 'Global Operations',
    colors: {
      background: '#050d1a',
      surface: '#0c1a30',
      primary: '#3b82f6',
      accent: '#60a5fa',
      textPrimary: '#eff6ff',
      textMuted: '#93c5fd',
      accentPalette: ['#3b82f6', '#60a5fa', '#06b6d4', '#6366f1', '#10b981', '#f59e0b']
    },
    fonts: {
      heading: 'Arial',
      body: 'Calibri'
    },
    logoUrl: null,
    footerDisclaimer: 'Global Operations Review — Highly Confidential',
    showAccentStripe: true
  },
  {
    id: 'amber-gold',
    name: 'Sovereign Amber & Gold',
    category: 'Private Equity & M&A',
    colors: {
      background: '#120d04',
      surface: '#221908',
      primary: '#f59e0b',
      accent: '#fbbf24',
      textPrimary: '#fffbeb',
      textMuted: '#fde68a',
      accentPalette: ['#f59e0b', '#fbbf24', '#d97706', '#10b981', '#3b82f6', '#ec4899']
    },
    fonts: {
      heading: 'Georgia',
      body: 'Arial'
    },
    logoUrl: null,
    footerDisclaimer: 'M&A Advisory & Valuation — Strictly Confidential',
    showAccentStripe: true
  },
  {
    id: 'cyber-neon',
    name: 'Neo Cyberpunk Neon',
    category: 'Modern Analytics',
    colors: {
      background: '#0f051d',
      surface: '#1b0b33',
      primary: '#d946ef',
      accent: '#06b6d4',
      textPrimary: '#faf5ff',
      textMuted: '#d8b4fe',
      accentPalette: ['#d946ef', '#06b6d4', '#a855f7', '#22c55e', '#facc15', '#f43f5e']
    },
    fonts: {
      heading: 'Trebuchet MS',
      body: 'Calibri'
    },
    logoUrl: null,
    footerDisclaimer: 'OmniDash Advanced Analytics — Restricted Distribution',
    showAccentStripe: true
  }
];

/**
 * Toggles a template between dark canvas and light canvas mode,
 * preserving primary/accent/palette colors while re-inverting background, surface, and text colors.
 */
export function toggleTemplateContrastMode(template) {
  if (!template || !template.colors) return template;
  const currentDark = isColorDark(template.colors.background);
  const targetDark = !currentDark;

  const newBg = targetDark ? '#0a1120' : '#ffffff';
  const newSurface = targetDark ? '#131e36' : '#f1f5f9';
  const newTextPrimary = targetDark ? '#f8fafc' : '#0f172a';
  const newTextMuted = targetDark ? '#94a3b8' : '#64748b';

  return {
    ...template,
    colors: {
      ...template.colors,
      background: newBg,
      surface: newSurface,
      textPrimary: newTextPrimary,
      textMuted: newTextMuted
    }
  };
}

/**
 * Parses a user-uploaded .pptx or .potx PowerPoint Brand Master Template.
 * Inspects theme XML colors, slide master backgrounds, slide colors, fonts, and embedded logos.
 */
export async function parsePptxTemplateFile(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 1. Locate theme files (case-insensitive)
    let themeXml = null;
    const themeFiles = Object.keys(zip.files).filter(f =>
      /ppt\/theme\/theme\d*\.xml/i.test(f)
    );
    if (themeFiles.length > 0) {
      themeXml = await zip.file(themeFiles[0]).async('text');
    }

    // Default extracted color scheme fallback
    const extractedColors = {
      dk1: '000000',
      lt1: 'FFFFFF',
      dk2: '1E293B',
      lt2: 'F1F5F9',
      accent1: '2563EB',
      accent2: '38BDF8',
      accent3: '10B981',
      accent4: 'F59E0B',
      accent5: '8B5CF6',
      accent6: 'EC4899'
    };

    let majorFont = 'Arial';
    let minorFont = 'Calibri';

    if (themeXml) {
      // Parse Color Scheme: matches <a:clrScheme ...> or <clrScheme ...>
      const clrSchemeMatch = themeXml.match(/<(?:\w+:)?clrScheme[^>]*>([\s\S]*?)<\/(?:\w+:)?clrScheme>/i);
      if (clrSchemeMatch) {
        const tags = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6'];
        for (const tag of tags) {
          const reg = new RegExp(`<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`, 'i');
          const match = clrSchemeMatch[1].match(reg);
          if (match) {
            const inner = match[1];
            // Check for srgbClr val="RRGGBB"
            const srgbMatch = inner.match(/val="([A-Fa-f0-9]{6})"/i);
            if (srgbMatch) {
              extractedColors[tag] = srgbMatch[1].toUpperCase();
            } else {
              // Check for sysClr lastClr="RRGGBB"
              const lastClrMatch = inner.match(/lastClr="([A-Fa-f0-9]{6})"/i);
              if (lastClrMatch) {
                extractedColors[tag] = lastClrMatch[1].toUpperCase();
              } else if (/val="windowText"/i.test(inner)) {
                extractedColors[tag] = '000000';
              } else if (/val="window"/i.test(inner)) {
                extractedColors[tag] = 'FFFFFF';
              }
            }
          }
        }
      }

      // Parse Font Scheme: matches <a:fontScheme ...>
      const fontSchemeMatch = themeXml.match(/<(?:\w+:)?fontScheme[^>]*>([\s\S]*?)<\/(?:\w+:)?fontScheme>/i);
      if (fontSchemeMatch) {
        const majorMatch = fontSchemeMatch[1].match(/<(?:\w+:)?majorFont>[\s\S]*?typeface="([^"]+)"/i);
        const minorMatch = fontSchemeMatch[1].match(/<(?:\w+:)?minorFont>[\s\S]*?typeface="([^"]+)"/i);
        if (majorMatch && majorMatch[1]) majorFont = majorMatch[1];
        if (minorMatch && minorMatch[1]) minorFont = minorMatch[1];
      }
    }

    // 2. Inspect Slide Masters to determine real slide background & clrMap
    let isMasterDark = false;
    let explicitBgHex = null;
    const slideMasterFiles = Object.keys(zip.files).filter(f =>
      /ppt\/slideMasters\/slideMaster\d*\.xml/i.test(f)
    );

    if (slideMasterFiles.length > 0) {
      try {
        const masterXml = await zip.file(slideMasterFiles[0]).async('text');
        // Check clrMap: e.g. <p:clrMap bg1="dk1" tx1="lt1" ... />
        const clrMapMatch = masterXml.match(/<(?:\w+:)?clrMap[^>]*bg1="(\w+)"/i);
        if (clrMapMatch && /dk[12]/i.test(clrMapMatch[1])) {
          isMasterDark = true;
        }

        // Check explicit solidFill background in slideMaster: <p:bg> ... <a:srgbClr val="RRGGBB"/>
        const bgMatch = masterXml.match(/<(?:\w+:)?bg>[\s\S]*?val="([A-Fa-f0-9]{6})"/i);
        if (bgMatch && bgMatch[1]) {
          explicitBgHex = '#' + bgMatch[1].toUpperCase();
          isMasterDark = isColorDark(explicitBgHex);
        }
      } catch (err) {
        console.warn('[BrandParser] Could not inspect slideMaster:', err);
      }
    }

    // 3. Scan slides and masters for custom corporate RGB colors (to discover genuine brand palette)
    const scannedColorsSet = new Set();
    const xmlScanTargets = Object.keys(zip.files).filter(f =>
      /ppt\/(slideMasters|slides)\/.*\.xml$/i.test(f)
    ).slice(0, 10);

    for (const xmlPath of xmlScanTargets) {
      try {
        const content = await zip.file(xmlPath).async('text');
        const matches = content.matchAll(/<(?:\w+:)?srgbClr\s+val="([A-Fa-f0-9]{6})"/gi);
        for (const m of matches) {
          const hex = m[1].toUpperCase();
          // Filter out near-pure blacks and whites from accent candidate list
          if (hex !== '000000' && hex !== 'FFFFFF' && hex !== '1E293B' && hex !== 'F1F5F9') {
            scannedColorsSet.add('#' + hex);
          }
        }
      } catch (e) {
        // ignore scan error
      }
    }

    // 4. Extract embedded images / logos in ppt/media/
    const mediaFiles = Object.keys(zip.files).filter(f =>
      f.toLowerCase().startsWith('ppt/media/') && /\.(png|jpe?g|svg|webp)$/i.test(f)
    );

    const extractedMedia = [];
    for (const mediaPath of mediaFiles) {
      try {
        const ext = mediaPath.split('.').pop().toLowerCase();
        const mimeType = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
        const base64Data = await zip.file(mediaPath).async('base64');
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        const fileName = mediaPath.split('/').pop();
        extractedMedia.push({
          path: mediaPath,
          name: fileName,
          dataUrl
        });
      } catch (err) {
        console.warn('[BrandParser] Failed to extract media:', mediaPath, err);
      }
    }

    // 5. Construct cohesive color tokens based on detected background
    let bgHex = explicitBgHex;
    if (!bgHex) {
      bgHex = isMasterDark ? '#' + extractedColors.dk1 : '#' + extractedColors.lt1;
    }
    const isDark = isColorDark(bgHex);

    const surfaceHex = isDark
      ? (extractedColors.dk2 ? '#' + extractedColors.dk2 : '#131e36')
      : (extractedColors.lt2 ? '#' + extractedColors.lt2 : '#f1f5f9');

    const textPrimaryHex = isDark
      ? (extractedColors.lt1 ? '#' + extractedColors.lt1 : '#f8fafc')
      : (extractedColors.dk1 ? '#' + extractedColors.dk1 : '#0f172a');

    const textMutedHex = isDark
      ? (extractedColors.lt2 ? '#' + extractedColors.lt2 : '#94a3b8')
      : (extractedColors.dk2 ? '#' + extractedColors.dk2 : '#64748b');

    const primaryAccent = '#' + extractedColors.accent1;
    const secondaryAccent = '#' + extractedColors.accent2;

    // Build the 6-color Chart Accent Ramp
    // Combine explicit accent tags, and supplement with scanned custom slide colors if available
    const basePalette = [
      '#' + extractedColors.accent1,
      '#' + extractedColors.accent2,
      '#' + extractedColors.accent3,
      '#' + extractedColors.accent4,
      '#' + extractedColors.accent5,
      '#' + extractedColors.accent6
    ];

    const uniquePalette = Array.from(new Set([...basePalette, ...scannedColorsSet])).slice(0, 8);
    while (uniquePalette.length < 6) {
      uniquePalette.push(primaryAccent);
    }

    const brandTemplate = {
      id: `custom-pptx-${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      fileName: file.name,
      isUploaded: true,
      colors: {
        background: bgHex,
        surface: surfaceHex,
        primary: primaryAccent,
        accent: secondaryAccent,
        textPrimary: textPrimaryHex,
        textMuted: textMutedHex,
        accentPalette: uniquePalette.slice(0, 6)
      },
      fonts: {
        heading: majorFont,
        body: minorFont
      },
      logoUrl: extractedMedia[0]?.dataUrl || null,
      extractedMedia,
      footerDisclaimer: 'Confidential & Proprietary — Master Presentation Deck',
      showAccentStripe: true
    };

    // Save as uploaded template cache
    saveUploadedBrandTemplate(brandTemplate);

    return {
      success: true,
      template: brandTemplate,
      mediaCount: extractedMedia.length,
      colorsFound: uniquePalette.length
    };
  } catch (error) {
    console.error('[BrandParser] Failed to parse PPTX template:', error);
    return {
      success: false,
      error: error.message || 'Unable to parse PPTX template structure.'
    };
  }
}

export function saveActiveBrandTemplate(template) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(template));
  } catch (e) {
    console.warn('[BrandParser] Could not save active brand template:', e);
  }
}

export function loadActiveBrandTemplate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return BUILTIN_BRAND_PRESETS[0];
}

export function saveUploadedBrandTemplate(template) {
  try {
    localStorage.setItem(UPLOADED_STORAGE_KEY, JSON.stringify(template));
  } catch (e) {
    console.warn('[BrandParser] Could not save uploaded brand template:', e);
  }
}

export function loadUploadedBrandTemplate() {
  try {
    const raw = localStorage.getItem(UPLOADED_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return null;
}

