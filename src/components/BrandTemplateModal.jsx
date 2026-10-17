import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  CheckCircle2,
  X,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Type,
  Palette,
  Sun,
  Moon,
  Eye
} from 'lucide-react';
import {
  BUILTIN_BRAND_PRESETS,
  parsePptxTemplateFile,
  saveActiveBrandTemplate,
  loadActiveBrandTemplate,
  saveUploadedBrandTemplate,
  loadUploadedBrandTemplate,
  toggleTemplateContrastMode,
  isColorDark
} from '../services/brandTemplateService';

export function BrandTemplateModal({
  isOpen,
  onClose,
  activeTemplate,
  onApplyTemplate
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(() => activeTemplate || loadActiveBrandTemplate());
  const [uploadedTemplate, setUploadedTemplate] = useState(() => loadUploadedBrandTemplate());
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [parseSuccessMsg, setParseSuccessMsg] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [customLogoUrl, setCustomLogoUrl] = useState(activeTemplate?.logoUrl || null);
  const [footerDisclaimer, setFooterDisclaimer] = useState(
    activeTemplate?.footerDisclaimer || 'Confidential & Proprietary — For Executive Board Review'
  );
  const [showAccentStripe, setShowAccentStripe] = useState(
    activeTemplate?.showAccentStripe !== false
  );
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // Sync state if activeTemplate prop updates
  useEffect(() => {
    if (activeTemplate) {
      setSelectedTemplate(activeTemplate);
      if (activeTemplate.logoUrl) setCustomLogoUrl(activeTemplate.logoUrl);
      if (activeTemplate.footerDisclaimer) setFooterDisclaimer(activeTemplate.footerDisclaimer);
      if (activeTemplate.showAccentStripe !== undefined) setShowAccentStripe(activeTemplate.showAccentStripe);
    }
  }, [activeTemplate]);

  if (!isOpen) return null;

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!/\.(pptx|potx)$/i.test(file.name)) {
      setParseError('Please upload a valid PowerPoint Master Template file (.pptx or .potx)');
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setParseSuccessMsg(null);

    const result = await parsePptxTemplateFile(file);
    setIsParsing(false);

    if (result.success && result.template) {
      setSelectedTemplate(result.template);
      setUploadedTemplate(result.template);
      if (result.template.logoUrl) {
        setCustomLogoUrl(result.template.logoUrl);
      }
      setParseSuccessMsg(
        `Successfully extracted ${result.colorsFound || 6} brand colors and ${result.mediaCount || 0} media assets from "${file.name}"`
      );
    } else {
      setParseError(result.error || 'Failed to extract PowerPoint template properties.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  // Switch to a chosen preset or uploaded template
  const handleSelectPalette = (template) => {
    setSelectedTemplate(template);
    if (template.logoUrl) {
      setCustomLogoUrl(template.logoUrl);
    }
    if (template.footerDisclaimer) {
      setFooterDisclaimer(template.footerDisclaimer);
    }
    setParseError(null);
  };

  // Toggle canvas contrast mode (Dark / Light)
  const handleToggleContrast = () => {
    setSelectedTemplate(prev => toggleTemplateContrastMode(prev));
  };

  // Modify an individual color channel
  const handleColorChange = (key, hex) => {
    setSelectedTemplate(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: hex
      }
    }));
  };

  // Modify a color within the 6-color Chart Accent Ramp
  const handleAccentPaletteColorChange = (index, hex) => {
    setSelectedTemplate(prev => {
      const newPalette = [...(prev.colors.accentPalette || ['#2563eb', '#38bdf8', '#0ea5e9', '#6366f1', '#10b981', '#f59e0b'])];
      newPalette[index] = hex;
      return {
        ...prev,
        colors: {
          ...prev.colors,
          accentPalette: newPalette
        }
      };
    });
  };

  // Quick action: Set an accent ramp color as Primary
  const handleSetRampAsPrimary = (color) => {
    handleColorChange('primary', color);
  };

  // Quick action: Set an accent ramp color as Accent
  const handleSetRampAsAccent = (color) => {
    handleColorChange('accent', color);
  };

  // Custom logo upload directly
  const handleCustomLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomLogoUrl(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    const finalTemplate = {
      ...selectedTemplate,
      logoUrl: customLogoUrl,
      footerDisclaimer,
      showAccentStripe
    };
    saveActiveBrandTemplate(finalTemplate);
    if (finalTemplate.isUploaded) {
      saveUploadedBrandTemplate(finalTemplate);
    }
    onApplyTemplate(finalTemplate);
    onClose();
  };

  const colors = selectedTemplate?.colors || BUILTIN_BRAND_PRESETS[0].colors;
  const isDark = isColorDark(colors.background);
  const ramp = colors.accentPalette && colors.accentPalette.length >= 6
    ? colors.accentPalette
    : ['#2563eb', '#38bdf8', '#0ea5e9', '#6366f1', '#10b981', '#f59e0b'];

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          width: '920px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)'
        }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: `0 4px 14px ${colors.primary}44`
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
                Brand Master Template Studio
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Upload an official PowerPoint deck (.pptx / .potx) or toggle between executive color palettes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: '50%' }}
            title="Close Brand Studio"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* PPT Upload Dropzone */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                Upload Corporate PowerPoint Master (.pptx / .potx)
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Zero-cloud client-side XML extraction
              </span>
            </div>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: dragActive ? '2px dashed #2563eb' : '2px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '20px 16px',
                textAlign: 'center',
                background: dragActive ? 'rgba(37, 99, 235, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pptx,.potx"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: `${colors.primary}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.primary
                  }}
                >
                  <Upload size={20} />
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: '600' }}>
                  {isParsing ? 'Extracting Theme XML, Master Layouts & Colors...' : 'Drop PowerPoint Template here, or click to browse'}
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, maxWidth: '500px' }}>
                  Extracts color schemes, slide master dark/light backgrounds, font schemes, slide shapes, and embedded logos automatically.
                </p>
              </div>
            </div>

            {parseError && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#ef4444',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <X size={16} />
                <span>{parseError}</span>
              </div>
            )}

            {parseSuccessMsg && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#10b981',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle2 size={16} />
                <span>{parseSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* PALETTE TOGGLE CATALOG - Lets users toggle between uploaded template & enterprise palettes */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Palette size={16} color={colors.primary} />
                <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>
                  Toggle Between Corporate Color Palettes
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Click any palette to switch instantly
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
              {/* If an uploaded deck template exists, render it as the first selectable card */}
              {uploadedTemplate && (
                <div
                  onClick={() => handleSelectPalette(uploadedTemplate)}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: selectedTemplate?.id === uploadedTemplate.id
                      ? `2px solid ${colors.primary}`
                      : '1px solid var(--border-color)',
                    background: selectedTemplate?.id === uploadedTemplate.id
                      ? `${colors.primary}18`
                      : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: '800',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981'
                      }}
                    >
                      UPLOADED PPTX
                    </span>
                    {selectedTemplate?.id === uploadedTemplate.id && (
                      <CheckCircle2 size={16} color={colors.primary} />
                    )}
                  </div>
                  <strong style={{ fontSize: '0.84rem', display: 'block', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {uploadedTemplate.name}
                  </strong>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Extracted from Deck
                  </div>
                  {/* Swatch ramp */}
                  <div style={{ display: 'flex', gap: '3px', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    {(uploadedTemplate.colors.accentPalette || []).slice(0, 6).map((c, i) => (
                      <div key={i} style={{ flex: 1, background: c }} />
                    ))}
                  </div>
                </div>
              )}

              {/* All Enterprise Presets */}
              {BUILTIN_BRAND_PRESETS.map((preset) => {
                const isSelected = selectedTemplate?.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPalette(preset)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: isSelected ? `2px solid ${preset.colors.primary}` : '1px solid var(--border-color)',
                      background: isSelected ? `${preset.colors.primary}15` : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.84rem' }}>{preset.name}</strong>
                      {isSelected && <CheckCircle2 size={16} color={preset.colors.primary} />}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {preset.category}
                    </div>
                    {/* Swatch ramp */}
                    <div style={{ display: 'flex', gap: '3px', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      {preset.colors.accentPalette.slice(0, 6).map((c, i) => (
                        <div key={i} style={{ flex: 1, background: c }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVE PALETTE CONTROLS & LIVE COLOR PICKERS */}
          {selectedTemplate && (
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '18px',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      background: selectedTemplate.isUploaded ? 'rgba(16, 185, 129, 0.15)' : `${colors.primary}22`,
                      color: selectedTemplate.isUploaded ? '#10b981' : colors.primary
                    }}
                  >
                    {selectedTemplate.isUploaded ? 'EXTRACTED FROM DECK' : 'ENTERPRISE PRESET'}
                  </span>
                  <strong style={{ fontSize: '1rem' }}>{selectedTemplate.name}</strong>
                </div>

                {/* Dark / Light Canvas Mode Quick Toggle Button */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleToggleContrast}
                  style={{ gap: '6px', fontSize: '0.78rem' }}
                  title="Toggle Slide Canvas between Dark & Light themes"
                >
                  {isDark ? <Sun size={14} color="#fbbf24" /> : <Moon size={14} color="#6366f1" />}
                  <span>{isDark ? 'Switch to Light Canvas' : 'Switch to Dark Canvas'}</span>
                </button>
              </div>

              {/* 4 Interactive Brand Color Channels */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  Interactive Brand Color Scheme (Click any swatch to pick color):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                  {/* Primary Accent */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <input
                      type="color"
                      value={colors.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        background: 'transparent'
                      }}
                      title="Click to pick Primary color"
                    />
                    <div style={{ fontSize: '0.75rem', flex: 1 }}>
                      <div style={{ color: 'var(--text-muted)' }}>Primary</div>
                      <input
                        type="text"
                        value={colors.primary}
                        onChange={(e) => handleColorChange('primary', e.target.value)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          fontSize: '0.76rem',
                          fontWeight: '700',
                          width: '65px',
                          padding: 0
                        }}
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <input
                      type="color"
                      value={colors.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        background: 'transparent'
                      }}
                      title="Click to pick Accent color"
                    />
                    <div style={{ fontSize: '0.75rem', flex: 1 }}>
                      <div style={{ color: 'var(--text-muted)' }}>Accent</div>
                      <input
                        type="text"
                        value={colors.accent}
                        onChange={(e) => handleColorChange('accent', e.target.value)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          fontSize: '0.76rem',
                          fontWeight: '700',
                          width: '65px',
                          padding: 0
                        }}
                      />
                    </div>
                  </div>

                  {/* Slide Canvas Background */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <input
                      type="color"
                      value={colors.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        background: 'transparent'
                      }}
                      title="Click to pick Slide Background"
                    />
                    <div style={{ fontSize: '0.75rem', flex: 1 }}>
                      <div style={{ color: 'var(--text-muted)' }}>Slide Canvas</div>
                      <input
                        type="text"
                        value={colors.background}
                        onChange={(e) => handleColorChange('background', e.target.value)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          fontSize: '0.76rem',
                          fontWeight: '700',
                          width: '65px',
                          padding: 0
                        }}
                      />
                    </div>
                  </div>

                  {/* Card Surface */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <input
                      type="color"
                      value={colors.surface}
                      onChange={(e) => handleColorChange('surface', e.target.value)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        background: 'transparent'
                      }}
                      title="Click to pick Card Surface"
                    />
                    <div style={{ fontSize: '0.75rem', flex: 1 }}>
                      <div style={{ color: 'var(--text-muted)' }}>Card Surface</div>
                      <input
                        type="text"
                        value={colors.surface}
                        onChange={(e) => handleColorChange('surface', e.target.value)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          fontSize: '0.76rem',
                          fontWeight: '700',
                          width: '65px',
                          padding: 0
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 6-Color Chart Accent Ramp with Live Clickable Swatches */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                    6-Color Chart Accent Ramp (Applied to presentation chart bars, donuts & series):
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Click swatch to edit or assign
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                  {ramp.map((color, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '6px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleAccentPaletteColorChange(idx, e.target.value)}
                        style={{
                          width: '100%',
                          height: '26px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          background: 'transparent'
                        }}
                        title={`Click to pick Accent Color ${idx + 1}`}
                      />
                      <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {color}
                      </span>
                      <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
                        <button
                          type="button"
                          onClick={() => handleSetRampAsPrimary(color)}
                          style={{
                            fontSize: '0.6rem',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: 'none',
                            color: 'var(--text-main)',
                            cursor: 'pointer'
                          }}
                          title="Use as Primary Color"
                        >
                          P
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetRampAsAccent(color)}
                          style={{
                            fontSize: '0.6rem',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: 'none',
                            color: 'var(--text-main)',
                            cursor: 'pointer'
                          }}
                          title="Use as Accent Color"
                        >
                          A
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* LIVE REAL-TIME SLIDE PREVIEW IN WINDOW */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '700', marginBottom: '8px' }}>
                  <Eye size={15} color={colors.primary} />
                  <span>Real-time Slide Deck Preview</span>
                </div>
                <div
                  style={{
                    background: colors.background,
                    borderRadius: '10px',
                    padding: '20px 24px',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                    color: colors.textPrimary,
                    fontFamily: selectedTemplate.fonts?.body ? `"${selectedTemplate.fonts.body}", sans-serif` : 'inherit'
                  }}
                >
                  {/* Top accent stripe */}
                  {showAccentStripe && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: colors.primary
                      }}
                    />
                  )}

                  {/* Header row with logo & title */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: colors.primary,
                          color: '#ffffff',
                          display: 'inline-block',
                          marginBottom: '6px'
                        }}
                      >
                        {selectedTemplate.name}
                      </span>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '1.15rem',
                          fontWeight: '800',
                          color: colors.textPrimary,
                          fontFamily: selectedTemplate.fonts?.heading ? `"${selectedTemplate.fonts.heading}", sans-serif` : 'inherit'
                        }}
                      >
                        Quarterly Strategic Performance Overview
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: colors.accent, fontWeight: '600' }}>
                        Executive presentation deck powered by active corporate theme
                      </p>
                    </div>

                    {customLogoUrl && (
                      <img
                        src={customLogoUrl}
                        alt="Logo"
                        style={{ maxHeight: '28px', maxWidth: '100px', objectFit: 'contain' }}
                      />
                    )}
                  </div>

                  {/* Sample Content: KPI Card + Mini Chart Visual */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', alignItems: 'center' }}>
                    {/* Mini KPI Card */}
                    <div
                      style={{
                        background: colors.surface,
                        borderRadius: '8px',
                        padding: '10px 14px',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`
                      }}
                    >
                      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: colors.textMuted, fontWeight: '700' }}>
                        Net Gross Margin
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: colors.textPrimary, margin: '2px 0' }}>
                        $4,820,000
                      </div>
                      <span
                        style={{
                          fontSize: '0.64rem',
                          fontWeight: '700',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: `${colors.primary}22`,
                          color: colors.primary
                        }}
                      >
                        +14.8% YoY
                      </span>
                    </div>

                    {/* Mini Chart Bars Preview */}
                    <div
                      style={{
                        background: colors.surface,
                        borderRadius: '8px',
                        padding: '10px 14px',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        height: '70px'
                      }}
                    >
                      <div style={{ fontSize: '0.64rem', color: colors.textMuted, marginBottom: '6px' }}>
                        Live Visual Accent Colors:
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '36px' }}>
                        {ramp.slice(0, 6).map((barColor, bIdx) => {
                          const heights = ['50%', '85%', '65%', '95%', '70%', '80%'];
                          return (
                            <div
                              key={bIdx}
                              style={{
                                flex: 1,
                                height: heights[bIdx] || '60%',
                                background: barColor,
                                borderRadius: '3px 3px 0 0'
                              }}
                              title={`Chart Series ${bIdx + 1}: ${barColor}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Mini Footer */}
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '8px',
                      borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.64rem',
                      color: colors.textMuted
                    }}
                  >
                    <span>{footerDisclaimer}</span>
                    <span>OmniDash Presentation</span>
                  </div>
                </div>
              </div>

              {/* Typography Settings */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '700', marginBottom: '8px' }}>
                  <Type size={15} color={colors.primary} /> Typography Scheme
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Heading Font
                    </label>
                    <select
                      className="form-select"
                      value={selectedTemplate.fonts?.heading || 'Arial'}
                      onChange={(e) => {
                        const newHeading = e.target.value;
                        setSelectedTemplate(prev => ({
                          ...prev,
                          fonts: { ...prev.fonts, heading: newHeading }
                        }));
                      }}
                      style={{ width: '100%', fontSize: '0.8rem' }}
                    >
                      <option value="Arial">Arial (Clean Sans-Serif)</option>
                      <option value="Helvetica">Helvetica (Modern Corporate)</option>
                      <option value="Georgia">Georgia (Editorial Serif)</option>
                      <option value="Trebuchet MS">Trebuchet MS (Tech & SaaS)</option>
                      <option value="Calibri">Calibri (Executive Microsoft Standard)</option>
                      <option value="Inter">Inter (High-Definition Digital)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Body / Bullet Font
                    </label>
                    <select
                      className="form-select"
                      value={selectedTemplate.fonts?.body || 'Calibri'}
                      onChange={(e) => {
                        const newBody = e.target.value;
                        setSelectedTemplate(prev => ({
                          ...prev,
                          fonts: { ...prev.fonts, body: newBody }
                        }));
                      }}
                      style={{ width: '100%', fontSize: '0.8rem' }}
                    >
                      <option value="Calibri">Calibri (Standard)</option>
                      <option value="Arial">Arial (Universal)</option>
                      <option value="Helvetica">Helvetica (Contemporary)</option>
                      <option value="Inter">Inter (Precision)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Extracted Media / Logos & Custom Upload */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '700' }}>
                    <ImageIcon size={15} color={colors.primary} />
                    <span>Corporate Logo & Slide Assets</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => logoInputRef.current?.click()}
                    style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                  >
                    Upload Custom Logo
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleCustomLogoFile}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
                  {/* Option: None */}
                  <div
                    onClick={() => setCustomLogoUrl(null)}
                    style={{
                      padding: '8px 12px',
                      border: !customLogoUrl ? `2px solid ${colors.primary}` : '1px solid var(--border-color)',
                      borderRadius: '8px',
                      background: !customLogoUrl ? `${colors.primary}15` : 'rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '80px'
                    }}
                  >
                    No Logo
                  </div>

                  {/* Extracted media list */}
                  {(selectedTemplate.extractedMedia || []).map((media, idx) => {
                    const isSelected = customLogoUrl === media.dataUrl;
                    return (
                      <div
                        key={idx}
                        onClick={() => setCustomLogoUrl(media.dataUrl)}
                        style={{
                          padding: '6px 10px',
                          border: isSelected ? `2px solid ${colors.primary}` : '1px solid var(--border-color)',
                          borderRadius: '8px',
                          background: isSelected ? `${colors.primary}15` : 'rgba(255, 255, 255, 0.05)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          minWidth: '85px'
                        }}
                      >
                        <img
                          src={media.dataUrl}
                          alt={media.name}
                          style={{ maxHeight: '32px', maxWidth: '75px', objectFit: 'contain' }}
                        />
                        <span style={{ fontSize: '0.66rem', color: isSelected ? colors.primary : 'var(--text-muted)' }}>
                          {isSelected ? 'Active Logo' : `Asset ${idx + 1}`}
                        </span>
                      </div>
                    );
                  })}

                  {/* Active custom uploaded logo if not from extractedMedia */}
                  {customLogoUrl && !selectedTemplate.extractedMedia?.some(m => m.dataUrl === customLogoUrl) && (
                    <div
                      style={{
                        padding: '6px 10px',
                        border: `2px solid ${colors.primary}`,
                        borderRadius: '8px',
                        background: `${colors.primary}15`,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        minWidth: '85px'
                      }}
                    >
                      <img
                        src={customLogoUrl}
                        alt="Custom Logo"
                        style={{ maxHeight: '32px', maxWidth: '75px', objectFit: 'contain' }}
                      />
                      <span style={{ fontSize: '0.66rem', color: colors.primary }}>
                        Custom Logo
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Master Decor & Confidentiality Footer */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Slide Master Confidentiality Disclaimer
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={footerDisclaimer}
                      onChange={(e) => setFooterDisclaimer(e.target.value)}
                      placeholder="e.g. Confidential & Proprietary — For Executive Board Review"
                      style={{ width: '100%', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '22px' }}>
                    <input
                      type="checkbox"
                      id="stripe-toggle"
                      checked={showAccentStripe}
                      onChange={(e) => setShowAccentStripe(e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="stripe-toggle" style={{ fontSize: '0.82rem', cursor: 'pointer', fontWeight: '500' }}>
                      Render Top Master Accent Stripe on Slides
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            borderTop: '1px solid var(--border-color)',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Selected: <strong style={{ color: colors.primary }}>{selectedTemplate?.name}</strong>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleApply}
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                border: 'none',
                gap: '6px'
              }}
            >
              <Sparkles size={15} /> Apply Template to Deck
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
