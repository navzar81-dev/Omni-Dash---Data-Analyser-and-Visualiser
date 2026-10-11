import React, { useState, useRef } from 'react';
import {
  FileCode,
  Upload,
  CheckCircle2,
  X,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Type,
  Palette,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import {
  BUILTIN_BRAND_PRESETS,
  parsePptxTemplateFile,
  saveActiveBrandTemplate
} from '../services/brandTemplateService';

export function BrandTemplateModal({
  isOpen,
  onClose,
  activeTemplate,
  onApplyTemplate
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(activeTemplate || BUILTIN_BRAND_PRESETS[0]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [customLogoUrl, setCustomLogoUrl] = useState(activeTemplate?.logoUrl || null);
  const [footerDisclaimer, setFooterDisclaimer] = useState(
    activeTemplate?.footerDisclaimer || 'Confidential & Proprietary'
  );
  const [showAccentStripe, setShowAccentStripe] = useState(
    activeTemplate?.showAccentStripe !== false
  );
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!/\.(pptx|potx)$/i.test(file.name)) {
      setParseError('Please upload a valid PowerPoint Master Template file (.pptx or .potx)');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    const result = await parsePptxTemplateFile(file);
    setIsParsing(false);

    if (result.success && result.template) {
      setSelectedTemplate(result.template);
      if (result.template.logoUrl) {
        setCustomLogoUrl(result.template.logoUrl);
      }
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

  const handleApply = () => {
    const finalTemplate = {
      ...selectedTemplate,
      logoUrl: customLogoUrl,
      footerDisclaimer,
      showAccentStripe
    };
    saveActiveBrandTemplate(finalTemplate);
    onApplyTemplate(finalTemplate);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                Brand Master Template Studio
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Upload an official PowerPoint deck (.pptx / .potx) to automatically extract corporate colors, fonts & logos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* PPT Upload Dropzone */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              Upload Corporate PowerPoint Template (.pptx / .potx)
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: dragActive ? '2px dashed #2563eb' : '2px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '24px 16px',
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
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(56, 189, 248, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8'
                  }}
                >
                  <Upload size={22} />
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                  {isParsing ? 'Analyzing PowerPoint Template Structure...' : 'Drop PowerPoint Template here, or browse'}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, maxWidth: '460px' }}>
                  Client-side zero-cloud extraction parses theme XML colors, font schemes, master backgrounds, and slide media assets automatically.
                </p>
              </div>
            </div>
            {parseError && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  fontSize: '0.8rem'
                }}
              >
                {parseError}
              </div>
            )}
          </div>

          {/* Active / Extracted Template Inspector */}
          {selectedTemplate && (
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      background: selectedTemplate.isUploaded ? 'rgba(16, 185, 129, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                      color: selectedTemplate.isUploaded ? '#10b981' : '#38bdf8'
                    }}
                  >
                    {selectedTemplate.isUploaded ? 'EXTRACTED FROM PPT' : 'ENTERPRISE PRESET'}
                  </span>
                  <strong style={{ fontSize: '1rem' }}>{selectedTemplate.name}</strong>
                </div>
                {selectedTemplate.fileName && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {selectedTemplate.fileName}
                  </span>
                )}
              </div>

              {/* Color Ramp & Palette */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '600', marginBottom: '8px' }}>
                  <Palette size={15} /> Brand Color Scheme
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '130px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: selectedTemplate.colors.primary,
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                    <div style={{ fontSize: '0.75rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Primary</div>
                      <strong>{selectedTemplate.colors.primary}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '130px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: selectedTemplate.colors.accent,
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                    <div style={{ fontSize: '0.75rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Accent</div>
                      <strong>{selectedTemplate.colors.accent}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '130px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: selectedTemplate.colors.background,
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                    <div style={{ fontSize: '0.75rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Slide Canvas</div>
                      <strong>{selectedTemplate.colors.background}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '130px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: selectedTemplate.colors.surface,
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                    <div style={{ fontSize: '0.75rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Card Surface</div>
                      <strong>{selectedTemplate.colors.surface}</strong>
                    </div>
                  </div>
                </div>

                {/* 6-Color Chart Palette Preview */}
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Extracted Chart Accent Ramp (Applied to presentation visuals):
                  </div>
                  <div style={{ display: 'flex', gap: '4px', height: '10px', borderRadius: '4px', overflow: 'hidden' }}>
                    {selectedTemplate.colors.accentPalette?.map((color, idx) => (
                      <div key={idx} style={{ flex: 1, background: color }} title={`Accent ${idx + 1}: ${color}`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Typography & Fonts */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '600', marginBottom: '8px' }}>
                  <Type size={15} /> Typography Scheme
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Heading Font: </span>
                    <strong>{selectedTemplate.fonts?.heading || 'Arial'}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Body / Bullet Font: </span>
                    <strong>{selectedTemplate.fonts?.body || 'Calibri'}</strong>
                  </div>
                </div>
              </div>

              {/* Extracted Media / Logo Selection */}
              {selectedTemplate.extractedMedia && selectedTemplate.extractedMedia.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '600', marginBottom: '8px' }}>
                    <ImageIcon size={15} /> Extracted Corporate Media ({selectedTemplate.extractedMedia.length} found)
                  </div>
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
                    {selectedTemplate.extractedMedia.map((media, idx) => {
                      const isSelected = customLogoUrl === media.dataUrl;
                      return (
                        <div
                          key={idx}
                          onClick={() => setCustomLogoUrl(media.dataUrl)}
                          style={{
                            padding: '6px',
                            border: isSelected ? '2px solid #2563eb' : '1px solid var(--border-color)',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            minWidth: '80px'
                          }}
                        >
                          <img
                            src={media.dataUrl}
                            alt={media.name}
                            style={{ maxHeight: '36px', maxWidth: '70px', objectFit: 'contain' }}
                          />
                          <span style={{ fontSize: '0.68rem', color: isSelected ? '#38bdf8' : 'var(--text-muted)' }}>
                            {isSelected ? 'Active Logo' : `Asset ${idx + 1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Master Decor & Footer Settings */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Slide Master Confidentiality Tag
                    </label>
                    <input
                      type="text"
                      className="input input-sm"
                      value={footerDisclaimer}
                      onChange={(e) => setFooterDisclaimer(e.target.value)}
                      placeholder="e.g. Confidential & Proprietary"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '18px' }}>
                    <input
                      type="checkbox"
                      id="stripe-toggle"
                      checked={showAccentStripe}
                      onChange={(e) => setShowAccentStripe(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="stripe-toggle" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
                      Include Top Master Accent Stripe
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Built-in Enterprise Presets Selection */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              Or Choose an Enterprise Preset
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '10px' }}>
              {BUILTIN_BRAND_PRESETS.map((preset) => {
                const isSelected = selectedTemplate?.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setSelectedTemplate(preset);
                      setCustomLogoUrl(preset.logoUrl);
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.85rem' }}>{preset.name}</strong>
                      {isSelected && <CheckCircle2 size={16} color="#38bdf8" />}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {preset.category}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          background: preset.colors.background,
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}
                        title="Background"
                      />
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          background: preset.colors.primary
                        }}
                        title="Primary"
                      />
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          background: preset.colors.accent
                        }}
                        title="Accent"
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {preset.fonts.heading}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleApply}>
            <Sparkles size={16} /> Apply Template to Deck
          </button>
        </div>
      </div>
    </div>
  );
}
