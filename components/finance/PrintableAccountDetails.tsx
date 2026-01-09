import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useClinicData } from '../../hooks/useClinicData';

interface PrintableAccountDetailsProps {
  accountData: {
    entityName: string;
    transactions: Array<{
      id: string;
      date: string;
      description: string;
      debit: number;
      credit: number;
      balance: number;
      type: string;
    }>;
    summary: {
      totalDebit: number;
      totalCredit: number;
      balance: number;
    };
  };
  currencyFormatter: Intl.NumberFormat;
  selectedAccountType: string;
}

const PrintableAccountDetails: React.FC<PrintableAccountDetailsProps> = ({
  accountData,
  currencyFormatter,
  selectedAccountType
}) => {
  const { t, locale } = useI18n();
  const { clinicInfo } = useClinicData();
  const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="p-4 bg-white text-slate-900" dir="rtl" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontSize: '12px', lineHeight: '1.4' }}>
      <header className="text-center mb-6 break-inside-avoid">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-800 mb-1">{clinicInfo.name || t('appName')}</h1>
          <p className="text-sm text-slate-600">{clinicInfo.address}</p>
          <p className="text-sm text-slate-600">{clinicInfo.phone} | {clinicInfo.email}</p>
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">{t('financialAccounts.accountDetails.title')}</h2>
        <p className="text-sm text-slate-600">{accountData.entityName} - {t(`financialAccounts.accountDetails.accountTypes.${selectedAccountType}`)}</p>
      </header>

      <main>
        {/* Account Summary */}
        <div className="mb-6 break-inside-avoid">
          <h3 className="text-lg font-bold text-slate-800 mb-4">{t('financialAccounts.accountDetails.accountSummary')}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{currencyFormatter.format(accountData.summary.totalDebit)}</div>
              <div className="text-sm text-slate-600">{t('financialAccounts.accountDetails.totalDebit')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{currencyFormatter.format(accountData.summary.totalCredit)}</div>
              <div className="text-sm text-slate-600">{t('financialAccounts.accountDetails.totalCredit')}</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${accountData.summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currencyFormatter.format(accountData.summary.balance)}
              </div>
              <div className="text-sm text-slate-600">{t('financialAccounts.accountDetails.balance')}</div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="mb-6 break-inside-avoid">
          <h3 className="text-lg font-bold text-slate-800 mb-4">{t('financialAccounts.accountDetails.transactions')}</h3>
          <table className="w-full text-sm border-collapse border border-slate-400">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-right font-semibold border border-slate-300">{t('financialAccounts.accountDetails.columns.date')}</th>
                <th className="p-2 text-right font-semibold border border-slate-300">{t('financialAccounts.accountDetails.columns.description')}</th>
                <th className="p-2 text-right font-semibold border border-slate-300">{t('financialAccounts.accountDetails.columns.debit')}</th>
                <th className="p-2 text-right font-semibold border border-slate-300">{t('financialAccounts.accountDetails.columns.credit')}</th>
                <th className="p-2 text-right font-semibold border border-slate-300">{t('financialAccounts.accountDetails.columns.balance')}</th>
              </tr>
            </thead>
            <tbody>
              {accountData.transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-slate-200">
                  <td className="p-2 border border-slate-300">{dateFormatter.format(new Date(transaction.date))}</td>
                  <td className="p-2 border border-slate-300">{transaction.description}</td>
                  <td className="p-2 border border-slate-300">{transaction.debit > 0 ? currencyFormatter.format(transaction.debit) : ''}</td>
                  <td className="p-2 border border-slate-300">{transaction.credit > 0 ? currencyFormatter.format(transaction.credit) : ''}</td>
                  <td className="p-2 border border-slate-300">{currencyFormatter.format(transaction.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default PrintableAccountDetails;
