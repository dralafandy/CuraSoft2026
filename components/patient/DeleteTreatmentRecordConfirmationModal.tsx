import React from 'react';
import { TreatmentRecord } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useClinicData } from '../../hooks/useClinicData';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

interface DeleteTreatmentRecordConfirmationModalProps {
    record: TreatmentRecord;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteTreatmentRecordConfirmationModal: React.FC<DeleteTreatmentRecordConfirmationModalProps> = ({ record, onConfirm, onCancel }) => {
    const { t } = useI18n();
    const { treatmentDefinitions } = useClinicData();
    
    const treatmentDef = treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);
    const dateFormatter = new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-700">{t('treatmentDelete.confirmTitle')}</h2>
                    <button onClick={onCancel} className="p-1 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <div className="p-6 space-y-4">
                    <p className="text-slate-700">{t('treatmentDelete.confirmMessage')}</p>
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <p className="text-sm text-red-800 font-medium">{treatmentDef?.name || t('common.unknownTreatment')}</p>
                        <p className="text-sm text-red-800">{dateFormatter.format(new Date(record.treatmentDate))}</p>
                        <p className="text-sm text-red-800 font-medium mt-2">{t('treatmentDelete.financialImpact')}</p>
                        <p className="text-sm text-red-800">{t('treatmentDelete.doctorShareImpact').replace('{amount}', record.doctorShare.toFixed(2))}</p>
                        <p className="text-sm text-red-800">{t('treatmentDelete.clinicShareImpact').replace('{amount}', record.clinicShare.toFixed(2))}</p>
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300">
                            {t('common.cancel')}
                        </button>
                        <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                            {t('common.delete')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteTreatmentRecordConfirmationModal;