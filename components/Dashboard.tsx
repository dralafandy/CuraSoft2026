import React, { useMemo, useState } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { AppointmentStatus, LabCaseStatus, View, Dentist, TreatmentRecord, ExpenseCategory, Appointment } from '../types';
import { useI18n } from '../hooks/useI18n';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: { value: number; isPositive: boolean };
    subtitle?: string;
    onClick?: () => void;
    className?: string;
    shape?: 'card' | 'circle';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend, subtitle, onClick, className, shape = 'card' }) => {
    if (shape === 'circle') {
        return (
            <div
                className={`w-32 h-32 bg-white rounded-xl shadow-md hover:shadow-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 border border-slate-200 cursor-pointer group ${onClick ? 'hover:border-blue-300' : ''} ${className || ''}`}
                onClick={onClick}
                role={onClick ? 'button' : undefined}
                tabIndex={onClick ? 0 : undefined}
                onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
                aria-label={onClick ? `${title}: ${value}` : undefined}
            >
                <div className={`p-3 rounded-full ${color} shadow-sm mb-2 group-hover:shadow-md transition-shadow`}>
                    {icon}
                </div>
                <p className="text-xs text-slate-600 font-medium text-center px-1">{title}</p>
                <p className="text-lg font-bold text-slate-800">{value}</p>
                {subtitle && <p className="text-xs text-slate-500 text-center px-1">{subtitle}</p>}
            </div>
        );
    }

    return (
        <div
            className={`bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 border border-slate-200 cursor-pointer group ${onClick ? 'hover:border-blue-300 hover:shadow-lg' : ''} ${className || ''}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
            aria-label={onClick ? `${title}: ${value}` : undefined}
        >
            <div className="flex items-center">
                <div className={`p-3 rounded-lg ${color} shadow-sm group-hover:shadow-md transition-shadow`}>
                    {icon}
                </div>
                <div className="ms-4 flex-1">
                    <p className="text-sm text-slate-600 font-medium">{title}</p>
                    <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
                    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                    {trend && (
                        <div className={`flex items-center mt-2 text-xs font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                            <svg className={`w-3 h-3 mr-1 ${trend.isPositive ? '' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            {Math.abs(trend.value)}%
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC<{ clinicData: ClinicData, setCurrentView: (view: View) => void }> = ({ clinicData, setCurrentView }) => {
    const { t, locale } = useI18n();
    const { patients, appointments, treatmentRecords, inventoryItems, labCases, dentists, payments, expenses, supplierInvoices, doctorPayments, prescriptions, prescriptionItems } = clinicData;
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    const fullCurrencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    const dateFormatter = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' });

    // --- CALCULATIONS ---

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysAppointmentsCount = appointments.filter(apt => {
        const aptDate = new Date(apt.startTime);
        aptDate.setHours(0,0,0,0);
        return aptDate.getTime() === today.getTime();
    }).length;

    const todaysPayments = useMemo(() => {
        return payments.filter(p => {
            const pDate = new Date(p.date);
            pDate.setHours(0, 0, 0, 0);
            return pDate.getTime() === today.getTime();
        });
    }, [payments, today]);

    const todaysRevenue = useMemo(() => {
        return todaysPayments.reduce((sum, p) => sum + p.amount, 0);
    }, [todaysPayments]);

    const todaysExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            expDate.setHours(0, 0, 0, 0);
            return expDate.getTime() === today.getTime();
        }).reduce((sum, exp) => sum + exp.amount, 0);
    }, [expenses, today]);

    const doctorsDuesToday = useMemo(() => {
        return todaysPayments.reduce((sum, p) => sum + p.doctorShare, 0);
    }, [todaysPayments]);

    const netToday = useMemo(() => todaysRevenue - todaysExpenses - doctorsDuesToday, [todaysRevenue, todaysExpenses, doctorsDuesToday]);

    const doctorsDues = useMemo(() => {
        const totalDoctorShares = treatmentRecords.reduce((sum, tr) => sum + tr.doctorShare, 0);
        const totalDoctorPayments = doctorPayments.reduce((sum, dp) => sum + dp.amount, 0);
        return totalDoctorShares - totalDoctorPayments;
    }, [treatmentRecords, doctorPayments]);

    const nextAppointment = useMemo(() => {
      const now = new Date();
      const upcomingAppointments = appointments
        .filter(apt => new Date(apt.startTime) > now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      return upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
    }, [appointments]);
    
    const upcomingAppointmentsList = useMemo(() => {
      const now = new Date();
      return appointments
        .filter(apt => new Date(apt.startTime) > now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 10);
    }, [appointments]);

    // Additional financial metrics
    const thisMonthRevenue = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return payments
            .filter(p => {
                const pDate = new Date(p.date);
                return pDate >= startOfMonth && pDate <= endOfMonth;
            })
            .reduce((sum, p) => sum + p.amount, 0);
    }, [payments]);

    const totalOutstandingBalance = useMemo(() => {
        const totalCharges = treatmentRecords.reduce((sum, tr) => {
            const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
            return sum + (treatmentDef ? treatmentDef.basePrice : 0);
        }, 0);
        const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
        return totalCharges - totalPayments;
    }, [treatmentRecords, payments, clinicData.treatmentDefinitions]);

    const thisMonthExpenses = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return expenses
            .filter(exp => {
                const expDate = new Date(exp.date);
                return expDate >= startOfMonth && expDate <= endOfMonth;
            })
            .reduce((sum, exp) => sum + exp.amount, 0);
    }, [expenses]);

    const thisMonthDoctorShares = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return payments
            .filter(p => {
                const pDate = new Date(p.date);
                return pDate >= startOfMonth && pDate <= endOfMonth;
            })
            .reduce((sum, p) => sum + p.doctorShare, 0);
    }, [payments]);

    const clinicProfitThisMonth = useMemo(() => {
        return thisMonthRevenue - thisMonthDoctorShares - thisMonthExpenses;
    }, [thisMonthRevenue, thisMonthDoctorShares, thisMonthExpenses]);

    const pendingPayments = useMemo(() => {
        const totalCharges = treatmentRecords.reduce((sum, tr) => {
            const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
            return sum + (treatmentDef ? treatmentDef.basePrice : 0);
        }, 0);
        const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
        return Math.max(0, totalCharges - totalPayments);
    }, [treatmentRecords, payments, clinicData.treatmentDefinitions]);

    const overdueInvoices = useMemo(() => {
        const today = new Date();
        return supplierInvoices.filter(invoice =>
            invoice.status === 'UNPAID' &&
            invoice.dueDate &&
            new Date(invoice.dueDate) < today
        ).length;
    }, [supplierInvoices]);

    const newPatientsThisMonth = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return patients.filter(p => {
            const patientRecords = treatmentRecords.filter(tr => tr.patientId === p.id);
            if (patientRecords.length === 0) return false;
            
            const firstTreatment = patientRecords.sort((a,b) => new Date(a.treatmentDate).getTime() - new Date(b.treatmentDate).getTime())[0];
            
            const firstTreatmentDate = new Date(firstTreatment.treatmentDate);
            return firstTreatmentDate >= startOfMonth && firstTreatmentDate <= endOfMonth;
        }).length;
    }, [patients, treatmentRecords]);
    
    
    const pendingLabCases = useMemo(() => {
        return labCases.filter(lc => ![LabCaseStatus.FITTED_TO_PATIENT, LabCaseStatus.CANCELLED].includes(lc.status))
                       .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                       .slice(0, 5);
    }, [labCases]);

    const lowStockItems = useMemo(() => {
        const lowStockThreshold = 10;
        return inventoryItems.filter(item => item.currentStock <= lowStockThreshold)
                             .sort((a,b) => a.currentStock - b.currentStock)
                             .slice(0, 5);
    }, [inventoryItems]);


    const doctorPerformanceToday = useMemo(() => {
        const dailyEarnings: Record<string, { name: string, earnings: number, color: string }> = {};

        // Calculate earnings from today's payments linked to treatments by the dentist
        todaysPayments.forEach(payment => {
            const treatmentRecord = treatmentRecords.find(tr => tr.id === payment.treatmentRecordId);
            if (treatmentRecord) {
                const dentist = dentists.find(d => d.id === treatmentRecord.dentistId);
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

    }, [todaysPayments, treatmentRecords, dentists]);

    // Chart data for today's financials
    const todaysFinancialData = useMemo(() => [
        { name: t('dashboard.todaysRevenue'), value: todaysRevenue, color: '#10b981' },
        { name: t('dashboard.todaysExpenses') || "المصروف اليومي", value: todaysExpenses, color: '#ef4444' },
        { name: t('dashboard.doctorsDuesToday') || "حصة الأطباء اليوم", value: doctorsDuesToday, color: '#f59e0b' },
    ], [todaysRevenue, todaysExpenses, doctorsDuesToday, t]);

    // Monthly trends data (last 6 months)
    const monthlyTrendsData = useMemo(() => {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const monthRevenue = payments
                .filter(p => {
                    const pDate = new Date(p.date);
                    return pDate >= monthStart && pDate <= monthEnd;
                })
                .reduce((sum, p) => sum + p.amount, 0);

            const monthExpenses = expenses
                .filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate >= monthStart && expDate <= monthEnd;
                })
                .reduce((sum, exp) => sum + exp.amount, 0);

            months.push({
                month: monthStart.toLocaleDateString(locale, { month: 'short' }),
                revenue: monthRevenue,
                expenses: monthExpenses,
                profit: monthRevenue - monthExpenses
            });
        }
        return months;
    }, [payments, expenses, locale]);

    // Timeline data for appointments and treatments
    const timelineData = useMemo(() => {
        const events: Array<{
            id: string;
            type: 'appointment' | 'treatment' | 'payment';
            date: Date;
            title: string;
            color: string;
        }> = [];

        // Add appointments
        appointments.forEach(apt => {
            const patient = patients.find(p => p.id === apt.patientId);
            events.push({
                id: `apt-${apt.id}`,
                type: 'appointment',
                date: new Date(apt.startTime),
                title: `${patient?.name} - ${apt.reason}`,
                color: '#0ea5e9'
            });
        });

        // Add treatments
        treatmentRecords.slice(0, 20).forEach(tr => {
            const patient = patients.find(p => p.id === tr.patientId);
            const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
            events.push({
                id: `tr-${tr.id}`,
                type: 'treatment',
                date: new Date(tr.treatmentDate),
                title: `${patient?.name} - ${treatmentDef?.name || 'Treatment'}`,
                color: '#8b5cf6'
            });
        });

        // Add payments
        payments.slice(0, 20).forEach(payment => {
            const patient = patients.find(p => p.id === payment.patientId);
            events.push({
                id: `pay-${payment.id}`,
                type: 'payment',
                date: new Date(payment.date),
                title: `${patient?.name} - Payment: ${currencyFormatter.format(payment.amount)}`,
                color: '#10b981'
            });
        });

        return events
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 50); // Limit to 50 events for performance
    }, [appointments, treatmentRecords, payments, patients, clinicData.treatmentDefinitions, currencyFormatter]);

    // --- ICONS ---
    const PatientsIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>);
    const CalendarIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
    const DollarIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /> </svg>);
    const UserPlusIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>);
    const TrendingUpIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>);
    const TrendingDownIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>);
    const AlertIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>);
    const ClockIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* 1. Data Visualization Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Today's Financial Overview */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3"></div>
                                    {t('dashboard.todaysFinancials')}
                                </h2>
                                <button
                                    onClick={() => setCurrentView('reports')}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-blue-50"
                                >
                                    {t('dashboard.viewDetails')}
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-4">
                                <StatCard
                                    title={t('dashboard.todaysRevenue') || "إيرادات اليوم"}
                                    value={currencyFormatter.format(todaysRevenue)}
                                    icon={TrendingUpIcon}
                                    color="bg-emerald-50 border border-emerald-200"
                                    subtitle={t('dashboard.today') || "اليوم"}
                                />
                                <StatCard
                                    title={t('dashboard.todaysExpenses') || "المصروفات اليوم"}
                                    value={currencyFormatter.format(todaysExpenses)}
                                    icon={TrendingDownIcon}
                                    color="bg-red-50 border border-red-200"
                                    subtitle={t('dashboard.today') || "اليوم"}
                                />
                                <StatCard
                                    title={t('dashboard.doctorsDuesToday') || "حصة الأطباء اليوم"}
                                    value={currencyFormatter.format(doctorsDuesToday)}
                                    icon={AlertIcon}
                                    color="bg-orange-50 border border-orange-200"
                                    subtitle={t('dashboard.today') || "اليوم"}
                                />
                            </div>
                            <div className="mt-6 text-center">
                                <p className="text-sm text-slate-600">
                                    {t('dashboard.netToday')}: <span className={`font-bold ${netToday >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {currencyFormatter.format(netToday)}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Trends */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                    <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full mr-3"></div>
                                    {t('dashboard.monthlyTrends') || 'Monthly Trends'}
                                </h2>
                                <button
                                    onClick={() => setCurrentView('reports')}
                                    className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-emerald-50"
                                >
                                    {t('dashboard.viewDetails')}
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyTrendsData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis tickFormatter={(value) => currencyFormatter.format(value)} />
                                        <Tooltip formatter={(value) => [currencyFormatter.format(value as number), '']} />
                                        <Legend />
                                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name={t('dashboard.monthlyRevenue') || 'Revenue'} />
                                        <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name={t('dashboard.monthlyExpenses')} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Upcoming Appointments Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                <div className="w-1 h-6 bg-gradient-to-b from-sky-500 to-sky-600 rounded-full mr-3"></div>
                                {t('dashboard.upcomingAppointments')}
                            </h2>
                            <button
                                onClick={() => setCurrentView('scheduler')}
                                className="text-sm text-sky-600 hover:text-sky-800 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-sky-50"
                            >
                                {t('dashboard.viewAll')}
                            </button>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {upcomingAppointmentsList.length > 0 ? (
                                upcomingAppointmentsList.map(apt => (
                                    <div key={apt.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                        <div>
                                            <p className="font-semibold text-slate-800">{patients.find(p => p.id === apt.patientId)?.name}</p>
                                            <p className="text-sm text-slate-600">{apt.reason}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-slate-700">{new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(apt.startTime))}</p>
                                            <p className="text-xs text-slate-500">{new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(apt.startTime))}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 p-4 text-center">{t('dashboard.noUpcomingAppointments')}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2.5. Activity Timeline */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full mr-3"></div>
                                {t('dashboard.activityTimeline') || 'Activity Timeline'}
                            </h2>
                            <button
                                onClick={() => setCurrentView('reports')}
                                className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-purple-50"
                            >
                                {t('dashboard.viewAll')}
                            </button>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {timelineData.length > 0 ? (
                                timelineData.map(event => (
                                    <div key={event.id} className="flex items-start space-x-4">
                                        <div className={`w-3 h-3 rounded-full mt-2`} style={{ backgroundColor: event.color }}></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-slate-800 truncate">{event.title}</p>
                                                <p className="text-xs text-slate-500 ml-2 flex-shrink-0">
                                                    {new Intl.DateTimeFormat(locale, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }).format(event.date)}
                                                </p>
                                            </div>
                                            <div className="flex items-center mt-1">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                                  event.type === 'appointment' ? 'bg-sky-100 text-sky-800' :
                                                  event.type === 'treatment' ? 'bg-purple-100 text-purple-800' :
                                                  'bg-emerald-100 text-emerald-800'
                                                }`}>
                                                  {t(`dashboard.eventType.${event.type}`)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 p-4 text-center">{t('dashboard.noRecentActivity') || 'No recent activity'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Alerts and Quick Actions Section (Quick View + Doctor Performance) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Alerts Section */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                    <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full mr-3"></div>
                                    {t('dashboard.atAGlance')}
                                </h2>
                                {overdueInvoices > 0 && (
                                    <div className="flex items-center text-orange-600 text-sm font-medium bg-orange-50 px-3 py-1 rounded-full">
                                        {AlertIcon}
                                        <span className="ml-1">{overdueInvoices} {t('dashboard.overdue')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <h3 className="font-semibold text-slate-600 mb-3 flex items-center">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                                        {t('dashboard.pendingLabCases')}
                                    </h3>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {pendingLabCases.length > 0 ? (
                                            pendingLabCases.map(lc => (
                                                <button key={lc.id} onClick={() => setCurrentView('labCases')} className="w-full text-start p-3 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent hover:border-slate-200">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <p className="font-semibold text-slate-800">{patients.find(p => p.id === lc.patientId)?.name}</p>
                                                        <p className="text-xs text-slate-500">{t('labCases.due')}: {lc.dueDate ? dateFormatter.format(new Date(lc.dueDate)) : 'No due date'}</p>
                                                    </div>
                                                    <p className="text-xs text-slate-600 mt-1">{lc.caseType}</p>
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-sm text-slate-500 p-3 text-center bg-slate-50 rounded-lg">{t('dashboard.noPendingLabCases')}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center mb-3">
                                        {AlertIcon}
                                        <h3 className="font-semibold text-slate-600 ml-2 flex items-center">
                                            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                            {t('dashboard.lowStockItems')}
                                        </h3>
                                    </div>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {lowStockItems.length > 0 ? (
                                            lowStockItems.map(item => (
                                                <button key={item.id} onClick={() => setCurrentView('inventory')} className="w-full text-start p-3 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent hover:border-slate-200">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <p className="font-semibold text-slate-800">{item.name}</p>
                                                        <p className="text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded">{t('inventory.stock')}: {item.currentStock}</p>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-sm text-slate-500 p-3 text-center bg-slate-50 rounded-lg">{t('dashboard.noLowStockItems')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Section */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                    <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full mr-3"></div>
                                    {t('dashboard.quickActions')}
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => setCurrentView('patients')}
                                        className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-emerald-50 rounded-xl transition-colors border border-slate-200 hover:border-emerald-200 group"
                                    >
                                        <div className="text-emerald-600 group-hover:text-emerald-700">
                                            {PatientsIcon}
                                        </div>
                                        <span className="mt-2 text-xs font-medium text-slate-700 group-hover:text-emerald-700">{t('dashboard.addPatient')}</span>
                                    </button>
                                    <button
                                        onClick={() => setCurrentView('scheduler')}
                                        className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-sky-50 rounded-xl transition-colors border border-slate-200 hover:border-sky-200 group"
                                    >
                                        <div className="text-sky-600 group-hover:text-sky-700">
                                            {CalendarIcon}
                                        </div>
                                        <span className="mt-2 text-xs font-medium text-slate-700 group-hover:text-sky-700">{t('dashboard.schedule')}</span>
                                    </button>
                                    <button
                                        onClick={() => setCurrentView('accountSelection')}
                                        className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-green-50 rounded-xl transition-colors border border-slate-200 hover:border-green-200 group"
                                    >
                                        <div className="text-emerald-600 group-hover:text-emerald-700">
                                            {DollarIcon}
                                        </div>
                                        <span className="mt-2 text-xs font-medium text-slate-700 group-hover:text-emerald-700">{t('dashboard.finance')}</span>
                                    </button>
                                    <button
                                        onClick={() => setCurrentView('reports')}
                                        className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-colors border border-slate-200 hover:border-indigo-200 group"
                                    >
                                        <div className="text-indigo-600 group-hover:text-indigo-700">
                                            {TrendingUpIcon}
                                        </div>
                                        <span className="mt-2 text-xs font-medium text-slate-700 group-hover:text-indigo-700">{t('dashboard.reports')}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Doctor Performance Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                        <div className="w-1 h-5 bg-gradient-to-b from-teal-500 to-teal-600 rounded-full mr-3"></div>
                                        {t('dashboard.doctorDailyPerformance')}
                                    </h2>
                                    <button
                                        onClick={() => setCurrentView('doctors')}
                                        className="text-sm text-teal-600 hover:text-teal-800 font-medium transition-colors px-2 py-1 rounded hover:bg-teal-50"
                                    >
                                        {t('dashboard.viewDetails')}
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4 max-h-48 overflow-y-auto">
                                    {doctorPerformanceToday.length > 0 ? doctorPerformanceToday.map(doc => (
                                        <div key={doc.name} className="p-3 bg-slate-50 rounded-lg">
                                            <div className="flex justify-between items-center text-sm font-semibold mb-2">
                                                <span className="text-slate-700">{doc.name}</span>
                                                <span className="text-slate-600">{fullCurrencyFormatter.format(doc.earnings)}</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                <div className={`${doc.color} h-2 rounded-full transition-all duration-300`} style={{ width: `${doc.percentage}%` }}></div>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg">{t('dashboard.noEarningsToday')}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Monthly Metrics and Operational Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Metrics Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full mr-3"></div>
                                {t('dashboard.monthlyMetrics')}
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-4">
                                <StatCard
                                    title={t('dashboard.monthlyRevenue') || "إيرادات الشهر"}
                                    value={currencyFormatter.format(thisMonthRevenue)}
                                    icon={TrendingUpIcon}
                                    color="bg-blue-50 border border-blue-200"
                                    subtitle={t('dashboard.thisMonth') || "هذا الشهر"}
                                />
                                <StatCard
                                    title={t('dashboard.monthlyExpenses') || "مصروفات الشهر"}
                                    value={currencyFormatter.format(thisMonthExpenses)}
                                    icon={TrendingDownIcon}
                                    color="bg-red-50 border border-red-200"
                                    subtitle={t('dashboard.thisMonth') || "هذا الشهر"}
                                />
                                <StatCard
                                    title={t('dashboard.monthlyDoctorShares')}
                                    value={currencyFormatter.format(thisMonthDoctorShares)}
                                    icon={DollarIcon}
                                    color="bg-orange-50 border border-orange-200"
                                    subtitle={t('dashboard.thisMonth') || "هذا الشهر"}
                                    onClick={() => setCurrentView('doctors')}
                                />
                                <StatCard
                                    title={t('dashboard.monthlyNetProfit') || "صافي الشهر"}
                                    value={currencyFormatter.format(clinicProfitThisMonth)}
                                    icon={clinicProfitThisMonth >= 0 ? TrendingUpIcon : TrendingDownIcon}
                                    color={clinicProfitThisMonth >= 0 ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}
                                    subtitle={t('dashboard.thisMonth') || "هذا الشهر"}
                                    onClick={() => setCurrentView('reports')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Operational Metrics Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full mr-3"></div>
                                {t('dashboard.operationalMetrics')}
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-4">
                                <StatCard
                                    title={t('dashboard.totalPatients')}
                                    value={patients.length}
                                    icon={PatientsIcon}
                                    color="bg-emerald-50 border border-emerald-200"
                                    subtitle={t('dashboard.activePatients')}
                                />
                                <StatCard
                                    title={t('dashboard.newPatientsThisMonth')}
                                    value={newPatientsThisMonth}
                                    icon={UserPlusIcon}
                                    color="bg-indigo-50 border border-indigo-200"
                                    subtitle="This month"
                                />
                                <StatCard
                                    title={t('dashboard.appointmentsToday')}
                                    value={todaysAppointmentsCount}
                                    icon={CalendarIcon}
                                    color="bg-sky-50 border border-sky-200"
                                    subtitle={t('dashboard.scheduledToday')}
                                />
                                <StatCard
                                    title={t('dashboard.nextAppointment')}
                                    value={nextAppointment ? new Intl.DateTimeFormat(locale, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }).format(new Date(nextAppointment.startTime)) : t('dashboard.noUpcomingAppointments')}
                                    icon={ClockIcon}
                                    color="bg-purple-50 border border-purple-200"
                                    subtitle={nextAppointment ? patients.find(p => p.id === nextAppointment.patientId)?.name : ''}
                                    onClick={() => setCurrentView('scheduler')}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
