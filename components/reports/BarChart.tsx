import React from 'react';

interface BarChartProps {
    title: string;
    data: { label: string; value: number }[];
    colorClass: string;
}

const BarChart: React.FC<BarChartProps> = ({ title, data, colorClass }) => {
    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div className="w-full">
            {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
            <div className="flex items-end space-x-2 h-64">
                {data.map((item, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                        <div
                            className={`w-full ${colorClass} rounded-t`}
                            style={{ height: `${(item.value / maxValue) * 100}%` }}
                        ></div>
                        <span className="text-xs mt-2 text-center">{item.label}</span>
                        <span className="text-xs text-gray-500">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BarChart;
