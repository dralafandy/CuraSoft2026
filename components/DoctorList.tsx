import React, { useState, useMemo, useCallback } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { Dentist, Appointment, TreatmentRecord, DoctorDetailTab, DoctorPayment, NotificationType } from '../types';
import { useI18n } from '../hooks/useI18n';
import { useNotification } from '../contexts/NotificationContext';
import AddDoctorPaymentModal from './finance/AddDoctorPaymentModal';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const AddUserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const DollarSignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v22m5-18H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;

const availableColors = [
    'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
    'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-purple-500',
];

const DoctorDetailsModal: React.FC<{
    doctor: Dentist;
    onClose: () => void;
    onUpdate: (doctor: Dentist) => void;
    clinicData: ClinicData;
}> = ({ doctor, onClose, onUpdate, clinicData }) => {
    const { t, locale } = useI18n();
    const { addNotification } = useNotification();
    const { appointments, patients, treatmentRecords, treatmentDefinitions, doctorPayments } = clinicData;
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(doctor);
    const [activeTab, setActiveTab] = useState<DoctorDetailTab>('details');
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);

    const doctorAppointments = useMemo(() => {
        return appointments
            .filter(a => a.dentistId === doctor.id)
            .sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
    }, [appointments, doctor.id]);

    const doctorTreatmentRecords = useMemo(() => {
        return treatmentRecords
            .filter(tr => tr.dentistId === doctor.id)
            .sort((a,b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime());
    }, [treatmentRecords, doctor.id]);

    const doctorPaymentsList = useMemo(() => (doctorPayments || []).filter(p => p.dentistId === doctor.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [doctorPayments, doctor.id]);

    const financialSummary = useMemo(() => {
        const totalRevenue = doctorTreatmentRecords.reduce((sum, tr) => {
            const treatmentDef = treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
            return sum + (treatmentDef ? treatmentDef.basePrice : 0);
        }, 0);
        const totalEarnings = doctorTreatmentRecords.reduce((sum, tr) => sum + tr.doctorShare, 0);
        const totalPaymentsReceived = doctorPaymentsList.reduce((sum, p) => sum + p.amount, 0);
        const netBalance = totalEarnings - totalPaymentsReceived;
        return { totalRevenue, totalEarnings, totalPaymentsReceived, netBalance };
    }, [doctorTreatmentRecords, doctorPaymentsList, treatmentDefinitions]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleColorChange = (color: string) => {
        setFormData(prev => ({ ...prev, color }));
    }

    const handleSave = () => {
        onUpdate(formData);
        setIsEditing(false);
    };

    const handleAddPayment = useCallback((payment: Omit<DoctorPayment, 'id'>) => {
        clinicData.addDoctorPayment(payment);
        setIsAddPaymentModalOpen(false);
        addNotification(t('notifications.paymentAdded'), NotificationType.SUCCESS);
    }, [clinicData, addNotification, t]);

    const dateTimeFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-700">{doctor.name}</h2>
                     <div className="flex items-center gap-2">
                        {!isEditing && (
                             <button onClick={() => setIsEditing(true)} className="flex items-center px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300">
                                <EditIcon /> {t('common.edit')}
                            </button>
                        )}
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('doctorDetails.closeAriaLabel')}>
                            <CloseIcon />
                        </button>
                    </div>
                </header>
                <nav className="border-b border-slate-200 bg-slate-50 flex-shrink-0">
                    <ul className="-mb-px flex space-x-4 rtl:space-x-reverse overflow-x-auto text-sm font-medium text-center text-slate-500">
                        {[
                            { key: 'details', label: 'doctorDetails.tabDetails' },
                            { key: 'treatments', label: 'doctorDetails.tabTreatments' },
                            { key: 'financials', label: 'doctorDetails.tabFinancials' }
                        ].map(({ key, label }) => (
                            <li key={key}>
                                <button
                                    onClick={() => setActiveTab(key as DoctorDetailTab)}
                                    className={`inline-block p-4 border-b-2 ${activeTab === key ? 'border-primary text-primary' : 'border-transparent hover:text-slate-700 hover:border-slate-300'}`}
                                >
                                    {t(label)}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <main className="p-6 overflow-y-auto flex-1 bg-neutral">
                    {activeTab === 'details' && (
                        <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <label htmlFor="edit-doctor-name" className="sr-only">{t('doctorDetails.fullName')}</label>
                                    <input id="edit-doctor-name" name="name" value={formData.name} onChange={handleChange} placeholder={t('doctorDetails.fullName')} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" />

                                    <label htmlFor="edit-doctor-specialty" className="sr-only">{t('doctorDetails.specialty')}</label>
                                    <input id="edit-doctor-specialty" name="specialty" value={formData.specialty} onChange={handleChange} placeholder={t('doctorDetails.specialty')} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-2">{t('doctorDetails.colorTag')}</label>
                                        <div className="flex flex-wrap gap-2">
                                        {availableColors.map(color => (
                                            <button
                                                type="button"
                                                key={color}
                                                onClick={() => handleColorChange(color)}
                                                className={`w-8 h-8 rounded-full ${color} ${formData.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light`}
                                                aria-label={t('doctorDetails.selectColorAriaLabel', {color: color.replace('bg-','')})}
                                            ></button>
                                        ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        <strong className="text-slate-500 block">{t('doctorDetails.specialty')}:</strong> {doctor.specialty}
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-slate-600 mb-2">{t('doctorDetails.appointmentSchedule')}</h3>
                                        <div className="bg-neutral p-4 rounded-lg text-sm text-slate-600 max-h-48 overflow-y-auto shadow-inner">
                                            {doctorAppointments.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {doctorAppointments.map(apt => {
                                                        const patient = patients.find(p => p.id === apt.patientId);
                                                        return (
                                                            <li key={apt.id} className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm">
                                                                <span>{dateTimeFormatter.format(apt.startTime)}: {patient?.name} ({apt.reason})</span>
                                                                <span className="text-xs p-1 bg-slate-200 rounded">{t(`appointmentStatus.${apt.status}`)}</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            ) : <p>{t('doctorDetails.noAppointmentsFound')}</p>}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'treatments' && (
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="text-lg font-bold text-slate-700 mb-4">{t('doctorDetails.treatmentsPerformed')}</h3>
                            <div className="bg-neutral p-4 rounded-lg text-sm text-slate-600 max-h-96 overflow-y-auto shadow-inner">
                                {doctorTreatmentRecords.length > 0 ? (
                                    <ul className="space-y-2">
                                        {doctorTreatmentRecords.map(tr => {
                                            const patient = patients.find(p => p.id === tr.patientId);
                                            const treatment = treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
                                            return (
                                                <li key={tr.id} className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm">
                                                    <span>{dateFormatter.format(new Date(tr.treatmentDate))}: {treatment?.name} ({patient?.name})</span>
                                                    <span className="font-semibold">{currencyFormatter.format(tr.doctorShare)}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : <p>{t('doctorDetails.noTreatmentsFound')}</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'financials' && (
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="text-lg font-bold text-slate-700 mb-4">{t('doctorDetails.financialSummary')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="bg-neutral-light p-3 rounded-lg text-center">
                                    <p className="text-sm text-slate-600">{t('doctorDetails.totalEarnings')}</p>
                                    <p className="text-xl font-bold text-slate-800">{currencyFormatter.format(financialSummary.totalEarnings)}</p>
                                </div>
                                <div className="bg-neutral-light p-3 rounded-lg text-center">
                                    <p className="text-sm text-slate-600">{t('doctorDetails.totalPaymentsReceived')}</p>
                                    <p className="text-xl font-bold text-slate-800">{currencyFormatter.format(financialSummary.totalPaymentsReceived)}</p>
                                </div>
                                <div className={`col-span-1 sm:col-span-2 p-3 rounded-lg text-center ${financialSummary.netBalance >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    <p className="text-sm font-semibold">{t('doctorDetails.netBalance')}</p>
                                    <p className="text-xl font-bold">{currencyFormatter.format(financialSummary.netBalance)}</p>
                                    <p className="text-xs mt-1">
                                        {financialSummary.netBalance >= 0 ? t('financials.amountDue') : t('financials.overpaid')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-start gap-3 mb-6 flex-wrap">
                            </div>

                            <h3 className="text-lg font-bold text-slate-700 mb-4">{t('doctorDetails.transactions')}</h3>
                            <div className="bg-neutral p-4 rounded-lg shadow-inner max-h-96 overflow-y-auto">
                                {doctorPaymentsList.length === 0 && doctorTreatmentRecords.length === 0 ? (
                                    <p className="text-center text-slate-500 py-4">{t('doctorDetails.noTransactions')}</p>
                                ) : (
                                    <div className="space-y-2">
                                        {/* Display payments first */}
                                        {doctorPaymentsList.map(payment => (
                                            <div key={payment.id} className="bg-white p-3 rounded-md shadow-sm flex justify-between items-center border-l-4 border-green-500">
                                                <div>
                                                    <p className="font-bold text-slate-800">{t('doctorDetails.payments')}</p>
                                                    <p className="text-sm text-slate-600">
                                                        {dateFormatter.format(new Date(payment.date))}
                                                        {payment.notes && <span className="ms-2 ps-2 border-s border-slate-300">{payment.notes}</span>}
                                                    </p>
                                                </div>
                                                <span className="font-bold text-green-700">{currencyFormatter.format(payment.amount)}</span>
                                            </div>
                                        ))}

                                        {/* Then display earnings (treatment records) */}
                                        {doctorTreatmentRecords.map(record => {
                                            const patient = patients.find(p => p.id === record.patientId);
                                            const treatment = treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);
                                            return (
                                                <div key={record.id} className="bg-white p-3 rounded-md shadow-sm flex justify-between items-center border-l-4 border-blue-500">
                                                    <div>
                                                        <p className="font-bold text-slate-800">{t('doctorDetails.earnings')} - {treatment?.name} ({patient?.name})</p>
                                                        <p className="text-sm text-slate-600">
                                                            {dateFormatter.format(new Date(record.treatmentDate))}
                                                            {record.notes && <span className="ms-2 ps-2 border-s border-slate-300">{record.notes.slice(0, 50)}...</span>}
                                                        </p>
                                                    </div>
                                                    <span className="font-bold text-blue-700">{currencyFormatter.format(record.doctorShare)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
                 {isEditing && (
                    <footer className="p-4 border-t flex justify-end space-x-4 bg-slate-50 rounded-b-xl">
                        <button type="button" onClick={() => { setIsEditing(false); setFormData(doctor); }} className="px-4 py-2 bg-neutral-dark rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300">{t('common.cancel')}</button>
                        <button type="button" onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light">{t('common.saveChanges')}</button>
                    </footer>
                )}

                {isAddPaymentModalOpen && (
                    <AddDoctorPaymentModal
                        dentistId={doctor.id}
                        onClose={() => setIsAddPaymentModalOpen(false)}
                        onAdd={handleAddPayment}
                        doctorPayments={clinicData.doctorPayments}
                    />
                )}
            </div>
        </div>
    );
};

const AddDoctorModal: React.FC<{
    onClose: () => void;
    onAdd: (doctor: Omit<Dentist, 'id'>) => void;
}> = ({ onClose, onAdd }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState({
        name: '',
        specialty: '',
        color: availableColors[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleColorChange = (color: string) => {
        setFormData(prev => ({ ...prev, color }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(formData);
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-700">{t('addDoctorModal.title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('addDoctorModal.closeAriaLabel')}>
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <label htmlFor="add-doctor-name" className="sr-only">{t('addDoctorModal.fullName')}</label>
                    <input id="add-doctor-name" name="name" value={formData.name} onChange={handleChange} placeholder={t('addDoctorModal.fullName')} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required />
                    
                    <label htmlFor="add-doctor-specialty" className="sr-only">{t('addDoctorModal.specialty')}</label>
                    <input id="add-doctor-specialty" name="specialty" value={formData.specialty} onChange={handleChange} placeholder={t('addDoctorModal.specialty')} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required />
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">{t('addDoctorModal.colorTag')}</label>
                        <div className="flex flex-wrap gap-2">
                        {availableColors.map(color => (
                            <button 
                                type="button" 
                                key={color} 
                                onClick={() => handleColorChange(color)} 
                                className={`w-8 h-8 rounded-full ${color} ${formData.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light`}
                                aria-label={t('doctorDetails.selectColorAriaLabel', {color: color.replace('bg-', '')})}
                            ></button>
                        ))}
                        </div>
                    </div>
                    <footer className="pt-2 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-dark rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light">{t('addDoctorModal.saveDoctor')}</button>
                    </footer>
                </form>
             </div>
        </div>
    );
};

const DoctorList: React.FC<{ clinicData: ClinicData }> = ({ clinicData }) => {
    const { dentists, addDoctor, updateDoctor, treatmentRecords, doctorPayments } = clinicData;
    const { t } = useI18n();
    const [selectedDoctor, setSelectedDoctor] = useState<Dentist | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const currencyFormatter = new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' });

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
            <div className="flex justify-end mb-4">
                 <button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-light">
                    <AddUserIcon />
                    {t('doctorList.addNewDoctor')}
                </button>
            </div>
            <div className="space-y-3">
                {dentists.map(doctor => {
                    // Calculate outstanding balance for this doctor
                    const doctorEarnings = treatmentRecords
                        .filter(tr => tr.dentistId === doctor.id)
                        .reduce((sum, tr) => sum + tr.doctorShare, 0);
                    const doctorPaymentsReceived = doctorPayments
                        .filter(p => p.dentistId === doctor.id)
                        .reduce((sum, p) => sum + p.amount, 0);
                    const outstandingBalance = doctorEarnings - doctorPaymentsReceived;

                    return (
                        <div key={doctor.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center gap-3 hover:bg-slate-50 shadow-sm transition-shadow duration-200">
                            <div className="flex items-center gap-3">
                                <span className={`w-4 h-4 rounded-full ${doctor.color}`}></span>
                                <div>
                                    <p className="font-bold text-slate-800">{doctor.name}</p>
                                    <p className="text-sm text-slate-600">{doctor.specialty}</p>
                                    {outstandingBalance > 0 && (
                                        <p className="text-xs font-semibold text-blue-600 mt-1">
                                            رصيد مستحق: {currencyFormatter.format(outstandingBalance)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <button
                                    onClick={() => setSelectedDoctor(doctor)}
                                    className="text-primary hover:text-primary-dark font-semibold px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
                                >
                                    {t('doctorList.viewDetails')}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {selectedDoctor && <DoctorDetailsModal
                doctor={selectedDoctor}
                onUpdate={updateDoctor}
                onClose={() => setSelectedDoctor(null)}
                clinicData={clinicData}
             />}
            {isAddModalOpen && <AddDoctorModal onAdd={addDoctor} onClose={() => setIsAddModalOpen(false)} />}
        </div>
    );
};

export default DoctorList;