import React, { useState } from 'react';
import {
  Palette,
  Layout,
  Type,
  Image,
  CheckCircle2,
  X,
  RotateCcw,
  Sliders,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

const THEME_OPTIONS = [
  { id: 'midnight', name: 'Midnight Cyber', desc: 'Deep executive dark with indigo & purple aura', bg: '#07090e', accent: '#6366f1' },
  { id: 'light', name: 'Clean Corporate', desc: 'Bright slate white for high-clarity day reports', bg: '#f8fafc', accent: '#4f46e5' },
  { id: 'emerald', name: 'Wealth & Financial', desc: 'Dark emerald green calibrated for banking & P&L', bg: '#061a14', accent: '#10b981' },
  { id: 'sapphire', name: 'Sapphire Ocean', desc: 'Deep royal navy blue with electric cobalt highlights', bg: '#081325', accent: '#3b82f6' },
  { id: 'obsidian-red', name: 'Obsidian Crimson', desc: 'Ultra-dark carbon black with ruby red highlights', bg: '#0c0708', accent: '#f43f5e' },
  { id: 'cyberpunk', name: 'High-Contrast Neon', desc: 'Vibrant magenta & cyan neon for modern dashboards', bg: '#0f051d', accent: '#d946ef' }
];

const ACCENT_PRESETS = [
  { name: 'Indigo', color: '#6366f1' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Sapphire', color: '#3b82f6' },
  { name: 'Ruby', color: '#f43f5e' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Cyan', color: '#06b6d4' },
  { name: 'Purple', color: '#a855f7' }
];

export function BrandingModal({
  isOpen,
  onClose,
  branding,
  onSaveBranding,
  currentTheme,
  onSelectTheme
}) {
  const [brandTitle, setBrandTitle] = useState(branding?.title || 'OmniDash.BI');
  const [brandSubtitle, setBrandSubtitle] = useState(
    branding?.subtitle || 'Enterprise Business Analytics & Presentation Studio'
  );
  const [accentColor, setAccentColor] = useState(branding?.accentColor || '#6366f1');
  const [gridDensity, setGridDensity] = useState(branding?.gridDensity || 'spacious'); // 'spacious' | 'compact'
  const [logoUrl, setLogoUrl] = useState(branding?.logoUrl || '');

  if (!isOpen) return null;

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetDefaults = () => {
    setBrandTitle('OmniDash.BI');
    setBrandSubtitle('Enterprise Business Analytics & Presentation Studio');
    setAccentColor('#6366f1');
    setGridDensity('spacious');
    setLogoUrl('');
    onSelectTheme('midnight');
  };

  const handleSave = () => {
    onSaveBranding({
      title: brandTitle.trim() || 'OmniDash.BI',
      subtitle: brandSubtitle.trim() || 'Enterprise Business Analytics',
      accentColor,
      gridDensity,
      logoUrl
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        style={{
          width: '740px',
          maxWidth: '92vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                padding: '6px',
                borderRadius: '8px',
                color: '#fff',
                display: 'flex'
              }}>
                <Palette size={18} />
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Branding & Visual Presentation Suite
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
              Customize brand labels, executive themes, accent color tokens, logo, and dashboard grid density.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px 8px'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px', paddingRight: '4px' }}>
          {/* Section 1: Themes Catalog */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
              Executive Color Palettes & Contrast Themes
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {THEME_OPTIONS.map(th => {
                const isSelected = currentTheme === th.id;
                return (
                  <div
                    key={th.id}
                    onClick={() => onSelectTheme(th.id)}
                    style={{
                      background: th.bg,
                      border: isSelected ? `2px solid ${th.accent}` : '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 15px ${th.accent}40` : 'none',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: th.id === 'light' ? '#0f172a' : '#fff' }}>
                        {th.name}
                      </span>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: th.accent }} />
                    </div>
                    <p style={{ fontSize: '0.7rem', color: th.id === 'light' ? '#64748b' : '#94a3b8', lineHeight: 1.3 }}>
                      {th.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Brand Identity */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '12px' }}>
              Company / Dashboard Identity
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Dashboard / Company Title:
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={brandTitle}
                  onChange={e => setBrandTitle(e.target.value)}
                  style={{ width: '100%', height: '36px', fontSize: '0.82rem' }}
                  placeholder="e.g. Acme Corp BI"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Subtitle / Department:
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={brandSubtitle}
                  onChange={e => setBrandSubtitle(e.target.value)}
                  style={{ width: '100%', height: '36px', fontSize: '0.82rem' }}
                  placeholder="e.g. Global Financial Operations"
                />
              </div>
            </div>

            {/* Custom Logo Upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Custom Logo (PNG, SVG, JPG):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ fontSize: '0.75rem', width: '100%' }}
                />
              </div>
              {logoUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    style={{ maxHeight: '36px', maxWidth: '80px', borderRadius: '4px', objectFit: 'contain', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', padding: '2px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '0.72rem' }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Accent Color & Grid Density */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px' }}>
              {/* Accent Color Tokens */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Primary Brand Accent Token:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {ACCENT_PRESETS.map(ac => (
                    <div
                      key={ac.name}
                      onClick={() => setAccentColor(ac.color)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: ac.color,
                        cursor: 'pointer',
                        border: accentColor === ac.color ? '2px solid #ffffff' : '2px solid transparent',
                        boxShadow: accentColor === ac.color ? '0 0 10px rgba(255,255,255,0.4)' : 'none',
                        transition: 'transform 0.15s ease'
                      }}
                      title={ac.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer' }}
                    title="Custom Hex Picker"
                  />
                </div>
              </div>

              {/* Grid Density */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Dashboard Grid Density:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${gridDensity === 'spacious' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setGridDensity('spacious')}
                  >
                    Spacious (Default)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${gridDensity === 'compact' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setGridDensity('compact')}
                  >
                    Compact (Dense)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResetDefaults}
            style={{ gap: '6px' }}
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              style={{ gap: '6px' }}
            >
              <CheckCircle2 size={16} />
              <span>Apply Branding Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
