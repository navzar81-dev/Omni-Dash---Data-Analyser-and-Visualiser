import React from 'react';
import { Target } from 'lucide-react';

export function GaugeWidget({ value = 75, target = 100, min = 0, max = 100, label = 'Achievement Rate', unit = '%' }) {
  // Normalize percentage
  const effectiveMax = max || 100;
  const clampedVal = Math.min(Math.max(value, min), effectiveMax);
  const percentage = Math.round(((clampedVal - min) / (effectiveMax - min)) * 100);

  // Semi-circle SVG angles: -180 to 0 degrees
  const radius = 80;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Half-circle perimeter
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  let gaugeColor = '#6366f1';
  if (percentage >= 100) gaugeColor = '#10b981';
  else if (percentage < 60) gaugeColor = '#f59e0b';
  if (percentage < 40) gaugeColor = '#f43f5e';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '10px 0' }}>
      <div style={{ position: 'relative', width: '200px', height: '110px' }}>
        <svg width="200" height="120" viewBox="0 0 200 120" style={{ overflow: 'visible' }}>
          {/* Background Track Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />

          {/* Target marker tick at 100% or target percentage */}
          {target && (
            <circle
              cx="100"
              cy="20"
              r="4"
              fill="#fbbf24"
              stroke="#0f172a"
              strokeWidth="2"
            />
          )}
        </svg>

        {/* Center Readout */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', lineHeight: 1 }}>
            {percentage}{unit}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {label}
          </div>
        </div>
      </div>

      {/* Target Comparison Meta */}
      <div style={{ display: 'flex', gap: '14px', marginTop: '14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div>Current: <strong style={{ color: 'var(--text-main)' }}>{value.toLocaleString()}</strong></div>
        <div style={{ color: 'var(--border-subtle)' }}>|</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Target size={12} color="#fbbf24" />
          <span>Target: <strong style={{ color: 'var(--text-main)' }}>{target?.toLocaleString()}</strong></span>
        </div>
      </div>
    </div>
  );
}
