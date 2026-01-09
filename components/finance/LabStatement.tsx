import React, { useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Supplier, LabCase, LabCaseStatus } from '../../types';
import { useI18n } from '../../hooks/useI18n';

interface LabStatementProps {
    supplier: Supplier;
    clinicData: ClinicData;
}

const LabStatement: React.FC<LabStatementProps> = ({ supplier, clinicData }) => {
    const { t, locale } = useI18n();
    const { clinicInfo, labCases, patients } = clinicData;

    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    const shortDateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    const relatedLabCases = useMemo(() => {
        return labCases.filter(lc => lc.labId === supplier.id)
            .sort((a, b) => new Date(a.sentDate).getTime() - new Date(b.sentDate).getTime());
    }, [labCases, supplier.id]);

    const labCaseSummary = useMemo(() => {
        const totalCases = relatedLabCases.length;
        const totalCost = relatedLabCases.reduce((sum, lc) => sum + lc.labCost, 0);
        return { totalCases, totalCost };
    }, [relatedLabCases]);

    if (supplier.type !== 'Dental Lab') {
        return (
            <div className="p-8 bg-white text-slate-900 min-h-screen text-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                <h1 className="text-3xl font-bold text-red-600 mb-4">{t('supplierStatement.notDentalLab')}</h1>
                <p className="text-md text-slate-700">{t('supplierStatement.selectDentalLab')}</p>
            </div>
        );
    }

    return (
        <div className="p-8 bg-white text-slate-900 min-h-screen" dir={locale === 'ar' ? 'rtl' : 'ltr'} style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontSize: '12px', lineHeight: '1.4' }}>
            <header className="text-center mb-10 break-inside-avoid">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">{clinicInfo.name || t('appName')}</h1>
                    <p className="text-sm text-slate-600">{clinicInfo.address}</p>
                    <p className="text-sm text-slate-600">{clinicInfo.phone} | {clinicInfo.email}</p>
                </div>
                <h2 className="text-xl font-bold text-primary-dark mt-6 mb-2">{t('supplierStatement.caseTitle')}</h2>
                <p className="text-sm text-slate-700">{t('patientReport.generatedOn', { date: dateFormatter.format(new Date()) })}</p>
            </header>

            <section className="mb-10 p-6 border rounded-lg bg-neutral-light shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-4">{t('supplierStatement.caseDetails')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-md text-slate-700">
                    <div><strong>{t('suppliers.supplierName')}:</strong> {supplier.name}</div>
                    <div><strong>{t('suppliers.contactPerson')}:</strong> {supplier.contactPerson || '-'}</div>
                    <div><strong>{t('suppliers.phone')}:</strong> {supplier.phone || '-'}</div>
                    <div><strong>{t('suppliers.email')}:</strong> {supplier.email || '-'}</div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200">
                    <p className="text-lg text-slate-700"><strong>{t('supplierStatement.totalCases')}:</strong> {labCaseSummary.totalCases}</p>
                    <p className="text-lg text-slate-700"><strong>{t('supplierStatement.totalCost')}:</strong> {currencyFormatter.format(labCaseSummary.totalCost)}</p>
                </div>
            </section>

            <section className="mb-10 break-inside-avoid">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 border-b pb-2">{t('labCases.labCaseTracker')}</h3>
                {relatedLabCases.length > 0 ? (
                    <table className="w-full text-md border-collapse border border-slate-400">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('labCases.patient')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('labCases.caseType')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('labCases.sentDate')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('labCases.dueDate')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('labCases.status')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('labCases.cost')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {relatedLabCases.map(lc => {
                                const patient = patients.find(p => p.id === lc.patientId);
                                return (
                                    <tr key={lc.id} className="border-b border-slate-200">
                                        <td className="p-3 border border-slate-300">{patient?.name || t('common.unknownPatient')}</td>
                                        <td className="p-3 border border-slate-300">{lc.caseType}</td>
                                        <td className="p-3 border border-slate-300">{shortDateFormatter.format(new Date(lc.sentDate))}</td>
                                        <td className="p-3 border border-slate-300">{shortDateFormatter.format(new Date(lc.dueDate))}</td>
                                        <td className="p-3 border border-slate-300">{t(`labCaseStatus.${lc.status}`)}</td>
                                        <td className="p-3 border border-slate-300">{currencyFormatter.format(lc.labCost)}</td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-slate-50 font-bold">
                                <td colSpan={5} className="p-3 text-right border border-slate-300">{t('supplierStatement.totalCost')}:</td>
                                <td className="p-3 border border-slate-300">{currencyFormatter.format(labCaseSummary.totalCost)}</td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-slate-500 py-4">{t('labCases.noCasesRecorded')}</p>
                )}
            </section>

            <footer className="text-center mt-12 text-slate-600 text-sm">
                <p>{t('patientReport.footer')}</p>
            </footer>
        </div>
    );
};

export default LabStatement;