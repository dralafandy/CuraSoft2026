import React, { useState, useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { TreatmentRecord, InventoryItem, LabCase, LabCaseStatus, Prescription } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

interface InventoryItemSelection {
    inventoryItemId: string;
    quantity: number;
}

const AddTreatmentRecordModal: React.FC<{
    patientId: string;
    onClose: () => void;
    onAdd: (record: Omit<TreatmentRecord, 'id' | 'patientId'>) => void;
    clinicData: ClinicData;
}> = ({ patientId, onClose, onAdd, clinicData }) => {
    const { t, locale } = useI18n();
    const { addNotification } = useNotification();
    const { dentists, treatmentDefinitions, inventoryItems, updateInventoryItem } = clinicData;

    const [formData, setFormData] = useState({
        dentistId: '',
        treatmentDate: new Date().toISOString().split('T')[0],
        treatmentDefinitionId: '',
        notes: '',
        selectedInventoryItems: [] as InventoryItemSelection[],
        affectedTeeth: [] as string[],
        labId: '', // Add lab selection
    });

    const selectedTreatmentDef = useMemo(() => {
        return treatmentDefinitions.find(td => td.id === formData.treatmentDefinitionId);
    }, [formData.treatmentDefinitionId, treatmentDefinitions]);

    const calculateCosts = useMemo(() => {
        let totalMaterialCost = 0;
        const itemsUsedForRecord: { inventoryItemId: string; quantity: number; cost: number; }[] = [];

        formData.selectedInventoryItems.forEach(sm => {
            const material = inventoryItems.find(lm => lm.id === sm.inventoryItemId);
            if (material && sm.quantity > 0) {
                const costForMaterial = material.unitCost * sm.quantity;
                totalMaterialCost += costForMaterial;
                itemsUsedForRecord.push({
                    inventoryItemId: sm.inventoryItemId,
                    quantity: sm.quantity,
                    cost: costForMaterial,
                });
            }
        });

        const basePrice = selectedTreatmentDef?.basePrice || 0;
        const doctorShare = basePrice * (selectedTreatmentDef?.doctorPercentage || 0);
        const clinicShare = (basePrice * (selectedTreatmentDef?.clinicPercentage || 0)) - totalMaterialCost;

        return {
            doctorShare,
            clinicShare,
            itemsUsedForRecord,
        };
    }, [formData.selectedInventoryItems, inventoryItems, selectedTreatmentDef]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemSelect = (itemId: string) => {
        setFormData(prev => {
            if (prev.selectedInventoryItems.some(sm => sm.inventoryItemId === itemId)) {
                return prev;
            }
            return {
                ...prev,
                selectedInventoryItems: [...prev.selectedInventoryItems, { inventoryItemId: itemId, quantity: 1 }],
            };
        });
    };


    const handleItemQuantityChange = (itemId: string, quantity: number) => {
        setFormData(prev => ({
            ...prev,
            selectedInventoryItems: prev.selectedInventoryItems.map(sm =>
                sm.inventoryItemId === itemId ? { ...sm, quantity: Math.max(0, quantity) } : sm
            ),
        }));
    };

    const handleRemoveItem = (itemId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedInventoryItems: prev.selectedInventoryItems.filter(sm => sm.inventoryItemId !== itemId),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.dentistId || !formData.treatmentDefinitionId) {
            addNotification(t('addTreatmentRecord.alertFillFields'), NotificationType.ERROR);
            return;
        }

        formData.selectedInventoryItems.forEach(sm => {
            const item = inventoryItems.find(lm => lm.id === sm.inventoryItemId);
            if (item) {
                updateInventoryItem({ ...item, currentStock: item.currentStock - sm.quantity });
            }
        });

        // Add lab case if labId is selected (when adding treatment record)
        if (formData.labId) {
            const labCaseData: Omit<LabCase, 'id'> = {
                patientId: patientId,
                labId: formData.labId,
                caseType: selectedTreatmentDef?.name || 'Treatment Case',
                sentDate: formData.treatmentDate,
                dueDate: new Date(new Date(formData.treatmentDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days later
                returnDate: '',
                status: LabCaseStatus.DRAFT,
                labCost: 0, // Will be updated later
                notes: formData.notes || '',
            };
            clinicData.addLabCase(labCaseData);
        }

        onAdd({
            dentistId: formData.dentistId,
            treatmentDate: formData.treatmentDate,
            treatmentDefinitionId: formData.treatmentDefinitionId,
            notes: formData.notes,
            inventoryItemsUsed: calculateCosts.itemsUsedForRecord,
            doctorShare: calculateCosts.doctorShare,
            clinicShare: calculateCosts.clinicShare,
            totalTreatmentCost: calculateCosts.doctorShare + calculateCosts.clinicShare,
            affectedTeeth: formData.affectedTeeth,
        });
    };

    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-700">{t('addTreatmentRecord.title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
                    <div>
                        <label htmlFor="treatmentDate" className="block text-sm font-medium text-slate-600">{t('addTreatmentRecord.date')}</label>
                        <input id="treatmentDate" name="treatmentDate" type="date" value={formData.treatmentDate} onChange={handleChange} className="mt-1 p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required />
                    </div>
                    <div>
                        <label htmlFor="dentistId" className="block text-sm font-medium text-slate-600">{t('addTreatmentRecord.dentist')}</label>
                        <select id="dentistId" name="dentistId" value={formData.dentistId} onChange={handleChange} className="mt-1 p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required>
                            <option value="">{t('addTreatmentRecord.selectDentist')}</option>
                            {dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="treatmentDefinitionId" className="block text-sm font-medium text-slate-600">{t('addTreatmentRecord.treatment')}</label>
                        <select id="treatmentDefinitionId" name="treatmentDefinitionId" value={formData.treatmentDefinitionId} onChange={handleChange} className="mt-1 p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required>
                            <option value="">{t('addTreatmentRecord.selectTreatment')}</option>
                            {treatmentDefinitions.map(td => <option key={td.id} value={td.id}>{td.name} ({currencyFormatter.format(td.basePrice)})</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="labId" className="block text-sm font-medium text-slate-600">{t('labCases.dentalLab')} ({t('common.optional')})</label>
                        <select id="labId" name="labId" value={formData.labId} onChange={handleChange} className="mt-1 p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary">
                            <option value="">{t('labCases.selectDentalLab')}</option>
                            {clinicData.suppliers.filter(s => s.type === 'Dental Lab').map(lab => <option key={lab.id} value={lab.id}>{lab.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-slate-600">{t('addTreatmentRecord.notes')}</label>
                        <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder={t('addTreatmentRecord.notesPlaceholder')} className="mt-1 p-2 border border-slate-300 rounded-lg w-full h-24 focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                        <label htmlFor="affectedTeeth" className="block text-sm font-medium text-slate-600">{t('addTreatmentRecord.affectedTeeth')}</label>
                        <select
                            id="affectedTeeth"
                            multiple
                            value={formData.affectedTeeth}
                            onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                                setFormData(prev => ({ ...prev, affectedTeeth: selected }));
                            }}
                            className="mt-1 p-2 border border-slate-300 rounded-lg w-full h-32 focus:ring-primary focus:border-primary"
                        >
                            {[
                                ...Array.from({ length: 8 }, (_, i) => `UR${i + 1}`),
                                ...Array.from({ length: 8 }, (_, i) => `UL${i + 1}`),
                                ...Array.from({ length: 8 }, (_, i) => `LL${i + 1}`),
                                ...Array.from({ length: 8 }, (_, i) => `LR${i + 1}`),
                            ].map(toothId => (
                                <option key={toothId} value={toothId}>{toothId}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">{t('addTreatmentRecord.affectedTeethHelp')}</p>
                    </div>

                    <div className="bg-neutral p-4 rounded-lg shadow-inner">
                        <h3 className="text-md font-semibold text-slate-700 mb-2">{t('addTreatmentRecord.inventoryItemsUsed')}</h3>
                        <div className="space-y-2 mb-4">
                            {formData.selectedInventoryItems.map(si => {
                                const item = inventoryItems.find(i => i.id === si.inventoryItemId);
                                return item ? (
                                    <div key={si.inventoryItemId} className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm">
                                        <p className="flex-1 text-sm text-slate-700">{item.name}</p>
                                        <div className="flex items-center space-x-1">
                                            <button type="button" onClick={() => handleItemQuantityChange(si.inventoryItemId, si.quantity - 1)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('addTreatmentRecord.decreaseQuantityAria', {itemName: item.name})}>
                                                <MinusIcon />
                                            </button>
                                            <input
                                                type="number"
                                                min="0"
                                                value={si.quantity}
                                                onChange={(e) => handleItemQuantityChange(si.inventoryItemId, parseFloat(e.target.value))}
                                                className="w-16 text-center border border-slate-300 rounded-lg p-1 text-sm focus:ring-primary focus:border-primary"
                                                aria-label={t('addTreatmentRecord.quantityAria', {itemName: item.name})}
                                            />
                                            <button type="button" onClick={() => handleItemQuantityChange(si.inventoryItemId, si.quantity + 1)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('addTreatmentRecord.increaseQuantityAria', {itemName: item.name})}>
                                                <PlusIcon />
                                            </button>
                                        </div>
                                        <button type="button" onClick={() => handleRemoveItem(si.inventoryItemId)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300" aria-label={t('addTreatmentRecord.removeItemAria', {itemName: item.name})}>
                                            <CloseIcon />
                                        </button>
                                    </div>
                                ) : null;
                            })}
                        </div>
                        <label htmlFor="add-inventory-item" className="sr-only">{t('addTreatmentRecord.addItem')}</label>
                        <select
                            id="add-inventory-item"
                            onChange={(e) => handleItemSelect(e.target.value)}
                            value=""
                            className="p-2 border border-slate-300 rounded-lg w-full text-slate-600 focus:ring-primary focus:border-primary"
                        >
                            <option value="">{t('addTreatmentRecord.addItemPlaceholder')}</option>
                            {inventoryItems.filter(i => !formData.selectedInventoryItems.some(si => si.inventoryItemId === i.id))
                                .map(i => (
                                <option key={i.id} value={i.id}>{i.name} ({t('addTreatmentRecord.stock')}: {i.currentStock})</option>
                            ))}
                        </select>
                    </div>


                    <div className="bg-neutral p-4 rounded-lg space-y-2 shadow-inner">
                        <h3 className="text-md font-semibold text-slate-700">{t('addTreatmentRecord.costSummary')}</h3>
                        <p className="text-sm"><strong>{t('addTreatmentRecord.baseTreatmentPrice')}:</strong> {currencyFormatter.format(selectedTreatmentDef?.basePrice || 0)}</p>
                        <p className="text-sm text-blue-700">{t('addTreatmentRecord.doctorShare')}: <strong className="text-base">{currencyFormatter.format(calculateCosts.doctorShare)}</strong></p>
                        <p className="text-sm text-green-700">{t('addTreatmentRecord.clinicShare')}: <strong className="text-base">{currencyFormatter.format(calculateCosts.clinicShare)}</strong></p>
                    </div>

                    <footer className="pt-2 flex justify-end space-x-4 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-dark rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light">{t('addTreatmentRecord.saveRecord')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default AddTreatmentRecordModal;