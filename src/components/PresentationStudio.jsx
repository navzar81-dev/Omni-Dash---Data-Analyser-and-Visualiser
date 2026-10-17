import React, { useState, useEffect, useRef } from 'react';
import {
  Presentation,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Maximize2,
  FileSpreadsheet,
  Download,
  FileText,
  X,
  Edit3,
  Check,
  ChevronLeft,
  ChevronRight,
  MonitorPlay,
  Layers,
  BarChart3,
  Target
} from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { BrandTemplateModal } from './BrandTemplateModal';
import {
  loadActiveBrandTemplate,
  isColorDark
} from '../services/brandTemplateService';
import {
  exportPresentationToPptx,
  exportPresentationToPdf,
  captureElementAsDataUrl
} from '../services/exportService';

const SLIDE_LAYOUTS = [
  { id: 'title', label: 'Title Slide', icon: Presentation, desc: 'Deck cover, agenda & metadata' },
  { id: 'kpi-spotlight', label: 'KPI Scorecard', icon: Target, desc: 'Key performance metrics & deltas' },
  { id: 'split-visual-insights', label: 'Visual + Insights', icon: BarChart3, desc: 'Chart alongside narrative bullets' },
  { id: 'full-chart', label: 'Full Graphic', icon: Layers, desc: 'Panoramic visual analysis' },
  { id: 'conclusions', label: 'Strategic Roadmap', icon: FileText, desc: 'Executive takeaways & next actions' }
];

function createInitialDeck(datasetMeta, widgets = [], insights = [], kpis = []) {
  const topInsights = insights.slice(0, 3);
  const primaryWidget = widgets[0];
  const secondaryWidget = widgets[1] || widgets[0];

  return [
    {
      id: `slide-1`,
      layout: 'title',
      title: `${datasetMeta?.name || 'Executive Business'} Strategic Report`,
      subtitle: 'Performance Review, Trajectory & Key Analytical Findings',
      presenter: 'Executive Analytics Team',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      speakerNotes: 'Welcome executive leadership. Today we review our core metrics, growth drivers, and strategic anomalies.'
    },
    {
      id: `slide-2`,
      layout: 'kpi-spotlight',
      title: 'Executive KPI Scorecard',
      subtitle: 'High-level business velocity and period-over-period performance',
      kpis: kpis.slice(0, 4).map(k => ({
        label: k.name?.replace(/_/g, ' ') || 'Metric',
        value: k.formattedTotal || '100K',
        delta: `${k.isPositive ? '+' : ''}${k.deltaPct}% vs prior`
      })),
      bullets: [
        'Core indicators demonstrate solid resilience across major business operational lines.',
        'Positive trajectory observed across key revenue generation channels with controlled variance.',
        'Efficiency metrics indicate optimized operational capacity with healthy margin profiles.'
      ],
      speakerNotes: 'Highlight the top two KPIs and address the positive momentum observed across regional units.'
    },
    {
      id: `slide-3`,
      layout: 'split-visual-insights',
      title: primaryWidget ? primaryWidget.title : 'Revenue Performance & Breakdown',
      subtitle: 'Segment distribution and contribution dynamics',
      widgetId: primaryWidget?.id || null,
      bullets: [
        topInsights[0]?.text || 'Strong positive acceleration observed across primary business divisions.',
        'Segment allocation highlights key growth catalysts with sustained momentum.',
        'Strategic allocation has driven higher margin retention compared to budget targets.'
      ],
      speakerNotes: 'Point out the distribution in the chart and emphasize the leading contributor segments.'
    },
    {
      id: `slide-4`,
      layout: 'split-visual-insights',
      title: secondaryWidget ? secondaryWidget.title : 'Trend Velocity & Forecasting',
      subtitle: 'Period-over-period trajectory and operational stability',
      widgetId: secondaryWidget?.id || null,
      bullets: [
        topInsights[1]?.text || 'Sequential performance reflects consistent demand trajectory.',
        'Moving averages indicate steady operational stabilization without cyclical drops.',
        'Variance vs budget benchmarks remains within the favorable upper confidence band.'
      ],
      speakerNotes: 'Walk the executive committee through the trendline and the rolling average trajectory.'
    },
    {
      id: `slide-5`,
      layout: 'conclusions',
      title: 'Strategic Takeaways & Action Roadmap',
      subtitle: 'Key directives for next fiscal quarters',
      bullets: [
        'Accelerate capital investment into top-performing segments to capitalize on positive velocity.',
        'Initiate targeted margin optimization in secondary divisions to mitigate identified outliers.',
        'Sustain operational cadence and monitor key metric thresholds on a weekly reporting cycle.',
        'Review resource rebalancing prior to the upcoming quarter planning session.'
      ],
      speakerNotes: 'Summarize the four executive recommendations and invite questions from the board.'
    }
  ];
}

