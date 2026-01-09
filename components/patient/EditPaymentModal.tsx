import React, { useState, useEffect } from 'react';
import { Payment } from '../../types';
import { ClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';
import { PaymentMethod } from '../../types';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

interface EditPaymentModalProps {
    patientId: string;
    payment: Payment;
    clinicData: ClinicData;
    onClose: () => void;
    onUpdate: (payment: Payment) => void;
}

const EditPaymentModal: React.FC<EditPaymentModalProps> = ({ patientId, payment, clinicData, onClose, onUpdate }) => {
    const { t } = useI18n();
    const { addNotification } = useNotification();
    const [formData, setFormData] = useState<Payment>(payment);
    const [originalAmount, setOriginalAmount] = useState(payment.amount);

    useEffect(() => {
        setFormData(payment);
        setOriginalAmount(payment.amount);
    }, [payment]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const newValue = name === 'amount' ? parseFloat(value) : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));

        // Recalculate shares if amount changed
        if (name === 'amount' && parseFloat(newValue as string) !== originalAmount) {
            const treatmentRecord = clinicData.treatmentRecords.find(tr => tr.id === payment.treatmentRecordId);
            if (treatmentRecord) {
                const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === treatmentRecord.treatmentDefinitionId);
                if (treatmentDef) {
                    const amountValue = parseFloat(newValue as string);
                    const doctorShare = amountValue * treatmentDef.doctorPercentage;
                    const clinicShare = amountValue - doctorShare;
                    setFormData(prev => ({ ...prev, clinicShare, doctorShare }));
                }
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.amount <= 0) {
            addNotification(t('addPaymentModal.alertPositiveAmount'), NotificationType.ERROR);
            return;
        }

        // TODO: Add validation for closed periods - prevent editing if payment date is in closed accounting period
        // TODO: Add validation for dependencies - check if payment is referenced by financial reports

        // Calculate outstanding balance for the patient (excluding current payment)
        const patientTreatmentRecords = clinicData.treatmentRecords.filter(tr => tr.patientId === patientId);
        const totalTreatmentCosts = patientTreatmentRecords.reduce((sum, tr) => {
            const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
            return sum + (treatmentDef ? treatmentDef.basePrice : 0);
        }, 0);
        const totalPayments = clinicData.payments.filter(p => p.patientId === patientId && p.id !== payment.id).reduce((sum, p) => sum + p.amount, 0);
        const outstandingBalance = totalTreatmentCosts - totalPayments;

        // Validate payment doesn't exceed outstanding balance
        if (outstandingBalance <= 0) {
            addNotification('لا يوجد رصيد مستحق لهذا المريض', NotificationType.ERROR);
            return;
        }
        if (formData.amount > outstandingBalance) {
            addNotification(`المبلغ المدخل يتجاوز الرصيد المستحق: ${outstandingBalance.toFixed(2)}`, NotificationType.ERROR);
            return;
        }

        onUpdate(formData);
        onClose();
    };

    // Fix: Create a constant array from the PaymentMethod union type to iterate over its values
    const allPaymentMethods: PaymentMethod[] = ['Cash', 'Credit Card', 'Bank Transfer', 'Other', 'Discount'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-700">{t('paymentEdit.title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
                    <div>
                        <label htmlFor="paymentDate" className="block text-sm font-medium text-slate-600 mb-1">{t('addPaymentModal.paymentDate')}</label>
                        <input id="paymentDate" name="date" type="date" value={formData.date} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required />
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-1">{t('addPaymentModal.amount')}</label>
                        <input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required min="0.01" />
                        {formData.amount !== originalAmount && (
                            <p className="text-sm text-amber-600 mt-1">{t('paymentEdit.amountChanged')}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="treatmentRecord" className="block text-sm font-medium text-slate-600 mb-1">Treatment Record</label>
                        <select id="treatmentRecord" name="treatmentRecordId" value={formData.treatmentRecordId} disabled className="p-2 border border-slate-300 rounded-lg w-full bg-slate-100 cursor-not-allowed">
                            {clinicData.treatmentRecords.filter(tr => tr.patientId === patientId).map(tr => {
                                const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
                                return (
                                    <option key={tr.id} value={tr.id}>
                                        {treatmentDef?.name || 'Unknown Treatment'} - {new Date(tr.treatmentDate).toLocaleDateString()}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-600 mb-1">{t('addPaymentModal.paymentMethod')}</label>
                        <select id="paymentMethod" name="method" value={formData.method} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required>
                            {/* Fix: Iterate over the 'allPaymentMethods' array */}
                            {allPaymentMethods.filter(method => method !== 'Discount').map(method => (
                                <option key={method} value={method}>{t(`paymentMethod.${method}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-slate-600 mb-1">{t('addPaymentModal.notes')}</label>
                        <textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} placeholder={t('addPaymentModal.notesPlaceholder')} className="p-2 border border-slate-300 rounded-lg w-full h-20 focus:ring-primary focus:border-primary" />
                    </div>
                    <footer className="pt-2 flex justify-end space-x-4 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-dark rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light">{t('paymentEdit.saveChanges')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default EditPaymentModal;