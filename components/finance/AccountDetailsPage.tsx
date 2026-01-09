import React, { useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../contexts/AuthContext';
import FinancialFilters from './FinancialFilters';
import AccountDetailsTab from './AccountDetailsTab';
import PrintableAccountDetails from './PrintableAccountDetails';

const AccountDetailsPage: React.FC = () => {
  const { t, locale } = useI18n();
  const { userProfile } = useAuth();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
  });
  const [isPrinting, setIsPrinting] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

  if (!userProfile?.permissions?.includes('view_finance')) {
    return <div className="text-center py-8">{t('common.accessDenied')}</div>;
  }

  const handlePrint = (accountData: any, selectedAccountType: string) => {
    setPrintData({ accountData, selectedAccountType });
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      setPrintData(null);
    }, 100);
  };

  if (isPrinting && printData) {
    return (
      <PrintableAccountDetails
        accountData={printData.accountData}
        currencyFormatter={currencyFormatter}
        selectedAccountType={printData.selectedAccountType}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{t('financialAccounts.accountDetails.title')}</h2>
        <div className="flex gap-2">
          <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark">
            {t('financialAccounts.export')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <FinancialFilters filters={filters} onFiltersChange={setFilters} />

      {/* Account Details Content */}
      <AccountDetailsTab
        filters={filters}
        currencyFormatter={currencyFormatter}
        onPrint={handlePrint}
      />
    </div>
  );
};

export default AccountDetailsPage;
