import React, { useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Patient, TreatmentRecord, Payment } from '../../types';
import { useI18n } from '../../hooks/useI18n';

const printStyles = `
@media print {
  @page {
    size: A4;
    margin: 1cm;
  }
  body {
    font-size: 12pt;
    line-height: 1.4;
  }
  .text-4xl { font-size: 24pt; }
  .text-3xl { font-size: 20pt; }
  .text-2xl { font-size: 16pt; }
  .text-xl { font-size: 14pt; }
  .text-md { font-size: 12pt; }
  .text-sm { font-size: 10pt; }
  .p-8 { padding: 20pt; }
  .p-6 { padding: 15pt; }
  .p-4 { padding: 10pt; }
  .p-3 { padding: 8pt; }
  .p-2 { padding: 5pt; }
  .mb-10 { margin-bottom: 25pt; }
  .mb-4 { margin-bottom: 10pt; }
  .mb-2 { margin-bottom: 5pt; }
  .mt-12 { margin-top: 30pt; }
  .mt-6 { margin-top: 15pt; }
  .mt-4 { margin-top: 10pt; }
  .mt-2 { margin-top: 5pt; }
  .border { border-width: 1pt; }
  .border-b { border-bottom-width: 1pt; }
  .border-collapse { border-collapse: collapse; }
  .break-inside-avoid { break-inside: avoid; }
}
`;

interface PatientInvoiceProps {
    patient: Patient;
    clinicData: ClinicData;
}

