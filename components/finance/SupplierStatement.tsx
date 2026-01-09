import React, { useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Supplier, SupplierInvoice, PaymentMethod } from '../../types';
import { useI18n } from '../../hooks/useI18n';

interface SupplierStatementProps {
    supplier: Supplier;
    clinicData: ClinicData;
}

const SupplierStatement: React.FC<SupplierStatementProps> = ({ supplier, clinicData }) => {
    const { t, locale } = useI18n();
    const { clinicInfo, supplierInvoices, expenses } = clinicData;

    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    const relatedInvoices = useMemo(() => {
        return supplierInvoices.filter(inv => inv.supplierId === supplier.id)
            .sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime());
    }, [supplierInvoices, supplier.id]);

    const financialSummary = useMemo(() => {
        const totalBilled = relatedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const totalPaid = relatedInvoices.reduce((total, inv) => total + inv.payments.reduce((sum, p) => sum + p.amount, 0), 0);
        const outstandingBalance = totalBilled - totalPaid;
        return { totalBilled, totalPaid, outstandingBalance };
    }, [relatedInvoices]);

    const allPaymentsToSupplier = useMemo(() => {
        return expenses.filter(exp => exp.supplierId === supplier.id)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [expenses, supplier.id]);

    return (
        <div className="p-8 bg-white text-slate-900 min-h-screen" dir={locale === 'ar' ? 'rtl' : 'ltr'} style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontSize: '12px', lineHeight: '1.4' }}>
            <header className="text-center mb-10 break-inside-avoid">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">{clinicInfo.name || t('appName')}</h1>
                    <p className="text-sm text-slate-600">{clinicInfo.address}</p>
                    <p className="text-sm text-slate-600">{clinicInfo.phone} | {clinicInfo.email}</p>
                </div>
                <h2 className="text-xl font-bold text-primary-dark mt-6 mb-2">{t('supplierStatement.financialTitle')}</h2>
                <p className="text-sm text-slate-700">{t('patientReport.generatedOn', { date: dateFormatter.format(new Date()) })}</p>
            </header>

            <section className="mb-10 p-6 border rounded-lg bg-neutral-light shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-4">{t('supplierStatement.statementDetails')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-md text-slate-700">
                    <div><strong>{t('suppliers.supplierName')}:</strong> {supplier.name}</div>
                    <div><strong>{t('suppliers.contactPerson')}:</strong> {supplier.contactPerson || '-'}</div>
                    <div><strong>{t('suppliers.phone')}:</strong> {supplier.phone || '-'}</div>
                    <div><strong>{t('suppliers.email')}:</strong> {supplier.email || '-'}</div>
                </div>
            </section>

            <section className="mb-10 break-inside-avoid">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 border-b pb-2">{t('invoices.title')}</h3>
                {relatedInvoices.length > 0 ? (
                    <table className="w-full text-md border-collapse border border-slate-400">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('invoices.date')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('invoices.invoiceNumber')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('invoices.billed')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('invoices.paidAmount')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('invoices.remaining')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {relatedInvoices.map(inv => {
                                const totalPaidForInvoice = inv.payments.reduce((sum, p) => sum + p.amount, 0);
                                const balance = inv.amount - totalPaidForInvoice;
                                return (
                                    <tr key={inv.id} className="border-b border-slate-200">
                                        <td className="p-3 border border-slate-300">{dateFormatter.format(new Date(inv.invoiceDate))}</td>
                                        <td className="p-3 border border-slate-300">{inv.invoiceNumber || inv.id.slice(-6)}</td>
                                        <td className="p-3 border border-slate-300">{currencyFormatter.format(inv.amount)}</td>
                                        <td className="p-3 border border-slate-300">{currencyFormatter.format(totalPaidForInvoice)}</td>
                                        <td className="p-3 border border-slate-300">{currencyFormatter.format(balance)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-slate-500 py-4">{t('invoices.noInvoices')}</p>
                )}
            </section>

            <section className="mb-10 break-inside-avoid">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 border-b pb-2">{t('financials.payments')}</h3>
                {allPaymentsToSupplier.length > 0 ? (
                    <table className="w-full text-md border-collapse border border-slate-400">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('expenses.date')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('expenses.description')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('expenses.category')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('expenses.amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allPaymentsToSupplier.map(exp => (
                                <tr key={exp.id} className="border-b border-slate-200">
                                    <td className="p-3 border border-slate-300">{dateFormatter.format(new Date(exp.date))}</td>
                                    <td className="p-3 border border-slate-300">{exp.description}</td>
                                    <td className="p-3 border border-slate-300">{t(`expenseCategory.${exp.category}`)}</td>
                                    <td className="p-3 border border-slate-300">{currencyFormatter.format(exp.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-slate-500 py-4">{t('supplierStatement.noPaymentsRecorded')}</p>
                )}
            </section>

            <section className="flex justify-end mt-12 mb-10">
                <div className="w-full max-w-sm p-6 bg-blue-50 rounded-lg shadow-md border-primary-light">
                    <h3 className="text-xl font-bold text-primary-dark mb-4">{t('invoices.outstandingBalance')}</h3>
                    <p className="text-4xl font-extrabold text-primary-dark">{currencyFormatter.format(financialSummary.outstandingBalance)}</p>
                </div>
            </section>

            <footer className="text-center mt-12 text-slate-600 text-sm">
                <p>{t('patientReport.footer')}</p>
            </footer>
        </div>
    );
};

export default SupplierStatement;