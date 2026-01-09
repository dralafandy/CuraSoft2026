import React, { useState, useEffect } from 'react';

interface DateRangeSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  showRangeSelector?: boolean;
  label?: string;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  selectedDate,
  onDateChange,
  onDateRangeChange,
  showRangeSelector = false,
  label = "اختر التاريخ"
}) => {
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [startDate, setStartDate] = useState(selectedDate);
  const [endDate, setEndDate] = useState(selectedDate);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (onDateRangeChange && isRangeMode) {
      onDateRangeChange(startDate, endDate);
    }
  }, [startDate, endDate, isRangeMode]);

  const quickRanges = [
    { label: 'اليوم', value: 'today' },
    { label: 'أمس', value: 'yesterday' },
    { label: 'آخر 7 أيام', value: 'last7' },
    { label: 'آخر 30 يوم', value: 'last30' },
    { label: 'هذا الشهر', value: 'thisMonth' },
    { label: 'الشهر الماضي', value: 'lastMonth' }
  ];

  const handleQuickRange = (range: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (range) {
      case 'today':
        start = new Date();
        end = new Date();
        break;
      case 'yesterday':
        start = new Date(today);
        start.setDate(today.getDate() - 1);
        end = new Date(start);
        break;
      case 'last7':
        start = new Date(today);
        start.setDate(today.getDate() - 6);
        end = today;
        break;
      case 'last30':
        start = new Date(today);
        start.setDate(today.getDate() - 29);
        end = today;
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setIsRangeMode(true);
  };

  const formatDateRange = () => {
    if (startDate === endDate) {
      return new Date(startDate).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return `${new Date(startDate).toLocaleDateString('ar-EG', {
      month: 'short',
      day: 'numeric'
    })} - ${new Date(endDate).toLocaleDateString('ar-EG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{label}</h3>
      
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        {/* Mode Toggle */}
        {showRangeSelector && (
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsRangeMode(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                !isRangeMode 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              يوم واحد
            </button>
            <button
              onClick={() => setIsRangeMode(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isRangeMode 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              نطاق زمني
            </button>
          </div>
        )}

        {/* Date Inputs */}
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {!isRangeMode ? (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          ) : (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <span className="text-gray-500 self-center">إلى</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            اختصارات
          </button>
          <button
            onClick={() => {
              if (!isRangeMode) {
                onDateChange(new Date().toISOString().split('T')[0]);
              } else {
                setStartDate(new Date().toISOString().split('T')[0]);
                setEndDate(new Date().toISOString().split('T')[0]);
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            اليوم
          </button>
        </div>
      </div>

      {/* Quick Range Selector */}
      {isOpen && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {quickRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => handleQuickRange(range.value)}
                className="px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Selection Display */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <p className="text-sm text-gray-600">المحدد حاليًا:</p>
        <p className="text-lg font-semibold text-gray-900">{formatDateRange()}</p>
      </div>
    </div>
  );
};

export default DateRangeSelector;