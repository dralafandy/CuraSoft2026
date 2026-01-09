import React, { useState } from 'react';

interface LineChartProps {
    title: string;
    data: { label: string; value: number }[];
    colorClass: string;
    onPointClick?: (point: { label: string; value: number; index: number }) => void;
}

const LineChart: React.FC<LineChartProps> = ({ title, data, colorClass, onPointClick }) => {
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    const points = data.map((item, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((item.value - minValue) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    const handlePointMouseEnter = (event: React.MouseEvent, item: { label: string; value: number }, index: number) => {
        setHoveredPoint(index);
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltip({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
            content: `${item.label}: ${item.value.toLocaleString()}`
        });
    };

    const handlePointMouseLeave = () => {
        setHoveredPoint(null);
        setTooltip(null);
    };

    const handlePointClick = (item: { label: string; value: number }, index: number) => {
        if (onPointClick) {
            onPointClick({ ...item, index });
        }
    };

    return (
        <div className="w-full relative">
            {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
            <div className="relative h-64">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Grid lines */}
                    <defs>
                        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
                        </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />

                    {/* Line */}
                    <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={colorClass}
                        points={points}
                    />

                    {/* Data points */}
                    {data.map((item, index) => {
                        const x = (index / (data.length - 1)) * 100;
                        const y = 100 - ((item.value - minValue) / range) * 100;
                        return (
                            <circle
                                key={index}
                                cx={x}
                                cy={y}
                                r={hoveredPoint === index ? "3" : "1.5"}
                                fill="currentColor"
                                className={colorClass}
                                style={{
                                    cursor: onPointClick ? 'pointer' : 'default',
                                    transition: 'r 0.2s ease'
                                }}
                                onMouseEnter={(e) => handlePointMouseEnter(e, item, index)}
                                onMouseLeave={handlePointMouseLeave}
                                onClick={() => handlePointClick(item, index)}
                            />
                        );
                    })}
                </svg>

                {/* Labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-500">
                    {data.map((item, index) => (
                        <span key={index} className="text-center">{item.label}</span>
                    ))}
                </div>

                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-slate-500 -ml-8">
                    <span>{maxValue.toLocaleString()}</span>
                    <span>{((maxValue + minValue) / 2).toLocaleString()}</span>
                    <span>{minValue.toLocaleString()}</span>
                </div>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="absolute bg-black text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-10"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    {tooltip.content}
                </div>
            )}

            {/* Interactive legend */}
            <div className="mt-4 flex flex-wrap gap-2">
                {data.map((item, index) => (
                    <button
                        key={index}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            hoveredPoint === index
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        onMouseEnter={() => setHoveredPoint(index)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        onClick={() => handlePointClick(item, index)}
                        style={{ cursor: onPointClick ? 'pointer' : 'default' }}
                    >
                        {item.label}: {item.value.toLocaleString()}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LineChart;