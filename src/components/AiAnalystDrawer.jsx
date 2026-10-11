import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Cpu,
  Copy,
  Check,
  Plus,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  FileText,
  HelpCircle,
  Presentation
} from 'lucide-react';
import { localAiEngine } from '../services/localAiEngine';

const QUICK_PROMPTS = [
  { label: 'Executive Boardroom Summary', icon: FileText, query: 'Prepare a comprehensive executive summary of this business dataset with topline performance, key drivers, and performance benchmarks.' },
  { label: 'Margin Variance & Risk Audit', icon: AlertTriangle, query: 'Analyze cost spreads, profit margin compression, anomalous variances, and customer retention risks.' },
  { label: 'Growth Strategy for Next Quarter', icon: TrendingUp, query: 'Formulate an actionable expansion strategy for the upcoming fiscal quarter based on current volume and trajectory.' },
  { label: 'Deep-Dive Outlier Analysis', icon: Sparkles, query: 'Examine identified statistical outliers (>2.2 stddev) and explain potential operational bottlenecks.' }
];

export function AiAnalystDrawer({
  isOpen,
  onClose,
  datasetMeta,
  columns,
  columnProfiles,
  kpis,
  insights,
  filteredData,
  onOpenModelSettings,
  onAddSlideWithAiAnalysis
}) {
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      role: 'assistant',
      text: `Hello! I am your **Local Business Intelligence AI Analyst**. I have ingested the current schema for **${datasetMeta?.name || 'your dataset'}** (${filteredData.length} records active).\n\nSelect a prompt below or ask any strategic question to generate offline executive insights.`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [activeEngineName, setActiveEngineName] = useState(localAiEngine.modelName ? `GGUF: ${localAiEngine.modelName}` : 'Instant Reasoner (Offline)');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  if (!isOpen) return null;

  const handleSendPrompt = async (promptText) => {
    const textToSend = promptText || inputText;
    if (!textToSend.trim() || isGenerating) return;

    const userMsgId = `usr-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    // Add user message
    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', text: textToSend }
    ]);
    setInputText('');
    setIsGenerating(true);

    // Context prompt
    const contextPrompt = localAiEngine.buildContextPrompt(
      datasetMeta,
      columns,
      columnProfiles,
      kpis,
      insights,
      textToSend
    );

    // Placeholder AI message
    setMessages(prev => [
      ...prev,
      { id: aiMsgId, role: 'assistant', text: '', isStreaming: true }
    ]);

    try {
      const result = await localAiEngine.generateAnalysis({
        prompt: textToSend,
        contextPrompt,
        onToken: (chunk, accumulated) => {
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: accumulated } : m));
        }
      });

      setActiveEngineName(result.engine);
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isStreaming: false } : m));
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: `Error generating response: ${err.message}`, isStreaming: false } : m));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div
        className="glass-panel drawer-panel"
        style={{
          width: 'min(520px, 100vw)',
          maxWidth: '100vw',
          height: '100vh',
          borderRadius: '16px 0 0 16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-15px 0 50px rgba(0, 0, 0, 0.7)',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          background: '#090d16'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Local AI Business Analyst</h3>
                <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                  Offline
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {activeEngineName}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onOpenModelSettings}
              style={{ fontSize: '0.7rem', padding: '3px 8px', gap: '4px' }}
              title="Configure local GGUF file or AirLLM server"
            >
              <Cpu size={13} color="#10b981" />
              <span>Model Settings</span>
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Executive Prompts */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.01)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: '8px' }}>
            1-Click Strategic Directives:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {QUICK_PROMPTS.map((qp, idx) => {
              const Icon = qp.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendPrompt(qp.query)}
                  disabled={isGenerating}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '7px',
                    padding: '6px 8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--text-muted)',
                    fontSize: '0.72rem',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.borderColor = '#10b981'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                >
                  <Icon size={12} color="#10b981" />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{qp.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: isUser ? '85%' : '96%',
                  background: isUser ? '#6366f1' : 'rgba(255, 255, 255, 0.03)',
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                  borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  padding: '12px 16px',
                  color: '#ffffff'
                }}
              >
                {/* Message Header (for AI) */}
                {!isUser && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>
                      <Sparkles size={12} />
                      <span>Executive Intelligence Analysis</span>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: '2px' }}
                        title="Copy Analysis"
                      >
                        {copiedId === msg.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      </button>

                      {onAddSlideWithAiAnalysis && msg.text.length > 50 && (
                        <button
                          onClick={() => onAddSlideWithAiAnalysis(msg.text)}
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '4px',
                            color: '#fbbf24',
                            fontSize: '0.68rem',
                            cursor: 'pointer',
                            padding: '1px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="Add these findings as a slide in Presentation Studio"
                        >
                          <Presentation size={10} />
                          <span>Add to Deck</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Formatted Text */}
                <div style={{
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  color: isUser ? '#ffffff' : 'var(--text-main)'
                }}>
                  {msg.text || (msg.isStreaming ? 'Synthesizing strategic analysis...' : '')}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.2)' }}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendPrompt(); }}
            style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
          >
            <input
              type="text"
              className="form-input"
              placeholder="Ask for custom analysis, KPI evaluation, or projections..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={isGenerating}
              style={{ fontSize: '0.84rem' }}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!inputText.trim() || isGenerating}
              style={{ padding: '8px 12px' }}
            >
              {isGenerating ? <RefreshCw size={15} className="animate-pulse-slow" /> : <Send size={15} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