export function PresentationStudio({
  isOpen,
  onClose,
  datasetMeta,
  data,
  columnProfiles,
  widgets = [],
  insights = [],
  kpis = [],
  pendingAiSlide = null,
  onClearPendingAiSlide = () => {}
}) {
  const [slides, setSlides] = useState(() => createInitialDeck(datasetMeta, widgets, insights, kpis));
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [brandTemplate, setBrandTemplate] = useState(() => loadActiveBrandTemplate());
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  // Sync slides if deck is empty or dataset switched
  const lastDatasetKeyRef = useRef(datasetMeta?.id || datasetMeta?.name);
  useEffect(() => {
    const currentKey = datasetMeta?.id || datasetMeta?.name;
    if (isOpen) {
      if (slides.length === 0 || lastDatasetKeyRef.current !== currentKey) {
        setSlides(createInitialDeck(datasetMeta, widgets, insights, kpis));
        setActiveSlideIndex(0);
        lastDatasetKeyRef.current = currentKey;
      }
    }
  }, [isOpen, datasetMeta?.id, datasetMeta?.name]);

  // Ingest pending AI analyst slide
  useEffect(() => {
    if (pendingAiSlide) {
      const rawBullets = String(pendingAiSlide)
        .split('\n')
        .map(l => l.replace(/^[•*\-\d.]+\s*/, '').trim())
        .filter(l => l.length > 10)
        .slice(0, 4);

      const newSlide = {
        id: `slide-ai-${Date.now()}`,
        layout: 'conclusions',
        title: 'Local AI Strategic Findings',
        subtitle: 'Automated on-device executive intelligence synthesis',
        bullets: rawBullets.length > 0 ? rawBullets : [String(pendingAiSlide).slice(0, 200)],
        speakerNotes: String(pendingAiSlide)
      };

      setSlides(prev => {
        const next = [...prev, newSlide];
        setActiveSlideIndex(next.length - 1);
        return next;
      });
      onClearPendingAiSlide();
    }
  }, [pendingAiSlide]);

  // Keyboard navigation for Presenter Mode
  useEffect(() => {
    if (!isPresenting) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setActiveSlideIndex(prev => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setActiveSlideIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        setIsPresenting(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, slides.length]);

  if (!isOpen) return null;

  const currentSlide = slides[activeSlideIndex] || slides[0] || null;
  if (!currentSlide) return null;

  // Auto-generate 5-slide Executive Presentation from live data & insights
  const generateDefaultDeck = () => {
    const topInsights = insights.slice(0, 3);
    const primaryWidget = widgets[0];
    const secondaryWidget = widgets[1] || widgets[0];

    const defaultSlides = [
      {
        id: `slide-1`,
        layout: 'title',
        title: `${datasetMeta?.name || 'Executive Business'} Strategic Report`,
        subtitle: 'Performance Review, Trajectory & Key Analytical Findings',
        presenter: 'Executive Analytics Team',
        date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        speakerNotes: 'Welcome executive leadership. Today we review our core metrics, growth drivers, and strategic anomalies.'
      },
      {
        id: `slide-2`,
        layout: 'kpi-spotlight',
        title: 'Executive KPI Scorecard',
        subtitle: 'High-level business velocity and period-over-period performance',
        kpis: kpis.slice(0, 4).map(k => ({
          label: k.name?.replace(/_/g, ' ') || 'Metric',
          value: k.formattedTotal || '100K',
          delta: `${k.isPositive ? '+' : ''}${k.deltaPct}% vs prior`
        })),
        bullets: [
          'Core indicators demonstrate solid resilience across major business operational lines.',
          'Positive trajectory observed across key revenue generation channels with controlled variance.',
          'Efficiency metrics indicate optimized operational capacity with healthy margin profiles.'
        ],
        speakerNotes: 'Highlight the top two KPIs and address the positive momentum observed across regional units.'
      },
      {
        id: `slide-3`,
        layout: 'split-visual-insights',
        title: primaryWidget ? primaryWidget.title : 'Revenue Performance & Breakdown',
        subtitle: 'Segment distribution and contribution dynamics',
        widgetId: primaryWidget?.id || null,
        bullets: [
          topInsights[0]?.text || 'Strong positive acceleration observed across primary business divisions.',
          'Segment allocation highlights key growth catalysts with sustained momentum.',
          'Strategic allocation has driven higher margin retention compared to budget targets.'
        ],
        speakerNotes: 'Point out the distribution in the chart and emphasize the leading contributor segments.'
      },
      {
        id: `slide-4`,
        layout: 'split-visual-insights',
        title: secondaryWidget ? secondaryWidget.title : 'Trend Velocity & Forecasting',
        subtitle: 'Period-over-period trajectory and operational stability',
        widgetId: secondaryWidget?.id || null,
        bullets: [
          topInsights[1]?.text || 'Sequential performance reflects consistent demand trajectory.',
          'Moving averages indicate steady operational stabilization without cyclical drops.',
          'Variance vs budget benchmarks remains within the favorable upper confidence band.'
        ],
        speakerNotes: 'Walk the executive committee through the trendline and the rolling average trajectory.'
      },
      {
        id: `slide-5`,
        layout: 'conclusions',
        title: 'Strategic Takeaways & Action Roadmap',
        subtitle: 'Key directives for next fiscal quarters',
        bullets: [
          'Accelerate capital investment into top-performing segments to capitalize on positive velocity.',
          'Initiate targeted margin optimization in secondary divisions to mitigate identified outliers.',
          'Sustain operational cadence and monitor key metric thresholds on a weekly reporting cycle.',
          'Review resource rebalancing prior to the upcoming quarter planning session.'
        ],
        speakerNotes: 'Summarize the four executive recommendations and invite questions from the board.'
      }
    ];

    setSlides(defaultSlides);
    setActiveSlideIndex(0);
  };

  // Add blank or template slide
  const handleAddSlide = (layout = 'split-visual-insights') => {
    const newSlide = {
      id: `slide-${Date.now()}`,
      layout,
      title: 'New Strategic Slide',
      subtitle: 'Add executive context and takeaways',
      widgetId: widgets[0]?.id || null,
      bullets: ['First analytical observation', 'Second key takeaway'],
      speakerNotes: 'Presenter notes for this slide.'
    };
    setSlides(prev => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const handleDuplicateSlide = (idx) => {
    const target = slides[idx];
    const copy = { ...target, id: `slide-${Date.now()}`, title: `${target.title} (Copy)` };
    const next = [...slides];
    next.splice(idx + 1, 0, copy);
    setSlides(next);
    setActiveSlideIndex(idx + 1);
  };

  const handleDeleteSlide = (idx) => {
    if (slides.length <= 1) return;
    const next = slides.filter((_, i) => i !== idx);
    setSlides(next);
    setActiveSlideIndex(Math.max(0, idx - 1));
  };

  const handleMoveSlide = (idx, dir) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    const next = [...slides];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    setSlides(next);
    setActiveSlideIndex(targetIdx);
  };

  // Update current slide field
  const updateCurrentSlide = (field, value) => {
    setSlides(prev => {
      const copy = [...prev];
      copy[activeSlideIndex] = { ...copy[activeSlideIndex], [field]: value };
      return copy;
    });
  };

  // Add / remove bullet
  const handleUpdateBullet = (bulletIdx, val) => {
    const currentBullets = [...(currentSlide.bullets || [])];
    currentBullets[bulletIdx] = val;
    updateCurrentSlide('bullets', currentBullets);
  };

  const handleAddBullet = () => {
    const currentBullets = [...(currentSlide.bullets || [])];
    currentBullets.push('New key takeaway or metric observation');
    updateCurrentSlide('bullets', currentBullets);
  };

  const handleDeleteBullet = (bulletIdx) => {
    const currentBullets = (currentSlide.bullets || []).filter((_, i) => i !== bulletIdx);
    updateCurrentSlide('bullets', currentBullets);
  };

  // Export to PowerPoint PPTX with clean presentation chart captures
  const handleExportPptx = async () => {
    setIsExporting(true);
    try {
      // Capture all widget images from clean presentation capture elements
      const capturedImagesMap = {};
      for (const s of slides) {
        if (s.widgetId) {
          const domId = `presentation-capture-widget-${s.widgetId}`;
          let imgDataUrl = await captureElementAsDataUrl(domId);
          if (!imgDataUrl) {
            imgDataUrl = await captureElementAsDataUrl(`slide-active-widget-${s.widgetId}`) || await captureElementAsDataUrl(`widget-card-${s.widgetId}`);
          }
          if (imgDataUrl) {
            capturedImagesMap[s.widgetId] = imgDataUrl;
          }
        }
      }

      const isDarkCanvas = isColorDark(brandTemplate?.colors?.background || '#0a0e17');
      await exportPresentationToPptx(slides, capturedImagesMap, {
        title: datasetMeta?.name || 'Executive Presentation',
        company: brandTemplate?.name || 'Executive Board',
        theme: isDarkCanvas ? 'dark' : 'light'
      }, brandTemplate);
    } catch (err) {
      console.error('Failed to export PPTX:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF Slides (exports full presentation deck across all slides)
  const handleExportPdfSlides = async () => {
    setIsExporting(true);
    const originalIndex = activeSlideIndex;
    try {
      const slideElements = [];
      for (let i = 0; i < slides.length; i++) {
        setActiveSlideIndex(i);
        // Wait for React re-render and Chart.js animation update
        await new Promise(r => setTimeout(r, 120));
        const el = document.getElementById('slide-canvas-preview');
        if (el) {
          slideElements.push(el);
        }
      }
      await exportPresentationToPdf(slideElements, datasetMeta?.name || 'Presentation_Deck');
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setActiveSlideIndex(originalIndex);
      setIsExporting(false);
    }
  };

  // Find widget associated with current slide
  const activeWidget = currentSlide?.widgetId ? (widgets.find(w => w.id === currentSlide.widgetId) || widgets[0]) : widgets[0];

  return (
    <div
      className="modal-overlay presentation-studio-overlay"
      style={{ padding: isPresenting ? 0 : '16px' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="glass-panel presentation-studio-panel"
        style={{
          width: isPresenting ? '100vw' : '96vw',
          height: isPresenting ? '100vh' : '94vh',
          borderRadius: isPresenting ? 0 : '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#07090e',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Studio Top Control Header (Hidden when presenting) */}
        {!isPresenting && (
          <div className="presentation-studio-header" style={{
            padding: '12px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Presentation size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Business Presentation Studio</h2>
                  <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
                    {slides.length} Slides
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Assemble boardroom slide decks pairing live charts with narrative business insights
                </div>
              </div>
            </div>

            {/* Actions: Brand Master, Generate, Present, Export */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Brand Master Template Button */}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsBrandModalOpen(true)}
                style={{ gap: '6px' }}
                title="Upload or customize PowerPoint Brand Master Template (.pptx / .potx)"
              >
                <Layers size={14} color="#38bdf8" />
                <span>Brand: <strong style={{ color: '#38bdf8' }}>{brandTemplate?.name || 'Master'}</strong></span>
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={generateDefaultDeck}
                style={{ gap: '6px' }}
                title="Regenerate presentation from latest data and insights"
              >
                <Sparkles size={14} color="#fbbf24" />
                <span>Auto-Generate AI Deck</span>
              </button>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsPresenting(true)}
                style={{ gap: '6px' }}
              >
                <MonitorPlay size={14} />
                <span>Present Deck</span>
              </button>

              {/* PPTX Export Button */}
              <button
                className="btn btn-accent btn-sm"
                onClick={handleExportPptx}
                disabled={isExporting}
                style={{ gap: '6px' }}
              >
                <Download size={14} />
                <span>{isExporting ? 'Generating...' : 'Export PowerPoint (.pptx)'}</span>
              </button>

              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', marginLeft: '6px' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="presentation-main-body" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Sidebar: Slide Thumbnails (Hidden when presenting) */}
          {!isPresenting && (
            <div className="presentation-slides-sidebar" style={{
              width: '260px',
              borderRight: '1px solid var(--border-subtle)',
              background: 'rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                  Deck Slides ({slides.length})
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    title="Regenerate presentation from live dashboard metrics and widgets"
                    onClick={() => {
                      if (window.confirm('Re-sync entire presentation deck with current dashboard KPIs and charts?')) {
                        setSlides(createInitialDeck(datasetMeta, widgets, insights, kpis));
                        setActiveSlideIndex(0);
                      }
                    }}
                    style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                  >
                    Sync Live
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleAddSlide('split-visual-insights')}
                    style={{ padding: '3px 8px', fontSize: '0.7rem', gap: '4px' }}
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>

              {/* Thumbnail List */}
              <div className="thumbnails-list" style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {slides.map((s, idx) => {
                  const isActive = idx === activeSlideIndex;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setActiveSlideIndex(idx)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isActive ? '#6366f1' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: isActive ? '#818cf8' : 'var(--text-faint)'
                        }}>
                          {idx + 1}
                        </span>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: isActive ? 'var(--text-main)' : 'var(--text-muted)'
                          }}>
                            {s.title || `Slide ${idx + 1}`}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-faint)' }}>
                            {s.layout}
                          </div>
                        </div>
                      </div>

                      {/* Move / Action controls */}
                      <div style={{ display: 'flex', gap: '2px' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleMoveSlide(idx, -1)}
                          disabled={idx === 0}
                          style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: '2px' }}
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          onClick={() => handleMoveSlide(idx, 1)}
                          disabled={idx === slides.length - 1}
                          style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: '2px' }}
                        >
                          <ChevronDown size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteSlide(idx)}
                          disabled={slides.length <= 1}
                          style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', padding: '2px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Center: Active Slide Canvas (16:9 Aspect Ratio) */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isPresenting ? '0' : '20px',
            background: isPresenting ? '#07090e' : 'rgba(0, 0, 0, 0.4)',
            overflowY: 'auto'
          }}>
          {(() => {
            const brandColors = brandTemplate?.colors || {};
            const brandFonts = brandTemplate?.fonts || {};
            const isDarkCanvas = isColorDark(brandColors.background || '#0a0e17');

            const canvasBg = brandColors.background || '#0a0e17';
            const canvasSurface = brandColors.surface || (isDarkCanvas ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc');
            const canvasTextMain = brandColors.textPrimary || (isDarkCanvas ? '#f8fafc' : '#0f172a');
            const canvasTextMuted = brandColors.textMuted || (isDarkCanvas ? '#94a3b8' : '#64748b');
            const brandPrimary = brandColors.primary || '#2563eb';
            const brandAccent = brandColors.accent || '#38bdf8';
            const headingFont = brandFonts.heading ? `"${brandFonts.heading}", system-ui, sans-serif` : 'inherit';
            const bodyFont = brandFonts.body ? `"${brandFonts.body}", system-ui, sans-serif` : 'inherit';

            return (
              <div
                id="slide-canvas-preview"
                className="glass-panel"
                style={{
                  width: isPresenting ? '100vw' : '100%',
                  maxWidth: isPresenting ? 'none' : '1080px',
                  aspectRatio: '16 / 9',
                  borderRadius: isPresenting ? 0 : '12px',
                  padding: isPresenting ? '48px 64px' : '36px 44px',
                  background: canvasBg,
                  color: canvasTextMain,
                  fontFamily: bodyFont,
                  border: isPresenting ? 'none' : `1px solid ${isDarkCanvas ? 'var(--border-subtle)' : '#e2e8f0'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
                }}
              >
                {/* Top Master Accent Stripe */}
                {brandTemplate?.showAccentStripe !== false && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: brandPrimary
                    }}
                  />
                )}

                {/* Top-Right Corporate Logo */}
                {brandTemplate?.logoUrl && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '28px',
                      maxHeight: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      zIndex: 10
                    }}
                  >
                    <img
                      src={brandTemplate.logoUrl}
                      alt="Brand Logo"
                      style={{ maxHeight: '32px', maxWidth: '140px', objectFit: 'contain' }}
                    />
                  </div>
                )}

                {/* Slide Content by Layout */}

                {/* 1. TITLE LAYOUT */}
                {currentSlide.layout === 'title' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: brandPrimary,
                          color: '#ffffff',
                          fontWeight: 700
                        }}
                      >
                        {brandTemplate?.name ? `${brandTemplate.name} Briefing` : 'Executive Strategic Briefing'}
                      </span>
                    </div>
                    <h1
                      style={{
                        fontSize: isPresenting ? '3.2rem' : '2.4rem',
                        fontWeight: 800,
                        fontFamily: headingFont,
                        color: canvasTextMain,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.15,
                        marginBottom: '14px'
                      }}
                    >
                      {currentSlide.title}
                    </h1>
                    <p style={{ fontSize: isPresenting ? '1.4rem' : '1.1rem', color: brandAccent, fontWeight: 600, marginBottom: '40px' }}>
                      {currentSlide.subtitle}
                    </p>
                    <div style={{ display: 'flex', gap: '24px', fontSize: '0.85rem', color: canvasTextMuted, borderTop: `1px solid ${isDarkCanvas ? 'var(--border-subtle)' : '#e2e8f0'}`, paddingTop: '20px' }}>
                      <div>Prepared by: <strong style={{ color: canvasTextMain }}>{currentSlide.presenter || (brandTemplate?.name ? brandTemplate.name : 'OmniDash Analytics')}</strong></div>
                      <div>Date: <strong style={{ color: canvasTextMain }}>{currentSlide.date}</strong></div>
                    </div>
                  </div>
                )}

              {/* 2. KPI SPOTLIGHT LAYOUT */}
              {currentSlide.layout === 'kpi-spotlight' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Header */}
                  <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: isPresenting ? '2rem' : '1.5rem', fontWeight: 800, fontFamily: headingFont, color: canvasTextMain }}>{currentSlide.title}</h2>
                    <p style={{ fontSize: '0.85rem', color: canvasTextMuted, fontFamily: bodyFont }}>{currentSlide.subtitle}</p>
                  </div>

                  {/* 4 Big KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                    {(currentSlide.kpis || []).map((kpi, kIdx) => (
                      <div
                        key={kIdx}
                        className="glass-panel"
                        style={{
                          padding: '16px',
                          background: canvasSurface,
                          border: `1px solid ${isDarkCanvas ? 'var(--border-subtle)' : '#e2e8f0'}`
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: canvasTextMuted, textTransform: 'uppercase' }}>
                          {kpi.label}
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)', margin: '6px 0', color: canvasTextMain }}>
                          {kpi.value}
                        </div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: `${brandPrimary}22`,
                            color: brandPrimary
                          }}
                        >
                          {kpi.delta}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bullet Highlights */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(currentSlide.bullets || []).map((b, bIdx) => (
                      <div key={bIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: brandAccent, marginTop: '7px' }} />
                        <span style={{ fontSize: isPresenting ? '1.05rem' : '0.88rem', color: canvasTextMain, lineHeight: 1.5, fontFamily: bodyFont }}>
                          {b}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. SPLIT VISUAL + INSIGHTS LAYOUT */}
              {currentSlide.layout === 'split-visual-insights' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Header */}
                  <div style={{ marginBottom: '16px' }}>
                    <h2 style={{ fontSize: isPresenting ? '1.9rem' : '1.45rem', fontWeight: 800, fontFamily: headingFont, color: canvasTextMain }}>{currentSlide.title}</h2>
                    <p style={{ fontSize: '0.82rem', color: canvasTextMuted, fontFamily: bodyFont }}>{currentSlide.subtitle}</p>
                  </div>

                  {/* Content Split: 60% Chart / 40% Narrative */}
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '6fr 4fr', gap: '24px', alignItems: 'center' }}>
                    {/* Live Chart Rendering */}
                    <div style={{ height: '100%', minHeight: '260px', display: 'flex', flexDirection: 'column' }}>
                      {activeWidget ? (
                        <WidgetCard
                          widget={{ ...activeWidget, width: 'full' }}
                          data={data}
                          theme={isDarkCanvas ? 'dark' : 'light'}
                          customPalette={{
                            primary: brandPrimary,
                            border: brandAccent,
                            gradient: (brandColors.accentPalette && brandColors.accentPalette.length >= 6)
                              ? brandColors.accentPalette
                              : [brandPrimary, brandAccent, '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
                          }}
                          hideControls={true}
                          idOverride={`slide-active-widget-${activeWidget.id}`}
                          onEdit={() => {}}
                          onDuplicate={() => {}}
                          onDelete={() => {}}
                          onResize={() => {}}
                        />
                      ) : (
                        <div style={{ color: canvasTextMuted, textAlign: 'center', padding: '40px' }}>
                          Select a widget to embed in this slide.
                        </div>
                      )}
                    </div>

                    {/* Executive Takeaways & Insights Bullets */}
                    <div
                      className="glass-panel"
                      style={{
                        height: '100%',
                        padding: '20px',
                        background: canvasSurface,
                        border: `1px solid ${isDarkCanvas ? 'var(--border-subtle)' : '#e2e8f0'}`,
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: brandAccent, textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={14} color="#fbbf24" />
                        <span>Executive Takeaways & Findings</span>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(currentSlide.bullets || []).map((b, bIdx) => (
                          <div key={bIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: brandPrimary, marginTop: '6px' }} />
                            <p style={{ fontSize: isPresenting ? '1rem' : '0.85rem', color: canvasTextMain, lineHeight: 1.5, fontFamily: bodyFont }}>
                              {b}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. FULL CHART LAYOUT */}
              {currentSlide.layout === 'full-chart' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: '14px' }}>
                    <h2 style={{ fontSize: isPresenting ? '1.9rem' : '1.45rem', fontWeight: 800, fontFamily: headingFont, color: canvasTextMain }}>{currentSlide.title}</h2>
                    <p style={{ fontSize: '0.82rem', color: canvasTextMuted, fontFamily: bodyFont }}>{currentSlide.subtitle}</p>
                  </div>
                  <div style={{ flex: 1, minHeight: '300px' }}>
                    {activeWidget && (
                      <WidgetCard
                        widget={{ ...activeWidget, width: 'full' }}
                        data={data}
                        theme={isDarkCanvas ? 'dark' : 'light'}
                        customPalette={{
                          primary: brandPrimary,
                          border: brandAccent,
                          gradient: (brandColors.accentPalette && brandColors.accentPalette.length >= 6)
                            ? brandColors.accentPalette
                            : [brandPrimary, brandAccent, '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
                        }}
                        hideControls={true}
                        idOverride={`slide-active-widget-${activeWidget.id}`}
                        onEdit={() => {}}
                        onDuplicate={() => {}}
                        onDelete={() => {}}
                        onResize={() => {}}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* 5. STRATEGIC CONCLUSIONS LAYOUT */}
              {currentSlide.layout === 'conclusions' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        background: brandPrimary,
                        color: '#ffffff',
                        display: 'inline-block',
                        marginBottom: '8px'
                      }}
                    >
                      Executive Directives
                    </span>
                    <h2 style={{ fontSize: isPresenting ? '2.4rem' : '1.8rem', fontWeight: 800, fontFamily: headingFont, color: canvasTextMain }}>{currentSlide.title}</h2>
                    <p style={{ fontSize: '0.9rem', color: canvasTextMuted, fontFamily: bodyFont }}>{currentSlide.subtitle}</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {(currentSlide.bullets || []).map((b, bIdx) => (
                      <div
                        key={bIdx}
                        className="glass-panel"
                        style={{
                          padding: '14px 18px',
                          background: canvasSurface,
                          border: `1px solid ${isDarkCanvas ? 'var(--border-subtle)' : '#e2e8f0'}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px'
                        }}
                      >
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: `${brandPrimary}22`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: brandPrimary,
                          fontWeight: 800,
                          fontSize: '0.8rem'
                        }}>
                          {bIdx + 1}
                        </div>
                        <span style={{ fontSize: isPresenting ? '1.15rem' : '0.92rem', fontWeight: 500, color: canvasTextMain, fontFamily: bodyFont }}>
                          {b}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                {/* Slide Footer */}
                <div
                  style={{
                    marginTop: 'auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.72rem',
                    color: canvasTextMuted,
                    borderTop: `1px solid ${isDarkCanvas ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                    paddingTop: '10px'
                  }}
                >
                  <div>{brandTemplate?.footerDisclaimer || 'OmniDash Executive Intelligence · Confidential'}</div>
                  <div>Slide {activeSlideIndex + 1} of {slides.length}</div>
                </div>
              </div>
            );
          })()}

            {/* Presenter Mode Floating Navigation Controls */}
            {isPresenting && (
              <div style={{
                position: 'fixed',
                bottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(15, 23, 42, 0.95)',
                padding: '8px 16px',
                borderRadius: '9999px',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
                zIndex: 100
              }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveSlideIndex(p => Math.max(0, p - 1))}
                  disabled={activeSlideIndex === 0}
                  style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0, justifyContent: 'center' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {activeSlideIndex + 1} / {slides.length}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveSlideIndex(p => Math.min(slides.length - 1, p + 1))}
                  disabled={activeSlideIndex === slides.length - 1}
                  style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0, justifyContent: 'center' }}
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
                  style={{ fontSize: '0.75rem' }}
                >
                  Speaker Notes
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsPresenting(false)}
                  style={{ fontSize: '0.75rem', color: '#fb7185' }}
                >
                  Exit Show (ESC)
                </button>
              </div>
            )}

            {/* Presenter Speaker Notes Popup */}
            {isPresenting && showSpeakerNotes && (
              <div
                className="glass-panel"
                style={{
                  position: 'fixed',
                  bottom: '80px',
                  width: '500px',
                  padding: '16px',
                  background: 'rgba(15, 23, 42, 0.98)',
                  zIndex: 100
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>
                  SPEAKER NOTES (Slide {activeSlideIndex + 1}):
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {currentSlide.speakerNotes || 'No specific speaker notes configured for this slide.'}
                </p>
              </div>
            )}
          </div>

          {/* Right Sidebar: Active Slide Content & Layout Editor (Hidden when presenting) */}
          {!isPresenting && (
            <div style={{
              width: '320px',
              borderLeft: '1px solid var(--border-subtle)',
              background: 'rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              padding: '16px'
            }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: '12px' }}>
                Slide Customization
              </div>

              {/* Layout Switcher */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Slide Layout
                </label>
                <select
                  className="form-select"
                  value={currentSlide.layout}
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onChange={e => {
                    e.stopPropagation();
                    updateCurrentSlide('layout', e.target.value);
                  }}
                >
                  {SLIDE_LAYOUTS.map(l => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Title & Subtitle */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Slide Headline
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={currentSlide.title}
                  onChange={e => updateCurrentSlide('title', e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Subtitle / Context
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={currentSlide.subtitle || ''}
                  onChange={e => updateCurrentSlide('subtitle', e.target.value)}
                />
              </div>

              {/* Visual Widget Selector (if layout includes chart) */}
              {(currentSlide.layout === 'split-visual-insights' || currentSlide.layout === 'full-chart') && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Select Chart Widget for Slide
                  </label>
                  <select
                    className="form-select"
                    value={currentSlide.widgetId || ''}
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    onChange={e => {
                      e.stopPropagation();
                      updateCurrentSlide('widgetId', e.target.value);
                    }}
                  >
                    {widgets.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.title} ({w.chartType})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Editable Bullets / Key Takeaways */}
              {currentSlide.bullets && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Key Bullet Points ({currentSlide.bullets.length})
                    </label>
                    <button
                      onClick={handleAddBullet}
                      style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      + Add Point
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentSlide.bullets.map((b, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '4px' }}>
                        <textarea
                          className="form-input"
                          rows={2}
                          value={b}
                          onChange={e => handleUpdateBullet(idx, e.target.value)}
                          style={{ fontSize: '0.76rem', padding: '6px' }}
                        />
                        <button
                          onClick={() => handleDeleteBullet(idx)}
                          style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', padding: '4px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Speaker Notes */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Speaker Talking Notes
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Private talking points for the presenter..."
                  value={currentSlide.speakerNotes || ''}
                  onChange={e => updateCurrentSlide('speakerNotes', e.target.value)}
                  style={{ fontSize: '0.76rem' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Off-screen Capture Container for Pristine Slide Image Generation */}
      <div
        id="presentation-studio-offscreen-capture"
        style={{
          position: 'fixed',
          left: '-99999px',
          top: 0,
          width: '1200px',
          pointerEvents: 'none',
          opacity: 0,
          zIndex: -1
        }}
      >
        {Array.from(new Set(slides.map(s => s.widgetId).filter(Boolean))).map(wId => {
          const w = (widgets || []).find(item => item.id === wId);
          if (!w) return null;
          const brandColors = brandTemplate?.colors || {};
          const isDarkCanvas = isColorDark(brandColors.background || '#0a0e17');
          const canvasBg = brandColors.background || '#0a0e17';
          const brandPrimary = brandColors.primary || '#2563eb';
          const brandAccent = brandColors.accent || '#38bdf8';
          return (
            <div
              key={w.id}
              id={`presentation-capture-widget-${w.id}`}
              style={{
                width: '1000px',
                height: '560px',
                background: canvasBg,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <WidgetCard
                widget={{ ...w, width: 'full' }}
                data={data}
                theme={isDarkCanvas ? 'dark' : 'light'}
                customPalette={{
                  primary: brandPrimary,
                  border: brandAccent,
                  gradient: (brandColors.accentPalette && brandColors.accentPalette.length >= 6)
                    ? brandColors.accentPalette
                    : [brandPrimary, brandAccent, '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
                }}
                hideControls={true}
                idOverride={`presentation-capture-widget-${w.id}-card`}
                onEdit={() => {}}
                onDuplicate={() => {}}
                onDelete={() => {}}
                onResize={() => {}}
              />
            </div>
          );
        })}
      </div>

      {/* Corporate Brand Master Template Studio Modal */}
      {isBrandModalOpen && (
        <BrandTemplateModal
          isOpen={isBrandModalOpen}
          onClose={() => setIsBrandModalOpen(false)}
          activeTemplate={brandTemplate}
          onApplyTemplate={(newT) => setBrandTemplate(newT)}
        />
      )}
    </div>
  );
}
