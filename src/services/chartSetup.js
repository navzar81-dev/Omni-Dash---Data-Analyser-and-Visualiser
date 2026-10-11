import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

export function formatChartDataLabel(val, customFormatter, metricName = '', modifier = '') {
  if (typeof customFormatter === 'function') {
    return customFormatter(val);
  }

  if (typeof val !== 'number') return String(val);

  if (
    modifier === 'GROWTH_PCT' ||
    modifier === 'SHARE_OF_TOTAL' ||
    modifier === 'PARETO_CUMULATIVE_PCT' ||
    modifier === 'PCT_OF_MAX' ||
    modifier === 'PCT_OF_FIRST' ||
    /pct|percent|rate|ratio|margin/i.test(metricName)
  ) {
    return `${val > 0 && modifier === 'GROWTH_PCT' ? '+' : ''}${val.toFixed(1)}%`;
  }

  const isCurrency = /(revenue|cost|cogs|price|spend|profit|mrr|arr|income|ebitda|budget)/i.test(metricName);

  let formatted = '';
  const abs = Math.abs(val);
  if (abs >= 1_000_000) {
    formatted = `${(val / 1_000_000).toFixed(1)}M`;
  } else if (abs >= 1_000) {
    formatted = `${(val / 1_000).toFixed(0)}K`;
  } else {
    formatted = Number.isInteger(val) ? val.toLocaleString() : val.toFixed(1);
  }

  return isCurrency ? `$${formatted}` : formatted;
}

export const customDataLabelsPlugin = {
  id: 'customDataLabels',
  afterDatasetsDraw(chart, args, pluginOptions) {
    if (pluginOptions && pluginOptions.display === false) return;

    const chartType = chart.config.type;
    const shouldDisplay = pluginOptions?.display !== undefined
      ? pluginOptions.display
      : (chartType === 'bar' || chartType === 'line');

    if (!shouldDisplay) return;

    const { ctx, chartArea } = chart;
    if (!ctx) return;

    // Detect active theme (light or dark)
    const isLight = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light';

    // Track all rendered bounding boxes across the chart to prevent collision / overlapping
    const renderedBoxes = [];

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (!meta || meta.hidden) return;

      const totalPoints = meta.data ? meta.data.length : 0;
      if (totalPoints === 0) return;

      // Smart density throttling for dense datasets (e.g. 50+ Transaction IDs):
      let step = 1;
      if (totalPoints > 80) step = Math.ceil(totalPoints / 8);
      else if (totalPoints > 40) step = Math.ceil(totalPoints / 10);
      else if (totalPoints > 20) step = Math.ceil(totalPoints / 14);
      else if (totalPoints > 12) step = 2;

      meta.data.forEach((element, index) => {
        if (index % step !== 0) return;

        const val = dataset.data[index];
        // Skip null, NaN, and 0 (prevents stacked zero labels at bottom baseline)
        if (val === null || val === undefined || isNaN(val)) return;
        if (typeof val === 'number' && Math.abs(val) === 0 && totalPoints > 1) return;

        const text = formatChartDataLabel(
          val,
          pluginOptions?.formatter,
          pluginOptions?.metricName || dataset.label || '',
          pluginOptions?.modifier || ''
        );
        if (!text) return;

        let pos = typeof element.tooltipPosition === 'function' ? element.tooltipPosition() : { x: element.x, y: element.y };
        let x = pos.x;
        let y = pos.y;

        const isHorizontal = chart.options?.indexAxis === 'y';

        if (chartType === 'bar') {
          if (isHorizontal) {
            x += val >= 0 ? 6 : -6;
          } else {
            y += val >= 0 ? -6 : 6;
          }
        } else if (chartType === 'line') {
          y -= 8;
        }

        // Clamp to chart area so labels are never clipped off-canvas
        if (chartArea) {
          if (y < chartArea.top + 10) y = chartArea.top + 12;
          if (y > chartArea.bottom - 4) y = chartArea.bottom - 4;
          if (x < chartArea.left + 16) x = chartArea.left + 16;
          if (x > chartArea.right - 16) x = chartArea.right - 16;
        }

        ctx.save();
        ctx.font = '700 10.5px "Plus Jakarta Sans", "Inter", -apple-system, sans-serif';
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const boxWidth = textWidth + 12;
        const boxHeight = 16;

        // Bounding box for collision detection
        const box = {
          left: x - boxWidth / 2,
          right: x + boxWidth / 2,
          top: y - boxHeight,
          bottom: y + 2
        };

        // If this label collides with any already drawn label on this chart, skip it to prevent overlapping
        const hasCollision = renderedBoxes.some(b => 
          !(box.right < b.left || box.left > b.right || box.bottom < b.top || box.top > b.bottom)
        );

        if (hasCollision) {
          ctx.restore();
          return;
        }
        renderedBoxes.push(box);

        // Turn OFF any blurry shadow completely
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        // Crisp vector outline + solid fill for razor-sharp visibility without blur
        if (isLight) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.lineWidth = 3;
          ctx.lineJoin = 'round';
          ctx.strokeText(text, x, y);

          ctx.fillStyle = '#0f172a'; // Crisp Dark text on light background
          ctx.fillText(text, x, y);
        } else {
          ctx.strokeStyle = 'rgba(7, 9, 14, 0.95)';
          ctx.lineWidth = 3;
          ctx.lineJoin = 'round';
          ctx.strokeText(text, x, y);

          ctx.fillStyle = '#ffffff'; // Pure White text on dark background
          ctx.fillText(text, x, y);
        }

        ctx.restore();
      });
    });
  }
};

