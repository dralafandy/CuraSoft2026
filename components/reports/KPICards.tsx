import React from 'react';
import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'indigo' | 'pink' | 'teal' | 'cyan' | 'lime';
  formatValue?: (value: string | number) => string;
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  red: 'from-red-500 to-red-600',
  yellow: 'from-yellow-500 to-yellow-600',
  purple: 'from-purple-500 to-purple-600',
  orange: 'from-orange-500 to-orange-600',
  indigo: 'from-indigo-500 to-indigo-600',
  pink: 'from-pink-500 to-pink-600',
  teal: 'from-teal-500 to-teal-600',
  cyan: 'from-cyan-500 to-cyan-600',
  lime: 'from-lime-500 to-lime-600'
};

const KPIContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {children}
    </div>
  );
};

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  formatValue
}) => {
  const formattedValue = formatValue ? formatValue(value) : value;
  const isProfit = typeof value === 'number' && value >= 0;
  const isLoss = typeof value === 'number' && value < 0;

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="p-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>{trend.isPositive ? '▲' : '▼'}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-gray-500">{trend.label}</span>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="text-2xl font-bold text-gray-900">
            {formattedValue}
          </div>
          {typeof value === 'number' && (
            <div className="flex space-x-2 text-xs text-gray-500">
              <span className={isProfit ? 'text-green-600' : isLoss ? 'text-red-600' : 'text-gray-600'}>
                {isProfit ? 'ربح' : isLoss ? 'خسارة' : 'محايد'}
              </span>
            </div>
          )}
        </div>

        <div className={`w-16 h-16 bg-gradient-to-br ${colorClasses[color]} rounded-full flex items-center justify-center shadow-lg`}>
          {icon && React.cloneElement(icon as React.ReactElement, { 
            className: 'w-8 h-8 text-white' 
          })}
        </div>
      </div>

      {/* Decorative accent */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </motion.div>
  );
};

export { KPICard, KPIContainer };