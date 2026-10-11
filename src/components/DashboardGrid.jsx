import React, { useState } from 'react';
import { WidgetCard } from './WidgetCard';
import { Plus } from 'lucide-react';

export function DashboardGrid({
  widgets,
  data,
  theme,
  onAddWidget,
  onEditWidget,
  onDuplicateWidget,
  onDeleteWidget,
  onResizeWidget,
  onReorderWidgets
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    // Left drag zone
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...widgets];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    if (onReorderWidgets) {
      onReorderWidgets(reordered);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="dashboard-grid-container" style={{ margin: '0 20px 20px 20px' }}>
      <div className="dashboard-widgets-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '20px'
      }}>
        {widgets.map((w, index) => (
          <WidgetCard
            key={`${w.id}-${theme || 'dark'}`}
            widget={w}
            data={data}
            theme={theme}
            onEdit={onEditWidget}
            onDuplicate={onDuplicateWidget}
            onDelete={onDeleteWidget}
            onResize={onResizeWidget}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            isDragging={draggedIndex === index}
            isDropTarget={dragOverIndex === index && draggedIndex !== index}
          />
        ))}

        {/* Add Widget Ghost Card */}
        <div
          onClick={onAddWidget}
          className="glass-panel"
          style={{
            gridColumn: widgets.length % 2 === 1 ? 'span 6' : 'span 12',
            minHeight: '160px',
            border: '2px dashed var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            gap: '8px',
            color: 'var(--text-muted)',
            transition: 'all 0.2s ease',
            background: 'rgba(255, 255, 255, 0.01)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#6366f1';
            e.currentTarget.style.color = '#818cf8';
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
          }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6366f1'
          }}>
            <Plus size={22} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Add Custom Reporting Widget</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Choose dimensions, measures, calculations & chart formats</div>
        </div>
      </div>
    </div>
  );
}
