import React, { useState, useEffect } from 'react';
import { Prescription, PrescriptionItem, Patient, Dentist } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

interface AddEditPrescriptionModalProps {
    prescription?: Prescription;
    prescriptionItems?: PrescriptionItem[];
    patient: Patient;
    dentists: Dentist[];
    onClose: () => void;
    onSave: (prescriptionData: Omit<Prescription, 'id' | 'patientId' | 'userId' | 'createdAt' | 'updatedAt'>, items: PrescriptionItem[]) => void;
}

const AddEditPrescriptionModal: React.FC<AddEditPrescriptionModalProps> = ({
    prescription,
    prescriptionItems = [],
    patient,
    dentists,
    onClose,
    onSave
}) => {
    const { t } = useI18n();
    const { addNotification } = useNotification();

    const [formData, setFormData] = useState<Omit<Prescription, 'id' | 'patientId' | 'userId' | 'createdAt' | 'updatedAt'>>({
        dentistId: prescription?.dentistId || dentists[0]?.id || '',
        prescriptionDate: prescription?.prescriptionDate || new Date().toISOString().split('T')[0],
        notes: prescription?.notes || '',
        totalCost: prescription?.totalCost || 0,
    });

    const [prescriptionItemsState, setPrescriptionItemsState] = useState<PrescriptionItem[]>(prescriptionItems);

    // Load existing items if editing
    useEffect(() => {
        if (prescription && prescriptionItems.length === 0) {
            // Mock data for editing - in real implementation, this would be fetched from API
            const mockItems: PrescriptionItem[] = [
                {
                    id: 'mock-1',
                    prescriptionId: prescription.id,
                    medicationName: 'Amoxicillin',
                    dosage: '500mg',
                    quantity: 20,
                    unitCost: 0.5,
                    instructions: 'Take 3 times daily after meals',
                    userId: '',
                    createdAt: '',
                    updatedAt: ''
                },
                {
                    id: 'mock-2',
                    prescriptionId: prescription.id,
                    medicationName: 'Ibuprofen',
                    dosage: '200mg',
                    quantity: 30,
                    unitCost: 0.3,
                    instructions: 'Take as needed for pain',
                    userId: '',
                    createdAt: '',
                    updatedAt: ''
                }
            ];
            setPrescriptionItemsState(mockItems);
        }
    }, [prescription, prescriptionItems]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addPrescriptionItem = () => {
        const newItem: PrescriptionItem = {
            id: `temp-${Date.now()}`,
            prescriptionId: prescription?.id || '',
            medicationName: '',
            dosage: '',
            quantity: 1,
            unitCost: 0,
            instructions: '',
            userId: '',
            createdAt: '',
            updatedAt: ''
        };
        setPrescriptionItemsState(prev => [...prev, newItem]);
    };

    const updatePrescriptionItem = (index: number, field: keyof PrescriptionItem, value: string | number) => {
        setPrescriptionItemsState(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    };

    const removePrescriptionItem = (index: number) => {
        setPrescriptionItemsState(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.dentistId || !formData.prescriptionDate) {
            addNotification(t('prescriptionModal.alertFillRequired'), NotificationType.ERROR);
            return;
        }

        // Validate prescription items
        const validItems = prescriptionItemsState.filter(item =>
            item.medicationName.trim() && item.quantity > 0
        );

        if (validItems.length === 0) {
            addNotification(t('prescriptionModal.alertAtLeastOneItem'), NotificationType.ERROR);
            return;
        }

        // In a real implementation, you'd save both prescription and items
        // Now we save both prescription and items
        onSave(formData, validItems);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-700">
                        {prescription ? t('prescriptionModal.editTitle') : t('prescriptionModal.title')}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('prescriptionModal.closeAriaLabel')}>
                        <CloseIcon />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Prescription Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="dentistId" className="block text-sm font-medium text-slate-600 mb-1">
                                {t('prescriptionModal.dentist')}
                            </label>
                            <select
                                id="dentistId"
                                name="dentistId"
                                value={formData.dentistId}
                                onChange={handleChange}
                                className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary"
                                required
                            >
                                <option value="">{t('prescriptionModal.selectDentist')}</option>
                                {dentists.map(dentist => (
                                    <option key={dentist.id} value={dentist.id}>
                                        {dentist.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="prescriptionDate" className="block text-sm font-medium text-slate-600 mb-1">
                                {t('prescriptionModal.prescriptionDate')}
                            </label>
                            <input
                                id="prescriptionDate"
                                name="prescriptionDate"
                                type="date"
                                value={formData.prescriptionDate}
                                onChange={handleChange}
                                className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-slate-600 mb-1">
                            {t('prescriptionModal.notes')}
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder={t('prescriptionModal.notesPlaceholder')}
                            className="p-2 border border-slate-300 rounded-lg w-full h-24 focus:ring-primary focus:border-primary"
                        />
                    </div>

                    {/* Prescription Items */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-700">
                                {t('prescriptionModal.medications')}
                            </h3>
                            <button
                                type="button"
                                onClick={addPrescriptionItem}
                                className="bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary-dark flex items-center gap-2 text-sm"
                            >
                                <PlusIcon />
                                {t('prescriptionModal.addMedication')}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {prescriptionItemsState.map((item, index) => (
                                <div key={item.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                                {t('prescriptionModal.medicationName')}
                                            </label>
                                            <input
                                                type="text"
                                                value={item.medicationName}
                                                onChange={(e) => updatePrescriptionItem(index, 'medicationName', e.target.value)}
                                                placeholder={t('prescriptionModal.medicationNamePlaceholder')}
                                                className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                                {t('prescriptionModal.dosage')}
                                            </label>
                                            <input
                                                type="text"
                                                value={item.dosage || ''}
                                                onChange={(e) => updatePrescriptionItem(index, 'dosage', e.target.value)}
                                                placeholder={t('prescriptionModal.dosagePlaceholder')}
                                                className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                                {t('prescriptionModal.quantity')}
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updatePrescriptionItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-2 lg:col-span-4">
                                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                                {t('prescriptionModal.instructions')}
                                            </label>
                                            <input
                                                type="text"
                                                value={item.instructions || ''}
                                                onChange={(e) => updatePrescriptionItem(index, 'instructions', e.target.value)}
                                                placeholder={t('prescriptionModal.instructionsPlaceholder')}
                                                className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        <button
                                            type="button"
                                            onClick={() => removePrescriptionItem(index)}
                                            className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 flex items-center gap-2 text-sm"
                                        >
                                            <TrashIcon />
                                            {t('common.remove')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {prescriptionItemsState.length === 0 && (
                            <p className="text-center text-slate-500 py-8">
                                {t('prescriptionModal.noMedications')}
                            </p>
                        )}
                    </div>

                    <footer className="pt-4 flex justify-end space-x-4 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-neutral-dark rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light"
                        >
                            {prescription ? t('prescriptionModal.savePrescription') : t('prescriptionModal.createPrescription')}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default AddEditPrescriptionModal;