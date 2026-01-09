import React, { useState, useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import { useFinancialCalculations } from '../../hooks/useFinancialCalculations';
import { openPrintWindow } from '../../utils/print';
import PrintableReport from './PrintableReport';
import BarChart from './BarChart';
import LineChart from './LineChart';
import PieChart from './PieChart';

interface MonthlyFinancialSummaryProps {
    clinicData: ClinicData;
}

const MonthlyFinancialSummary: React.FC<MonthlyFinancialSummaryProps> = ({ clinicData }) => {
    const { t, locale } = useI18n();
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    const monthlyData = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);

        const monthPayments = clinicData.payments.filter(p => {
            const paymentDate = new Date(p.date);
            return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
        });

        const monthExpenses = clinicData.expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
        });

        const thisMonthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
        const thisMonthExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
        const clinicProfitThisMonth = thisMonthRevenue - thisMonthExpenses - monthPayments.reduce((sum, p) => sum + p.doctorShare, 0);

        // Calculate monthly averages
        const daysInMonth = endOfMonth.getDate();
        const monthlyAverages = {
            dailyRevenue: thisMonthRevenue / daysInMonth,
            dailyExpenses: thisMonthExpenses / daysInMonth,
            dailyProfit: clinicProfitThisMonth / daysInMonth
        };

        // Calculate growth rates (compared to previous month)
        const prevMonth = new Date(year, month - 2, 1);
        const prevMonthEnd = new Date(year, month - 1, 0);

        const prevMonthRevenue = clinicData.payments
            .filter(p => {
                const paymentDate = new Date(p.date);
                return paymentDate >= prevMonth && paymentDate <= prevMonthEnd;
            })
            .reduce((sum, p) => sum + p.amount, 0);

        const prevMonthExpenses = clinicData.expenses
            .filter(e => {
                const expenseDate = new Date(e.date);
                return expenseDate >= prevMonth && expenseDate <= prevMonthEnd;
            })
            .reduce((sum, e) => sum + e.amount, 0);

        const prevMonthProfit = prevMonthRevenue - prevMonthExpenses - clinicData.payments
            .filter(p => {
                const paymentDate = new Date(p.date);
                return paymentDate >= prevMonth && paymentDate <= prevMonthEnd;
            })
            .reduce((sum, p) => sum + p.doctorShare, 0);

        const growthRates = {
            revenueGrowth: prevMonthRevenue > 0 ? ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0,
            expenseGrowth: prevMonthExpenses > 0 ? ((thisMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100 : 0,
            profitGrowth: prevMonthProfit !== 0 ? ((clinicProfitThisMonth - prevMonthProfit) / Math.abs(prevMonthProfit)) * 100 : 0
        };

        return {
            thisMonthRevenue,
            thisMonthExpenses,
            clinicProfitThisMonth,
            monthlyAverages,
            growthRates,
            monthPayments,
            monthExpenses
        };
    }, [clinicData, selectedMonth]);

    const revenueData = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const data = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayRevenue = clinicData.payments
                .filter(p => p.date === dateStr)
                .reduce((sum, p) => sum + p.amount, 0);

            if (day % 5 === 0 || day === daysInMonth) { // Show every 5th day and last day
                data.push({
                    label: day.toString(),
                    value: dayRevenue
                });
            }
        }
        return data;
    }, [clinicData.payments, selectedMonth]);

    const expenseBreakdownData = useMemo(() => {
        const expenseByCategory = monthlyData.monthExpenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {} as Record<string, number>);

        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
        return Object.entries(expenseByCategory).map(([category, amount], index) => ({
            label: t(`expenseCategory.${category}`),
            value: amount,
            color: colors[index % colors.length]
        }));
    }, [monthlyData.monthExpenses, t]);

    const profitTrendData = useMemo(() => {
        const data = [];
        const [year, month] = selectedMonth.split('-').map(Number);

        for (let m = month - 5; m <= month; m++) {
            let actualMonth = m;
            let actualYear = year;
            if (m <= 0) {
                actualMonth = 12 + m;
                actualYear = year - 1;
            }

            const startOfMonth = new Date(actualYear, actualMonth - 1, 1);
            const endOfMonth = new Date(actualYear, actualMonth, 0);

            const monthRevenue = clinicData.payments
                .filter(p => {
                    const paymentDate = new Date(p.date);
                    return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
                })
                .reduce((sum, p) => sum + p.amount, 0);

            const monthExpenses = clinicData.expenses
                .filter(e => {
                    const expenseDate = new Date(e.date);
                    return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
                })
                .reduce((sum, e) => sum + e.amount, 0);

            const profit = monthRevenue - monthExpenses;

            data.push({
                label: new Date(actualYear, actualMonth - 1, 1).toLocaleDateString(locale, { month: 'short', year: 'numeric' }),
                value: profit
            });
        }
        return data;
    }, [clinicData, selectedMonth, locale]);

    const handlePrint = () => {
        const [year, month] = selectedMonth.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

        openPrintWindow(
            `${t('reports.monthlyFinancialSummary.title')} - ${new Date(startDate).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`,
            <PrintableReport clinicData={clinicData} activeTab="monthlyFinancialSummary" startDate={startDate} endDate={endDate} />
        );
    };

    return (
        <div className="space-y-8 p-6 bg-slate-50 min-h-screen" dir="rtl">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('reports.monthlyFinancialSummary.title')}</h1>
                        <p className="text-slate-600">{t('reports.monthlyFinancialSummary.subtitle')}</p>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark flex items-center gap-2 font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                        🖨️ {t('reports.printReport')}
                    </button>
                </div>
            </div>

            {/* Month/Year Picker */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">{t('reports.selectMonth')}</h2>
                <div className="max-w-xs">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{t('reports.monthlyFinancialSummary.thisMonthRevenue')}</p>
                            <p className="text-3xl font-bold text-slate-800">{currencyFormatter.format(monthlyData.thisMonthRevenue)}</p>
                        </div>
                        <div className="text-4xl opacity-20">💰</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{t('reports.monthlyFinancialSummary.thisMonthExpenses')}</p>
                            <p className="text-3xl font-bold text-slate-800">{currencyFormatter.format(monthlyData.thisMonthExpenses)}</p>
                        </div>
                        <div className="text-4xl opacity-20">💸</div>
                    </div>
                </div>

                <div className={`bg-white p-6 rounded-xl shadow-lg border-l-4 ${monthlyData.clinicProfitThisMonth >= 0 ? 'border-green-500' : 'border-red-500'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{t('reports.monthlyFinancialSummary.clinicProfitThisMonth')}</p>
                            <p className="text-3xl font-bold text-slate-800">{currencyFormatter.format(monthlyData.clinicProfitThisMonth)}</p>
                        </div>
                        <div className="text-4xl opacity-20">📈</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{t('reports.monthlyFinancialSummary.monthlyAverages')}</p>
                            <div className="text-sm">
                                <p>{t('reports.dailyRevenue')}: {currencyFormatter.format(monthlyData.monthlyAverages.dailyRevenue)}</p>
                                <p>{t('reports.dailyExpenses')}: {currencyFormatter.format(monthlyData.monthlyAverages.dailyExpenses)}</p>
                            </div>
                        </div>
                        <div className="text-4xl opacity-20">📊</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-500">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{t('reports.monthlyFinancialSummary.growthRates')}</p>
                            <div className="text-sm">
                                <p className={monthlyData.growthRates.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {t('reports.revenue')}: {monthlyData.growthRates.revenueGrowth.toFixed(1)}%
                                </p>
                                <p className={monthlyData.growthRates.expenseGrowth <= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {t('reports.expenses')}: {monthlyData.growthRates.expenseGrowth.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <div className="text-4xl opacity-20">📈</div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <LineChart title={t('reports.monthlyFinancialSummary.revenueChart')} data={revenueData} colorClass="bg-blue-500" />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <PieChart title={t('reports.monthlyFinancialSummary.expenseBreakdown')} data={expenseBreakdownData} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <LineChart title={t('reports.monthlyFinancialSummary.profitTrend')} data={profitTrendData} colorClass="bg-green-500" />
            </div>

            {/* Detailed Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">{t('reports.monthlyFinancialSummary.monthlyPayments')}</h3>
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
                                {monthlyData.monthPayments.slice(0, 10).map(payment => {
                                    const patient = clinicData.patients.find(p => p.id === payment.patientId);
                                    return (
                                        <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-600 text-right">{patient?.name || t('common.unknown')}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600 text-right">{currencyFormatter.format(payment.amount)}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600 text-right">
                                                {new Date(payment.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">{t('reports.monthlyFinancialSummary.monthlyExpenses')}</h3>
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
                                {monthlyData.monthExpenses.slice(0, 10).map(expense => (
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

export default MonthlyFinancialSummary;