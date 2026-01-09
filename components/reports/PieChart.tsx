import React, { useState } from 'react';

interface PieChartProps {
    title: string;
    data: { label: string; value: number; color: string }[];
    onSegmentClick?: (segment: { label: string; value: number; color: string; percentage: number }) => void;
}

const PieChart: React.FC<PieChartProps> = ({ title, data, onSegmentClick }) => {
    const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
        return (
            <div className="w-full">
                {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
                <div className="flex items-center justify-center h-64 text-slate-500">
                    No data to display
                </div>
            </div>
        );
    }

    const segments = data.map((item, index) => {
        const percentage = (item.value / total) * 100;
        const startAngle = data.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 360, 0);
        const endAngle = startAngle + (item.value / total) * 360;

        return {
            ...item,
            percentage,
            startAngle,
            endAngle,
        };
    });

    const handleMouseEnter = (event: React.MouseEvent, segment: any, index: number) => {
        setHoveredSegment(index);
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltip({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
            content: `${segment.label}: ${segment.value.toLocaleString()} (${segment.percentage.toFixed(1)}%)`
        });
    };

    const handleMouseLeave = () => {
        setHoveredSegment(null);
        setTooltip(null);
    };

    const handleClick = (segment: any) => {
        if (onSegmentClick) {
            onSegmentClick(segment);
        }
    };

    return (
        <div className="w-full relative">
            {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
            <div className="flex flex-col lg:flex-row items-center gap-4">
                <div className="relative w-64 h-64">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        {segments.map((segment, index) => {
                            const largeArcFlag = segment.percentage > 50 ? 1 : 0;
                            const x1 = 50 + 40 * Math.cos((segment.startAngle * Math.PI) / 180);
                            const y1 = 50 + 40 * Math.sin((segment.startAngle * Math.PI) / 180);
                            const x2 = 50 + 40 * Math.cos((segment.endAngle * Math.PI) / 180);
                            const y2 = 50 + 40 * Math.sin((segment.endAngle * Math.PI) / 180);

                            return (
                                <path
                                    key={index}
                                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                    fill={segment.color}
                                    stroke="white"
                                    strokeWidth="0.5"
                                    style={{
                                        cursor: onSegmentClick ? 'pointer' : 'default',
                                        opacity: hoveredSegment === index ? 0.8 : 1,
                                        transform: hoveredSegment === index ? 'scale(1.05)' : 'scale(1)',
                                        transformOrigin: '50% 50%'
                                    }}
                                    onMouseEnter={(e) => handleMouseEnter(e, segment, index)}
                                    onMouseLeave={handleMouseLeave}
                                    onClick={() => handleClick(segment)}
                                />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-semibold text-slate-700">
                            Total: {total.toLocaleString()}
                        </span>
                    </div>
                </div>
                <div className="flex-1 space-y-2">
                    {segments.map((segment, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                hoveredSegment === index ? 'bg-slate-100' : ''
                            }`}
                            onMouseEnter={() => setHoveredSegment(index)}
                            onMouseLeave={() => setHoveredSegment(null)}
                            onClick={() => handleClick(segment)}
                            style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
                        >
                            <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: segment.color }}
                            ></div>
                            <span className="text-sm text-slate-700 flex-1">{segment.label}</span>
                            <span className="text-sm font-semibold text-slate-800">
                                {segment.percentage.toFixed(1)}%
                            </span>
                            <span className="text-xs text-slate-500">
                                ({segment.value.toLocaleString()})
                            </span>
                        </div>
                    ))}
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
        </div>
    );
};

export default PieChart;