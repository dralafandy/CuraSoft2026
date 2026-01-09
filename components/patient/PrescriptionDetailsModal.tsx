import React from 'react';
import { Prescription, PrescriptionItem, Patient, Dentist } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { openPrintWindow } from '../../utils/print';
import PrintablePrescription from './PrintablePrescription';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const PrintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;

interface PrescriptionDetailsModalProps {
    prescription: Prescription;
    patient: Patient;
    prescriptions: Prescription[];
    prescriptionItems: PrescriptionItem[];
    dentists: Dentist[];
    clinicInfo: any;
    onClose: () => void;
    onUpdate?: (prescription: Prescription) => void;
}

const PrescriptionDetailsModal: React.FC<PrescriptionDetailsModalProps> = ({
    prescription,
    patient,
    prescriptions,
    prescriptionItems,
    dentists,
    clinicInfo,
    onClose,
    onUpdate
}) => {
    const { t, locale } = useI18n();

    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });

    const dentist = dentists.find(d => d.id === prescription.dentistId);
    const items = prescriptionItems.filter(item => item.prescriptionId === prescription.id);

    const handlePrint = () => {
        if (!dentist) return;
        const title = `${t('prescriptionDetails.title')} - ${patient.name}`;
        openPrintWindow(
            title,
            <PrintablePrescription
                prescription={prescription}
                patient={patient}
                prescriptionItems={items}
                dentist={dentist}
                clinicInfo={clinicInfo}
            />
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-700">
                        {t('prescriptionDetails.title')} #{prescription.id.slice(-8)}
                    </h2>
                    <div className="flex items-center gap-2">
                        {onUpdate && (
                            <button
                                onClick={() => onUpdate(prescription)}
                                className="flex items-center px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                            >
                                <EditIcon /> {t('common.edit')}
                            </button>
                        )}
                        <button
                            onClick={handlePrint}
                            className="flex items-center px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                        >
                            <PrintIcon /> {t('common.print')}
                        </button>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('prescriptionDetails.closeAriaLabel')}>
                            <CloseIcon />
                        </button>
                    </div>
                </header>

                <main className="p-6 overflow-y-auto flex-1">
                    {/* Prescription Header */}
                    <div className="bg-slate-50 p-4 rounded-lg mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-bold text-slate-700 mb-2">{t('prescriptionDetails.patientInfo')}</h3>
                                <p className="text-sm"><strong>{t('prescriptionDetails.patientName')}:</strong> {patient.name}</p>
                                <p className="text-sm"><strong>{t('prescriptionDetails.patientId')}:</strong> {patient.id.slice(-8)}</p>
                                <p className="text-sm"><strong>{t('prescriptionDetails.patientPhone')}:</strong> {patient.phone}</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-700 mb-2">{t('prescriptionDetails.prescriptionInfo')}</h3>
                                <p className="text-sm"><strong>{t('prescriptionDetails.dentist')}:</strong> {dentist?.name || t('common.unknownDentist')}</p>
                                <p className="text-sm"><strong>{t('prescriptionDetails.date')}:</strong> {dateFormatter.format(new Date(prescription.prescriptionDate))}</p>
                                <p className="text-sm"><strong>{t('prescriptionDetails.prescriptionId')}:</strong> {prescription.id.slice(-8)}</p>
                            </div>
                        </div>
                        {prescription.notes && (
                            <div className="mt-4">
                                <h3 className="font-bold text-slate-700 mb-2">{t('prescriptionDetails.notes')}</h3>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{prescription.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Medications */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-700 mb-4">{t('prescriptionDetails.medications')}</h3>

                        {items.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">{t('prescriptionDetails.noMedications')}</p>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-bold text-slate-800 text-lg">{item.medicationName}</h4>
                                            <span className="text-sm text-slate-500">#{index + 1}</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            {item.dosage && (
                                                <div>
                                                    <strong className="text-slate-600">{t('prescriptionDetails.dosage')}:</strong>
                                                    <p className="text-slate-800">{item.dosage}</p>
                                                </div>
                                            )}
                                            <div>
                                                <strong className="text-slate-600">{t('prescriptionDetails.quantity')}:</strong>
                                                <p className="text-slate-800">{item.quantity}</p>
                                            </div>
                                            {item.instructions && (
                                                <div className="md:col-span-3">
                                                    <strong className="text-slate-600">{t('prescriptionDetails.instructions')}:</strong>
                                                    <p className="text-slate-800">{item.instructions}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light"
                        >
                            {t('common.close')}
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PrescriptionDetailsModal;