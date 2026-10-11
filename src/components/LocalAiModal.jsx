import React, { useState, useRef } from 'react';
import {
  Cpu,
  X,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  HardDrive,
  ExternalLink,
  Sliders,
  RefreshCw
} from 'lucide-react';
import { localAiEngine } from '../services/localAiEngine';

const RECOMMENDED_GGUF_MODELS = [
  {
    name: 'Llama-3.2-1B-Instruct (Q4_K_M)',
    size: '800 MB',
    ram: '~1.1 GB',
    desc: 'Ultra-lightweight, optimal for 8GB or 4GB laptops. Strong business reasoning.',
    link: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF'
  },
  {
    name: 'Qwen-2.5-1.5B-Instruct (Q4_K_M)',
    size: '1.1 GB',
    ram: '~1.4 GB',
    desc: 'Superb numerical calculation, tabular data understanding, and formula synthesis.',
    link: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF'
  },
  {
    name: 'SmolLM2-1.7B-Instruct (Q4_K_M)',
    size: '1.0 GB',
    ram: '~1.3 GB',
    desc: 'Fast conversational executive summarizer with low resource consumption.',
    link: 'https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF'
  }
];

export function LocalAiModal({
  isOpen,
  onClose,
  onModelLoaded
}) {
  const [activeTab, setActiveTab] = useState('gguf'); // 'gguf' | 'airllm'
  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [modelStatus, setModelStatus] = useState(localAiEngine.modelStatus);
  const [modelName, setModelName] = useState(localAiEngine.modelName);
  const [modelSizeMb, setModelSizeMb] = useState(localAiEngine.modelSizeMb);
  const [airLlmUrl, setAirLlmUrl] = useState(localAiEngine.airLlmUrl);
  const [airLlmStatus, setAirLlmStatus] = useState(localAiEngine.airLlmAvailable ? 'connected' : 'disconnected');
  const [isTestingAirLlm, setIsTestingAirLlm] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleSelectGguf = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.gguf')) {
      setErrorMessage('Please select a valid .gguf model file.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setLoadProgress(0);

    try {
      await localAiEngine.loadLocalGgufFile(file, (pct) => setLoadProgress(pct));
      setModelStatus('ready');
      setModelName(file.name);
      setModelSizeMb(Math.round(file.size / (1024 * 1024)));
      if (onModelLoaded) onModelLoaded({ name: file.name, type: 'In-Browser GGUF' });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to initialize GGUF file in browser.');
      setModelStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestAirLlm = async () => {
    setIsTestingAirLlm(true);
    setErrorMessage(null);
    try {
      const res = await localAiEngine.checkAirLlmConnection(airLlmUrl);
      if (res.available) {
        setAirLlmStatus('connected');
        if (onModelLoaded) onModelLoaded({ name: 'AirLLM Server', type: 'Local Server' });
      } else {
        setAirLlmStatus('disconnected');
        setErrorMessage(`Could not reach AirLLM server at ${airLlmUrl}. Is "python airllm_server.py" running?`);
      }
    } catch (err) {
      setAirLlmStatus('disconnected');
      setErrorMessage(err.message);
    } finally {
      setIsTestingAirLlm(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        style={{ width: '800px', padding: '28px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
            }}>
              <Cpu size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Local AI Engine & Model Settings</h2>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                100% offline, privacy-first AI reasoning on 8GB laptops without cloud dependencies
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('gguf')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'gguf' ? '2px solid #10b981' : '2px solid transparent',
              padding: '8px 16px',
              color: activeTab === 'gguf' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <HardDrive size={15} color="#10b981" />
            <span>In-Browser Local GGUF (Wllama / WebGPU)</span>
          </button>

          <button
            onClick={() => setActiveTab('airllm')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'airllm' ? '2px solid #6366f1' : '2px solid transparent',
              padding: '8px 16px',
              color: activeTab === 'airllm' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Server size={15} color="#818cf8" />
            <span>AirLLM Python Server (Layer-Offloading)</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#fb7185',
            fontSize: '0.8rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: In-Browser GGUF */}
        {activeTab === 'gguf' && (
          <div>
            {/* Status Card */}
            <div className="glass-panel" style={{
              padding: '16px',
              marginBottom: '20px',
              background: modelStatus === 'ready' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${modelStatus === 'ready' ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: modelStatus === 'ready' ? '#10b981' : '#f59e0b',
                    boxShadow: modelStatus === 'ready' ? '0 0 10px #10b981' : 'none'
                  }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {modelStatus === 'ready' ? `Model Loaded: ${modelName}` : 'No Local GGUF Model Loaded'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {modelStatus === 'ready'
                        ? `Memory Footprint: ~${modelSizeMb} MB · WebAssembly / WebGPU active`
                        : 'Select a locally downloaded .gguf file from your hard drive to run completely offline'}
                    </div>
                  </div>
                </div>

                {/* File Upload Trigger */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleSelectGguf}
                    accept=".gguf"
                    style={{ display: 'none' }}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    style={{ gap: '6px' }}
                  >
                    <Upload size={14} />
                    <span>{loading ? `Loading (${loadProgress}%)...` : 'Load Local .gguf File'}</span>
                  </button>
                </div>
              </div>

              {/* Progress bar if loading */}
              {loading && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${loadProgress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                      transition: 'width 0.2s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                    Mapping weights into memory: {loadProgress}%
                  </div>
                </div>
              )}
            </div>

            {/* Recommended 8GB Laptop Models */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Recommended GGUF Models for 8GB Laptops:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {RECOMMENDED_GGUF_MODELS.map(m => (
                  <div
                    key={m.name}
                    className="glass-panel"
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{m.name}</span>
                        <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>Size: {m.size}</span>
                        <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>RAM: {m.ram}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {m.desc}
                      </div>
                    </div>
                    <a
                      href={m.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '4px', fontSize: '0.72rem', textDecoration: 'none' }}
                    >
                      <span>HuggingFace</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AirLLM Python Server */}
        {activeTab === 'airllm' && (
          <div>
            <div className="glass-panel" style={{ padding: '18px', marginBottom: '20px', background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                AirLLM Companion Server Configuration
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
                AirLLM streams model layers sequentially from your SSD/disk into RAM/VRAM, allowing you to run larger 8B-70B models on 8GB laptops.
              </p>

              {/* Endpoint Input */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={airLlmUrl}
                  onChange={e => setAirLlmUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleTestAirLlm}
                  disabled={isTestingAirLlm}
                  style={{ gap: '6px' }}
                >
                  <RefreshCw size={13} className={isTestingAirLlm ? 'animate-pulse-slow' : ''} />
                  <span>{isTestingAirLlm ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>

              {/* Connection Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <span>Status:</span>
                <span className={`badge ${airLlmStatus === 'connected' ? 'badge-emerald' : 'badge-amber'}`}>
                  {airLlmStatus === 'connected' ? 'Connected to AirLLM Server' : 'Disconnected / Server Not Running'}
                </span>
              </div>
            </div>

            {/* Launch Instructions */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.76rem',
              color: 'var(--text-muted)'
            }}>
              <div style={{ color: '#818cf8', fontWeight: 700, marginBottom: '6px' }}>
                # How to launch your local AirLLM server:
              </div>
              <div>pip install airllm fastapi uvicorn torch</div>
              <div style={{ marginTop: '4px', color: '#f8fafc' }}>
                python airllm_server.py --model_path meta-llama/Llama-3.2-1B-Instruct --port 8000
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
