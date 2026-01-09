import React, { useState, useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import { useFinancialCalculations } from '../../hooks/useFinancialCalculations';
import { openPrintWindow } from '../../utils/print';
import PrintableReport from './PrintableReport';
import BarChart from './BarChart';
import LineChart from './LineChart';
import PieChart from './PieChart';

interface QuarterlyAnnualOverviewProps {
    clinicData: ClinicData;
}

const QuarterlyAnnualOverview: React.FC<QuarterlyAnnualOverviewProps> = ({ clinicData }) => {
    const { t, locale } = useI18n();
    const [selectedPeriod, setSelectedPeriod] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
    });
    const [viewType, setViewType] = useState<'quarterly' | 'annual'>('quarterly');

    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    const periodData = useMemo(() => {
        const [year, quarter] = selectedPeriod.includes('Q') ?
            selectedPeriod.split('-Q').map((s, i) => i === 0 ? parseInt(s) : parseInt(s)) :
            [parseInt(selectedPeriod), 0];

        let startDate: Date;
        let endDate: Date;

        if (viewType === 'quarterly') {
            const quarterStartMonth = (quarter - 1) * 3;
            startDate = new Date(year, quarterStartMonth, 1);
            endDate = new Date(year, quarterStartMonth + 3, 0);
        } else {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31);
        }

        const periodPayments = clinicData.payments.filter(p => {
            const paymentDate = new Date(p.date);
            return paymentDate >= startDate && paymentDate <= endDate;
        });

        const periodExpenses = clinicData.expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= startDate && expenseDate <= endDate;
        });

        const quarterlyAnnualTotals = {
            revenue: periodPayments.reduce((sum, p) => sum + p.amount, 0),
            expenses: periodExpenses.reduce((sum, e) => sum + e.amount, 0),
            profit: 0
        };
        quarterlyAnnualTotals.profit = quarterlyAnnualTotals.revenue - quarterlyAnnualTotals.expenses - periodPayments.reduce((sum, p) => sum + p.doctorShare, 0);

        // Year-over-year comparisons
        const prevYear = year - 1;
        let prevStartDate: Date;
        let prevEndDate: Date;

        if (viewType === 'quarterly') {
            const quarterStartMonth = (quarter - 1) * 3;
            prevStartDate = new Date(prevYear, quarterStartMonth, 1);
            prevEndDate = new Date(prevYear, quarterStartMonth + 3, 0);
        } else {
            prevStartDate = new Date(prevYear, 0, 1);
            prevEndDate = new Date(prevYear, 11, 31);
        }

        const prevPeriodPayments = clinicData.payments.filter(p => {
            const paymentDate = new Date(p.date);
            return paymentDate >= prevStartDate && paymentDate <= prevEndDate;
        });

        const prevPeriodExpenses = clinicData.expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= prevStartDate && expenseDate <= prevEndDate;
        });

        const prevPeriodTotals = {
            revenue: prevPeriodPayments.reduce((sum, p) => sum + p.amount, 0),
            expenses: prevPeriodExpenses.reduce((sum, e) => sum + e.amount, 0),
            profit: 0
        };
        prevPeriodTotals.profit = prevPeriodTotals.revenue - prevPeriodTotals.expenses - prevPeriodPayments.reduce((sum, p) => sum + p.doctorShare, 0);

        const yearOverYearComparisons = {
            revenueChange: prevPeriodTotals.revenue > 0 ? ((quarterlyAnnualTotals.revenue - prevPeriodTotals.revenue) / prevPeriodTotals.revenue) * 100 : 0,
            expenseChange: prevPeriodTotals.expenses > 0 ? ((quarterlyAnnualTotals.expenses - prevPeriodTotals.expenses) / prevPeriodTotals.expenses) * 100 : 0,
            profitChange: prevPeriodTotals.profit !== 0 ? ((quarterlyAnnualTotals.profit - prevPeriodTotals.profit) / Math.abs(prevPeriodTotals.profit)) * 100 : 0
        };

        // Seasonal trends (for annual view, show quarterly breakdown)
        const seasonalTrends = viewType === 'annual' ? [1, 2, 3, 4].map(q => {
            const quarterStartMonth = (q - 1) * 3;
            const qStart = new Date(year, quarterStartMonth, 1);
            const qEnd = new Date(year, quarterStartMonth + 3, 0);

            const qRevenue = clinicData.payments.filter(p => {
                const paymentDate = new Date(p.date);
                return paymentDate >= qStart && paymentDate <= qEnd;
            }).reduce((sum, p) => sum + p.amount, 0);

            const qExpenses = clinicData.expenses.filter(e => {
                const expenseDate = new Date(e.date);
                return expenseDate >= qStart && expenseDate <= qEnd;
            }).reduce((sum, e) => sum + e.amount, 0);

            return {
                quarter: `Q${q}`,
                revenue: qRevenue,
                expenses: qExpenses,
                profit: qRevenue - qExpenses - clinicData.payments.filter(p => {
                    const paymentDate = new Date(p.date);
                    return paymentDate >= qStart && paymentDate <= qEnd;
                }).reduce((sum, p) => sum + p.doctorShare, 0)
            };
        }) : [];

        // Cumulative profit
        const cumulativeProfit = quarterlyAnnualTotals.profit;

        return {
            quarterlyAnnualTotals,
            yearOverYearComparisons,
            seasonalTrends,
            cumulativeProfit,
            periodPayments,
            periodExpenses
        };
    }, [clinicData, selectedPeriod, viewType]);

    const comparisonData = useMemo(() => {
        const [year] = selectedPeriod.includes('Q') ?
            selectedPeriod.split('-Q').map((s, i) => i === 0 ? parseInt(s) : parseInt(s)) :
            [parseInt(selectedPeriod), 0];

        const currentYearData = periodData.quarterlyAnnualTotals;
        const prevYearData = {
            revenue: currentYearData.revenue * (1 - periodData.yearOverYearComparisons.revenueChange / 100),
            expenses: currentYearData.expenses * (1 - periodData.yearOverYearComparisons.expenseChange / 100),
            profit: currentYearData.profit * (1 - periodData.yearOverYearComparisons.profitChange / 100)
        };

        return [
            {
                label: `${year - 1}`,
                value: prevYearData.revenue
            },
            {
                label: `${year}`,
                value: currentYearData.revenue
            }
        ];
    }, [periodData, selectedPeriod]);

    const seasonalData = useMemo(() => {
        if (viewType === 'quarterly') return [];

        return periodData.seasonalTrends.map(trend => ({
            label: trend.quarter,
            value: trend.profit
        }));
    }, [periodData.seasonalTrends, viewType]);

    const revenueExpenseBreakdown = useMemo(() => {
        if (viewType === 'quarterly') return [];

        const colors = ['#22c55e', '#ef4444'];
        return [
            {
                label: 'Revenue',
                value: periodData.quarterlyAnnualTotals.revenue,
                color: colors[0]
            },
            {
                label: 'Expenses',
                value: periodData.quarterlyAnnualTotals.expenses,
                color: colors[1]
            }
        ];
    }, [periodData.quarterlyAnnualTotals, viewType]);

    const trendData = useMemo(() => {
        const data = [];
        const [year] = selectedPeriod.includes('Q') ?
            selectedPeriod.split('-Q').map((s, i) => i === 0 ? parseInt(s) : parseInt(s)) :
            [parseInt(selectedPeriod), 0];

        for (let y = year - 4; y <= year; y++) {
            let startDate: Date;
            let endDate: Date;

            if (viewType === 'quarterly') {
                const [, quarter] = selectedPeriod.split('-Q').map((s, i) => i === 0 ? parseInt(s) : parseInt(s));
                const quarterStartMonth = (quarter - 1) * 3;
                startDate = new Date(y, quarterStartMonth, 1);
                endDate = new Date(y, quarterStartMonth + 3, 0);
            } else {
                startDate = new Date(y, 0, 1);
                endDate = new Date(y, 11, 31);
            }

            const yearRevenue = clinicData.payments.filter(p => {
                const paymentDate = new Date(p.date);
                return paymentDate >= startDate && paymentDate <= endDate;
            }).reduce((sum, p) => sum + p.amount, 0);

            const yearExpenses = clinicData.expenses.filter(e => {
                const expenseDate = new Date(e.date);
                return expenseDate >= startDate && expenseDate <= endDate;
            }).reduce((sum, e) => sum + e.amount, 0);

            const profit = yearRevenue - yearExpenses - clinicData.payments.filter(p => {
                const paymentDate = new Date(p.date);
                return paymentDate >= startDate && paymentDate <= endDate;
            }).reduce((sum, p) => sum + p.doctorShare, 0);

            data.push({
                label: y.toString(),
                value: profit
            });
        }
        return data;
    }, [clinicData, selectedPeriod, viewType]);

    const handlePrint = () => {
        const [year, quarter] = selectedPeriod.includes('Q') ?
            selectedPeriod.split('-Q').map((s, i) => i === 0 ? parseInt(s) : parseInt(s)) :
            [parseInt(selectedPeriod), 0];

        let startDate: string;
        let endDate: string;

        if (viewType === 'quarterly') {
            const quarterStartMonth = (quarter - 1) * 3;
            startDate = new Date(year, quarterStartMonth, 1).toISOString().split('T')[0];
            endDate = new Date(year, quarterStartMonth + 3, 0).toISOString().split('T')[0];
        } else {
            startDate = `${year}-01-01`;
            endDate = `${year}-12-31`;
        }

        openPrintWindow(
            `${t('reports.quarterlyAnnualOverview.title')} - ${viewType === 'quarterly' ? `Q${quarter}` : ''} ${year}`,
            <PrintableReport clinicData={clinicData} activeTab="quarterlyAnnualOverview" startDate={startDate} endDate={endDate} />
        );
    };

    return (
        <div className="space-y-8 p-6 bg-slate-50 min-h-screen" dir="rtl">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('reports.quarterlyAnnualOverview.title')}</h1>
                        <p className="text-slate-600">{t('reports.quarterlyAnnualOverview.subtitle')}</p>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark flex items-center gap-2 font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                        🖨️ {t('reports.printReport')}
                    </button>
                </div>
            </div>

            {/* Period Picker */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('reports.viewType')}</label>
                        <select
                            value={viewType}
                            onChange={(e) => setViewType(e.target.value as 'quarterly' | 'annual')}
                            className="p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        >
                            <option value="quarterly">{t('reports.quarterly')}</option>
                            <option value="annual">{t('reports.annual')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {viewType === 'quarterly' ? t('reports.selectQuarter') : t('reports.selectYear')}
                        </label>
                        {viewType === 'quarterly' ? (
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            >
                                {Array.from({ length: 4 }, (_, i) => {
                                    const year = new Date().getFullYear();
                                    return (
                                        <option key={`${year}-Q${i + 1}`} value={`${year}-Q${i + 1}`}>
                                            Q{i + 1} {year}
                                        </option>
                                    );
                                })}
                            </select>
                        ) : (
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            >
                                {Array.from({ length: 5 }, (_, i) => {
                                    const year = new Date().getFullYear() - 2 + i;
                                    return (
                                        <option key={year} value={year.toString()}>
                                            {year}
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{t('reports.quarterlyAnnualOverview.totalRevenue')}</p>
                            <p className="text-3xl font-bold text-slate-800">{currencyFormatter.format(periodData.quarterlyAnnualTotals.revenue)}</p>
                        </div>
                        <div className="text-4xl opacity-20">💰</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{t('reports.quarterlyAnnualOverview.totalExpenses')}</p>
                            <p className="text-3xl font-bold text-slate-800">{currencyFormatter.format(periodData.quarterlyAnnualTotals.expenses)}</p>
                        </div>
                        <div className="text-4xl opacity-20">💸</div>
                    </div>
                </div>

                <div className={`bg-white p-6 rounded-xl shadow-lg border-l-4 ${periodData.cumulativeProfit >= 0 ? 'border-green-500' : 'border-red-500'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{t('reports.quarterlyAnnualOverview.cumulativeProfit')}</p>
                            <p className="text-3xl font-bold text-slate-800">{currencyFormatter.format(periodData.cumulativeProfit)}</p>
                        </div>
                        <div className="text-4xl opacity-20">📈</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{t('reports.quarterlyAnnualOverview.yearOverYear')}</p>
                            <div className="text-sm">
                                <p className={periodData.yearOverYearComparisons.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {t('reports.revenue')}: {periodData.yearOverYearComparisons.revenueChange.toFixed(1)}%
                                </p>
                                <p className={periodData.yearOverYearComparisons.profitChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {t('reports.profit')}: {periodData.yearOverYearComparisons.profitChange.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <div className="text-4xl opacity-20">📊</div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <BarChart title={t('reports.quarterlyAnnualOverview.comparisonChart')} data={comparisonData} colorClass="bg-blue-500" />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <LineChart title={t('reports.quarterlyAnnualOverview.trendChart')} data={trendData} colorClass="bg-green-500" />
                </div>
            </div>

            {viewType === 'annual' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <BarChart title={t('reports.quarterlyAnnualOverview.seasonalTrends')} data={seasonalData} colorClass="bg-purple-500" />
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <PieChart title={t('reports.quarterlyAnnualOverview.revenueExpenseBreakdown')} data={revenueExpenseBreakdown} />
                    </div>
                </div>
            )}

            {/* Quarterly Comparison Chart for Annual View */}
            {viewType === 'annual' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Quarterly Performance Comparison</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {periodData.seasonalTrends.map((quarter, index) => (
                            <div key={quarter.quarter} className="bg-slate-50 p-4 rounded-lg border">
                                <h4 className="font-semibold text-slate-700 mb-2">{quarter.quarter}</h4>
                                <div className="space-y-1 text-sm">
                                    <p>Revenue: <span className="font-semibold text-green-600">{currencyFormatter.format(quarter.revenue)}</span></p>
                                    <p>Expenses: <span className="font-semibold text-red-600">{currencyFormatter.format(quarter.expenses)}</span></p>
                                    <p>Profit: <span className={`font-semibold ${quarter.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                        {currencyFormatter.format(quarter.profit)}
                                    </span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detailed Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">{t('reports.quarterlyAnnualOverview.periodPayments')}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">{t('common.patient')}</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">{t('payment.amount')}</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">{t('common.date')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {periodData.periodPayments.slice(0, 10).map(payment => {
                                    const patient = clinicData.patients.find(p => p.id === payment.patientId);
                                    return (
                                        <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-600 text-right">{patient?.name || t('common.unknown')}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600 text-right">{currencyFormatter.format(payment.amount)}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600 text-right">
                                                {new Date(payment.date).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">{t('reports.quarterlyAnnualOverview.periodExpenses')}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">{t('expense.description')}</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">{t('expense.amount')}</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">{t('expense.category')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {periodData.periodExpenses.slice(0, 10).map(expense => (
                                    <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-4 py-3 text-sm text-slate-600 text-right">{expense.description}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600 text-right">{currencyFormatter.format(expense.amount)}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600 text-right">{t(`expenseCategory.${expense.category}`)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuarterlyAnnualOverview;