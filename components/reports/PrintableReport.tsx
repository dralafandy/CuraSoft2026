import React, { useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import { Patient, AppointmentStatus, ExpenseCategory, TreatmentRecord, Expense, Appointment, InventoryItem, LabCase, Payment, SupplierInvoice } from '../../types';

const PrintStyles = () => (
  <style>{`
    @media print {
      @page {
        size: A4;
        margin: 1cm;
      }
      body {
        font-size: 12px;
        line-height: 1.4;
      }
      .print-header {
        margin-bottom: 1.5rem;
        page-break-after: avoid;
      }
      .print-section {
        margin-bottom: 1rem;
        page-break-inside: avoid;
      }
      table {
        font-size: 10px;
      }
      h1 {
        font-size: 18px;
      }
      h2, h3, h4 {
        font-size: 14px;
      }
    }
  `}</style>
);

const PrintTable: React.FC<{title: string, headers: string[], data: (string|number)[][]}> = ({ title, headers, data }) => (
    <div className="mb-6 break-inside-avoid">
        <h4 className="text-md font-bold text-slate-800 mb-2">{title}</h4>
        <table className="w-full text-sm border-collapse border border-slate-400">
            <thead className="bg-slate-100">
                <tr>
                    {headers.map(h => <th key={h} className="p-2 text-right font-semibold border border-slate-300">{h}</th>)}
                </tr>
            </thead>
            <tbody>
                {data.map((row, i) => (
                    <tr key={i} className="border-b border-slate-200">
                        {row.map((cell, j) => <td key={j} className="p-2 border border-slate-300">{cell}</td>)}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

interface PrintableReportProps {
    clinicData: ClinicData;
    activeTab: 'patientStats' | 'financialSummary' | 'appointmentOverview' | 'inventoryReport' | 'treatmentPerformance' | 'labCasesReport' | 'paymentsReport' | 'supplierInvoicesReport' | 'dentistsReport' | 'suppliersReport' | 'dailyFinancialSummary' | 'monthlyFinancialSummary' | 'quarterlyAnnualOverview';
    startDate: string;
    endDate: string;
}

const PrintableReport: React.FC<PrintableReportProps> = ({ clinicData, activeTab, startDate, endDate }) => {
    const { t, locale } = useI18n();
    const { patients, appointments, expenses, inventoryItems, treatmentDefinitions, dentists, treatmentRecords, labCases, payments, supplierInvoices, suppliers, clinicInfo } = clinicData;

    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });

    const filterDataByDate = <T extends Record<F, string | Date>, F extends keyof T>(data: T[], dateField: F): T[] => {
        if (!startDate || !endDate) return data;
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return data.filter(item => {
            const dateValue: string | Date = item[dateField];
            const itemDate = new Date(dateValue);
            return !isNaN(itemDate.getTime()) && itemDate >= start && itemDate <= end;
        });
    };

    const patientStats = useMemo(() => {
        const filteredPatients = patients.filter(p => {
            if (!startDate || !endDate) return true;
            const start = new Date(startDate);
            start.setHours(0,0,0,0);
            const end = new Date(endDate);
            end.setHours(23,59,59,999);
            const lastVisitDate = new Date(p.lastVisit);
            return lastVisitDate >= start && lastVisitDate <= end;
        });

        const genderDistribution = filteredPatients.reduce((acc, p) => {
            acc[p.gender] = (acc[p.gender] || 0) + 1;
            return acc;
        }, {} as Record<Patient['gender'], number>);

        const ageDistribution: Record<string, number> = {
            '0-18': 0, '19-35': 0, '36-55': 0, '56+': 0
        };
        filteredPatients.forEach(p => {
            const dob = new Date(p.dob);
            const ageDiffMs = Date.now() - dob.getTime();
            const ageDate = new Date(ageDiffMs);
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            if (age <= 18) ageDistribution['0-18']++;
            else if (age <= 35) ageDistribution['19-35']++;
            else if (age <= 55) ageDistribution['36-55']++;
            else ageDistribution['56+']++;
        });

        const newPatientsThisPeriod = patients.filter(p => {
            const lastVisitDate = new Date(p.lastVisit);
            if (!startDate || !endDate) return false;
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            return lastVisitDate >= start && lastVisitDate <= end;
        }).length;


        return {
            totalPatients: filteredPatients.length,
            genderDistribution,
            ageDistribution,
            newPatientsThisPeriod,
        };
    }, [patients, startDate, endDate]);

    const financialSummary = useMemo(() => {
        const filteredTreatmentRecords: TreatmentRecord[] = filterDataByDate(treatmentRecords, 'treatmentDate');
        const filteredExpenses: Expense[] = filterDataByDate(expenses, 'date');
        const filteredPayments: Payment[] = filterDataByDate(payments, 'date');

        const totalIncome = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalDoctorPayments = clinicData.doctorPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const netProfit = totalIncome - (totalExpenses + totalDoctorPayments);

        const incomeByTreatment: Record<string, number> = {};
        filteredPayments.forEach(p => {
            const method = t(`paymentMethod.${p.method}`);
            incomeByTreatment[method] = (incomeByTreatment[method] || 0) + p.amount;
        });

        const expensesByCategory: Record<ExpenseCategory, number> = {
            [ExpenseCategory.RENT]: 0, [ExpenseCategory.SALARIES]: 0, [ExpenseCategory.UTILITIES]: 0,
            [ExpenseCategory.LAB_FEES]: 0, [ExpenseCategory.SUPPLIES]: 0, [ExpenseCategory.MARKETING]: 0,
            [ExpenseCategory.MISC]: 0,
        };
        filteredExpenses.forEach(exp => {
            expensesByCategory[exp.category] += exp.amount;
        });

        return {
            totalIncome,
            totalExpenses,
            netProfit,
            incomeByTreatment,
            expensesByCategory,
        };
    }, [payments, expenses, startDate, endDate, t]);

    const appointmentOverview = useMemo(() => {
        const filteredAppointments: Appointment[] = filterDataByDate(appointments, 'startTime');

        const totalAppointments = filteredAppointments.length;
        const completedAppointments = filteredAppointments.filter(apt => apt.status === AppointmentStatus.COMPLETED).length;
        const cancelledAppointments = filteredAppointments.filter(apt => apt.status === AppointmentStatus.CANCELLED).length;
        const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

        const appointmentsByDentist: Record<string, number> = {};
        filteredAppointments.forEach(apt => {
            const dentistName = dentists.find(d => d.id === apt.dentistId)?.name || t('common.unknownDentist');
            appointmentsByDentist[dentistName] = (appointmentsByDentist[dentistName] || 0) + 1;
        });

        return {
            totalAppointments,
            completedAppointments,
            cancelledAppointments,
            completionRate,
            appointmentsByDentist,
        };
    }, [appointments, dentists, startDate, endDate, t]);

    const inventoryReport = useMemo(() => {
        const lowStockThreshold = 5; 
        const lowStockItems = inventoryItems.filter(item => item.currentStock <= lowStockThreshold);
        const allItemsValue = inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);

        return {
            lowStockItems,
            allInventoryItems: inventoryItems,
            allItemsValue,
        };
    }, [inventoryItems]);

    const treatmentPerformance = useMemo(() => {
        const filteredTreatmentRecords: TreatmentRecord[] = filterDataByDate(treatmentRecords, 'treatmentDate');

        const treatmentStats: Record<string, { count: number; totalRevenue: number; totalClinicShare: number; totalDoctorShare: number; }> = {};
        filteredTreatmentRecords.forEach(rec => {
            const treatmentName = treatmentDefinitions.find(td => td.id === rec.treatmentDefinitionId)?.name || t('common.unknownTreatment');
            if (!treatmentStats[treatmentName]) {
                treatmentStats[treatmentName] = { count: 0, totalRevenue: 0, totalClinicShare: 0, totalDoctorShare: 0 };
            }
            treatmentStats[treatmentName].count++;
            treatmentStats[treatmentName].totalRevenue += rec.totalTreatmentCost;
            treatmentStats[treatmentName].totalClinicShare += rec.clinicShare;
            treatmentStats[treatmentName].totalDoctorShare += rec.doctorShare;
        });

        const formattedStats = Object.entries(treatmentStats).map(([name, stats]) => ({
            treatment: name,
            count: stats.count,
            averagePrice: stats.count > 0 ? stats.totalRevenue / stats.count : 0,
            totalRevenue: stats.totalRevenue,
            totalClinicShare: stats.totalClinicShare,
            totalDoctorShare: stats.totalDoctorShare,
        })).sort((a,b) => b.totalRevenue - a.totalRevenue);

        return {
            allTreatmentPerformance: formattedStats,
        };
    }, [treatmentRecords, treatmentDefinitions, startDate, endDate, t]);

    const labCasesReport = useMemo(() => {
        const filteredLabCases: LabCase[] = filterDataByDate(labCases, 'sentDate');

        return {
            filteredLabCases,
        };
    }, [labCases, startDate, endDate]);

    const paymentsReport = useMemo(() => {
        const filteredPayments: Payment[] = filterDataByDate(payments, 'date');

        return {
            filteredPayments,
        };
    }, [payments, startDate, endDate]);

    const supplierInvoicesReport = useMemo(() => {
        const filteredSupplierInvoices: SupplierInvoice[] = filterDataByDate(supplierInvoices, 'invoiceDate');

        return {
            filteredSupplierInvoices,
        };
    }, [supplierInvoices, startDate, endDate]);
    
    const tabTitles: Record<typeof activeTab, string> = {
        patientStats: t('reports.tabPatientStatistics'),
        financialSummary: t('reports.tabFinancialSummary'),
        appointmentOverview: t('reports.tabAppointmentOverview'),
        inventoryReport: t('reports.tabInventoryReport'),
        treatmentPerformance: t('reports.tabTreatmentPerformance'),
        labCasesReport: t('reports.tabLabCasesReport'),
        paymentsReport: t('reports.tabPaymentsReport'),
        supplierInvoicesReport: t('reports.tabSupplierInvoicesReport'),
        dentistsReport: t('reports.tabDentistsReport'),
        suppliersReport: t('reports.tabSuppliersReport'),
        dailyFinancialSummary: t('reports.dailyFinancialSummary.title'),
        monthlyFinancialSummary: t('reports.monthlyFinancialSummary.title'),
        quarterlyAnnualOverview: t('reports.quarterlyAnnualOverview.title'),
    };

    return (
        <>
            <PrintStyles />
            <div className="p-4 bg-white text-slate-900" dir="rtl">
                <header className="print-header text-center mb-6">
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold text-slate-800 mb-1">{clinicInfo.name || t('appName')}</h1>
                        <div className="text-sm text-slate-600 space-y-1">
                            {clinicInfo.address && <p>{clinicInfo.address}</p>}
                            <div className="flex justify-center gap-4">
                                {clinicInfo.phone && <span>{t('common.phone')}: {clinicInfo.phone}</span>}
                                {clinicInfo.email && <span>{t('common.email')}: {clinicInfo.email}</span>}
                            </div>
                        </div>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-700 mb-2">{tabTitles[activeTab]}</h2>
                    <p className="text-md text-slate-600">{t('reports.dateRange')}: {startDate ? dateFormatter.format(new Date(startDate)) : t('common.na')} - {endDate ? dateFormatter.format(new Date(endDate)) : t('common.na')}</p>
                </header>
            <main>
                {activeTab === 'patientStats' && (
                    <div className="print-section space-y-6">
                         <PrintTable
                            title={t('reports.patientStats.genderDistribution')}
                            headers={[t('patientDetails.gender'), t('reports.treatmentPerformance.count')]}
                            data={Object.entries(patientStats.genderDistribution).map(([label, value]: [string, number]) => [t(label.toLowerCase() as any), value])}
                        />
                        <PrintTable
                            title={t('reports.patientStats.ageDistribution')}
                            headers={[t('reports.patientStats.ageGroup'), t('reports.treatmentPerformance.count')]}
                            data={Object.entries(patientStats.ageDistribution).map(([label, value]: [string, number]) => [label, value])}
                        />
                    </div>
                )}
                {activeTab === 'financialSummary' && (
                    <div className="print-section space-y-6">
                         <PrintTable
                            title={t('reports.financialSummary.incomeByTreatment')}
                            headers={[t('reports.treatmentPerformance.treatment'), t('reports.financialSummary.totalIncome')]}
                            data={Object.entries(financialSummary.incomeByTreatment).map(([label, value]: [string, number]) => [label, currencyFormatter.format(value)])}
                        />
                        <PrintTable
                            title={t('reports.financialSummary.expensesByCategory')}
                            headers={[t('expenses.category'), t('expenses.amount')]}
                            data={Object.entries(financialSummary.expensesByCategory).filter(([, value]: [string, number]) => value > 0).map(([label, value]: [string, number]) => [t(`expenseCategory.${label}`), currencyFormatter.format(value)])}
                        />
                    </div>
                )}
                {activeTab === 'appointmentOverview' && (
                     <div className="print-section space-y-6">
                        <PrintTable
                            title={t('reports.appointmentOverview.appointmentsByDentist')}
                            headers={[t('addAppointmentModal.dentist'), t('reports.appointmentOverview.totalAppointments')]}
                            data={Object.entries(appointmentOverview.appointmentsByDentist).map(([label, value]: [string, number]) => [label, value])}
                        />
                    </div>
                )}
                {activeTab === 'inventoryReport' && (
                    <div className="print-section space-y-6">
                         <table className="min-w-full text-sm text-slate-700 border-collapse border border-slate-300">
                            <caption className="text-md font-bold text-slate-800 mb-2 text-start p-2 bg-slate-100">{t('reports.inventoryReport.allInventoryItems')}</caption>
                            <thead className="bg-slate-100">
                                <tr className="border-b border-slate-200">
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('reports.inventoryReport.itemName')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('reports.inventoryReport.currentStock')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('reports.inventoryReport.unitCost')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryReport.allInventoryItems.map(item => (
                                    <tr key={item.id} className="border-b border-slate-200 last:border-b-0">
                                        <td className="p-2 border border-slate-300">{item.name}</td>
                                        <td className="p-2 border border-slate-300">{item.currentStock}</td>
                                        <td className="p-2 border border-slate-300">{currencyFormatter.format(item.unitCost)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                 {activeTab === 'treatmentPerformance' && (
                    <div className="print-section">
                         <table className="min-w-full text-sm text-slate-700 border-collapse border border-slate-300">
                             <caption className="text-md font-bold text-slate-800 mb-2 text-start p-2 bg-slate-100">{t('reports.treatmentPerformance.allTreatmentPerformance')}</caption>
                            <thead className="bg-slate-100">
                                <tr className="border-b border-slate-200">
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('reports.treatmentPerformance.treatment')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('reports.treatmentPerformance.count')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('reports.treatmentPerformance.averagePrice')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('reports.treatmentPerformance.totalRevenue')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('reports.treatmentPerformance.totalClinicShare')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('reports.treatmentPerformance.totalDoctorShare')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {treatmentPerformance.allTreatmentPerformance.map(tp => (
                                    <tr key={tp.treatment} className="border-b border-slate-200 last:border-b-0">
                                        <td className="p-2 border border-slate-300">{tp.treatment}</td>
                                        <td className="p-2 border border-slate-300">{tp.count}</td>
                                        <td className="p-2 border border-slate-300">{currencyFormatter.format(tp.averagePrice)}</td>
                                        <td className="p-2 border border-slate-300">{currencyFormatter.format(tp.totalRevenue)}</td>
                                        <td className="p-2 border border-slate-300">{currencyFormatter.format(tp.totalClinicShare)}</td>
                                        <td className="p-2 border border-slate-300">{currencyFormatter.format(tp.totalDoctorShare)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'labCasesReport' && (
                    <div className="print-section">
                        <table className="min-w-full text-sm text-slate-700 border-collapse border border-slate-300">
                            <caption className="text-md font-bold text-slate-800 mb-2 text-start p-2 bg-slate-100">{t('reports.labCasesReport.allLabCases')}</caption>
                            <thead className="bg-slate-100">
                                <tr className="border-b border-slate-200">
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('labCase.patientName')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('labCase.caseType')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('labCase.status')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('labCase.cost')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('labCase.dueDate')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {labCasesReport.filteredLabCases.map(lc => (
                                    <tr key={lc.id} className="border-b border-slate-200 last:border-b-0">
                                        <td className="p-2 border border-slate-300">{patients.find(p => p.id === lc.patientId)?.name || t('common.unknownPatient')}</td>
                                        <td className="p-2 border border-slate-300">{lc.caseType}</td>
                                        <td className="p-2 border border-slate-300">{t(`labCaseStatus.${lc.status}`)}</td>
                                        <td className="p-2 border border-slate-300">{currencyFormatter.format(lc.labCost)}</td>
                                        <td className="p-2 border border-slate-300">{dateFormatter.format(new Date(lc.dueDate))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'paymentsReport' && (
                    <div className="print-section">
                        <table className="min-w-full text-sm text-slate-700 border-collapse border border-slate-300">
                            <caption className="text-md font-bold text-slate-800 mb-2 text-start p-2 bg-slate-100">{t('reports.paymentsReport.allPayments')}</caption>
                            <thead className="bg-slate-100">
                                <tr className="border-b border-slate-200">
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('payment.patientName')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('payment.amount')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('payment.method')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('payment.date')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('payment.notes')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(pay => (
                                    <tr key={pay.id} className="border-b border-slate-200 last:border-b-0">
                                        <td className="p-2 border border-slate-300">{patients.find(p => p.id === pay.patientId)?.name || t('common.unknownPatient')}</td>
                                        <td className="p-2 border border-slate-300">{currencyFormatter.format(pay.amount)}</td>
                                        <td className="p-2 border border-slate-300">{t(`paymentMethod.${pay.method}`)}</td>
                                        <td className="p-2 border border-slate-300">{dateFormatter.format(new Date(pay.date))}</td>
                                        <td className="p-2 border border-slate-300">{pay.notes || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'supplierInvoicesReport' && (
                    <div className="print-section">
                        <table className="min-w-full text-sm text-slate-700 border-collapse border border-slate-300">
                            <caption className="text-md font-bold text-slate-800 mb-2 text-start p-2 bg-slate-100">{t('reports.supplierInvoicesReport.allSupplierInvoices')}</caption>
                            <thead className="bg-slate-100">
                                <tr className="border-b border-slate-200">
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('supplierInvoice.supplierName')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('supplierInvoice.invoiceNumber')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('supplierInvoice.totalAmount')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('supplierInvoice.date')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('supplierInvoice.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {supplierInvoicesReport.filteredSupplierInvoices.map(si => (
                                    <tr key={si.id} className="border-b border-slate-200 last:border-b-0">
                                        <td className="p-2 border border-slate-300">{suppliers.find(s => s.id === si.supplierId)?.name || t('common.unknownSupplier')}</td>
                                        <td className="p-2 border border-slate-300">{si.invoiceNumber}</td>
                                        <td className="p-2 border border-slate-300">{currencyFormatter.format(si.amount)}</td>
                                        <td className="p-2 border border-slate-300">{dateFormatter.format(new Date(si.invoiceDate))}</td>
                                        <td className="p-2 border border-slate-300">{t(`supplierInvoiceStatus.${si.status}`)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'dentistsReport' && (
                    <div className="print-section">
                        <table className="min-w-full text-sm text-slate-700 border-collapse border border-slate-300">
                            <caption className="text-md font-bold text-slate-800 mb-2 text-start p-2 bg-slate-100">{t('reports.dentistsReport.allDentists')}</caption>
                            <thead className="bg-slate-100">
                                <tr className="border-b border-slate-200">
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('dentist.name')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('dentist.specialty')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dentists.map(d => (
                                    <tr key={d.id} className="border-b border-slate-200 last:border-b-0">
                                        <td className="p-2 border border-slate-300">{d.name}</td>
                                        <td className="p-2 border border-slate-300">{d.specialty}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'suppliersReport' && (
                    <div className="print-section">
                        <table className="min-w-full text-sm text-slate-700 border-collapse border border-slate-300">
                            <caption className="text-md font-bold text-slate-800 mb-2 text-start p-2 bg-slate-100">{t('reports.suppliersReport.allSuppliers')}</caption>
                            <thead className="bg-slate-100">
                                <tr className="border-b border-slate-200">
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('supplier.name')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('supplier.contactPerson')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('supplier.phone')}</th>
                                    <th className="p-2 text-right font-semibold border border-slate-300">{t('supplier.email')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map(s => (
                                    <tr key={s.id} className="border-b border-slate-200 last:border-b-0">
                                        <td className="p-2 border border-slate-300">{s.name}</td>
                                        <td className="p-2 border border-slate-300">{s.contactPerson}</td>
                                        <td className="p-2 border border-slate-300">{s.phone}</td>
                                        <td className="p-2 border border-slate-300">{s.email}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'dailyFinancialSummary' && (
                    <div className="print-section space-y-8">
                        {/* Report Header */}
                        <div className="text-center border-b-2 border-slate-300 pb-4 mb-6">
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">
                                {startDate === endDate ? t('reports.dailyFinancialSummary.title') : 'ملخص مالي للفترة'}
                            </h3>
                            <p className="text-lg text-slate-600">
                                {startDate === endDate
                                    ? new Date(startDate).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                    : `${dateFormatter.format(new Date(startDate))} - ${dateFormatter.format(new Date(endDate))}`
                                }
                            </p>
                        </div>

                        {/* Financial Summary Cards */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {(() => {
                                const filteredTreatmentRecords = treatmentRecords.filter(tr => {
                                    const treatmentDate = new Date(tr.treatmentDate);
                                    const start = new Date(startDate);
                                    const end = new Date(endDate);
                                    return treatmentDate >= start && treatmentDate <= end;
                                });

                                const filteredPayments = payments.filter(p => {
                                    const paymentDate = new Date(p.date);
                                    const start = new Date(startDate);
                                    const end = new Date(endDate);
                                    return paymentDate >= start && paymentDate <= end;
                                });

                                const filteredExpenses = expenses.filter(e => {
                                    const expenseDate = new Date(e.date);
                                    const start = new Date(startDate);
                                    const end = new Date(endDate);
                                    return expenseDate >= start && expenseDate <= end;
                                });

                                const todaysRevenue = filteredTreatmentRecords.reduce((sum, tr) => sum + tr.totalTreatmentCost, 0);
                                const todaysDoctorShares = filteredTreatmentRecords.reduce((sum, tr) => sum + tr.doctorShare, 0);
                                const todaysExpensesTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
                                const todaysProfit = todaysRevenue - todaysExpensesTotal - todaysDoctorShares;

                                const pendingPayments = treatmentRecords
                                    .filter(tr => new Date(tr.treatmentDate) <= new Date(endDate))
                                    .reduce((sum, tr) => sum + tr.totalTreatmentCost, 0) -
                                    payments.filter(p => new Date(p.date) <= new Date(endDate))
                                        .reduce((sum, p) => sum + p.amount, 0);

                                const overdueInvoices = treatmentRecords
                                    .filter(tr => {
                                        const treatmentDate = new Date(tr.treatmentDate);
                                        const daysSinceTreatment = (new Date(endDate).getTime() - treatmentDate.getTime()) / (1000 * 60 * 60 * 24);
                                        return daysSinceTreatment > 30 && tr.totalTreatmentCost > payments
                                            .filter(p => p.patientId === tr.patientId)
                                            .reduce((sum, p) => sum + p.amount, 0);
                                    })
                                    .reduce((sum, tr) => sum + tr.totalTreatmentCost, 0);

                                const numPayments = filteredPayments.length;
                                const numExpenses = filteredExpenses.length;
                                const todaysAppointments = appointments.filter(a => {
                                    const aDate = new Date(a.startTime);
                                    const start = new Date(startDate);
                                    const end = new Date(endDate);
                                    return aDate >= start && aDate <= end;
                                }).length;

                                const uniquePatientsToday = new Set(filteredPayments.map(p => p.patientId)).size;
                                const todaysDoctorPercentage = todaysRevenue > 0 ? (todaysDoctorShares / todaysRevenue) * 100 : 0;

                                const cards = [
                                    { title: startDate === endDate ? 'إيرادات اليوم' : 'إيرادات الفترة', value: todaysRevenue, icon: '💰', color: 'blue' },
                                    { title: startDate === endDate ? 'حصة الأطباء اليوم' : 'حصة الأطباء للفترة', value: todaysDoctorShares, icon: '👨‍⚕️', color: 'green' },
                                    { title: startDate === endDate ? 'مصروفات اليوم' : 'مصروفات الفترة', value: todaysExpensesTotal, icon: '💸', color: 'red' },
                                    { title: startDate === endDate ? 'ربح اليوم' : 'ربح الفترة', value: todaysProfit, icon: '📈', color: todaysProfit >= 0 ? 'green' : 'red' },
                                    { title: 'مدفوعات معلقة', value: Math.max(0, pendingPayments), icon: '⏳', color: 'orange' },
                                    { title: 'فواتير متأخرة', value: Math.max(0, overdueInvoices), icon: '⏰', color: 'purple' },
                                    { title: 'عدد المدفوعات', value: numPayments, icon: '💳', color: 'indigo' },
                                    { title: 'عدد المصروفات', value: numExpenses, icon: '📋', color: 'pink' },
                                    { title: startDate === endDate ? 'مواعيد اليوم' : 'مواعيد الفترة', value: todaysAppointments, icon: '📅', color: 'teal' },
                                    { title: startDate === endDate ? 'المرضى الفريدون' : 'إجمالي المرضى الفريدين', value: uniquePatientsToday, icon: '👥', color: 'cyan' },
                                    { title: 'نسبة الأطباء', value: `${todaysDoctorPercentage.toFixed(1)}%`, icon: '📊', color: 'lime' }
                                ];

                                return cards.map((card, index) => (
                                    <div key={index} className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-lg p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-2xl">{card.icon}</span>
                                            <span className="text-sm font-medium text-slate-600">{card.title}</span>
                                        </div>
                                        <div className="text-xl font-bold text-slate-800">
                                            {typeof card.value === 'number' && card.title !== 'نسبة الأطباء'
                                                ? currencyFormatter.format(card.value)
                                                : card.value
                                            }
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>

                        {/* Revenue Trend Chart Placeholder */}
                        <div className="border border-slate-200 rounded-lg p-6 mb-6">
                            <h4 className="text-lg font-bold text-slate-800 mb-4">
                                {startDate === endDate ? t('reports.dailyFinancialSummary.revenueTrend') : 'اتجاه الإيرادات للفترة'}
                            </h4>
                            <div className="text-center text-slate-500 py-8">
                                [رسم بياني لاتجاه الإيرادات - يتطلب عرض تفاعلي]
                            </div>
                        </div>

                        {/* Expenses Breakdown Chart Placeholder */}
                        <div className="border border-slate-200 rounded-lg p-6 mb-6">
                            <h4 className="text-lg font-bold text-slate-800 mb-4">
                                {startDate === endDate ? t('reports.dailyFinancialSummary.expensesBreakdown') : 'توزيع المصروفات للفترة'}
                            </h4>
                            <div className="text-center text-slate-500 py-8">
                                [رسم بياني دائري لتوزيع المصروفات - يتطلب عرض تفاعلي]
                            </div>
                        </div>

                        {/* Doctor Earnings Chart Placeholder */}
                        <div className="border border-slate-200 rounded-lg p-6 mb-6">
                            <h4 className="text-lg font-bold text-slate-800 mb-4">
                                {startDate === endDate ? 'استحقاقات الأطباء اليومية' : 'استحقاقات الأطباء للفترة'}
                            </h4>
                            <div className="text-center text-slate-500 py-8">
                                [رسم بياني لاستحقاقات الأطباء - يتطلب عرض تفاعلي]
                            </div>
                        </div>

                        {/* Detailed Tables */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <PrintTable
                                title={startDate === endDate ? t('reports.dailyFinancialSummary.todaysPayments') : 'مدفوعات الفترة'}
                                headers={[t('common.patient'), t('payment.amount'), t('payment.method'), t('common.date')]}
                                data={payments.filter(p => {
                                    const paymentDate = new Date(p.date);
                                    const start = new Date(startDate);
                                    const end = new Date(endDate);
                                    return paymentDate >= start && paymentDate <= end;
                                }).map(payment => {
                                    const patient = patients.find(p => p.id === payment.patientId);
                                    return [
                                        patient?.name || t('common.unknown'),
                                        currencyFormatter.format(payment.amount),
                                        t(`paymentMethod.${payment.method}`),
                                        dateFormatter.format(new Date(payment.date))
                                    ];
                                })}
                            />

                            <PrintTable
                                title={startDate === endDate ? t('reports.dailyFinancialSummary.todaysExpenses') : 'مصروفات الفترة'}
                                headers={[t('expense.description'), t('expense.amount'), t('expense.category'), t('common.date')]}
                                data={expenses.filter(e => {
                                    const expenseDate = new Date(e.date);
                                    const start = new Date(startDate);
                                    const end = new Date(endDate);
                                    return expenseDate >= start && expenseDate <= end;
                                }).map(expense => [
                                    expense.description,
                                    currencyFormatter.format(expense.amount),
                                    t(`expenseCategory.${expense.category}`),
                                    dateFormatter.format(new Date(expense.date))
                                ])}
                            />
                        </div>

                        {/* Footer */}
                        <div className="text-center text-sm text-slate-500 border-t border-slate-200 pt-4 mt-8">
                            <p>تم إنشاء هذا التقرير في {new Date().toLocaleString(locale)}</p>
                            <p>نظام إدارة عيادة الأسنان - {clinicInfo.name || t('appName')}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'monthlyFinancialSummary' && (
                    <div className="print-section space-y-6">
                        <h3 className="text-xl font-bold text-slate-800">{t('reports.monthlyFinancialSummary.title')} - {new Date(startDate).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</h3>

                        <PrintTable
                            title={t('reports.monthlyFinancialSummary.kpiCards')}
                            headers={[t('common.metric'), t('common.value')]}
                            data={[
                                [t('reports.monthlyFinancialSummary.thisMonthRevenue'), currencyFormatter.format(
                                    treatmentRecords.filter(tr => {
                                        const treatmentDate = new Date(tr.treatmentDate);
                                        const start = new Date(startDate);
                                        const end = new Date(endDate);
                                        return treatmentDate >= start && treatmentDate <= end;
                                    }).reduce((sum, tr) => sum + tr.totalTreatmentCost, 0)
                                )],
                                [t('dashboard.totalEarnings'), currencyFormatter.format(
                                    treatmentRecords.filter(tr => {
                                        const treatmentDate = new Date(tr.treatmentDate);
                                        const start = new Date(startDate);
                                        const end = new Date(endDate);
                                        return treatmentDate >= start && treatmentDate <= end;
                                    }).reduce((sum, tr) => sum + tr.doctorShare, 0)
                                )],
                                [t('reports.monthlyFinancialSummary.thisMonthExpenses'), currencyFormatter.format(
                                    expenses.filter(e => {
                                        const expenseDate = new Date(e.date);
                                        const start = new Date(startDate);
                                        const end = new Date(endDate);
                                        return expenseDate >= start && expenseDate <= end;
                                    }).reduce((sum, e) => sum + e.amount, 0)
                                )],
                                [t('reports.monthlyFinancialSummary.clinicProfitThisMonth'), currencyFormatter.format(
                                    treatmentRecords.filter(tr => {
                                        const treatmentDate = new Date(tr.treatmentDate);
                                        const start = new Date(startDate);
                                        const end = new Date(endDate);
                                        return treatmentDate >= start && treatmentDate <= end;
                                    }).reduce((sum, tr) => sum + tr.totalTreatmentCost, 0) -
                                    expenses.filter(e => {
                                        const expenseDate = new Date(e.date);
                                        const start = new Date(startDate);
                                        const end = new Date(endDate);
                                        return expenseDate >= start && expenseDate <= end;
                                    }).reduce((sum, e) => sum + e.amount, 0) -
                                    treatmentRecords.filter(tr => {
                                        const treatmentDate = new Date(tr.treatmentDate);
                                        const start = new Date(startDate);
                                        const end = new Date(endDate);
                                        return treatmentDate >= start && treatmentDate <= end;
                                    }).reduce((sum, tr) => sum + tr.doctorShare, 0)
                                )]
                            ]}
                        />

                        <PrintTable
                            title={t('reports.monthlyFinancialSummary.monthlyPayments')}
                            headers={[t('common.patient'), t('payment.amount'), t('common.date')]}
                            data={payments.filter(p => {
                                const paymentDate = new Date(p.date);
                                const start = new Date(startDate);
                                const end = new Date(endDate);
                                return paymentDate >= start && paymentDate <= end;
                            }).slice(0, 20).map(payment => {
                                const patient = patients.find(p => p.id === payment.patientId);
                                return [
                                    patient?.name || t('common.unknown'),
                                    currencyFormatter.format(payment.amount),
                                    dateFormatter.format(new Date(payment.date))
                                ];
                            })}
                        />

                        <PrintTable
                            title={t('reports.monthlyFinancialSummary.monthlyExpenses')}
                            headers={[t('expense.description'), t('expense.amount'), t('expense.category')]}
                            data={expenses.filter(e => {
                                const expenseDate = new Date(e.date);
                                const start = new Date(startDate);
                                const end = new Date(endDate);
                                return expenseDate >= start && expenseDate <= end;
                            }).slice(0, 20).map(expense => [
                                expense.description,
                                currencyFormatter.format(expense.amount),
                                t(`expenseCategory.${expense.category}`)
                            ])}
                        />
                    </div>
                )}

                {activeTab === 'quarterlyAnnualOverview' && (
                    <div className="print-section space-y-6">
                        <h3 className="text-xl font-bold text-slate-800">{t('reports.quarterlyAnnualOverview.title')} - {startDate.split('-')[0]}</h3>

                        <PrintTable
                            title={t('reports.quarterlyAnnualOverview.kpiCards')}
                            headers={[t('common.metric'), t('common.value')]}
                            data={[
                                [t('reports.quarterlyAnnualOverview.totalRevenue'), currencyFormatter.format(
                                    treatmentRecords.filter(tr => {
                                        const treatmentDate = new Date(tr.treatmentDate);
                                        const start = new Date(startDate);
                                        const end = new Date(endDate);
                                        return treatmentDate >= start && treatmentDate <= end;
                                    }).reduce((sum, tr) => sum + tr.totalTreatmentCost, 0)
                                )],
                                [t('dashboard.totalEarnings'), currencyFormatter.format(
                                    treatmentRecords.filter(tr => {
                                        const treatmentDate = new Date(tr.treatmentDate);
                                        const start = new Date(startDate);
                                        const end = new Date(endDate);
                                        return treatmentDate >= start && treatmentDate <= end;
                                    }).reduce((sum, tr) => sum + tr.doctorShare, 0)
                                )],
                                [t('reports.quarterlyAnnualOverview.totalExpenses'), currencyFormatter.format(
                                    expenses.filter(e => {
                                        const expenseDate = new Date(e.date);
                                        const start = new Date(startDate);
                                        const end = new Date(endDate);
                                        return expenseDate >= start && expenseDate <= end;
                                    }).reduce((sum, e) => sum + e.amount, 0)
                                )],
                                [t('reports.quarterlyAnnualOverview.cumulativeProfit'), currencyFormatter.format(
                                    treatmentRecords.filter(tr => {
                                        const treatmentDate = new Date(tr.treatmentDate);
                                        const start = new Date(startDate);
                                        const end = new Date(endDate);
                                        return treatmentDate >= start && treatmentDate <= end;
                                    }).reduce((sum, tr) => sum + tr.totalTreatmentCost, 0) -
                                    expenses.filter(e => {
                                        const expenseDate = new Date(e.date);
                                        const start = new Date(startDate);
                                        const end = new Date(endDate);
                                        return expenseDate >= start && expenseDate <= end;
                                    }).reduce((sum, e) => sum + e.amount, 0) -
                                    treatmentRecords.filter(tr => {
                                        const treatmentDate = new Date(tr.treatmentDate);
                                        const start = new Date(startDate);
                                        const end = new Date(endDate);
                                        return treatmentDate >= start && treatmentDate <= end;
                                    }).reduce((sum, tr) => sum + tr.doctorShare, 0)
                                )]
                            ]}
                        />

                        <PrintTable
                            title={t('reports.quarterlyAnnualOverview.periodPayments')}
                            headers={[t('common.patient'), t('payment.amount'), t('common.date')]}
                            data={payments.filter(p => {
                                const paymentDate = new Date(p.date);
                                const start = new Date(startDate);
                                const end = new Date(endDate);
                                return paymentDate >= start && paymentDate <= end;
                            }).slice(0, 20).map(payment => {
                                const patient = patients.find(p => p.id === payment.patientId);
                                return [
                                    patient?.name || t('common.unknown'),
                                    currencyFormatter.format(payment.amount),
                                    dateFormatter.format(new Date(payment.date))
                                ];
                            })}
                        />

                        <PrintTable
                            title={t('reports.quarterlyAnnualOverview.periodExpenses')}
                            headers={[t('expense.description'), t('expense.amount'), t('expense.category')]}
                            data={expenses.filter(e => {
                                const expenseDate = new Date(e.date);
                                const start = new Date(startDate);
                                const end = new Date(endDate);
                                return expenseDate >= start && expenseDate <= end;
                            }).slice(0, 20).map(expense => [
                                expense.description,
                                currencyFormatter.format(expense.amount),
                                t(`expenseCategory.${expense.category}`)
                            ])}
                        />
                    </div>
                )}
            </main>
        </div>
        </>
    );
};

export default PrintableReport;