import React, { useMemo } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { ClinicData, useClinicData } from '../../hooks/useClinicData';
import { Payment, Expense, TreatmentRecord, DoctorPayment, SupplierInvoice } from '../../types';

interface PrintableFinancialAccountsProps {
  clinicData: ClinicData;
  activeTab: 'revenue' | 'expenses' | 'balances';
  filters: {
    startDate: string;
    endDate: string;
    dentistId?: string;
    supplierId?: string;
    category?: string;
  };
  summaryData: {
    totalRevenue: number;
    totalPayments: number;
    totalExpenses: number;
    totalDoctorPayments: number;
    totalSupplierInvoices: number;
    unpaidInvoices: number;
    netProfit: number;
    cashFlow: number;
  };
}

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

const PrintableFinancialAccounts: React.FC<PrintableFinancialAccountsProps> = ({
  clinicData,
  activeTab,
  filters,
  summaryData
}) => {
  const { t, locale } = useI18n();
  const { clinicInfo } = useClinicData();
  const { payments, expenses, treatmentRecords, doctorPayments, supplierInvoices, patients, dentists, suppliers } = clinicData;

  const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
  const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });

  const filterDataByDate = <T extends Record<F, string | Date>, F extends keyof T>(data: T[], dateField: F): T[] => {
    if (!filters.startDate || !filters.endDate) return data;
    const start = new Date(filters.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);

    return data.filter(item => {
      const dateValue: string | Date = item[dateField];
      const itemDate = new Date(dateValue);
      return !isNaN(itemDate.getTime()) && itemDate >= start && itemDate <= end;
    });
  };

  const filteredPayments = useMemo(() => {
    let filtered = filterDataByDate(payments, 'date');
    if (filters.dentistId) {
      filtered = filtered.filter(p => {
        const treatment = treatmentRecords.find(tr => tr.patientId === p.patientId);
        return treatment?.dentistId === filters.dentistId;
      });
    }
    return filtered;
  }, [payments, filters, treatmentRecords]);

  const filteredExpenses = useMemo(() => {
    let filtered = filterDataByDate(expenses, 'date');
    if (filters.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }
    return filtered;
  }, [expenses, filters]);

  const filteredDoctorPayments = useMemo(() => {
    let filtered = filterDataByDate(doctorPayments, 'date');
    if (filters.dentistId) {
      filtered = filtered.filter(dp => dp.dentistId === filters.dentistId);
    }
    return filtered;
  }, [doctorPayments, filters]);

  const filteredSupplierInvoices = useMemo(() => {
    let filtered = filterDataByDate(supplierInvoices, 'invoiceDate');
    if (filters.supplierId) {
      filtered = filtered.filter(si => si.supplierId === filters.supplierId);
    }
    return filtered;
  }, [supplierInvoices, filters]);

  const filteredTreatmentRecords = useMemo(() => {
    let filtered = filterDataByDate(treatmentRecords, 'treatmentDate');
    if (filters.dentistId) {
      filtered = filtered.filter(tr => tr.dentistId === filters.dentistId);
    }
    return filtered;
  }, [treatmentRecords, filters]);

  const tabTitles = {
    revenue: t('financialAccounts.tabs.revenue'),
    expenses: t('financialAccounts.tabs.expenses'),
    balances: t('financialAccounts.tabs.balances'),
  };

  return (
    <div className="p-4 bg-white text-slate-900" dir="rtl" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontSize: '12px', lineHeight: '1.4' }}>
      <header className="text-center mb-6 break-inside-avoid">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-800 mb-1">{clinicInfo.name || t('appName')}</h1>
          <p className="text-sm text-slate-600">{clinicInfo.address}</p>
          <p className="text-sm text-slate-600">{clinicInfo.phone} | {clinicInfo.email}</p>
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">{t('financialAccounts.title')} - {tabTitles[activeTab]}</h2>
        <p className="text-sm text-slate-600">
          {t('reports.dateRange')}: {filters.startDate ? dateFormatter.format(new Date(filters.startDate)) : t('common.na')} - {filters.endDate ? dateFormatter.format(new Date(filters.endDate)) : t('common.na')}
        </p>
      </header>

      <main>
        {/* Financial Summary */}
        <div className="mb-6 break-inside-avoid">
          <h3 className="text-lg font-bold text-slate-800 mb-4">{t('financialSummary.title')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-sm text-slate-600">{t('financialSummary.totalRevenue')}</p>
              <p className="text-lg font-bold text-green-600">{currencyFormatter.format(summaryData.totalRevenue)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-sm text-slate-600">{t('financialSummary.totalPayments')}</p>
              <p className="text-lg font-bold text-blue-600">{currencyFormatter.format(summaryData.totalPayments)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-sm text-slate-600">{t('financialSummary.totalExpenses')}</p>
              <p className="text-lg font-bold text-red-600">{currencyFormatter.format(summaryData.totalExpenses)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-sm text-slate-600">{t('financialSummary.netProfit')}</p>
              <p className="text-lg font-bold text-slate-800">{currencyFormatter.format(summaryData.netProfit)}</p>
            </div>
          </div>
        </div>

        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <PrintTable
              title={t('revenueTab.payments')}
              headers={[t('revenueTab.patient'), t('revenueTab.amount'), t('revenueTab.date'), t('revenueTab.method')]}
              data={filteredPayments.map(payment => {
                const patient = patients.find(p => p.id === payment.patientId);
                return [
                  patient?.name || t('common.unknownPatient'),
                  currencyFormatter.format(payment.amount),
                  dateFormatter.format(new Date(payment.date)),
                  t(`paymentMethod.${payment.method}`)
                ];
              })}
            />

            <PrintTable
              title={t('revenueTab.treatmentRecords')}
              headers={[t('revenueTab.patient'), t('revenueTab.treatment'), t('revenueTab.cost'), t('revenueTab.date'), t('revenueTab.dentist')]}
              data={filteredTreatmentRecords.map(record => {
                const patient = patients.find(p => p.id === record.patientId);
                const dentist = dentists.find(d => d.id === record.dentistId);
                const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);
                return [
                  patient?.name || t('common.unknownPatient'),
                  treatmentDef?.name || t('common.unknownTreatment'),
                  currencyFormatter.format(record.totalTreatmentCost),
                  dateFormatter.format(new Date(record.treatmentDate)),
                  dentist?.name || t('common.unknownDentist')
                ];
              })}
            />
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <PrintTable
              title={t('expensesTab.expenses')}
              headers={[t('expensesTab.description'), t('expensesTab.amount'), t('expensesTab.category'), t('expensesTab.date')]}
              data={filteredExpenses.map(expense => [
                expense.description,
                currencyFormatter.format(expense.amount),
                t(`expenseCategory.${expense.category}`),
                dateFormatter.format(new Date(expense.date))
              ])}
            />

            <PrintTable
              title={t('expensesTab.doctorPayments')}
              headers={[t('expensesTab.dentist'), t('expensesTab.amount'), t('expensesTab.date'), t('expensesTab.notes')]}
              data={filteredDoctorPayments.map(payment => {
                const dentist = dentists.find(d => d.id === payment.dentistId);
                return [
                  dentist?.name || t('common.unknownDentist'),
                  currencyFormatter.format(payment.amount),
                  dateFormatter.format(new Date(payment.date)),
                  payment.notes || '-'
                ];
              })}
            />

            <PrintTable
              title={t('expensesTab.supplierInvoices')}
              headers={[t('expensesTab.supplier'), t('expensesTab.invoiceNumber'), t('expensesTab.amount'), t('expensesTab.date'), t('expensesTab.status')]}
              data={filteredSupplierInvoices.map(invoice => {
                const supplier = suppliers.find(s => s.id === invoice.supplierId);
                return [
                  supplier?.name || t('common.unknownSupplier'),
                  invoice.invoiceNumber || '-',
                  currencyFormatter.format(invoice.amount),
                  dateFormatter.format(new Date(invoice.invoiceDate)),
                  t(`supplierInvoiceStatus.${invoice.status}`)
                ];
              })}
            />
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="space-y-6">
            <PrintTable
              title={t('balancesTab.outstandingInvoices')}
              headers={[t('balancesTab.supplier'), t('balancesTab.invoiceNumber'), t('balancesTab.amount'), t('balancesTab.dueDate')]}
              data={filteredSupplierInvoices.filter(inv => inv.status === 'UNPAID').map(invoice => {
                const supplier = suppliers.find(s => s.id === invoice.supplierId);
                return [
                  supplier?.name || t('common.unknownSupplier'),
                  invoice.invoiceNumber || '-',
                  currencyFormatter.format(invoice.amount),
                  invoice.dueDate ? dateFormatter.format(new Date(invoice.dueDate)) : '-'
                ];
              })}
            />

            <div className="mb-6 break-inside-avoid">
              <h4 className="text-md font-bold text-slate-800 mb-2">{t('balancesTab.cashFlowSummary')}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-sm text-slate-600">{t('balancesTab.totalCashFlow')}</p>
                  <p className="text-lg font-bold text-slate-800">{currencyFormatter.format(summaryData.cashFlow)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-sm text-slate-600">{t('balancesTab.unpaidInvoices')}</p>
                  <p className="text-lg font-bold text-red-600">{currencyFormatter.format(summaryData.unpaidInvoices)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PrintableFinancialAccounts;