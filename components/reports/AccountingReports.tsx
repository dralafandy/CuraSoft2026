import React, { useState, useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import { openPrintWindow } from '../../utils/print';
import { useFinancialCalculations } from '../../hooks/useFinancialCalculations';
import DateRangeSelector from './DateRangeSelector';

interface AccountingReportsProps {
  clinicData: ClinicData;
}

type AccountingReportTab = 'doctors' | 'patients' | 'treatments' | 'expenses' | 'payments' | 'doctorPercentages';

const AccountingReports: React.FC<AccountingReportsProps> = ({ clinicData }) => {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<AccountingReportTab>('doctors');
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: ''
  });

  const isPrintView = false;

  const currencyFormatter = useMemo(() =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }),
    [locale]
  );

  // Use financial calculations hook for comprehensive metrics
  const financialSummary = useFinancialCalculations(
    clinicData.payments,
    clinicData.expenses,
    clinicData.treatmentRecords,
    clinicData.doctorPayments,
    clinicData.supplierInvoices,
    dateRange
  );

  // Tab configuration
  const tabs = [
    {
      id: 'doctors' as AccountingReportTab,
      label: t('accountingReports.doctorReports'),
      icon: '👨‍⚕️',
      description: t('accountingReports.doctorReportsDescription')
    },
    {
      id: 'patients' as AccountingReportTab,
      label: t('accountingReports.patientReports'),
      icon: '👥',
      description: t('accountingReports.patientReportsDescription')
    },
    {
      id: 'treatments' as AccountingReportTab,
      label: t('accountingReports.treatmentReports'),
      icon: '🦷',
      description: t('accountingReports.treatmentReportsDescription')
    },
    {
      id: 'expenses' as AccountingReportTab,
      label: t('accountingReports.expenseReports'),
      icon: '💸',
      description: t('accountingReports.expenseReportsDescription')
    },
    {
      id: 'payments' as AccountingReportTab,
      label: t('accountingReports.paymentReports'),
      icon: '💳',
      description: t('accountingReports.paymentReportsDescription')
    },
    {
      id: 'doctorPercentages' as AccountingReportTab,
      label: t('accountingReports.doctorPercentageReports'),
      icon: '📊',
      description: t('accountingReports.doctorPercentageReportsDescription')
    }
  ];

  // Handle print functionality for the current report
  const handlePrint = () => {
    const printContent = (
      <div className="p-8 bg-white text-slate-900" dir="rtl">
        <header className="text-center mb-10 border-b-2 border-slate-300 pb-6">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">{t('accountingReports.title')}</h1>
          <h2 className="text-2xl font-bold text-primary-dark mb-4">
            {tabs.find(tab => tab.id === activeTab)?.label}
          </h2>
          {dateRange.startDate && dateRange.endDate && (
            <p className="text-sm text-slate-600">
              {t('accountingReports.period')}: {new Date(dateRange.startDate).toLocaleDateString('ar-EG')} - {new Date(dateRange.endDate).toLocaleDateString('ar-EG')}
            </p>
          )}
        </header>

        <div className="mb-8">
          {renderTabContent(true)}
        </div>

        <footer className="text-center text-sm text-slate-500 border-t border-slate-300 pt-6">
          <p>{t('accountingReports.generatedOn')}: {new Date().toLocaleDateString('ar-EG')} {t('accountingReports.at')} {new Date().toLocaleTimeString('ar-EG')}</p>
          <p className="mt-2">{t('accountingReports.clinicName')}</p>
        </footer>
      </div>
    );

    const reportTitle = `${t('accountingReports.title')} - ${tabs.find(tab => tab.id === activeTab)?.label}`;
    openPrintWindow(reportTitle, printContent);
  };

  // Helper function to filter data by date range
  const filterDataByDate = <T extends { date?: string; treatmentDate?: string; invoiceDate?: string }>(
    data: T[]
  ): T[] => {
    if (!dateRange.startDate && !dateRange.endDate) return data;

    return data.filter(item => {
      const itemDate = item.date || item.treatmentDate || item.invoiceDate;
      if (!itemDate) return true;

      const itemDateObj = new Date(itemDate);
      const startDateObj = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDateObj = dateRange.endDate ? new Date(dateRange.endDate) : null;

      if (startDateObj && itemDateObj < startDateObj) return false;
      if (endDateObj) {
        endDateObj.setHours(23, 59, 59, 999);
        if (itemDateObj > endDateObj) return false;
      }

      return true;
    });
  };

  // Render content for each tab
  const renderTabContent = (isPrintView = false) => {
    const filteredTreatmentRecords = filterDataByDate(clinicData.treatmentRecords);
    const filteredPayments = filterDataByDate(clinicData.payments);
    const filteredExpenses = filterDataByDate(clinicData.expenses);
    const filteredDoctorPayments = filterDataByDate(clinicData.doctorPayments);

    switch (activeTab) {
      case 'doctors':
        return renderDoctorReports(filteredTreatmentRecords, filteredPayments, filteredDoctorPayments, isPrintView);
      case 'patients':
        return renderPatientReports(filteredTreatmentRecords, filteredPayments, isPrintView);
      case 'treatments':
        return renderTreatmentReports(filteredTreatmentRecords, filteredPayments, isPrintView);
      case 'expenses':
        return renderExpenseReports(filteredExpenses, isPrintView);
      case 'payments':
        return renderPaymentReports(filteredPayments, isPrintView);
      case 'doctorPercentages':
        return renderDoctorPercentageReports(filteredTreatmentRecords, filteredPayments, filteredDoctorPayments, isPrintView);
      default:
        return <div>{t('accountingReports.selectReportType')}</div>;
    }
  };

  // Doctor Reports Tab
  const renderDoctorReports = (
    treatmentRecords: typeof clinicData.treatmentRecords,
    payments: typeof clinicData.payments,
    doctorPayments: typeof clinicData.doctorPayments,
    isPrintView: boolean
  ) => {
    // Group data by doctor
    const doctorData = clinicData.dentists.map(doctor => {
      const doctorTreatments = treatmentRecords.filter(tr => tr.dentistId === doctor.id);
      const doctorTreatmentPayments = payments.filter(p => 
        treatmentRecords.some(tr => tr.id === p.treatmentRecordId && tr.dentistId === doctor.id)
      );
      const doctorDirectPayments = doctorPayments.filter(dp => dp.dentistId === doctor.id);

      const totalRevenue = doctorTreatments.reduce((sum, tr) => sum + tr.totalTreatmentCost, 0);
      const totalDoctorShare = doctorTreatments.reduce((sum, tr) => sum + tr.doctorShare, 0);
      const totalPaymentsReceived = doctorDirectPayments.reduce((sum, dp) => sum + dp.amount, 0);
      const netBalance = totalDoctorShare - totalPaymentsReceived;
      const treatmentCount = doctorTreatments.length;

      return {
        doctor,
        totalRevenue,
        totalDoctorShare,
        totalPaymentsReceived,
        netBalance,
        treatmentCount
      };
    }).filter(doctor => doctor.totalRevenue > 0 || doctor.treatmentCount > 0);

    if (doctorData.length === 0) {
      return <div className="text-center py-8 text-slate-500">{t('accountingReports.noDoctorData')}</div>;
    }

    return (
      <div className="space-y-6">
        {!isPrintView && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">{t('accountingReports.doctorSummary')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.totalDoctors')}</p>
                <p className="text-2xl font-bold text-slate-800">{doctorData.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.totalDoctorRevenue')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {currencyFormatter.format(doctorData.reduce((sum, d) => sum + d.totalRevenue, 0))}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.totalDoctorShares')}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {currencyFormatter.format(doctorData.reduce((sum, d) => sum + d.totalDoctorShare, 0))}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.totalTreatments')}</p>
                <p className="text-2xl font-bold text-purple-600">
                  {doctorData.reduce((sum, d) => sum + d.treatmentCount, 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className={`bg-white rounded-xl shadow-lg p-6 ${isPrintView ? 'print-content' : ''}`}>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('accountingReports.doctorDetails')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('common.doctor')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.totalRevenue')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.doctorShare')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.paymentsReceived')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.netBalance')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.treatments')}</th>
                </tr>
              </thead>
              <tbody>
                {doctorData.map(({ doctor, totalRevenue, totalDoctorShare, totalPaymentsReceived, netBalance, treatmentCount }) => (
                  <tr key={doctor.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-3 text-sm font-semibold">{doctor.name}</td>
                    <td className="border border-slate-300 p-3 text-sm">{currencyFormatter.format(totalRevenue)}</td>
                    <td className="border border-slate-300 p-3 text-sm text-green-600 font-semibold">
                      {currencyFormatter.format(totalDoctorShare)}
                    </td>
                    <td className="border border-slate-300 p-3 text-sm text-blue-600">
                      {currencyFormatter.format(totalPaymentsReceived)}
                    </td>
                    <td className={`border border-slate-300 p-3 text-sm font-semibold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {currencyFormatter.format(netBalance)}
                    </td>
                    <td className="border border-slate-300 p-3 text-sm text-center">{treatmentCount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td className="border border-slate-300 p-3 text-sm">{t('common.total')}</td>
                  <td className="border border-slate-300 p-3 text-sm">
                    {currencyFormatter.format(doctorData.reduce((sum, d) => sum + d.totalRevenue, 0))}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm text-green-600">
                    {currencyFormatter.format(doctorData.reduce((sum, d) => sum + d.totalDoctorShare, 0))}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm text-blue-600">
                    {currencyFormatter.format(doctorData.reduce((sum, d) => sum + d.totalPaymentsReceived, 0))}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm">
                    {currencyFormatter.format(doctorData.reduce((sum, d) => sum + d.netBalance, 0))}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm text-center">
                    {doctorData.reduce((sum, d) => sum + d.treatmentCount, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Patient Reports Tab
  const renderPatientReports = (
    treatmentRecords: typeof clinicData.treatmentRecords,
    payments: typeof clinicData.payments,
    isPrintView: boolean
  ) => {
    // Group data by patient
    const patientData = clinicData.patients.map(patient => {
      const patientTreatments = treatmentRecords.filter(tr => tr.patientId === patient.id);
      const patientPayments = payments.filter(p => p.patientId === patient.id);

      const totalRevenue = patientTreatments.reduce((sum, tr) => sum + tr.totalTreatmentCost, 0);
      const totalPaid = patientPayments.reduce((sum, p) => sum + p.amount, 0);
      const outstandingBalance = totalRevenue - totalPaid;
      const treatmentCount = patientTreatments.length;

      return {
        patient,
        totalRevenue,
        totalPaid,
        outstandingBalance,
        treatmentCount
      };
    }).filter(patient => patient.totalRevenue > 0 || patient.treatmentCount > 0);

    if (patientData.length === 0) {
      return <div className="text-center py-8 text-slate-500">{t('accountingReports.noPatientData')}</div>;
    }

    return (
      <div className="space-y-6">
        {!isPrintView && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">{t('accountingReports.patientSummary')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.totalPatients')}</p>
                <p className="text-2xl font-bold text-slate-800">{patientData.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.totalPatientRevenue')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {currencyFormatter.format(patientData.reduce((sum, p) => sum + p.totalRevenue, 0))}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.totalPaid')}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {currencyFormatter.format(patientData.reduce((sum, p) => sum + p.totalPaid, 0))}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.outstandingBalance')}</p>
                <p className={`text-2xl font-bold ${patientData.reduce((sum, p) => sum + p.outstandingBalance, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {currencyFormatter.format(patientData.reduce((sum, p) => sum + p.outstandingBalance, 0))}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className={`bg-white rounded-xl shadow-lg p-6 ${isPrintView ? 'print-content' : ''}`}>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('accountingReports.patientDetails')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('common.patient')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.totalRevenue')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.totalPaid')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.outstandingBalance')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.treatments')}</th>
                </tr>
              </thead>
              <tbody>
                {patientData.map(({ patient, totalRevenue, totalPaid, outstandingBalance, treatmentCount }) => (
                  <tr key={patient.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-3 text-sm font-semibold">{patient.name}</td>
                    <td className="border border-slate-300 p-3 text-sm">{currencyFormatter.format(totalRevenue)}</td>
                    <td className="border border-slate-300 p-3 text-sm text-blue-600">
                      {currencyFormatter.format(totalPaid)}
                    </td>
                    <td className={`border border-slate-300 p-3 text-sm font-semibold ${outstandingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {currencyFormatter.format(outstandingBalance)}
                    </td>
                    <td className="border border-slate-300 p-3 text-sm text-center">{treatmentCount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td className="border border-slate-300 p-3 text-sm">{t('common.total')}</td>
                  <td className="border border-slate-300 p-3 text-sm">
                    {currencyFormatter.format(patientData.reduce((sum, p) => sum + p.totalRevenue, 0))}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm text-blue-600">
                    {currencyFormatter.format(patientData.reduce((sum, p) => sum + p.totalPaid, 0))}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm">
                    {currencyFormatter.format(patientData.reduce((sum, p) => sum + p.outstandingBalance, 0))}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm text-center">
                    {patientData.reduce((sum, p) => sum + p.treatmentCount, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Treatment Reports Tab
  const renderTreatmentReports = (
    treatmentRecords: typeof clinicData.treatmentRecords,
    payments: typeof clinicData.payments,
    isPrintView: boolean
  ) => {
    if (treatmentRecords.length === 0) {
      return <div className="text-center py-8 text-slate-500">{t('accountingReports.noTreatmentData')}</div>;
    }

    // Group by treatment type
    const treatmentTypeData = treatmentRecords.reduce((acc, treatment) => {
      const treatmentName = clinicData.treatmentDefinitions.find(td => td.id === treatment.treatmentDefinitionId)?.name || treatment.treatmentName || 'Unknown';
      if (!acc[treatmentName]) {
        acc[treatmentName] = {
          count: 0,
          totalRevenue: 0,
          totalDoctorShare: 0,
          totalClinicShare: 0
        };
      }
      acc[treatmentName].count++;
      acc[treatmentName].totalRevenue += treatment.totalTreatmentCost;
      acc[treatmentName].totalDoctorShare += treatment.doctorShare;
      acc[treatmentName].totalClinicShare += treatment.clinicShare;
      return acc;
    }, {} as Record<string, {
      count: number;
      totalRevenue: number;
      totalDoctorShare: number;
      totalClinicShare: number;
    }>);

    const treatmentTypeArray = Object.entries(treatmentTypeData).map(([name, data]) => ({
      name,
      ...data
    }));

    return (
      <div className="space-y-6">
        {!isPrintView && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">{t('accountingReports.treatmentSummary')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.totalTreatments')}</p>
                <p className="text-2xl font-bold text-slate-800">{treatmentRecords.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.totalTreatmentRevenue')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {currencyFormatter.format(treatmentRecords.reduce((sum, tr) => sum + tr.totalTreatmentCost, 0))}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.totalDoctorShares')}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {currencyFormatter.format(treatmentRecords.reduce((sum, tr) => sum + tr.doctorShare, 0))}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.totalClinicShares')}</p>
                <p className="text-2xl font-bold text-purple-600">
                  {currencyFormatter.format(treatmentRecords.reduce((sum, tr) => sum + tr.clinicShare, 0))}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className={`bg-white rounded-xl shadow-lg p-6 ${isPrintView ? 'print-content' : ''}`}>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('accountingReports.treatmentByType')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.treatmentType')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.count')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.totalRevenue')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.doctorShare')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.clinicShare')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.avgRevenue')}</th>
                </tr>
              </thead>
              <tbody>
                {treatmentTypeArray.map(treatment => (
                  <tr key={treatment.name} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-3 text-sm font-semibold">{treatment.name}</td>
                    <td className="border border-slate-300 p-3 text-sm text-center">{treatment.count}</td>
                    <td className="border border-slate-300 p-3 text-sm">{currencyFormatter.format(treatment.totalRevenue)}</td>
                    <td className="border border-slate-300 p-3 text-sm text-green-600">
                      {currencyFormatter.format(treatment.totalDoctorShare)}
                    </td>
                    <td className="border border-slate-300 p-3 text-sm text-blue-600">
                      {currencyFormatter.format(treatment.totalClinicShare)}
                    </td>
                    <td className="border border-slate-300 p-3 text-sm">
                      {currencyFormatter.format(treatment.totalRevenue / treatment.count)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td className="border border-slate-300 p-3 text-sm">{t('common.total')}</td>
                  <td className="border border-slate-300 p-3 text-sm text-center">
                    {treatmentTypeArray.reduce((sum, t) => sum + t.count, 0)}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm">
                    {currencyFormatter.format(treatmentTypeArray.reduce((sum, t) => sum + t.totalRevenue, 0))}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm text-green-600">
                    {currencyFormatter.format(treatmentTypeArray.reduce((sum, t) => sum + t.totalDoctorShare, 0))}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm text-blue-600">
                    {currencyFormatter.format(treatmentTypeArray.reduce((sum, t) => sum + t.totalClinicShare, 0))}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm">
                    {currencyFormatter.format(treatmentTypeArray.reduce((sum, t) => sum + t.totalRevenue, 0) / treatmentTypeArray.reduce((sum, t) => sum + t.count, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Expense Reports Tab
  const renderExpenseReports = (
    expenses: typeof clinicData.expenses,
    isPrintView: boolean
  ) => {
    if (expenses.length === 0) {
      return <div className="text-center py-8 text-slate-500">{t('accountingReports.noExpenseData')}</div>;
    }

    // Group by category
    const expenseByCategory = expenses.reduce((acc, expense) => {
      const categoryName = t(`expenseCategory.${expense.category}`) || expense.category;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          count: 0,
          totalAmount: 0
        };
      }
      acc[categoryName].count++;
      acc[categoryName].totalAmount += expense.amount;
      return acc;
    }, {} as Record<string, { count: number; totalAmount: number }>);

    const expenseArray = Object.entries(expenseByCategory).map(([category, data]) => ({
      category,
      ...data
    }));

    return (
      <div className="space-y-6">
        {!isPrintView && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">{t('accountingReports.expenseSummary')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.totalExpenses')}</p>
                <p className="text-2xl font-bold text-slate-800">{expenses.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.totalExpenseAmount')}</p>
                <p className="text-2xl font-bold text-red-600">
                  {currencyFormatter.format(expenses.reduce((sum, e) => sum + e.amount, 0))}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.avgExpense')}</p>
                <p className="text-2xl font-bold text-purple-600">
                  {currencyFormatter.format(expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length)}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.expenseCategories')}</p>
                <p className="text-2xl font-bold text-blue-600">{expenseArray.length}</p>
              </div>
            </div>
          </div>
        )}

        <div className={`bg-white rounded-xl shadow-lg p-6 ${isPrintView ? 'print-content' : ''}`}>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('accountingReports.expensesByCategory')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.category')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.count')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.totalAmount')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.avgAmount')}</th>
                </tr>
              </thead>
              <tbody>
                {expenseArray.map(expense => (
                  <tr key={expense.category} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-3 text-sm font-semibold">{expense.category}</td>
                    <td className="border border-slate-300 p-3 text-sm text-center">{expense.count}</td>
                    <td className="border border-slate-300 p-3 text-sm text-red-600 font-semibold">
                      {currencyFormatter.format(expense.totalAmount)}
                    </td>
                    <td className="border border-slate-300 p-3 text-sm">
                      {currencyFormatter.format(expense.totalAmount / expense.count)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td className="border border-slate-300 p-3 text-sm">{t('common.total')}</td>
                  <td className="border border-slate-300 p-3 text-sm text-center">
                    {expenseArray.reduce((sum, e) => sum + e.count, 0)}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm text-red-600">
                    {currencyFormatter.format(expenseArray.reduce((sum, e) => sum + e.totalAmount, 0))}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm">
                    {currencyFormatter.format(expenseArray.reduce((sum, e) => sum + e.totalAmount, 0) / expenseArray.reduce((sum, e) => sum + e.count, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {!isPrintView && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('accountingReports.recentExpenses')}</h3>
            <div className="space-y-3">
              {expenses.slice(0, 10).map(expense => (
                <div key={expense.id} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{expense.description}</p>
                      <p className="text-sm text-slate-600">
                        {t(`expenseCategory.${expense.category}`)} • {new Date(expense.date).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        {currencyFormatter.format(expense.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Payment Reports Tab
  const renderPaymentReports = (
    payments: typeof clinicData.payments,
    isPrintView: boolean
  ) => {
    if (payments.length === 0) {
      return <div className="text-center py-8 text-slate-500">{t('accountingReports.noPaymentData')}</div>;
    }

    // Group by payment method
    const paymentsByMethod = payments.reduce((acc, payment) => {
      const methodName = t(`paymentMethod.${payment.method}`) || payment.method;
      if (!acc[methodName]) {
        acc[methodName] = {
          count: 0,
          totalAmount: 0
        };
      }
      acc[methodName].count++;
      acc[methodName].totalAmount += payment.amount;
      return acc;
    }, {} as Record<string, { count: number; totalAmount: number }>);

    const paymentMethodArray = Object.entries(paymentsByMethod).map(([method, data]) => ({
      method,
      ...data
    }));

    return (
      <div className="space-y-6">
        {!isPrintView && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">{t('accountingReports.paymentSummary')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.totalPayments')}</p>
                <p className="text-2xl font-bold text-slate-800">{payments.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.totalPaymentAmount')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {currencyFormatter.format(payments.reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.avgPayment')}</p>
                <p className="text-2xl font-bold text-purple-600">
                  {currencyFormatter.format(payments.reduce((sum, p) => sum + p.amount, 0) / payments.length)}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.paymentMethods')}</p>
                <p className="text-2xl font-bold text-blue-600">{paymentMethodArray.length}</p>
              </div>
            </div>
          </div>
        )}

        <div className={`bg-white rounded-xl shadow-lg p-6 ${isPrintView ? 'print-content' : ''}`}>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('accountingReports.paymentsByMethod')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.paymentMethod')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.count')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.totalAmount')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.avgAmount')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.percentage')}</th>
                </tr>
              </thead>
              <tbody>
                {paymentMethodArray.map(payment => {
                  const percentage = (payment.totalAmount / payments.reduce((sum, p) => sum + p.amount, 0)) * 100;
                  return (
                    <tr key={payment.method} className="hover:bg-slate-50">
                      <td className="border border-slate-300 p-3 text-sm font-semibold">{payment.method}</td>
                      <td className="border border-slate-300 p-3 text-sm text-center">{payment.count}</td>
                      <td className="border border-slate-300 p-3 text-sm text-green-600 font-semibold">
                        {currencyFormatter.format(payment.totalAmount)}
                      </td>
                      <td className="border border-slate-300 p-3 text-sm">
                        {currencyFormatter.format(payment.totalAmount / payment.count)}
                      </td>
                      <td className="border border-slate-300 p-3 text-sm">
                        {percentage.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td className="border border-slate-300 p-3 text-sm">{t('common.total')}</td>
                  <td className="border border-slate-300 p-3 text-sm text-center">
                    {paymentMethodArray.reduce((sum, p) => sum + p.count, 0)}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm text-green-600">
                    {currencyFormatter.format(paymentMethodArray.reduce((sum, p) => sum + p.totalAmount, 0))}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm">
                    {currencyFormatter.format(paymentMethodArray.reduce((sum, p) => sum + p.totalAmount, 0) / paymentMethodArray.reduce((sum, p) => sum + p.count, 0))}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {!isPrintView && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('accountingReports.recentPayments')}</h3>
            <div className="space-y-3">
              {payments.slice(0, 10).map(payment => {
                const patient = clinicData.patients.find(p => p.id === payment.patientId);
                return (
                  <div key={payment.id} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">{patient?.name || t('common.unknownPatient')}</p>
                        <p className="text-sm text-slate-600">
                          {t(`paymentMethod.${payment.method}`)} • {new Date(payment.date).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {currencyFormatter.format(payment.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Doctor Percentage Reports Tab
  const renderDoctorPercentageReports = (
    treatmentRecords: typeof clinicData.treatmentRecords,
    payments: typeof clinicData.payments,
    doctorPayments: typeof clinicData.doctorPayments,
    isPrintView: boolean
  ) => {
    if (treatmentRecords.length === 0) {
      return <div className="text-center py-8 text-slate-500">{t('accountingReports.noDoctorPercentageData')}</div>;
    }

    // Calculate overall percentages
    const totalRevenue = treatmentRecords.reduce((sum, tr) => sum + tr.totalTreatmentCost, 0);
    const totalDoctorShare = treatmentRecords.reduce((sum, tr) => sum + tr.doctorShare, 0);
    const totalClinicShare = treatmentRecords.reduce((sum, tr) => sum + tr.clinicShare, 0);
    const overallDoctorPercentage = (totalDoctorShare / totalRevenue) * 100;
    const overallClinicPercentage = (totalClinicShare / totalRevenue) * 100;

    // Group by doctor
    const doctorPercentageData = clinicData.dentists.map(doctor => {
      const doctorTreatments = treatmentRecords.filter(tr => tr.dentistId === doctor.id);
      if (doctorTreatments.length === 0) return null;

      const doctorRevenue = doctorTreatments.reduce((sum, tr) => sum + tr.totalTreatmentCost, 0);
      const doctorShare = doctorTreatments.reduce((sum, tr) => sum + tr.doctorShare, 0);
      const clinicShare = doctorTreatments.reduce((sum, tr) => sum + tr.clinicShare, 0);
      const doctorPercentage = (doctorShare / doctorRevenue) * 100;
      const clinicPercentage = (clinicShare / doctorRevenue) * 100;

      return {
        doctor,
        doctorRevenue,
        doctorShare,
        clinicShare,
        doctorPercentage,
        clinicPercentage,
        treatmentCount: doctorTreatments.length
      };
    }).filter(Boolean) as Array<{
      doctor: typeof clinicData.dentists[0];
      doctorRevenue: number;
      doctorShare: number;
      clinicShare: number;
      doctorPercentage: number;
      clinicPercentage: number;
      treatmentCount: number;
    }>;

    return (
      <div className="space-y-6">
        {!isPrintView && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">{t('accountingReports.doctorPercentageSummary')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.overallDoctorPercentage')}</p>
                <p className="text-2xl font-bold text-green-600">{overallDoctorPercentage.toFixed(1)}%</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.overallClinicPercentage')}</p>
                <p className="text-2xl font-bold text-blue-600">{overallClinicPercentage.toFixed(1)}%</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.totalDoctorRevenue')}</p>
                <p className="text-2xl font-bold text-slate-800">
                  {currencyFormatter.format(totalRevenue)}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600">{t('accountingReports.doctorCount')}</p>
                <p className="text-2xl font-bold text-purple-600">{doctorPercentageData.length}</p>
              </div>
            </div>
          </div>
        )}

        <div className={`bg-white rounded-xl shadow-lg p-6 ${isPrintView ? 'print-content' : ''}`}>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('accountingReports.doctorPercentageDetails')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('common.doctor')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.revenue')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.doctorShare')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.clinicShare')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.doctorPercentage')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.clinicPercentage')}</th>
                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">{t('accountingReports.treatments')}</th>
                </tr>
              </thead>
              <tbody>
                {doctorPercentageData.map(doctor => (
                  <tr key={doctor.doctor.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-3 text-sm font-semibold">{doctor.doctor.name}</td>
                    <td className="border border-slate-300 p-3 text-sm">
                      {currencyFormatter.format(doctor.doctorRevenue)}
                    </td>
                    <td className="border border-slate-300 p-3 text-sm text-green-600">
                      {currencyFormatter.format(doctor.doctorShare)}
                    </td>
                    <td className="border border-slate-300 p-3 text-sm text-blue-600">
                      {currencyFormatter.format(doctor.clinicShare)}
                    </td>
                    <td className="border border-slate-300 p-3 text-sm font-semibold text-green-600">
                      {doctor.doctorPercentage.toFixed(1)}%
                    </td>
                    <td className="border border-slate-300 p-3 text-sm font-semibold text-blue-600">
                      {doctor.clinicPercentage.toFixed(1)}%
                    </td>
                    <td className="border border-slate-300 p-3 text-sm text-center">{doctor.treatmentCount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td className="border border-slate-300 p-3 text-sm">{t('common.total')}</td>
                  <td className="border border-slate-300 p-3 text-sm">
                    {currencyFormatter.format(totalRevenue)}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm text-green-600">
                    {currencyFormatter.format(totalDoctorShare)}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm text-blue-600">
                    {currencyFormatter.format(totalClinicShare)}
                  </td>
                  <td className="border border-slate-300 p-3 text-sm font-semibold text-green-600">
                    {overallDoctorPercentage.toFixed(1)}%
                  </td>
                  <td className="border border-slate-300 p-3 text-sm font-semibold text-blue-600">
                    {overallClinicPercentage.toFixed(1)}%
                  </td>
                  <td className="border border-slate-300 p-3 text-sm text-center">
                    {doctorPercentageData.reduce((sum, d) => sum + d.treatmentCount, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {!isPrintView && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('accountingReports.percentageAnalysis')}</h3>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-600 mb-2">{t('accountingReports.overallDistribution')}</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      <span className="text-sm font-semibold">{t('accountingReports.doctorShare')}</span>
                    </div>
                    <div className="text-lg font-bold text-green-600 mt-1">
                      {overallDoctorPercentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                      <span className="text-sm font-semibold">{t('accountingReports.clinicShare')}</span>
                    </div>
                    <div className="text-lg font-bold text-blue-600 mt-1">
                      {overallClinicPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500"
                    style={{ width: `${overallDoctorPercentage}%` }}
                  ></div>
                  <div 
                    className="h-full bg-blue-500"
                    style={{ width: `${overallClinicPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('accountingReports.title')}</h1>
        <p className="text-slate-600">{t('accountingReports.description')}</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <DateRangeSelector 
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          showQuickPeriods={true}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-green-100">
          <p className="text-sm text-slate-600 mb-1">{t('accountingReports.totalRevenue')}</p>
          <p className="text-xl font-bold text-green-600">
            {currencyFormatter.format(financialSummary.totalRevenue)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-red-100">
          <p className="text-sm text-slate-600 mb-1">{t('accountingReports.totalExpenses')}</p>
          <p className="text-xl font-bold text-red-600">
            {currencyFormatter.format(financialSummary.totalExpenses)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-blue-100">
          <p className="text-sm text-slate-600 mb-1">{t('accountingReports.netProfit')}</p>
          <p className={`text-xl font-bold ${financialSummary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {currencyFormatter.format(financialSummary.netProfit)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-purple-100">
          <p className="text-sm text-slate-600 mb-1">{t('accountingReports.cashFlow')}</p>
          <p className={`text-xl font-bold ${financialSummary.cashFlow >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
            {currencyFormatter.format(financialSummary.cashFlow)}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/50">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary bg-white'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                }`}
                title={tab.description}
              >
                <span className="text-lg mr-3">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Print Button */}
      {!isPrintView && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all duration-200"
          >
            <span className="mr-2 text-lg">🖨️</span>
            <span className="font-semibold">{t('accountingReports.printReport')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountingReports;