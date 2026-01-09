import React, { useState, useMemo, useCallback } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import { useFinancialCalculations } from '../../hooks/useFinancialCalculations';
import { openPrintWindow } from '../../utils/print';
import PrintableReport from './PrintableReport';
import InteractiveCharts from './InteractiveCharts';
import { KPIContainer, KPICard } from './KPICards';
import DateRangeSelector from './DateRangeSelector';
import ModernTable from './ModernTable';
import DataExport from './DataExport';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';

interface EnhancedDailyFinancialSummaryProps {
  clinicData: ClinicData;
}

const EnhancedDailyFinancialSummary: React.FC<EnhancedDailyFinancialSummaryProps> = ({ clinicData }) => {
  const { t, locale } = useI18n();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencyFormatter = new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency: 'EGP',
    minimumFractionDigits: 2 
  });

  // Memoized data calculations for performance
  const dailyData = useMemo(() => {
    try {
      let startOfPeriod: Date;
      let endOfPeriod: Date;

      if (isRangeMode) {
        startOfPeriod = new Date(startDate);
        startOfPeriod.setHours(0, 0, 0, 0);
        endOfPeriod = new Date(endDate);
        endOfPeriod.setHours(23, 59, 59, 999);
      } else {
        const date = new Date(selectedDate);
        startOfPeriod = new Date(date);
        startOfPeriod.setHours(0, 0, 0, 0);
        endOfPeriod = new Date(date);
        endOfPeriod.setHours(23, 59, 59, 999);
      }

      const todaysPayments = clinicData.payments.filter(p =>
        new Date(p.date) >= startOfPeriod && new Date(p.date) <= endOfPeriod
      );

      const todaysExpenses = clinicData.expenses.filter(e =>
        new Date(e.date) >= startOfPeriod && new Date(e.date) <= endOfPeriod
      );

      const todaysRevenue = todaysPayments.reduce((sum, p) => sum + p.amount, 0);
      const todaysExpensesTotal = todaysExpenses.reduce((sum, e) => sum + e.amount, 0);
      const todaysDoctorShares = todaysPayments.reduce((sum, p) => sum + p.doctorShare, 0);
      const todaysProfit = todaysRevenue - todaysExpensesTotal - todaysDoctorShares;
      const todaysDoctorPercentage = todaysRevenue > 0 ? (todaysDoctorShares / todaysRevenue) * 100 : 0;

      const pendingPayments = clinicData.treatmentRecords
        .filter(tr => new Date(tr.treatmentDate) <= endOfPeriod)
        .reduce((sum, tr) => {
          const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
          return sum + (treatmentDef ? treatmentDef.basePrice : 0);
        }, 0) -
        clinicData.payments
          .filter(p => new Date(p.date) <= endOfPeriod)
          .reduce((sum, p) => sum + p.amount, 0);

      const overdueInvoices = clinicData.treatmentRecords
        .filter(tr => {
          const treatmentDate = new Date(tr.treatmentDate);
          const daysSinceTreatment = (endOfPeriod.getTime() - treatmentDate.getTime()) / (1000 * 60 * 60 * 24);
          const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
          const treatmentCost = treatmentDef ? treatmentDef.basePrice : 0;
          return daysSinceTreatment > 30 && treatmentCost > clinicData.payments
            .filter(p => p.patientId === tr.patientId)
            .reduce((sum, p) => sum + p.amount, 0);
        })
        .reduce((sum, tr) => {
          const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
          return sum + (treatmentDef ? treatmentDef.basePrice : 0);
        }, 0);

      const todaysAppointments = clinicData.appointments.filter(a => {
        const aDate = new Date(a.startTime);
        return aDate >= startOfPeriod && aDate <= endOfPeriod;
      }).length;

      const uniquePatientsToday = new Set(todaysPayments.map(p => p.patientId)).size;

      const todaysDoctorEarnings = (() => {
        const dailyEarnings: Record<string, { name: string, earnings: number, color: string }> = {};

        todaysPayments.forEach(payment => {
          const treatmentRecord = clinicData.treatmentRecords.find(tr => tr.id === payment.treatmentRecordId);
          if (treatmentRecord) {
            const dentist = clinicData.dentists.find(d => d.id === treatmentRecord.dentistId);
            if (dentist) {
              if (!dailyEarnings[dentist.id]) {
                dailyEarnings[dentist.id] = { name: dentist.name, earnings: 0, color: dentist.color };
              }
              dailyEarnings[dentist.id].earnings += payment.doctorShare;
            }
          }
        });

        const totalEarnings = Object.values(dailyEarnings).reduce((sum, d) => sum + d.earnings, 0);

        return Object.values(dailyEarnings).map(d => ({
          ...d,
          percentage: totalEarnings > 0 ? (d.earnings / totalEarnings) * 100 : 0,
        })).sort((a, b) => b.earnings - a.earnings);
      })();

      // Calculate previous period's data for trends
      const periodLength = Math.ceil((endOfPeriod.getTime() - startOfPeriod.getTime()) / (1000 * 60 * 60 * 24));
      const previousStartOfPeriod = new Date(startOfPeriod);
      previousStartOfPeriod.setDate(previousStartOfPeriod.getDate() - periodLength);
      const previousEndOfPeriod = new Date(endOfPeriod);
      previousEndOfPeriod.setDate(previousEndOfPeriod.getDate() - periodLength);

      const previousTodaysPayments = clinicData.payments.filter(p =>
        new Date(p.date) >= previousStartOfPeriod && new Date(p.date) <= previousEndOfPeriod
      );

      const previousTodaysExpenses = clinicData.expenses.filter(e =>
        new Date(e.date) >= previousStartOfPeriod && new Date(e.date) <= previousEndOfPeriod
      );

      const previousTodaysRevenue = previousTodaysPayments.reduce((sum, p) => sum + p.amount, 0);
      const previousTodaysExpensesTotal = previousTodaysExpenses.reduce((sum, e) => sum + e.amount, 0);
      const previousTodaysDoctorShares = previousTodaysPayments.reduce((sum, p) => sum + p.doctorShare, 0);
      const previousTodaysProfit = previousTodaysRevenue - previousTodaysExpensesTotal - previousTodaysDoctorShares;

      const previousTodaysAppointments = clinicData.appointments.filter(a => {
        const aDate = new Date(a.startTime);
        return aDate >= previousStartOfPeriod && aDate <= previousEndOfPeriod;
      }).length;

      const previousUniquePatientsToday = new Set(previousTodaysPayments.map(p => p.patientId)).size;

      return {
        todaysRevenue,
        todaysExpenses: todaysExpensesTotal,
        todaysDoctorShares,
        todaysDoctorPercentage,
        todaysProfit,
        pendingPayments: Math.max(0, pendingPayments),
        overdueInvoices: Math.max(0, overdueInvoices),
        todaysPayments,
        todaysExpensesArray: todaysExpenses,
        numPayments: todaysPayments.length,
        numExpenses: todaysExpenses.length,
        todaysAppointments,
        uniquePatientsToday,
        todaysDoctorEarnings,
        // Previous period data
        previousTodaysRevenue,
        previousTodaysExpenses: previousTodaysExpensesTotal,
        previousTodaysDoctorShares,
        previousTodaysProfit,
        previousNumPayments: previousTodaysPayments.length,
        previousNumExpenses: previousTodaysExpenses.length,
        previousTodaysAppointments,
        previousUniquePatientsToday
      };
    } catch (err) {
      setError('حدث خطأ أثناء حساب البيانات');
      return null;
    }
  }, [clinicData, selectedDate, startDate, endDate, isRangeMode]);

  // Chart data preparation
  const revenueTrendData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayRevenue = clinicData.payments
        .filter(p => p.date === dateStr)
        .reduce((sum, p) => sum + p.amount, 0);

      data.push({
        name: date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
        value: dayRevenue
      });
    }
    return data;
  }, [clinicData.payments, selectedDate, locale]);

  const expensesBreakdownData = useMemo(() => {
    if (!dailyData) return [];
    
    const expenseByCategory = dailyData.todaysExpensesArray.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
    return Object.entries(expenseByCategory).map(([category, amount], index) => ({
      name: t(`expenseCategory.${category}`),
      value: amount,
      color: colors[index % colors.length]
    }));
  }, [dailyData, t]);

  const doctorEarningsData = useMemo(() => {
    if (!dailyData) return [];
    return dailyData.todaysDoctorEarnings.map(doc => ({
      name: doc.name,
      value: doc.earnings,
      percentage: doc.percentage
    }));
  }, [dailyData]);

  // Table data preparation
  const paymentsTableData = useMemo(() => {
    if (!dailyData) return [];
    return dailyData.todaysPayments.map(payment => {
      const patient = clinicData.patients.find(p => p.id === payment.patientId);
      return {
        id: payment.id,
        patientName: patient?.name || t('common.unknown'),
        amount: payment.amount,
        method: payment.method,
        date: payment.date
      };
    });
  }, [dailyData, clinicData.patients, t]);

  const expensesTableData = useMemo(() => {
    if (!dailyData) return [];
    return dailyData.todaysExpensesArray.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      category: t(`expenseCategory.${expense.category}`),
      date: expense.date
    }));
  }, [dailyData, t]);

  const handlePrint = useCallback(() => {
    if (!dailyData) return;
    
    setIsLoading(true);
    try {
      openPrintWindow(
        `${t('reports.dailyFinancialSummary.title')} - ${new Date(selectedDate).toLocaleDateString(locale)}`,
        <PrintableReport 
          clinicData={clinicData} 
          activeTab="dailyFinancialSummary" 
          startDate={selectedDate} 
          endDate={selectedDate} 
        />
      );
    } catch (err) {
      setError('حدث خطأ أثناء الطباعة');
    } finally {
      setIsLoading(false);
    }
  }, [clinicData, selectedDate, dailyData, t]);

  const handleExport = useCallback((format: string) => {
    // Export logic would go here
    console.log(`Exporting to ${format}`);
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-6">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => setError(null)}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!dailyData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              {isRangeMode ? 'ملخص مالي للفترة' : t('reports.dailyFinancialSummary.title')}
            </h1>
            <p className="text-slate-600 text-lg">{isRangeMode ? 'تحليل مفصل للأداء المالي للفترة المحددة' : t('reports.dailyFinancialSummary.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePrint}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-medium"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  جاري الطباعة...
                </>
              ) : (
                <>
                  🖨️ {t('reports.printReport')}
                </>
              )}
            </button>
            <DataExport
              data={paymentsTableData}
              filename={`daily_financial_summary_${selectedDate}`}
              title={`${t('reports.dailyFinancialSummary.title')} - ${new Date(selectedDate).toLocaleDateString(locale)}`}
              columns={[
                { key: 'patientName', title: 'اسم المريض' },
                { key: 'amount', title: 'المبلغ' },
                { key: 'method', title: 'طريقة الدفع' },
                { key: 'date', title: 'التاريخ' }
              ]}
              onExport={handleExport}
            />
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <DateRangeSelector
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onDateRangeChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
          setIsRangeMode(true);
        }}
        showRangeSelector={true}
        label={t('reports.selectDate')}
      />

      {/* KPI Cards */}
      <KPIContainer>
        <KPICard
          title={isRangeMode ? "إيرادات الفترة" : "إيرادات اليوم"}
          value={dailyData.todaysRevenue}
          icon={<span className="text-white text-xl">💰</span>}
          color="blue"
          formatValue={(val) => currencyFormatter.format(Number(val))}
          trend={dailyData.previousTodaysRevenue > 0 ? {
            value: Math.abs(((dailyData.todaysRevenue - dailyData.previousTodaysRevenue) / dailyData.previousTodaysRevenue) * 100),
            label: isRangeMode ? "مقارنة بالفترة السابقة" : "مقارنة بالأمس",
            isPositive: dailyData.todaysRevenue >= dailyData.previousTodaysRevenue
          } : undefined}
        />

        <KPICard
          title={isRangeMode ? "حصة الأطباء للفترة" : "حصة الأطباء اليوم"}
          value={dailyData.todaysDoctorShares}
          icon={<span className="text-white text-xl">👨‍⚕️</span>}
          color="green"
          formatValue={(val) => currencyFormatter.format(Number(val))}
          trend={dailyData.previousTodaysDoctorShares > 0 ? {
            value: Math.abs(((dailyData.todaysDoctorShares - dailyData.previousTodaysDoctorShares) / dailyData.previousTodaysDoctorShares) * 100),
            label: isRangeMode ? "مقارنة بالفترة السابقة" : "مقارنة بالأمس",
            isPositive: dailyData.todaysDoctorShares >= dailyData.previousTodaysDoctorShares
          } : undefined}
        />

        <KPICard
          title={isRangeMode ? "مصروفات الفترة" : "مصروفات اليوم"}
          value={dailyData.todaysExpenses}
          icon={<span className="text-white text-xl">💸</span>}
          color="red"
          formatValue={(val) => currencyFormatter.format(Number(val))}
          trend={dailyData.previousTodaysExpenses > 0 ? {
            value: Math.abs(((dailyData.todaysExpenses - dailyData.previousTodaysExpenses) / dailyData.previousTodaysExpenses) * 100),
            label: isRangeMode ? "مقارنة بالفترة السابقة" : "مقارنة بالأمس",
            isPositive: dailyData.todaysExpenses <= dailyData.previousTodaysExpenses
          } : undefined}
        />

        <KPICard
          title={isRangeMode ? "ربح الفترة" : "ربح اليوم"}
          value={dailyData.todaysProfit}
          icon={<span className="text-white text-xl">📈</span>}
          color={dailyData.todaysProfit >= 0 ? "green" : "red"}
          formatValue={(val) => currencyFormatter.format(Number(val))}
          trend={dailyData.previousTodaysProfit !== undefined && dailyData.previousTodaysProfit !== 0 ? {
            value: Math.abs(((dailyData.todaysProfit - dailyData.previousTodaysProfit) / Math.abs(dailyData.previousTodaysProfit)) * 100),
            label: isRangeMode ? "مقارنة بالفترة السابقة" : "مقارنة بالأمس",
            isPositive: dailyData.todaysProfit >= dailyData.previousTodaysProfit
          } : undefined}
        />

        <KPICard
          title="مدفوعات معلقة"
          value={dailyData.pendingPayments}
          icon={<span className="text-white text-xl">⏳</span>}
          color="orange"
          formatValue={(val) => currencyFormatter.format(Number(val))}
        />

        <KPICard
          title="فواتير متأخرة"
          value={dailyData.overdueInvoices}
          icon={<span className="text-white text-xl">⏰</span>}
          color="purple"
          formatValue={(val) => currencyFormatter.format(Number(val))}
        />

        <KPICard
          title="عدد المدفوعات"
          value={dailyData.numPayments}
          icon={<span className="text-white text-xl">💳</span>}
          color="indigo"
          trend={dailyData.previousNumPayments > 0 ? {
            value: Math.abs(((dailyData.numPayments - dailyData.previousNumPayments) / dailyData.previousNumPayments) * 100),
            label: isRangeMode ? "مقارنة بالفترة السابقة" : "مقارنة بالأمس",
            isPositive: dailyData.numPayments >= dailyData.previousNumPayments
          } : undefined}
        />

        <KPICard
          title="عدد المصروفات"
          value={dailyData.numExpenses}
          icon={<span className="text-white text-xl">📋</span>}
          color="pink"
          trend={dailyData.previousNumExpenses > 0 ? {
            value: Math.abs(((dailyData.numExpenses - dailyData.previousNumExpenses) / dailyData.previousNumExpenses) * 100),
            label: isRangeMode ? "مقارنة بالفترة السابقة" : "مقارنة بالأمس",
            isPositive: dailyData.numExpenses <= dailyData.previousNumExpenses
          } : undefined}
        />

        <KPICard
          title={isRangeMode ? "مواعيد الفترة" : "مواعيد اليوم"}
          value={dailyData.todaysAppointments}
          icon={<span className="text-white text-xl">📅</span>}
          color="teal"
          trend={dailyData.previousTodaysAppointments >= 0 ? {
            value: dailyData.previousTodaysAppointments > 0 ? Math.abs(((dailyData.todaysAppointments - dailyData.previousTodaysAppointments) / dailyData.previousTodaysAppointments) * 100) : (dailyData.todaysAppointments > 0 ? 100 : 0),
            label: isRangeMode ? "مقارنة بالفترة السابقة" : "مقارنة بالأمس",
            isPositive: dailyData.todaysAppointments >= dailyData.previousTodaysAppointments
          } : undefined}
        />

        <KPICard
          title={isRangeMode ? "إجمالي المرضى الفريدين" : "المرضى الفريدون"}
          value={dailyData.uniquePatientsToday}
          icon={<span className="text-white text-xl">👥</span>}
          color="cyan"
          trend={dailyData.previousUniquePatientsToday > 0 ? {
            value: Math.abs(((dailyData.uniquePatientsToday - dailyData.previousUniquePatientsToday) / dailyData.previousUniquePatientsToday) * 100),
            label: isRangeMode ? "مقارنة بالفترة السابقة" : "مقارنة بالأمس",
            isPositive: dailyData.uniquePatientsToday >= dailyData.previousUniquePatientsToday
          } : undefined}
        />

        <KPICard
          title="نسبة الأطباء"
          value={`${dailyData.todaysDoctorPercentage.toFixed(1)}%`}
          icon={<span className="text-white text-xl">📊</span>}
          color="lime"
        />
      </KPIContainer>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <InteractiveCharts
          title={isRangeMode ? 'اتجاه الإيرادات للفترة' : t('reports.dailyFinancialSummary.revenueTrend')}
          data={revenueTrendData}
          type="line"
          height={400}
          colors={['#3b82f6', '#1d4ed8']}
          formatValue={(value) => currencyFormatter.format(value)}
        />

        <InteractiveCharts
          title={isRangeMode ? 'توزيع المصروفات للفترة' : t('reports.dailyFinancialSummary.expensesBreakdown')}
          data={expensesBreakdownData}
          type="pie"
          height={400}
          colors={['#ef4444', '#f97316', '#eab308', '#22c55e', '#8b5cf6']}
        />
      </div>

      {/* Doctor Earnings Chart */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">{isRangeMode ? 'استحقاقات الأطباء للفترة' : 'استحقاقات الأطباء اليومية'}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doctorEarningsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => currencyFormatter.format(Number(value))} />
                <Tooltip formatter={(value) => [currencyFormatter.format(Number(value)), 'الدخل']} />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart data={doctorEarningsData}>
                <Pie
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent ? (percent * 100).toFixed(1) : '0')}%`}
                  outerRadius={80}
                  fill="#8884d8"
                >
                  {doctorEarningsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [currencyFormatter.format(Number(value)), 'الدخل']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ModernTable
          title={isRangeMode ? 'مدفوعات الفترة' : t('reports.dailyFinancialSummary.todaysPayments')}
          columns={[
            { key: 'patientName', title: t('common.patient'), sortable: true },
            { key: 'amount', title: t('payment.amount'), sortable: true, render: (value) => currencyFormatter.format(value) },
            { key: 'method', title: t('payment.method'), sortable: true },
            { key: 'date', title: 'التاريخ', sortable: true }
          ]}
          data={paymentsTableData}
          searchable={true}
          sortable={true}
          pageSize={10}
        />

        <ModernTable
          title={isRangeMode ? 'مصروفات الفترة' : t('reports.dailyFinancialSummary.todaysExpensesList')}
          columns={[
            { key: 'description', title: t('expense.description'), sortable: true },
            { key: 'amount', title: t('expense.amount'), sortable: true, render: (value) => currencyFormatter.format(value) },
            { key: 'category', title: t('expense.category'), sortable: true },
            { key: 'date', title: 'التاريخ', sortable: true }
          ]}
          data={expensesTableData}
          searchable={true}
          sortable={true}
          pageSize={10}
        />
      </div>
    </div>
  );
};

export default EnhancedDailyFinancialSummary;