import React, { useState, useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Expense, ExpenseCategory, Supplier, SupplierInvoice, SupplierInvoiceStatus } from '../../types';
import { useI18n } from '../../hooks/useI18n';

const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

const AddEditExpenseModal: React.FC<{
    expense?: Expense;
    onClose: () => void;
    onSave: (expense: Omit<Expense, 'id'> | Expense) => void;
    clinicData: ClinicData;
}> = ({ expense, onClose, onSave, clinicData }) => {
    const { suppliers, supplierInvoices } = clinicData;
    const { t, locale } = useI18n();
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    const [formData, setFormData] = useState<Omit<Expense, 'id'> | Expense>(
        expense || { date: new Date().toISOString().split('T')[0], description: '', amount: 0, category: ExpenseCategory.MISC, supplierId: undefined, supplierInvoiceId: undefined }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'amount') {
            const parsedValue = parseFloat(value);
            setFormData({ ...formData, [name]: isNaN(parsedValue) ? 0 : parsedValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validate amount
        if (formData.amount <= 0) {
            alert('Amount must be greater than 0');
            return;
        }
        const expenseToSave = { ...formData };
        if (expenseToSave.supplierId === '') {
            delete expenseToSave.supplierId;
        }
        if (expenseToSave.supplierInvoiceId === '') {
            delete expenseToSave.supplierInvoiceId;
        }
        onSave(expenseToSave);
        onClose();
    };

    const unpaidInvoicesForSupplier = useMemo(() => {
        if (!formData.supplierId) return [];
        return supplierInvoices.filter(inv => 
            inv.supplierId === formData.supplierId && inv.status === SupplierInvoiceStatus.UNPAID
        );
    }, [formData.supplierId, supplierInvoices]);

    const getInvoiceBalance = (invoice: SupplierInvoice) => {
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
        return invoice.amount - totalPaid;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-700">{expense ? t('expenses.editExpense') : t('expenses.addNewExpense')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label htmlFor="expense-date" className="block text-sm font-medium text-slate-600 mb-1">{t('expenses.date')}</label>
                        <input id="expense-date" name="date" type="date" value={formData.date} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required />
                    </div>
                    <div>
                        <label htmlFor="expense-description" className="block text-sm font-medium text-slate-600 mb-1">{t('expenses.description')}</label>
                        <textarea id="expense-description" name="description" value={formData.description} onChange={handleChange} placeholder={t('expenses.descriptionPlaceholder')} className="p-2 border border-slate-300 rounded-lg w-full h-20 focus:ring-primary focus:border-primary" required />
                    </div>
                    <div>
                        <label htmlFor="expense-amount" className="block text-sm font-medium text-slate-600 mb-1">{t('expenses.amount')}</label>
                        <input id="expense-amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required />
                    </div>
                    <div>
                        <label htmlFor="expense-category" className="block text-sm font-medium text-slate-600 mb-1">{t('expenses.category')}</label>
                        <select id="expense-category" name="category" value={formData.category} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required>
                            {Object.values(ExpenseCategory).map(cat => <option key={cat} value={cat}>{t(`expenseCategory.${cat}`)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="expense-supplier" className="block text-sm font-medium text-slate-600 mb-1">{t('expenses.selectSupplier')}</label>
                        <select id="expense-supplier" name="supplierId" value={formData.supplierId || ''} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary">
                            <option value="">{t('expenses.noSupplier')}</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    {formData.supplierId && unpaidInvoicesForSupplier.length > 0 && (
                        <div>
                            <label htmlFor="expense-invoice" className="block text-sm font-medium text-slate-600 mb-1">{t('expenses.applyToInvoice')}</label>
                            <select id="expense-invoice" name="supplierInvoiceId" value={formData.supplierInvoiceId || ''} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary">
                                <option value="">{t('expenses.paymentOnAccount')}</option>
                                {unpaidInvoicesForSupplier.map(inv => (
                                    <option key={inv.id} value={inv.id}>
                                        {t('invoices.invoice')} #{inv.invoiceNumber || inv.id.slice(-4)} - {t('invoices.remaining')}: {currencyFormatter.format(getInvoiceBalance(inv))}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <footer className="pt-2 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-dark rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light">{t('common.save')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const ExpensesManagement: React.FC<{ clinicData: ClinicData }> = ({ clinicData }) => {
    const { expenses, addExpense, updateExpense, deleteExpense, suppliers, supplierInvoices } = clinicData;
    const { t, locale } = useI18n();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);

    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });

    const handleSaveExpense = (expense: Omit<Expense, 'id'> | Expense) => {
        if ('id' in expense && expense.id) {
            updateExpense(expense as Expense);
        } else {
            addExpense(expense as Omit<Expense, 'id'>);
        }
        setEditingExpense(undefined);
    };

    const handleDeleteExpense = (expense: Expense) => {
        if (window.confirm(t('expenses.confirmDelete', { description: expense.description }))) {
            deleteExpense(expense.id);
        }
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-700">{t('expenses.clinicExpenses')}</h3>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary-dark flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
                >
                    <AddIcon /> {t('expenses.addExpense')}
                </button>
            </div>
            <div className="bg-neutral p-4 rounded-lg shadow-inner">
                {expenses.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">{t('expenses.noExpensesRecorded')}</p>
                ) : (
                    <ul className="space-y-2">
                        {expenses.map(e => {
                            const supplier = e.supplierId ? suppliers.find(s => s.id === e.supplierId) : null;
                            const invoice = e.supplierInvoiceId ? supplierInvoices.find(i => i.id === e.supplierInvoiceId) : null;
                            return (
                                <li key={e.id} className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                                    <div>
                                        <p className="font-bold text-slate-800">{e.description}</p>
                                        <p className="text-sm text-slate-600">
                                            {t(`expenseCategory.${e.category}`)} - {dateFormatter.format(new Date(e.date))}
                                            {supplier && (
                                                <span className="ms-2 ps-2 border-s border-slate-300">{t('expenses.supplier')}: {supplier.name}
                                                 {invoice && ` (#${invoice.invoiceNumber || invoice.id.slice(-4)})`}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-700">{currencyFormatter.format(e.amount)}</span>
                                        <button
                                            onClick={() => { setEditingExpense(e); setIsAddModalOpen(true); }}
                                            className="text-primary hover:text-primary-dark text-sm p-2 rounded-lg hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary-light"
                                            aria-label={t('expenses.editExpenseAriaLabel', {description: e.description})}
                                        >
                                            <EditIcon />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteExpense(e)}
                                            className="text-red-600 hover:text-red-800 text-sm p-2 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
                                            aria-label={t('expenses.deleteExpenseAriaLabel', {description: e.description})}
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

            {isAddModalOpen && (
                <AddEditExpenseModal
                    expense={editingExpense}
                    onClose={() => { setIsAddModalOpen(false); setEditingExpense(undefined); }}
                    onSave={handleSaveExpense}
                    clinicData={clinicData}
                />
            )}
        </div>
    );
};

export default ExpensesManagement;