// Register all required Chart.js components + customDataLabelsPlugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  customDataLabelsPlugin
);

// Global styling defaults for premium look
// Global styling defaults for premium look
export function syncChartJsTheme(theme) {
  const t = theme || (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'midnight') || 'midnight';
  
  if (t === 'light') {
    ChartJS.defaults.color = '#0f172a';
    ChartJS.defaults.borderColor = 'rgba(0, 0, 0, 0.1)';
    ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(255, 255, 255, 0.96)';
    ChartJS.defaults.plugins.tooltip.titleColor = '#0f172a';
    ChartJS.defaults.plugins.tooltip.bodyColor = '#334155';
    ChartJS.defaults.plugins.tooltip.borderColor = 'rgba(0, 0, 0, 0.12)';
  } else if (t === 'emerald') {
    ChartJS.defaults.color = '#ecfdf5';
    ChartJS.defaults.borderColor = 'rgba(16, 185, 129, 0.2)';
    ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(4, 25, 18, 0.95)';
    ChartJS.defaults.plugins.tooltip.titleColor = '#ecfdf5';
    ChartJS.defaults.plugins.tooltip.bodyColor = '#a7f3d0';
    ChartJS.defaults.plugins.tooltip.borderColor = 'rgba(16, 185, 129, 0.4)';
  } else if (t === 'sapphire') {
    ChartJS.defaults.color = '#eff6ff';
    ChartJS.defaults.borderColor = 'rgba(59, 130, 246, 0.2)';
    ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(8, 23, 46, 0.95)';
    ChartJS.defaults.plugins.tooltip.titleColor = '#eff6ff';
    ChartJS.defaults.plugins.tooltip.bodyColor = '#93c5fd';
    ChartJS.defaults.plugins.tooltip.borderColor = 'rgba(59, 130, 246, 0.4)';
  } else if (t === 'obsidian-red') {
    ChartJS.defaults.color = '#fff1f2';
    ChartJS.defaults.borderColor = 'rgba(244, 63, 94, 0.2)';
    ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(26, 11, 15, 0.95)';
    ChartJS.defaults.plugins.tooltip.titleColor = '#fff1f2';
    ChartJS.defaults.plugins.tooltip.bodyColor = '#fda4af';
    ChartJS.defaults.plugins.tooltip.borderColor = 'rgba(244, 63, 94, 0.4)';
  } else if (t === 'cyberpunk') {
    ChartJS.defaults.color = '#faf5ff';
    ChartJS.defaults.borderColor = 'rgba(217, 70, 239, 0.25)';
    ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(27, 10, 52, 0.95)';
    ChartJS.defaults.plugins.tooltip.titleColor = '#faf5ff';
    ChartJS.defaults.plugins.tooltip.bodyColor = '#f0abfc';
    ChartJS.defaults.plugins.tooltip.borderColor = 'rgba(217, 70, 239, 0.5)';
  } else {
    // midnight / default dark
    ChartJS.defaults.color = '#ffffff';
    ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.16)';
    ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.95)';
    ChartJS.defaults.plugins.tooltip.titleColor = '#ffffff';
    ChartJS.defaults.plugins.tooltip.bodyColor = '#94a3b8';
    ChartJS.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.1)';
  }
}

syncChartJsTheme();
ChartJS.defaults.font.family = "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.95)';
ChartJS.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.1)';
ChartJS.defaults.plugins.tooltip.borderWidth = 1;
ChartJS.defaults.plugins.tooltip.padding = 10;
ChartJS.defaults.plugins.tooltip.cornerRadius = 8;
ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.labels.boxWidth = 8;
ChartJS.defaults.plugins.legend.labels.boxHeight = 8;

export default ChartJS;
