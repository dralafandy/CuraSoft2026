import React, { useState } from 'react';
import { Payment } from '../../types';
import { ClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

interface AddDiscountModalProps {
    patientId: string;
    clinicData: ClinicData;
    onClose: () => void;
    onAdd: (payment: Omit<Payment, 'id'>) => void;
}

const AddDiscountModal: React.FC<AddDiscountModalProps> = ({ patientId, clinicData, onClose, onAdd }) => {
    const { t } = useI18n();
    const { addNotification } = useNotification();
    const [formData, setFormData] = useState<Omit<Payment, 'id'>>({
        patientId,
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        method: 'Discount', // Discounts are handled as a special payment method
        notes: '',
        treatmentRecordId: '',
        clinicShare: 0,
        doctorShare: 0,
    });
    const [approvalPassword, setApprovalPassword] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'amount') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
        } else if (name === 'approvalPassword') {
            setApprovalPassword(value);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.amount <= 0) {
            addNotification(t('addPaymentModal.alertPositiveAmount'), NotificationType.WARNING);
            return;
        }

        // Calculate outstanding balance for the patient
        const patientTreatmentRecords = clinicData.treatmentRecords.filter(tr => tr.patientId === patientId);
        const totalTreatmentCosts = patientTreatmentRecords.reduce((sum, tr) => {
            const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
            return sum + (treatmentDef ? treatmentDef.basePrice : 0);
        }, 0);
        const totalPayments = clinicData.payments.filter(p => p.patientId === patientId).reduce((sum, p) => sum + p.amount, 0);
        const outstandingBalance = totalTreatmentCosts - totalPayments;

        // Validate discount doesn't exceed outstanding balance
        if (outstandingBalance <= 0) {
            addNotification('لا يوجد رصيد مستحق لهذا المريض', NotificationType.ERROR);
            return;
        }
        if (formData.amount > outstandingBalance) {
            addNotification(`المبلغ المدخل يتجاوز الرصيد المستحق: ${outstandingBalance.toFixed(2)}`, NotificationType.ERROR);
            return;
        }

        // Simple hardcoded password for discount approval
        if (approvalPassword !== '123') { // Use a secure way in a real app
            addNotification(t('addDiscountModal.passwordIncorrect'), NotificationType.ERROR);
            return;
        }

        onAdd(formData);
        onClose();
        addNotification(t('notifications.discountAdded'), NotificationType.SUCCESS);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-700">{t('addDiscountModal.title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
                    <div>
                        <label htmlFor="discountAmount" className="block text-sm font-medium text-slate-600 mb-1">{t('addDiscountModal.amount')}</label>
                        <input id="discountAmount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required min="0.01" />
                    </div>
                    <div>
                        <label htmlFor="discountNotes" className="block text-sm font-medium text-slate-600 mb-1">{t('addDiscountModal.notes')}</label>
                        <textarea id="discountNotes" name="notes" value={formData.notes || ''} onChange={handleChange} placeholder={t('addDiscountModal.notes')} className="p-2 border border-slate-300 rounded-lg w-full h-20 focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                        <label htmlFor="approvalPassword" className="block text-sm font-medium text-slate-600 mb-1">{t('addDiscountModal.password')}</label>
                        <input id="approvalPassword" name="approvalPassword" type="password" value={approvalPassword} onChange={handleChange} placeholder={t('addDiscountModal.passwordPlaceholder')} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required />
                    </div>
                    <footer className="pt-2 flex justify-end space-x-4 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-dark rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light">{t('addDiscountModal.saveDiscount')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default AddDiscountModal;