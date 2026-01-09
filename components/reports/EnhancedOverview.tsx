import React, { useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import { KPICard, KPIContainer } from './KPICards';
import InteractiveCharts from './InteractiveCharts';

interface EnhancedOverviewProps {
  clinicData: ClinicData;
}

const EnhancedOverview: React.FC<EnhancedOverviewProps> = ({ clinicData }) => {
  const { t, locale } = useI18n();

  const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

  const overviewData = useMemo(() => {
    const { patients, dentists, suppliers, treatmentRecords, payments, expenses, inventoryItems } = clinicData;

    // Financial metrics
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalDoctorShares = payments.reduce((sum, p) => sum + p.doctorShare, 0);
    const totalProfit = totalRevenue - totalExpenses - totalDoctorShares;

    // Patient metrics
    const totalPatients = patients.length;
    const activePatients = patients.filter(p =>
      treatmentRecords.some(tr => tr.patientId === p.id)
    ).length;

    // Doctor metrics
    const totalDoctors = dentists.length;
    const totalTreatments = treatmentRecords.length;

    // Supplier metrics
    const totalSuppliers = suppliers.length;
    const totalInventoryValue = inventoryItems.reduce((sum, item) =>
      sum + (item.unitCost * item.currentStock), 0
    );

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPayments = payments.filter(p =>
      new Date(p.date) >= thirtyDaysAgo
    ).reduce((sum, p) => sum + p.amount, 0);

    const recentExpenses = expenses.filter(e =>
      new Date(e.date) >= thirtyDaysAgo
    ).reduce((sum, e) => sum + e.amount, 0);

    return {
      totalRevenue,
      totalExpenses,
      totalDoctorShares,
      totalProfit,
      totalPatients,
      activePatients,
      totalDoctors,
      totalTreatments,
      totalSuppliers,
      totalInventoryValue,
      recentPayments,
      recentExpenses
    };
  }, [clinicData]);

  const revenueChartData = useMemo(() => {
    const monthlyRevenue = clinicData.payments.reduce((acc, payment) => {
      const month = new Date(payment.date).toLocaleDateString(locale, { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      name: month,
      value: revenue
    })).slice(-6); // Last 6 months
  }, [clinicData.payments, locale]);

  const patientDistributionData = useMemo(() => {
    const doctorTreatments = clinicData.dentists.map(doctor => ({
      name: doctor.name,
      value: clinicData.treatmentRecords.filter(tr => tr.dentistId === doctor.id).length
    })).filter(item => item.value > 0);

    return doctorTreatments;
  }, [clinicData.dentists, clinicData.treatmentRecords]);

  const expenseBreakdownData = useMemo(() => {
    const expenseByCategory = clinicData.expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(expenseByCategory).map(([category, amount]) => ({
      name: t(`expenseCategory.${category}`),
      value: amount
    }));
  }, [clinicData.expenses, t]);

  return (
    <div className="space-y-8 p-6 bg-slate-50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('reports.overview')}</h1>
        <p className="text-slate-600">{t('reports.overviewDescription')}</p>
      </div>

      {/* KPI Cards */}
      <KPIContainer>
        <KPICard
          title={t('reports.totalRevenue')}
          value={overviewData.totalRevenue}
          formatValue={(value) => currencyFormatter.format(Number(value))}
          icon={<span>💰</span>}
          color="green"
        />
        <KPICard
          title={t('reports.totalExpenses')}
          value={overviewData.totalExpenses}
          formatValue={(value) => currencyFormatter.format(Number(value))}
          icon={<span>💸</span>}
          color="red"
        />
        <KPICard
          title="حصة الطبيب"
          value={overviewData.totalDoctorShares}
          formatValue={(value) => currencyFormatter.format(Number(value))}
          icon={<span>👨‍⚕️</span>}
          color="indigo"
        />
        <KPICard
          title={t('reports.totalProfit')}
          value={overviewData.totalProfit}
          formatValue={(value) => currencyFormatter.format(Number(value))}
          icon={<span>📈</span>}
          color={overviewData.totalProfit >= 0 ? 'green' : 'red'}
        />
        <KPICard
          title={t('reports.totalPatients')}
          value={overviewData.totalPatients}
          icon={<span>👥</span>}
          color="blue"
        />
        <KPICard
          title={t('reports.activePatients')}
          value={overviewData.activePatients}
          icon={<span>🏥</span>}
          color="purple"
        />
        <KPICard
          title={t('reports.totalDoctors')}
          value={overviewData.totalDoctors}
          icon={<span>👨‍⚕️</span>}
          color="indigo"
        />
        <KPICard
          title={t('reports.totalTreatments')}
          value={overviewData.totalTreatments}
          icon={<span>🦷</span>}
          color="teal"
        />
        <KPICard
          title={t('reports.totalSuppliers')}
          value={overviewData.totalSuppliers}
          icon={<span>🏢</span>}
          color="orange"
        />
        <KPICard
          title={t('reports.inventoryValue')}
          value={overviewData.totalInventoryValue}
          formatValue={(value) => currencyFormatter.format(Number(value))}
          icon={<span>📦</span>}
          color="cyan"
        />
        <KPICard
          title={t('reports.recentPayments')}
          value={overviewData.recentPayments}
          subtitle={t('reports.last30Days')}
          formatValue={(value) => currencyFormatter.format(Number(value))}
          icon={<span>💳</span>}
          color="lime"
        />
        <KPICard
          title={t('reports.recentExpenses')}
          value={overviewData.recentExpenses}
          subtitle={t('reports.last30Days')}
          formatValue={(value) => currencyFormatter.format(Number(value))}
          icon={<span>🧾</span>}
          color="pink"
        />
      </KPIContainer>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <InteractiveCharts
          title={t('reports.revenueTrend')}
          data={revenueChartData}
          type="line"
          height={350}
          formatValue={(value) => currencyFormatter.format(value)}
        />

        <InteractiveCharts
          title={t('reports.treatmentDistribution')}
          data={patientDistributionData}
          type="pie"
          height={350}
        />
      </div>

      <InteractiveCharts
        title={t('reports.expenseBreakdown')}
        data={expenseBreakdownData}
        type="bar"
        height={350}
        formatValue={(value) => currencyFormatter.format(value)}
      />
    </div>
  );
};

export default EnhancedOverview;