const PatientInvoice: React.FC<PatientInvoiceProps> = ({ patient, clinicData }) => {
    const { t, locale } = useI18n();
    const { treatmentRecords, payments, treatmentDefinitions, dentists, clinicInfo } = clinicData;

    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    const patientTreatmentRecords = useMemo(() => treatmentRecords.filter(tr => tr.patientId === patient.id).sort((a, b) => new Date(a.treatmentDate).getTime() - new Date(b.treatmentDate).getTime()), [treatmentRecords, patient.id]);
    const patientPayments = useMemo(() => payments.filter(p => p.patientId === patient.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [payments, patient.id]);

    const financialSummary = useMemo(() => {
        const totalCharges = patientTreatmentRecords.reduce((sum, tr) => sum + (tr.doctorShare + tr.clinicShare), 0);
        const totalPaid = patientPayments.reduce((sum, p) => sum + p.amount, 0);
        const outstandingBalance = totalCharges - totalPaid;
        return { totalCharges, totalPaid, outstandingBalance };
    }, [patientTreatmentRecords, patientPayments]);

    return (
        <div className="p-8 bg-white text-slate-900 min-h-screen" dir="rtl">
            <style>{printStyles}</style>
            <header className="flex justify-between items-start mb-10">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800">{clinicInfo.name || t('appName')}</h1>
                    <p className="text-md text-slate-600">{clinicInfo.address || t('patientReport.clinicAddress')}</p>
                    <p className="text-sm text-slate-600">{clinicInfo.phone && `Phone: ${clinicInfo.phone}`}</p>
                    <p className="text-sm text-slate-600">{clinicInfo.email && `Email: ${clinicInfo.email}`}</p>
                </div>
                <div className="text-left">
                    <h2 className="text-3xl font-bold text-primary-dark mb-2">{t('patientInvoice.title')}</h2>
                    <p className="text-md text-slate-700"><strong>{t('patientInvoice.invoiceNumber')}:</strong> {patient.id}-INV-{new Date().getFullYear()}</p>
                    <p className="text-md text-slate-700"><strong>{t('patientInvoice.date')}:</strong> {dateFormatter.format(new Date())}</p>
                </div>
            </header>

            <section className="mb-10 p-6 border rounded-lg bg-neutral-light shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-4">{t('patientInvoice.billTo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-md text-slate-700">
                    <div><strong>{t('patientReport.demographics.name')}:</strong> {patient.name}</div>
                    <div><strong>{t('patientReport.demographics.phone')}:</strong> {patient.phone}</div>
                    <div><strong>{t('patientReport.demographics.dob')}:</strong> {dateFormatter.format(new Date(patient.dob))}</div>
                    <div><strong>{t('patientReport.demographics.email')}:</strong> {patient.email || '-'}</div>
                    <div className="md:col-span-2"><strong>{t('patientReport.demographics.address')}:</strong> {patient.address || '-'}</div>
                </div>
            </section>

            <section className="mb-10 break-inside-avoid">
                <h3 className="text-2xl font-bold text-slate-800 mb-4">{t('patientInvoice.treatmentDetails')}</h3>
                {patientTreatmentRecords.length > 0 ? (
                    <table className="w-full text-md border-collapse border border-slate-400">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('patientReport.treatmentHistory.date')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('patientReport.treatmentHistory.treatment')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('patientReport.treatmentHistory.dentist')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('patientReport.treatmentHistory.cost')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patientTreatmentRecords.map(record => {
                                const treatmentDef = treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);
                                const dentist = dentists.find(d => d.id === record.dentistId);
                                return (
                                    <tr key={record.id} className="border-b border-slate-200">
                                        <td className="p-3 border border-slate-300">{dateFormatter.format(new Date(record.treatmentDate))}</td>
                                        <td className="p-3 border border-slate-300">{treatmentDef?.name || t('common.unknownTreatment')}</td>
                                        <td className="p-3 border border-slate-300">{dentist?.name || t('common.unknownDentist')}</td>
                                        <td className="p-3 border border-slate-300">{currencyFormatter.format(record.doctorShare + record.clinicShare)}</td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-slate-50 font-bold">
                                <td colSpan={3} className="p-3 text-right border border-slate-300">{t('financials.totalCharges')}:</td>
                                <td className="p-3 border border-slate-300">{currencyFormatter.format(financialSummary.totalCharges)}</td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-slate-500 py-4">{t('patientReport.treatmentHistory.noRecords')}</p>
                )}
            </section>

            <section className="mb-10 break-inside-avoid">
                <h3 className="text-2xl font-bold text-slate-800 mb-4">{t('patientInvoice.paymentDetails')}</h3>
                {patientPayments.length > 0 ? (
                    <table className="w-full text-md border-collapse border border-slate-400">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('patientReport.financials.paymentDate')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('patientReport.financials.paymentMethod')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('patientReport.financials.notes')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-300">{t('patientReport.financials.amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patientPayments.map(payment => (
                                <tr key={payment.id} className="border-b border-slate-200">
                                    <td className="p-3 border border-slate-300">{dateFormatter.format(new Date(payment.date))}</td>
                                    <td className="p-3 border border-slate-300">{t(`paymentMethod.${payment.method}`)}</td>
                                    <td className="p-3 border border-slate-300">{payment.notes || '-'}</td>
                                    <td className="p-3 border border-slate-300">{currencyFormatter.format(payment.amount)}</td>
                                </tr>
                            ))}
                            <tr className="bg-slate-50 font-bold">
                                <td colSpan={3} className="p-3 text-right border border-slate-300">{t('financials.totalPaid')}:</td>
                                <td className="p-3 border border-slate-300">{currencyFormatter.format(financialSummary.totalPaid)}</td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-slate-500 py-4">{t('patientReport.financials.noPayments')}</p>
                )}
            </section>

            <section className="flex justify-end mt-12 mb-10">
                <div className="w-full max-w-sm p-6 bg-blue-50 rounded-lg shadow-md border-primary-light">
                    <h3 className="text-xl font-bold text-primary-dark mb-4">{t('patientInvoice.balanceDue')}</h3>
                    <p className="text-4xl font-extrabold text-primary-dark">{currencyFormatter.format(financialSummary.outstandingBalance)}</p>
                </div>
            </section>

            <footer className="text-center mt-12 text-slate-600 text-sm">
                <p className="mb-2">{t('patientInvoice.thankYou')}</p>
                <p>{t('patientReport.footer')}</p>
            </footer>
        </div>
    );
};

export default PatientInvoice;