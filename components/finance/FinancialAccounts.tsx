import React, { useState, useMemo } from 'react';
import { useClinicData } from '../../hooks/useClinicData';
import { useFinancialCalculations } from '../../hooks/useFinancialCalculations';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../contexts/AuthContext';
import { openPrintWindow } from '../../utils/print';
import { View } from '../../types';
import FinancialSummary from './FinancialSummary';
import RevenueTab from './RevenueTab';
import ExpensesTab from './ExpensesTab';
import BalancesTab from './BalancesTab';
import AccountSelectionPage from './AccountSelectionPage';
import FinancialFilters from './FinancialFilters';
import PrintableFinancialAccounts from './PrintableFinancialAccounts';

type TabType = 'revenue' | 'expenses' | 'balances' | 'accountDetails';

type PrintableSummaryData = {
  totalRevenue: number;
  totalPayments: number;
  totalExpenses: number;
  totalDoctorPayments: number;
  totalSupplierInvoices: number;
  unpaidInvoices: number;
  netProfit: number;
  cashFlow: number;
};

interface FinancialAccountsProps {
  setCurrentView: (view: View) => void;
}

const FinancialAccounts: React.FC<FinancialAccountsProps> = ({ setCurrentView }) => {
  const { t, locale } = useI18n();
  const { userProfile } = useAuth();
  const {
    payments,
    expenses,
    treatmentRecords,
    doctorPayments,
    supplierInvoices
  } = useClinicData();

  const [activeTab, setActiveTab] = useState<TabType>('revenue');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
  });

  // Currency formatter for consistent formatting
  const currencyFormatter = useMemo(() =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }),
    [locale]
  );

  // Calculate comprehensive summary data using the centralized hook
  const summary = useFinancialCalculations(
    payments,
    expenses,
    treatmentRecords,
    doctorPayments,
    supplierInvoices,
    filters
  );

  const summaryData = useMemo(() => ({
    clinicRevenue: summary.clinicRevenue,
    totalPayments: summary.totalPayments,
    operatingExpenses: summary.operatingExpenses,
    doctorPayments: summary.doctorPayments,
    totalSupplierInvoices: summary.totalSupplierInvoices,
    unpaidInvoices: summary.unpaidInvoices,
    netProfit: summary.netProfit,
    cashFlow: summary.cashFlow,
  }), [summary]);

  // Handle print functionality
  const handlePrint = () => {
    const printableSummaryData: PrintableSummaryData = {
      totalRevenue: summary.totalRevenue,
      totalPayments: summary.totalPayments,
      totalExpenses: summary.totalExpenses,
      totalDoctorPayments: summary.doctorPayments,
      totalSupplierInvoices: summary.totalSupplierInvoices,
      unpaidInvoices: summary.unpaidInvoices,
      netProfit: summary.netProfit,
      cashFlow: summary.cashFlow,
    };

    openPrintWindow(
      `${t('appName')} - ${t('financialAccounts.title')} - ${t(`financialAccounts.tabs.${activeTab}`)}`,
      <PrintableFinancialAccounts
        clinicData={useClinicData()}
        activeTab={activeTab as 'revenue' | 'expenses' | 'balances'}
        filters={filters}
        summaryData={printableSummaryData}
      />
    );
  };

  // Permission check
  if (!userProfile?.permissions?.includes('view_finance')) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            {t('common.accessDenied')}
          </h3>
          <p className="text-slate-600">
            You don't have permission to view financial accounts.
          </p>
        </div>
      </div>
    );
  }

  // Tab configuration
  const tabs = [
    {
      id: 'revenue' as TabType,
      label: t('financialAccounts.tabs.revenue'),
      icon: '💰',
      description: 'View revenue from treatments and payments'
    },
    {
      id: 'expenses' as TabType,
      label: t('financialAccounts.tabs.expenses'),
      icon: '💸',
      description: 'Track expenses, doctor payments, and supplier invoices'
    },
    {
      id: 'balances' as TabType,
      label: t('financialAccounts.tabs.balances'),
      icon: '⚖️',
      description: 'Monitor financial balances and outstanding invoices'
    },
    {
      id: 'accountDetails' as TabType,
      label: t('financialAccounts.tabs.accountDetails'),
      icon: '👤',
      description: 'View detailed account information for patients, doctors, and suppliers'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {t('financialAccounts.title')}
          </h1>
          <p className="text-slate-600 mt-1">
            Comprehensive financial overview and management
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentView('accountSelection')}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <span className="mr-2">👤</span>
            Account Details
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors">
            <span className="mr-2">📊</span>
            {t('financialAccounts.export')}
          </button>
          {activeTab !== 'accountDetails' && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <span className="mr-2">🖨️</span>
              {t('financialAccounts.print')}
            </button>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <FinancialSummary
        summaryData={summaryData}
        currencyFormatter={currencyFormatter}
      />

      {/* Filters Section */}
      <FinancialFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tab Headers */}
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
          {activeTab === 'revenue' && (
            <RevenueTab
              payments={payments}
              treatmentRecords={treatmentRecords}
              filters={filters}
              currencyFormatter={currencyFormatter}
            />
          )}
          {activeTab === 'expenses' && (
            <ExpensesTab
              expenses={expenses}
              doctorPayments={doctorPayments}
              supplierInvoices={supplierInvoices}
              filters={filters}
              currencyFormatter={currencyFormatter}
            />
          )}
          {activeTab === 'balances' && (
            <BalancesTab
              summaryData={{
                ...summaryData,
                totalRevenue: summary.totalRevenue,
                totalExpenses: summary.totalExpenses,
                totalDoctorPayments: summary.doctorPayments,
              }}
              supplierInvoices={supplierInvoices}
              filters={filters}
              currencyFormatter={currencyFormatter}
            />
          )}
          {activeTab === 'accountDetails' && (
            <AccountSelectionPage setCurrentView={setCurrentView} />
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-slate-500 py-4">
        <p>
          Financial data is updated in real-time. Last updated: {new Date().toLocaleString(locale)}
        </p>
      </div>
    </div>
  );
};

export default FinancialAccounts;
