import React, { useState, useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { InventoryItem, NotificationType, Supplier } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';

const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

const AddEditInventoryItemModal: React.FC<{
    item?: InventoryItem;
    onClose: () => void;
    onSave: (item: Omit<InventoryItem, 'id'> | InventoryItem) => void;
    suppliers: Supplier[];
}> = ({ item, onClose, onSave, suppliers }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState<Omit<InventoryItem, 'id'> | InventoryItem>(
        item || { name: '', description: '', supplierId: '', currentStock: 0, unitCost: 0, minStockLevel: 5 }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'currentStock' || name === 'unitCost' || name === 'minStockLevel') {
            const parsedValue = parseFloat(value);
            setFormData({ ...formData, [name]: isNaN(parsedValue) ? 0 : parsedValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validate required fields
        if (!formData.name || !formData.supplierId) {
            alert('Name and supplier are required');
            return;
        }
        // Validate numeric fields
        if (formData.currentStock < 0 || formData.unitCost < 0 || formData.minStockLevel < 0) {
            alert('Stock levels and costs cannot be negative');
            return;
        }
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-700">{item ? t('inventory.editItem') : t('inventory.addNewItem')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <label htmlFor="item-name" className="sr-only">{t('inventory.itemName')}</label>
                    <input id="item-name" name="name" value={formData.name} onChange={handleChange} placeholder={t('inventory.itemName')} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required />
                    
                    <label htmlFor="item-description" className="sr-only">{t('inventory.description')}</label>
                    <textarea id="item-description" name="description" value={formData.description} onChange={handleChange} placeholder={t('inventory.descriptionPlaceholder')} className="p-2 border border-slate-300 rounded-lg w-full h-20 focus:ring-primary focus:border-primary" />
                    
                    <div>
                        <label htmlFor="item-supplier" className="block text-sm font-medium text-slate-600 mb-1">{t('inventory.supplier')}</label>
                        <select id="item-supplier" name="supplierId" value={formData.supplierId} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required>
                            <option value="">{t('inventory.selectSupplier')}</option>
                            {suppliers.filter(s => s.type === 'Material Supplier').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="currentStock" className="block text-sm font-medium text-slate-600 mb-1">{t('inventory.currentStock')}</label>
                            <input id="currentStock" name="currentStock" type="number" value={formData.currentStock} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required />
                        </div>
                        <div>
                            <label htmlFor="unitCost" className="block text-sm font-medium text-slate-600 mb-1">{t('inventory.unitCost')}</label>
                            <input id="unitCost" name="unitCost" type="number" step="0.01" value={formData.unitCost} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="minStockLevel" className="block text-sm font-medium text-slate-600 mb-1">{t('inventory.minStockLevel')}</label>
                        <input id="minStockLevel" name="minStockLevel" type="number" value={formData.minStockLevel} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required />
                    </div>
                    <div>
                        <label htmlFor="expiryDate" className="block text-sm font-medium text-slate-600 mb-1">{t('inventory.expiryDate')}</label>
                        <input id="expiryDate" name="expiryDate" type="date" value={formData.expiryDate || ''} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" />
                    </div>

                    <footer className="pt-2 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-dark rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light">{t('common.save')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const InventoryManagement: React.FC<{ clinicData: ClinicData }> = ({ clinicData }) => {
    const { inventoryItems, addInventoryItem, updateInventoryItem, suppliers } = clinicData;
    const { t, locale } = useI18n();
    const { addNotification } = useNotification();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined);

    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });

    const handleSaveItem = (item: Omit<InventoryItem, 'id'> | InventoryItem) => {
        if ('id' in item && item.id) {
            updateInventoryItem(item as InventoryItem);
            addNotification(t('notifications.inventoryItemUpdated'), NotificationType.SUCCESS);
        } else {
            addInventoryItem(item as Omit<InventoryItem, 'id'>);
            addNotification(t('notifications.inventoryItemAdded'), NotificationType.SUCCESS);
        }
        setEditingItem(undefined);
        setIsAddModalOpen(false);
    };

    const getStatus = (item: InventoryItem) => {
        if (item.currentStock <= 0) return { label: t('inventoryStatus.outOfStock'), class: 'bg-red-100 text-red-700' };
        if (item.currentStock <= item.minStockLevel) return { label: t('inventoryStatus.lowStock'), class: 'bg-amber-100 text-amber-700' };
        if (item.expiryDate) {
            const expiry = new Date(item.expiryDate);
            const now = new Date();
            const threeMonths = 3 * 30 * 24 * 60 * 60 * 1000; // rough 3 months in ms
            if (expiry.getTime() < now.getTime()) return { label: t('inventoryStatus.expired'), class: 'bg-red-100 text-red-700' };
            if (expiry.getTime() - now.getTime() < threeMonths) return { label: t('inventoryStatus.expiresSoon'), class: 'bg-orange-100 text-orange-700' };
        }
        return { label: t('inventoryStatus.ok'), class: 'bg-green-100 text-green-700' };
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-700">{t('inventory.inventoryItems')}</h3>
                <button
                    onClick={() => { setEditingItem(undefined); setIsAddModalOpen(true); }}
                    className="bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary-dark flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
                >
                    <AddIcon /> {t('inventory.addItem')}
                </button>
            </div>
            <div className="bg-neutral p-4 rounded-lg shadow-inner">
                {inventoryItems.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">{t('inventory.noItemsAdded')}</p>
                ) : (
                    <ul className="space-y-3">
                        {inventoryItems.map(item => {
                            const supplier = suppliers.find(s => s.id === item.supplierId);
                            const status = getStatus(item);
                            return (
                                <li key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-3 rounded-md shadow-sm gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800">{item.name}</p>
                                        <p className="text-sm text-slate-600 truncate">{item.description || t('common.na')}</p>
                                        <p className="text-xs text-slate-500">
                                            {t('inventory.supplier')}: {supplier?.name || t('inventory.supplierNotAvailable')} | {t('inventory.currentStock')}: {item.currentStock || 0}
                                        </p>
                                        {item.expiryDate && (
                                            <p className="text-xs text-slate-500">
                                                {t('inventory.expiryDate')}: {dateFormatter.format(new Date(item.expiryDate))}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end sm:items-center gap-2 flex-shrink-0">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.class}`}>{status.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-700">{!isNaN(item.unitCost) && item.unitCost > 0 ? currencyFormatter.format(item.unitCost) : currencyFormatter.format(0)}</span>
                                            <button
                                                onClick={() => { setEditingItem(item); setIsAddModalOpen(true); }}
                                                className="text-primary hover:text-primary-dark p-2 rounded-lg hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary-light"
                                                aria-label={t('inventory.editItemAriaLabel', {name: item.name})}
                                            >
                                                <EditIcon />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {isAddModalOpen && (
                <AddEditInventoryItemModal
                    item={editingItem}
                    onClose={() => { setIsAddModalOpen(false); setEditingItem(undefined); }}
                    onSave={handleSaveItem}
                    suppliers={suppliers}
                />
            )}
        </div>
    );
};

export default InventoryManagement;