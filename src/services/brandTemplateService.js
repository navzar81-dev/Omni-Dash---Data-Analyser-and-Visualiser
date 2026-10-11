import JSZip from 'jszip';

const STORAGE_KEY = 'omnidash_brand_template';

export function isColorDark(hex) {
  if (!hex) return false;
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  // ITU-R BT.709 relative luminance
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 140;
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
      surface: '#f8fafc',
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
  }
];

/**
 * Parses a user-uploaded .pptx or .potx PowerPoint Brand Master Template
 * Extracts theme colors, fonts, master layouts, and embedded media/logos.
 */
export async function parsePptxTemplateFile(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 1. Locate theme file (usually ppt/theme/theme1.xml)
    let themeXml = null;
    const themeFiles = Object.keys(zip.files).filter(f => f.startsWith('ppt/theme/theme') && f.endsWith('.xml'));
    if (themeFiles.length > 0) {
      themeXml = await zip.file(themeFiles[0]).async('text');
    }

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
      // Parse Color Scheme
      const clrSchemeMatch = themeXml.match(/<a:clrScheme[^>]*>([\s\S]*?)<\/a:clrScheme>/);
      if (clrSchemeMatch) {
        const tags = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6'];
        for (const tag of tags) {
          const reg = new RegExp(`<a:${tag}[^>]*>([\\s\\S]*?)<\\/a:${tag}>`);
          const match = clrSchemeMatch[1].match(reg);
          if (match) {
            const valMatch = match[1].match(/val="([A-Fa-f0-9]{6})"/i) || match[1].match(/lastClr="([A-Fa-f0-9]{6})"/i);
            if (valMatch && valMatch[1]) {
              extractedColors[tag] = valMatch[1].toUpperCase();
            }
          }
        }
      }

      // Parse Font Scheme
      const fontSchemeMatch = themeXml.match(/<a:fontScheme[^>]*>([\s\S]*?)<\/a:fontScheme>/);
      if (fontSchemeMatch) {
        const majorMatch = fontSchemeMatch[1].match(/<a:majorFont>[\s\S]*?<a:latin typeface="([^"]+)"/);
        const minorMatch = fontSchemeMatch[1].match(/<a:minorFont>[\s\S]*?<a:latin typeface="([^"]+)"/);
        if (majorMatch && majorMatch[1]) majorFont = majorMatch[1];
        if (minorMatch && minorMatch[1]) minorFont = minorMatch[1];
      }
    }

    // 2. Extract embedded images / logos in ppt/media/
    const mediaFiles = Object.keys(zip.files).filter(f =>
      f.startsWith('ppt/media/') && /\.(png|jpe?g|svg|webp)$/i.test(f)
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

    // Determine background color and surface
    const bgHex = '#' + extractedColors.lt1;
    const isDark = isColorDark(bgHex);
    const textPrimaryHex = '#' + (isDark ? extractedColors.lt1 : extractedColors.dk1);
    const textMutedHex = '#' + (isDark ? extractedColors.lt2 : extractedColors.dk2);

    const primaryAccent = '#' + extractedColors.accent1;
    const secondaryAccent = '#' + extractedColors.accent2;

    const brandTemplate = {
      id: `custom-pptx-${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      fileName: file.name,
      isUploaded: true,
      colors: {
        background: bgHex,
        surface: isDark ? '#' + extractedColors.dk2 : '#' + extractedColors.lt2,
        primary: primaryAccent,
        accent: secondaryAccent,
        textPrimary: textPrimaryHex,
        textMuted: textMutedHex,
        accentPalette: [
          '#' + extractedColors.accent1,
          '#' + extractedColors.accent2,
          '#' + extractedColors.accent3,
          '#' + extractedColors.accent4,
          '#' + extractedColors.accent5,
          '#' + extractedColors.accent6
        ]
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

    return {
      success: true,
      template: brandTemplate,
      mediaCount: extractedMedia.length,
      colorsFound: Object.keys(extractedColors).length
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
