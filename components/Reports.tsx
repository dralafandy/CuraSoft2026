import React, { useState, useMemo } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { useI18n } from '../hooks/useI18n';
import { View } from '../types';
import { openPrintWindow } from '../utils/print';
import DailyFinancialSummary from './reports/DailyFinancialSummary';
import MonthlyFinancialSummary from './reports/MonthlyFinancialSummary';
import QuarterlyAnnualOverview from './reports/QuarterlyAnnualOverview';
import PrintableReport from './reports/PrintableReport';
import LineChart from './reports/LineChart';
import PieChart from './reports/PieChart';
import BarChart from './reports/BarChart';
import EnhancedOverview from './reports/EnhancedOverview';
import AccountingReports from './reports/AccountingReports';

interface ReportsProps {
  clinicData: ClinicData;
  setCurrentView: (view: View) => void;
  initialTab?: ReportTab;
}

type ReportTab = 'overview' | 'patients' | 'doctors' | 'suppliers' | 'daily' | 'monthly' | 'quarterly' | 'accounting';

const Reports: React.FC<ReportsProps> = ({ clinicData, setCurrentView, initialTab }) => {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab || 'overview');

  // Pre-compute all data to avoid conditional hooks
  const patientSummaries = useMemo(() => {
    const { patients, treatmentRecords, payments } = clinicData;
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    return patients.map(patient => {
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
        treatmentCount,
        currencyFormatter
      };
    });
  }, [clinicData, locale]);

  const doctorSummaries = useMemo(() => {
    const { dentists, treatmentRecords, doctorPayments } = clinicData;
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    return dentists.map(doctor => {
      const doctorTreatments = treatmentRecords.filter(tr => tr.dentistId === doctor.id);
      const doctorPaymentsList = doctorPayments.filter(p => p.dentistId === doctor.id);

      const totalRevenue = doctorTreatments.reduce((sum, tr) => sum + tr.totalTreatmentCost, 0);
      const totalEarnings = doctorTreatments.reduce((sum, tr) => sum + tr.doctorShare, 0);
      const totalPaymentsReceived = doctorPaymentsList.reduce((sum, p) => sum + p.amount, 0);
      const netBalance = totalEarnings - totalPaymentsReceived;
      const treatmentCount = doctorTreatments.length;

      return {
        doctor,
        totalRevenue,
        totalEarnings,
        totalPaymentsReceived,
        netBalance,
        treatmentCount,
        currencyFormatter
      };
    });
  }, [clinicData, locale]);

  const supplierSummaries = useMemo(() => {
    const { suppliers, inventoryItems, expenses } = clinicData;
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    return suppliers.map(supplier => {
      const supplierItems = inventoryItems.filter(item => item.supplierId === supplier.id);
      const supplierExpenses = expenses.filter(exp => exp.supplierId === supplier.id);

      const totalPurchases = supplierItems.reduce((sum, item) => sum + (item.unitCost * item.currentStock), 0);
      const totalExpenses = supplierExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalValue = totalPurchases + totalExpenses;
      const itemCount = supplierItems.length;
      const expenseCount = supplierExpenses.length;

      return {
        supplier,
        totalPurchases,
        totalExpenses,
        totalValue,
        itemCount,
        expenseCount,
        currencyFormatter
      };
    });
  }, [clinicData, locale]);

  const tabs = [
    { id: 'overview' as ReportTab, label: t('reports.overview'), icon: '📊' },
    { id: 'patients' as ReportTab, label: t('reports.patientReports'), icon: '👥' },
    { id: 'doctors' as ReportTab, label: t('reports.doctorReports'), icon: '👨‍⚕️' },
    { id: 'suppliers' as ReportTab, label: t('reports.supplierReports'), icon: '🏢' },
    { id: 'daily' as ReportTab, label: t('reports.dailyFinancialSummary.title'), icon: '📅' },
    { id: 'monthly' as ReportTab, label: t('reports.monthlyFinancialSummary.title'), icon: '📆' },
    { id: 'quarterly' as ReportTab, label: t('reports.quarterlyAnnualOverview.title'), icon: '📈' },
    { id: 'accounting' as ReportTab, label: t('reports.accounting.title'), icon: '💰' },
  ];

  const getTabDescription = (tabId: ReportTab) => {
    switch (tabId) {
      case 'overview':
        return t('reports.overviewDescription');
      case 'patients':
        return t('reports.patientReportsDescription');
      case 'doctors':
        return t('reports.doctorReportsDescription');
      case 'suppliers':
        return t('reports.supplierReportsDescription');
      case 'daily':
        return t('reports.dailyFinancialSummaryDescription');
      case 'monthly':
        return t('reports.monthlyFinancialSummaryDescription');
      case 'quarterly':
        return t('reports.quarterlyAnnualOverviewDescription');
      default:
        return '';
    }
  };


  const renderPatientsTab = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6" dir="rtl">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">{t('reports.patientList')}</h2>
          <div className="space-y-4">
            {patientSummaries.map(({ patient, totalRevenue, totalPaid, outstandingBalance, treatmentCount, currencyFormatter }) => (
              <div key={patient.id} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800">{patient.name}</h3>
                    <p className="text-sm text-slate-600">{patient.phone} | {patient.email}</p>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">{t('reports.totalRevenue')}:</span>
                        <span className="font-semibold text-slate-800 ml-1">{currencyFormatter.format(totalRevenue)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">{t('reports.totalPaid')}:</span>
                        <span className="font-semibold text-green-600 ml-1">{currencyFormatter.format(totalPaid)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">{t('reports.outstandingBalance')}:</span>
                        <span className={`font-semibold ml-1 ${outstandingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {currencyFormatter.format(outstandingBalance)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">{t('reports.treatmentCount')}:</span>
                        <span className="font-semibold text-slate-800 ml-1">{treatmentCount}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const { treatmentRecords, payments } = clinicData;
                      const patientTreatments = treatmentRecords.filter(tr => tr.patientId === patient.id);
                      const patientPayments = payments.filter(p => p.patientId === patient.id);
                      const totalRevenue = patientTreatments.reduce((sum, tr) => sum + tr.totalTreatmentCost, 0);
                      const totalPaid = patientPayments.reduce((sum, p) => sum + p.amount, 0);

                      const printContent = (
                        <div className="p-8 bg-white text-slate-900" dir="rtl">
                          <header className="text-center mb-10 border-b-2 border-slate-300 pb-6">
                            <h1 className="text-4xl font-bold text-slate-800 mb-2">{t('patientReport.title')}</h1>
                            <h2 className="text-2xl font-bold text-primary-dark mb-4">{patient.name}</h2>
                            <div className="text-sm text-slate-600">
                              <p>الهاتف: {patient.phone}</p>
                              <p>البريد الإلكتروني: {patient.email}</p>
                              <p>تاريخ الميلاد: {patient.dob ? new Date(patient.dob).toLocaleDateString('ar-EG') : 'غير محدد'}</p>
                            </div>
                          </header>

                          <section className="mb-10">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">{t('patientReport.summary')}</h3>
                            <div className="grid grid-cols-2 gap-6 mb-6">
                              <div className="bg-slate-50 p-4 rounded-lg border">
                                <p className="text-sm text-slate-600">{t('patientReport.totalRevenue')}</p>
                                <p className="text-2xl font-bold text-slate-800">{currencyFormatter.format(totalRevenue)}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-lg border">
                                <p className="text-sm text-slate-600">{t('patientReport.totalPaid')}</p>
                                <p className="text-2xl font-bold text-green-600">{currencyFormatter.format(totalPaid)}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-slate-50 p-4 rounded-lg border">
                                <p className="text-sm text-slate-600">الرصيد المستحق</p>
                                <p className={`text-xl font-bold ${outstandingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currencyFormatter.format(outstandingBalance)}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-lg border">
                                <p className="text-sm text-slate-600">عدد العلاجات</p>
                                <p className="text-xl font-bold text-blue-600">{treatmentCount}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-lg border">
                                <p className="text-sm text-slate-600">عدد المدفوعات</p>
                                <p className="text-xl font-bold text-purple-600">{patientPayments.length}</p>
                              </div>
                            </div>
                          </section>

                          <section className="mb-10">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">تفاصيل العلاجات</h3>
                            <table className="w-full border-collapse border border-slate-300">
                              <thead>
                                <tr className="bg-slate-100">
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">التاريخ</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">العلاج</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">الطبيب</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">التكلفة</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">ملاحظات</th>
                                </tr>
                              </thead>
                              <tbody>
                                {patientTreatments.map(treatment => {
                                  const doctor = clinicData.dentists.find(d => d.id === treatment.dentistId);
                                  return (
                                    <tr key={treatment.id}>
                                      <td className="border border-slate-300 p-3 text-sm">{new Date(treatment.treatmentDate).toLocaleDateString('ar-EG')}</td>
                                      <td className="border border-slate-300 p-3 text-sm">{treatment.treatmentName}</td>
                                      <td className="border border-slate-300 p-3 text-sm">{doctor?.name || 'غير محدد'}</td>
                                      <td className="border border-slate-300 p-3 text-sm font-semibold">{currencyFormatter.format(treatment.totalTreatmentCost)}</td>
                                      <td className="border border-slate-300 p-3 text-sm">{treatment.notes || '-'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </section>

                          <section className="mb-10">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">تفاصيل المدفوعات</h3>
                            <table className="w-full border-collapse border border-slate-300">
                              <thead>
                                <tr className="bg-slate-100">
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">التاريخ</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">المبلغ</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">طريقة الدفع</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">ملاحظات</th>
                                </tr>
                              </thead>
                              <tbody>
                                {patientPayments.map(payment => (
                                  <tr key={payment.id}>
                                    <td className="border border-slate-300 p-3 text-sm">{new Date(payment.date).toLocaleDateString('ar-EG')}</td>
                                    <td className="border border-slate-300 p-3 text-sm font-semibold text-green-600">{currencyFormatter.format(payment.amount)}</td>
                                    <td className="border border-slate-300 p-3 text-sm">{payment.method}</td>
                                    <td className="border border-slate-300 p-3 text-sm">{payment.notes || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </section>

                          <footer className="text-center text-sm text-slate-500 border-t border-slate-300 pt-6">
                            <p>تم إنشاء هذا التقرير في {new Date().toLocaleDateString('ar-EG')} الساعة {new Date().toLocaleTimeString('ar-EG')}</p>
                            <p className="mt-2">عيادة كيوراسوف - نظام إدارة العيادات الطبية</p>
                          </footer>
                        </div>
                      );
                      openPrintWindow(`${t('patientReport.title')} - ${patient.name}`, printContent);
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    🖨️ {t('reports.printReport')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDoctorsTab = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6" dir="rtl">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">{t('reports.doctorList')}</h2>
          <div className="space-y-4">
            {doctorSummaries.map(({ doctor, totalRevenue, totalEarnings, totalPaymentsReceived, netBalance, treatmentCount, currencyFormatter }) => (
              <div key={doctor.id} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <span className={`w-4 h-4 rounded-full ${doctor.color}`}></span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800">{doctor.name}</h3>
                      <p className="text-sm text-slate-600">{doctor.specialty}</p>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">{t('reports.totalRevenue')}:</span>
                          <span className="font-semibold text-slate-800 ml-1">{currencyFormatter.format(totalRevenue)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">{t('reports.totalEarnings')}:</span>
                          <span className="font-semibold text-green-600 ml-1">{currencyFormatter.format(totalEarnings)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">{t('reports.totalPaymentsReceived')}:</span>
                          <span className="font-semibold text-blue-600 ml-1">{currencyFormatter.format(totalPaymentsReceived)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">{t('reports.netBalance')}:</span>
                          <span className={`font-semibold ml-1 ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {currencyFormatter.format(netBalance)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {t('reports.treatmentCount')}: {treatmentCount}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const { treatmentRecords, doctorPayments } = clinicData;
                      const doctorTreatments = treatmentRecords.filter(tr => tr.dentistId === doctor.id);
                      const doctorPaymentsList = doctorPayments.filter(p => p.dentistId === doctor.id);
                      const totalEarnings = doctorTreatments.reduce((sum, tr) => sum + tr.doctorShare, 0);
                      const totalPaymentsReceived = doctorPaymentsList.reduce((sum, p) => sum + p.amount, 0);

                      const printContent = (
                        <div className="p-8 bg-white text-slate-900" dir="rtl">
                          <header className="text-center mb-10 border-b-2 border-slate-300 pb-6">
                            <h1 className="text-4xl font-bold text-slate-800 mb-2">{t('doctorReport.title')}</h1>
                            <h2 className="text-2xl font-bold text-primary-dark mb-4">{doctor.name}</h2>
                            <div className="text-sm text-slate-600">
                              <p>التخصص: {doctor.specialty}</p>
                            </div>
                          </header>

                          <section className="mb-10">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">{t('doctorReport.summary')}</h3>
                            <div className="grid grid-cols-2 gap-6 mb-6">
                              <div className="bg-slate-50 p-4 rounded-lg border">
                                <p className="text-sm text-slate-600">{t('doctorReport.totalEarnings')}</p>
                                <p className="text-2xl font-bold text-green-600">{currencyFormatter.format(totalEarnings)}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-lg border">
                                <p className="text-sm text-slate-600">{t('doctorReport.totalPaymentsReceived')}</p>
                                <p className="text-2xl font-bold text-blue-600">{currencyFormatter.format(totalPaymentsReceived)}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-slate-50 p-4 rounded-lg border">
                                <p className="text-sm text-slate-600">الرصيد الصافي</p>
                                <p className={`text-xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currencyFormatter.format(netBalance)}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-lg border">
                                <p className="text-sm text-slate-600">عدد العلاجات</p>
                                <p className="text-xl font-bold text-blue-600">{treatmentCount}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-lg border">
                                <p className="text-sm text-slate-600">عدد المدفوعات المستلمة</p>
                                <p className="text-xl font-bold text-purple-600">{doctorPaymentsList.length}</p>
                              </div>
                            </div>
                          </section>

                          <section className="mb-10">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">تفاصيل العلاجات</h3>
                            <table className="w-full border-collapse border border-slate-300">
                              <thead>
                                <tr className="bg-slate-100">
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">التاريخ</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">المريض</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">العلاج</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">إجمالي التكلفة</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">حصة الطبيب</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">ملاحظات</th>
                                </tr>
                              </thead>
                              <tbody>
                                {doctorTreatments.map(treatment => {
                                  const patient = clinicData.patients.find(p => p.id === treatment.patientId);
                                  return (
                                    <tr key={treatment.id}>
                                      <td className="border border-slate-300 p-3 text-sm">{new Date(treatment.treatmentDate).toLocaleDateString('ar-EG')}</td>
                                      <td className="border border-slate-300 p-3 text-sm">{patient?.name || 'غير محدد'}</td>
                                      <td className="border border-slate-300 p-3 text-sm">{treatment.treatmentName}</td>
                                      <td className="border border-slate-300 p-3 text-sm font-semibold">{currencyFormatter.format(treatment.totalTreatmentCost)}</td>
                                      <td className="border border-slate-300 p-3 text-sm font-semibold text-green-600">{currencyFormatter.format(treatment.doctorShare)}</td>
                                      <td className="border border-slate-300 p-3 text-sm">{treatment.notes || '-'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </section>

                          <section className="mb-10">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">تفاصيل المدفوعات المستلمة</h3>
                            <table className="w-full border-collapse border border-slate-300">
                              <thead>
                                <tr className="bg-slate-100">
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">التاريخ</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">المبلغ</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">ملاحظات</th>
                                </tr>
                              </thead>
                              <tbody>
                                {doctorPaymentsList.map(payment => (
                                  <tr key={payment.id}>
                                    <td className="border border-slate-300 p-3 text-sm">{new Date(payment.date).toLocaleDateString('ar-EG')}</td>
                                    <td className="border border-slate-300 p-3 text-sm font-semibold text-green-600">{currencyFormatter.format(payment.amount)}</td>
                                    <td className="border border-slate-300 p-3 text-sm">{payment.notes || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </section>

                          <footer className="text-center text-sm text-slate-500 border-t border-slate-300 pt-6">
                            <p>تم إنشاء هذا التقرير في {new Date().toLocaleDateString('ar-EG')} الساعة {new Date().toLocaleTimeString('ar-EG')}</p>
                            <p className="mt-2">عيادة كيوراسوف - نظام إدارة العيادات الطبية</p>
                          </footer>
                        </div>
                      );
                      openPrintWindow(`${t('doctorReport.title')} - ${doctor.name}`, printContent);
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    🖨️ {t('reports.printReport')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSuppliersTab = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6" dir="rtl">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">{t('reports.supplierList')}</h2>
          <div className="space-y-4">
            {supplierSummaries.map(({ supplier, totalPurchases, totalExpenses, totalValue, itemCount, expenseCount, currencyFormatter }) => (
              <div key={supplier.id} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800">{supplier.name}</h3>
                    <p className="text-sm text-slate-600">{supplier.contactPerson} | {supplier.phone}</p>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">{t('reports.totalPurchases')}:</span>
                        <span className="font-semibold text-slate-800 ml-1">{currencyFormatter.format(totalPurchases)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">{t('reports.totalExpenses')}:</span>
                        <span className="font-semibold text-red-600 ml-1">{currencyFormatter.format(totalExpenses)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">{t('reports.totalValue')}:</span>
                        <span className="font-semibold text-blue-600 ml-1">{currencyFormatter.format(totalValue)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">{t('reports.itemCount')}:</span>
                        <span className="font-semibold text-slate-800 ml-1">{itemCount}</span>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {t('reports.expenseCount')}: {expenseCount}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const { inventoryItems, expenses } = clinicData;
                      const supplierItems = inventoryItems.filter(item => item.supplierId === supplier.id);
                      const supplierExpenses = expenses.filter(exp => exp.supplierId === supplier.id);
                      const totalPurchases = supplierItems.reduce((sum, item) => sum + (item.unitCost * item.currentStock), 0);
                      const totalExpenses = supplierExpenses.reduce((sum, exp) => sum + exp.amount, 0);

                      const printContent = (
                        <div className="p-8 bg-white text-slate-900" dir="rtl">
                          <header className="text-center mb-10 border-b-2 border-slate-300 pb-6">
                            <h1 className="text-4xl font-bold text-slate-800 mb-2">{t('supplierReport.title')}</h1>
                            <h2 className="text-2xl font-bold text-primary-dark mb-4">{supplier.name}</h2>
                            <div className="text-sm text-slate-600">
                              <p>الشخص المسؤول: {supplier.contactPerson}</p>
                              <p>الهاتف: {supplier.phone}</p>
                              <p>البريد الإلكتروني: {supplier.email}</p>
                              <p>نوع المورد: {supplier.supplierType === 'materialSupplier' ? 'مورد مواد' : 'معمل أسنان'}</p>
                            </div>
                          </header>

                          <section className="mb-10">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">{t('supplierReport.summary')}</h3>
                            <div className="grid grid-cols-2 gap-6 mb-6">
                              <div className="bg-slate-50 p-4 rounded-lg border">
                                <p className="text-sm text-slate-600">{t('supplierReport.totalPurchases')}</p>
                                <p className="text-2xl font-bold text-slate-800">{currencyFormatter.format(totalPurchases)}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-lg border">
                                <p className="text-sm text-slate-600">{t('supplierReport.totalExpenses')}</p>
                                <p className="text-2xl font-bold text-red-600">{currencyFormatter.format(totalExpenses)}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-slate-50 p-4 rounded-lg border">
                                <p className="text-sm text-slate-600">القيمة الإجمالية</p>
                                <p className="text-xl font-bold text-blue-600">{currencyFormatter.format(totalValue)}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-lg border">
                                <p className="text-sm text-slate-600">عدد العناصر</p>
                                <p className="text-xl font-bold text-green-600">{itemCount}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-lg border">
                                <p className="text-sm text-slate-600">عدد المصروفات</p>
                                <p className="text-xl font-bold text-purple-600">{expenseCount}</p>
                              </div>
                            </div>
                          </section>

                          <section className="mb-10">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">قائمة العناصر المخزنة</h3>
                            <table className="w-full border-collapse border border-slate-300">
                              <thead>
                                <tr className="bg-slate-100">
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">اسم العنصر</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">المخزون الحالي</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">تكلفة الوحدة</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">إجمالي القيمة</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">تاريخ الانتهاء</th>
                                </tr>
                              </thead>
                              <tbody>
                                {supplierItems.map(item => (
                                  <tr key={item.id}>
                                    <td className="border border-slate-300 p-3 text-sm">{item.name}</td>
                                    <td className="border border-slate-300 p-3 text-sm text-center">{item.currentStock}</td>
                                    <td className="border border-slate-300 p-3 text-sm font-semibold">{currencyFormatter.format(item.unitCost)}</td>
                                    <td className="border border-slate-300 p-3 text-sm font-semibold text-blue-600">{currencyFormatter.format(item.unitCost * item.currentStock)}</td>
                                    <td className="border border-slate-300 p-3 text-sm">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('ar-EG') : '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </section>

                          <section className="mb-10">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">تفاصيل المصروفات</h3>
                            <table className="w-full border-collapse border border-slate-300">
                              <thead>
                                <tr className="bg-slate-100">
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">التاريخ</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">الوصف</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">المبلغ</th>
                                  <th className="border border-slate-300 p-3 text-right text-sm font-bold">الفئة</th>
                                </tr>
                              </thead>
                              <tbody>
                                {supplierExpenses.map(expense => (
                                  <tr key={expense.id}>
                                    <td className="border border-slate-300 p-3 text-sm">{new Date(expense.date).toLocaleDateString('ar-EG')}</td>
                                    <td className="border border-slate-300 p-3 text-sm">{expense.description}</td>
                                    <td className="border border-slate-300 p-3 text-sm font-semibold text-red-600">{currencyFormatter.format(expense.amount)}</td>
                                    <td className="border border-slate-300 p-3 text-sm">{t(`expenseCategory.${expense.category}`)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </section>

                          <footer className="text-center text-sm text-slate-500 border-t border-slate-300 pt-6">
                            <p>تم إنشاء هذا التقرير في {new Date().toLocaleDateString('ar-EG')} الساعة {new Date().toLocaleTimeString('ar-EG')}</p>
                            <p className="mt-2">عيادة كيوراسوف - نظام إدارة العيادات الطبية</p>
                          </footer>
                        </div>
                      );
                      openPrintWindow(`${t('supplierReport.title')} - ${supplier.name}`, printContent);
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    🖨️ {t('reports.printReport')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <EnhancedOverview clinicData={clinicData} />;
      case 'patients':
        return renderPatientsTab();
      case 'doctors':
        return renderDoctorsTab();
      case 'suppliers':
        return renderSuppliersTab();
      case 'daily':
        return <DailyFinancialSummary clinicData={clinicData} />;
      case 'monthly':
        return <MonthlyFinancialSummary clinicData={clinicData} />;
      case 'quarterly':
        return <QuarterlyAnnualOverview clinicData={clinicData} />;
      case 'accounting':
        return <AccountingReports clinicData={clinicData} />;
      default:
        return <EnhancedOverview clinicData={clinicData} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6" dir="rtl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('reports.title')}</h1>
        <p className="text-gray-600">{t('reports.description')}</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Reports;
