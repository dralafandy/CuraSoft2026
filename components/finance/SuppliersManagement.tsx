import React, { useState, useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Supplier, SupplierInvoice, SupplierInvoiceStatus } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';
import SupplierStatement from './SupplierStatement';
import LabStatement from './LabStatement';
import { openPrintWindow } from '../../utils/print';

const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const AttachmentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ReceiptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 me-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const PrintIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m0 0v1a2 2 0 002 2h6a2 2 0 002-2v-1M8 12h8m-8 4h.01M5 12h.01M19 12h.01M5 16h.01M19 16h.01" /></svg>);


const AddEditSupplierModal: React.FC<{
    supplier?: Supplier;
    onClose: () => void;
    onSave: (supplier: Omit<Supplier, 'id'> | Supplier) => void;
}> = ({ supplier, onClose, onSave }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState<Omit<Supplier, 'id'> | Supplier>(
        supplier || { name: '', contactPerson: '', phone: '', email: '', type: 'Material Supplier' }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-700">{supplier ? t('suppliers.editSupplier') : t('suppliers.addNewSupplier')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <label htmlFor="supplier-name" className="sr-only">{t('suppliers.supplierName')}</label>
                    <input id="supplier-name" name="name" value={formData.name} onChange={handleChange} placeholder={t('suppliers.supplierName')} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required />
                    
                    <label htmlFor="contact-person" className="sr-only">{t('suppliers.contactPerson')}</label>
                    <input id="contact-person" name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder={t('suppliers.contactPerson')} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" />
                    
                    <label htmlFor="supplier-phone" className="sr-only">{t('suppliers.phone')}</label>
                    <input id="supplier-phone" name="phone" value={formData.phone} onChange={handleChange} placeholder={t('suppliers.phone')} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" />
                    
                    <label htmlFor="supplier-email" className="sr-only">{t('suppliers.email')}</label>
                    <input id="supplier-email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder={t('suppliers.email')} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" />
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-slate-600 mb-1">{t('suppliers.supplierType')}</label>
                        <select id="type" name="type" value={formData.type} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required>
                            <option value="Material Supplier">{t('supplierType.materialSupplier')}</option>
                            <option value="Dental Lab">{t('supplierType.dentalLab')}</option>
                        </select>
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

const AddEditInvoiceModal: React.FC<{
    invoice?: SupplierInvoice;
    supplierId: string;
    clinicData: ClinicData;
    onClose: () => void;
    onSave: (invoice: Omit<SupplierInvoice, 'id'> | SupplierInvoice) => void;
}> = ({ invoice, supplierId, clinicData, onClose, onSave }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState<Omit<SupplierInvoice, 'id'> | SupplierInvoice>(
        invoice || {
            supplierId: supplierId,
            invoiceNumber: '',
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            amount: 0,
            status: SupplierInvoiceStatus.UNPAID,
            items: [{ description: '', amount: 0 }],
            invoiceImageUrl: '',
            payments: [],
        }
    );

    // Get lab cases for the supplier if it's a dental lab
    const supplier = clinicData.suppliers.find(s => s.id === supplierId);
    const labCases = supplier?.type === 'Dental Lab' ? clinicData.labCases.filter(lc => lc.labId === supplierId) : [];

    // Auto-populate invoice data if a lab case is selected
    const selectedLabCase = formData.labCaseId ? labCases.find(lc => lc.id === formData.labCaseId) : null;
    useMemo(() => {
        if (selectedLabCase && !invoice) { // Only auto-populate for new invoices
            setFormData(prev => ({
                ...prev,
                invoiceNumber: `LC-${selectedLabCase.caseType}-${Date.now()}`,
                amount: selectedLabCase.labCost,
                items: [{ description: `Lab case: ${selectedLabCase.caseType}`, amount: selectedLabCase.labCost }],
                dueDate: selectedLabCase.dueDate,
            }));
        }
    }, [selectedLabCase, invoice]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: name === 'amount' ? parseFloat(value) : value });
    };

    const handleItemChange = (index: number, field: string, value: string | number) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: field === 'amount' ? parseFloat(value as string) || 0 : value };
        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: '', amount: 0 }]
        });
    };

    const removeItem = (index: number) => {
        if (formData.items.length > 1) {
            setFormData({
                ...formData,
                items: formData.items.filter((_, i) => i !== index)
            });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, invoiceImageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Calculate total amount from items
        const totalAmount = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
        const invoiceToSave = { ...formData, amount: totalAmount };
        onSave(invoiceToSave);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-700">{invoice ? t('invoices.editInvoice') : t('invoices.addInvoice')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200" aria-label={t('common.closeForm')}><CloseIcon /></button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <input name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} placeholder={t('invoices.invoiceNumber')} className="p-2 border border-slate-300 rounded-lg w-full" />
                    {supplier?.type === 'Dental Lab' && labCases.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-slate-600 block mb-2">حالة المعمل المرتبطة</label>
                            <select
                                name="labCaseId"
                                value={formData.labCaseId || ''}
                                onChange={handleChange}
                                className="p-2 border border-slate-300 rounded-lg w-full"
                            >
                                <option value="">اختر حالة معمل (اختياري)</option>
                                {labCases.map(lc => (
                                    <option key={lc.id} value={lc.id}>
                                        {lc.caseType} - {clinicData.patients.find(p => p.id === lc.patientId)?.name || 'Unknown Patient'} ({lc.status})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-600" htmlFor="invoiceDate">{t('invoices.invoiceDate')}</label>
                            <input id="invoiceDate" name="invoiceDate" type="date" value={formData.invoiceDate} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full" required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-600" htmlFor="dueDate">{t('invoices.dueDate')}</label>
                            <input id="dueDate" name="dueDate" type="date" value={formData.dueDate || ''} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full" />
                        </div>
                    </div>

                    {/* Invoice Items */}
                    <div>
                        <label className="text-sm font-medium text-slate-600 block mb-2">عناصر الفاتورة</label>
                        {formData.items.map((item, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="الوصف"
                                    value={item.description}
                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                    className="flex-1 p-2 border border-slate-300 rounded-lg"
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="المبلغ"
                                    value={item.amount}
                                    onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                                    className="w-24 p-2 border border-slate-300 rounded-lg"
                                />
                                {formData.items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addItem}
                            className="text-sm text-primary hover:text-primary-dark"
                        >
                            + إضافة عنصر
                        </button>
                    </div>

                    {/* Total Amount Display */}
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-slate-600">
                            المبلغ الإجمالي: {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(formData.items.reduce((sum, item) => sum + (item.amount || 0), 0))}
                        </p>
                    </div>

                     <div>
                        <label className="text-sm font-medium text-slate-600 block mb-2">{t('invoices.attachInvoice')}</label>
                        <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                        {formData.invoiceImageUrl && <img src={formData.invoiceImageUrl} alt="Invoice preview" className="mt-2 max-h-32 rounded-lg" />}
                    </div>
                    <footer className="pt-2 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-dark rounded-lg hover:bg-slate-300">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">{t('common.save')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const SupplierDetailsAndInvoicesModal: React.FC<{
    supplier: Supplier;
    onClose: () => void;
    clinicData: ClinicData;
}> = ({ supplier, onClose, clinicData }) => {
    const { t, locale } = useI18n();
    const { supplierInvoices, addSupplierInvoice, updateSupplierInvoice, paySupplierInvoice, expenses } = clinicData;
    const { addNotification } = useNotification();
    const [modalState, setModalState] = useState<{ type: 'add_invoice' | 'edit_invoice' | null; data?: any }>({ type: null });
    
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });

    const relatedInvoices = useMemo(() => {
        return supplierInvoices.filter(inv => inv.supplierId === supplier.id)
            .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
    }, [supplierInvoices, supplier.id]);

    // Get all expenses related to this supplier (both direct expenses and invoice payments)
    const relatedExpenses = useMemo(() => {
        return expenses.filter(exp =>
            exp.supplierId === supplier.id ||
            relatedInvoices.some(inv => inv.payments.some(p => p.expenseId === exp.id))
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, supplier.id, relatedInvoices]);

    const financialSummary = useMemo(() => {
        console.log('Debug: Supplier ID:', supplier.id);
        console.log('Debug: Related Invoices:', relatedInvoices);
        console.log('Debug: Related Expenses:', relatedExpenses);

        const totalBilled = relatedInvoices.reduce((sum, inv) => {
            console.log('Debug: Invoice amount:', inv.amount, 'for invoice:', inv.id);
            return sum + inv.amount;
        }, 0);

        const totalPaid = relatedExpenses.reduce((sum, exp) => {
            console.log('Debug: Expense amount:', exp.amount, 'for expense:', exp.id);
            return sum + exp.amount;
        }, 0);

        const outstandingBalance = totalBilled - totalPaid;

        console.log('Debug: Financial Summary - Total Billed:', totalBilled, 'Total Paid:', totalPaid, 'Outstanding:', outstandingBalance);

        return { totalBilled, totalPaid, outstandingBalance };
    }, [relatedInvoices, relatedExpenses]);

    const handleSaveInvoice = (invoice: Omit<SupplierInvoice, 'id'> | SupplierInvoice) => {
        if ('id' in invoice && invoice.id) {
            updateSupplierInvoice(invoice as SupplierInvoice);
            addNotification(t('notifications.invoiceUpdated'), NotificationType.SUCCESS);
        } else {
            addSupplierInvoice(invoice as Omit<SupplierInvoice, 'id'>);
            addNotification(t('notifications.invoiceAdded'), NotificationType.SUCCESS);
        }
        setModalState({ type: null });
    };

    const handlePayRemaining = (invoice: SupplierInvoice) => {
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
        const balance = invoice.amount - totalPaid;
        if (balance > 0 && window.confirm(t('invoices.confirmPayRemaining', { amount: currencyFormatter.format(balance) }))) {
            paySupplierInvoice(invoice);
            addNotification(t('notifications.paymentRecorded'), NotificationType.SUCCESS);
        }
    };

    const handlePrintFinancialStatement = () => {
        openPrintWindow(t('supplierStatement.financialTitle'), <SupplierStatement supplier={supplier} clinicData={clinicData} />);
    };
    
    const handlePrintCaseStatement = () => {
        openPrintWindow(t('supplierStatement.caseTitle'), <LabStatement supplier={supplier} clinicData={clinicData} />);
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-700">{supplier.name}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrintFinancialStatement} className="flex items-center px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300">
                           <PrintIcon /> {t('supplierStatement.financialTitle')}
                        </button>
                        {supplier.type === 'Dental Lab' && (
                             <button onClick={handlePrintCaseStatement} className="flex items-center px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300">
                               <PrintIcon /> {t('supplierStatement.caseTitle')}
                            </button>
                        )}
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200" aria-label={t('common.closeForm')}><CloseIcon /></button>
                    </div>
                </header>
                <main className="p-6 overflow-y-auto space-y-6 bg-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Supplier Info */}
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                              <h3 className="font-semibold text-slate-600 mb-2">معلومات الاتصال</h3>
                             <p><strong>الشخص المسؤول:</strong> {supplier.contactPerson || '-'}</p>
                             <p><strong>الهاتف:</strong> {supplier.phone || '-'}</p>
                             <p><strong>البريد الإلكتروني:</strong> {supplier.email || '-'}</p>
                         </div>
                        {/* Financial Summary */}
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="font-semibold text-slate-600 mb-2">الملخص المالي</h3>
                            <p><strong>إجمالي الفواتير:</strong> {currencyFormatter.format(financialSummary.totalBilled)}</p>
                            <p><strong>إجمالي المدفوع:</strong> {currencyFormatter.format(financialSummary.totalPaid)}</p>
                            <p className="font-bold"><strong>الرصيد المستحق:</strong> {currencyFormatter.format(financialSummary.outstandingBalance)}</p>
                        </div>
                    </div>

                    {/* Invoices Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                              <h3 className="text-lg font-bold text-slate-700">الفواتير</h3>
                              <button onClick={() => setModalState({ type: 'add_invoice'})} className="flex items-center bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary-dark text-sm"><AddIcon /> إضافة فاتورة</button>
                         </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                            {relatedInvoices.length > 0 ? relatedInvoices.map(inv => {
                                const totalPaid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
                                const balance = inv.amount - totalPaid;

                                return (
                                <div key={inv.id} className="border p-3 rounded-lg">
                                    <div className="flex flex-wrap justify-between items-start gap-2">
                                        <div>
                                            <p className="font-bold text-slate-800">{t('invoices.invoice')} #{inv.invoiceNumber || inv.id.slice(-6)}</p>
                                            <p className="text-sm text-slate-600">{t('invoices.date')}: {dateFormatter.format(new Date(inv.invoiceDate))}</p>
                                            {inv.dueDate && <p className="text-xs text-slate-500">{t('invoices.due')}: {dateFormatter.format(new Date(inv.dueDate))}</p>}
                                        </div>
                                        <div className="text-end">
                                            <p className="text-lg font-bold">{currencyFormatter.format(inv.amount)}</p>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${balance <= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {balance <= 0 ? t('invoices.paid') : `${t('invoices.remaining')}: ${currencyFormatter.format(balance)}`}
                                            </span>
                                        </div>
                                    </div>
                                    {inv.items && inv.items.length > 0 && (
                                        <div className="mt-2 pt-2 border-t text-xs text-slate-600 space-y-1">
                                            <p className="font-semibold text-xs text-slate-500">تفاصيل الفاتورة:</p>
                                            {inv.items.map((item, index) => (
                                                <div key={index} className="flex items-center justify-between ps-2">
                                                    <span>{item.description || 'عنصر غير محدد'}</span>
                                                    <span>{currencyFormatter.format(item.amount || 0)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {inv.payments.length > 0 && (
                                        <div className="mt-2 pt-2 border-t text-xs text-slate-600 space-y-1">
                                            <p className="font-semibold text-xs text-slate-500">المدفوعات:</p>
                                            {inv.payments.map(p => {
                                                const expense = expenses.find(e => e.id === p.expenseId);
                                                return (
                                                    <div key={p.expenseId} className="flex items-center justify-between ps-2">
                                                        <span><ReceiptIcon />{dateFormatter.format(new Date(p.date))} - {expense?.description || 'دفعة'}</span>
                                                        <span>{currencyFormatter.format(p.amount)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-3">
                                        {inv.invoiceImageUrl && <a href={inv.invoiceImageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline"><AttachmentIcon/>{t('invoices.viewAttachment')}</a>}
                                        {balance > 0 && <button onClick={() => handlePayRemaining(inv)} className="flex items-center gap-1 text-sm bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200"><CheckCircleIcon />{t('invoices.payRemaining')}</button>}
                                        <button onClick={() => setModalState({ type: 'edit_invoice', data: inv })} className="flex items-center gap-1 text-sm bg-slate-100 text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-200"><EditIcon />{t('common.edit')}</button>
                                    </div>
                                </div>
                            )}) : <p className="text-slate-500 text-center py-4">لا توجد فواتير لهذا المورد.</p>}
                         </div>
                     </div>

                     {/* All Expenses Section */}
                     <div>
                         <h3 className="text-lg font-bold text-slate-700 mb-2">جميع المصروفات والمدفوعات</h3>
                         <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                             {relatedExpenses.length > 0 ? relatedExpenses.map(exp => {
                                 const isInvoicePayment = relatedInvoices.some(inv =>
                                     inv.payments.some(p => p.expenseId === exp.id)
                                 );
                                 const relatedInvoice = relatedInvoices.find(inv =>
                                     inv.payments.some(p => p.expenseId === exp.id)
                                 );

                                 return (
                                     <div key={exp.id} className="border p-3 rounded-lg">
                                         <div className="flex flex-wrap justify-between items-start gap-2">
                                             <div>
                                                 <p className="font-bold text-slate-800">
                                                     {isInvoicePayment ? `دفعة للفاتورة ${relatedInvoice?.invoiceNumber || relatedInvoice?.id.slice(-6)}` : exp.description}
                                                 </p>
                                                 <p className="text-sm text-slate-600">التاريخ: {dateFormatter.format(new Date(exp.date))}</p>
                                                 <p className="text-xs text-slate-500">الفئة: {exp.category === 'SUPPLIES' ? 'مستلزمات' : exp.category === 'RENT' ? 'إيجار' : exp.category === 'SALARIES' ? 'رواتب' : exp.category === 'UTILITIES' ? 'مرافق' : exp.category === 'MARKETING' ? 'تسويق' : exp.category === 'LAB_FEES' ? 'رسوم معمل' : 'أخرى'}</p>
                                             </div>
                                             <div className="text-end">
                                                 <p className="text-lg font-bold text-red-600">-{currencyFormatter.format(exp.amount)}</p>
                                                 {isInvoicePayment && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">دفعة فاتورة</span>}
                                             </div>
                                         </div>
                                     </div>
                                 );
                             }) : <p className="text-slate-500 text-center py-4">لا توجد مصروفات لهذا المورد.</p>}
                         </div>
                     </div>
                </main>
            </div>
            { (modalState.type === 'add_invoice' || modalState.type === 'edit_invoice') && (
                <AddEditInvoiceModal
                    supplierId={supplier.id}
                    invoice={modalState.data}
                    clinicData={clinicData}
                    onClose={() => setModalState({ type: null })}
                    onSave={handleSaveInvoice}
                />
            )}
        </div>
    );
};


export const SuppliersManagement: React.FC<{ clinicData: ClinicData }> = ({ clinicData }) => {
    const { suppliers, addSupplier, updateSupplier, deleteSupplier } = clinicData;
    const { t } = useI18n();
    const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
    const [viewingSupplier, setViewingSupplier] = useState<Supplier | undefined>(undefined);

    const handleSaveSupplier = (supplier: Omit<Supplier, 'id'> | Supplier) => {
        if ('id' in supplier && supplier.id) {
            updateSupplier(supplier as Supplier);
        } else {
            addSupplier(supplier as Omit<Supplier, 'id'>);
        }
        setEditingSupplier(undefined);
    };

    const handleDeleteSupplier = (supplier: Supplier) => {
        if (window.confirm(t('suppliers.confirmDelete', { name: supplier.name }))) {
            deleteSupplier(supplier.id);
        }
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-700">{t('suppliers.suppliersList')}</h3>
                    <button
                        onClick={() => setIsAddSupplierModalOpen(true)}
                        className="bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary-dark flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
                    >
                        <AddIcon /> {t('suppliers.addSupplier')}
                    </button>
                </div>
                <div className="bg-neutral p-4 rounded-lg shadow-inner">
                    {suppliers.length === 0 ? (
                        <p className="text-center text-slate-500 py-4">{t('suppliers.noSuppliersAdded')}</p>
                    ) : (
                        <ul className="space-y-2">
                            {suppliers.map(s => {
                                // Calculate outstanding balance for this supplier
                                const supplierInvoices = clinicData.supplierInvoices.filter(inv => inv.supplierId === s.id);
                                const totalBilled = supplierInvoices.reduce((sum, inv) => sum + inv.amount, 0);
                                const totalPaid = clinicData.expenses
                                    .filter(exp => exp.supplierId === s.id ||
                                        supplierInvoices.some(inv => inv.payments.some(p => p.expenseId === exp.id)))
                                    .reduce((sum, exp) => sum + exp.amount, 0);
                                const outstandingBalance = totalBilled - totalPaid;

                                return (
                                    <li key={s.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-3 rounded-md shadow-sm gap-2">
                                        <div>
                                            <p className="font-bold text-slate-800">{s.name}</p>
                                            <p className="text-sm text-slate-600">{s.contactPerson} - {s.phone}</p>
                                            <p className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">{s.type === 'Material Supplier' ? t('supplierType.materialSupplier') : t('supplierType.dentalLab')}</p>
                                            {outstandingBalance > 0 && (
                                                <p className="text-xs font-semibold text-orange-600 mt-1">
                                                    رصيد مستحق: {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(outstandingBalance)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                              <button
                                                 onClick={() => setViewingSupplier(s)}
                                                 className="text-secondary hover:text-green-700 font-semibold px-3 py-1 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
                                             >
                                                 {t('suppliers.viewDetails')}
                                             </button>
                                             <button
                                                 onClick={() => { setEditingSupplier(s); setIsAddSupplierModalOpen(true); }}
                                                 className="text-primary hover:text-primary-dark p-2 rounded-lg hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary-light"
                                                 aria-label={t('suppliers.editSupplierAriaLabel', {name: s.name})}
                                             >
                                                 <EditIcon />
                                             </button>
                                             <button
                                                 onClick={() => handleDeleteSupplier(s)}
                                                 className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
                                                 aria-label={t('suppliers.deleteSupplierAriaLabel', {name: s.name})}
                                             >
                                                 <DeleteIcon />
                                             </button>
                                         </div>
                                     </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {isAddSupplierModalOpen && (
                <AddEditSupplierModal
                    supplier={editingSupplier}
                    onClose={() => { setIsAddSupplierModalOpen(false); setEditingSupplier(undefined); }}
                    onSave={handleSaveSupplier}
                />
            )}

            {viewingSupplier && (
                <SupplierDetailsAndInvoicesModal
                    supplier={viewingSupplier}
                    onClose={() => setViewingSupplier(undefined)}
                    clinicData={clinicData}
                />
            )}
        </div>
    );
};
