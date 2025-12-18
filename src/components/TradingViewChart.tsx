'use client';

import { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
  symbol: string;
  theme?: 'dark' | 'light';
  height?: number;
}

function TradingViewChartComponent({ symbol, theme = 'dark', height = 400 }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    widgetContainer.appendChild(widgetDiv);

    containerRef.current.appendChild(widgetContainer);

    // Load TradingView script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: 'D',
      timezone: 'Europe/Berlin',
      theme: theme,
      style: '1',
      locale: 'de_DE',
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      hide_volume: false,
      backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0)',
      gridColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(200, 200, 200, 0.3)',
    });

    widgetContainer.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, theme]);

  return (
    <div
      ref={containerRef}
      style={{ height: `${height}px`, width: '100%' }}
      className="rounded-lg overflow-hidden"
    />
  );
}

export const TradingViewChart = memo(TradingViewChartComponent);
