import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Patient, DentalChartData, Payment, NotificationType, PatientDetailTab, TreatmentRecord, ToothStatus, Prescription, PrescriptionItem, Dentist, PatientAttachment } from '../../types';
import DentalChart from '../DentalChart';
import TreatmentRecordList from './TreatmentRecordList';
import AddTreatmentRecordModal from './AddTreatmentRecordModal';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import AddPaymentModal from './AddPaymentModal';
import AddDiscountModal from './AddDiscountModal';
import { openPrintWindow } from '../../utils/print';
import PatientInvoice from './PatientInvoice';
import PatientFullReport from './PatientFullReport';
import PatientAttachments from './PatientAttachments';
import PrescriptionList from './PrescriptionList';
import AddEditPrescriptionModal from './AddEditPrescriptionModal';
import ImageViewerModal from './ImageViewerModal';
import { supabase } from '../../supabaseClient';

// Helper function to map treatment names to tooth statuses
const getToothStatusFromTreatment = (treatmentName: string): ToothStatus | null => {
    const lowerName = treatmentName.toLowerCase();
    if (lowerName.includes('filling')) return ToothStatus.FILLING;
    if (lowerName.includes('crown')) return ToothStatus.CROWN;
    if (lowerName.includes('implant')) return ToothStatus.IMPLANT;
    if (lowerName.includes('root canal') || lowerName.includes('endodontic')) return ToothStatus.ROOT_CANAL;
    if (lowerName.includes('extraction') || lowerName.includes('removal')) return ToothStatus.MISSING;
    if (lowerName.includes('cavity')) return ToothStatus.CAVITY;
    return null; // No status change for other treatments
};

// Icons
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const DollarSignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 8v4m-4.003-4l-2.003 2.003m7.007-1.414L14.003 10m-3.414-1.414L9 5.586m4.003 2.828l3.004 3.004M9.879 16.121A3 3 0 1012.004 15H12v2.003V20m0-8c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PercentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m-10.5 2.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm10.5 10.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>;
const FileInvoiceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const FileReportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

export const PatientDetailsModal: React.FC<{
    patient: Patient;
    onEdit: () => void;
    clinicData: ClinicData;
}> = ({ patient, onEdit, clinicData }) => {
    const { t, locale } = useI18n();
    const { addNotification } = useNotification();
    const { updatePatient, addTreatmentRecord, addPayment, payments, treatmentRecords, prescriptions, prescriptionItems, addPrescription, updatePrescription, deletePrescription, addPrescriptionItem, updatePrescriptionItem, deletePrescriptionItem, attachments, addAttachment, updateAttachment, deleteAttachment } = clinicData;

    const [activeTab, setActiveTab] = useState<PatientDetailTab>('details');
    const [isAddTreatmentModalOpen, setIsAddTreatmentModalOpen] = useState(false);
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [isAddDiscountModalOpen, setIsAddDiscountModalOpen] = useState(false);
    const [isAddPrescriptionModalOpen, setIsAddPrescriptionModalOpen] = useState(false);
    const [dentists, setDentists] = useState<Dentist[]>([]);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        setDentists(clinicData.dentists);
    }, [clinicData.dentists]);

    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    const patientPayments = useMemo(() => payments.filter(p => p.patientId === patient.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [payments, patient.id]);
    const patientTreatmentRecords = useMemo(() => treatmentRecords.filter(tr => tr.patientId === patient.id).sort((a,b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime()), [treatmentRecords, patient.id]);

    const financialSummary = useMemo(() => {
        const totalCharges = patientTreatmentRecords.reduce((sum, tr) => sum + (tr.doctorShare + tr.clinicShare), 0);
        const totalPaid = patientPayments.reduce((sum, p) => sum + p.amount, 0);
        const outstandingBalance = totalCharges - totalPaid;
        return { totalCharges, totalPaid, outstandingBalance };
    }, [patientTreatmentRecords, patientPayments]);

    const handleUpdateDentalChart = useCallback((newChart: DentalChartData) => {
        console.log('PatientDetailsModal: handleUpdateDentalChart called with:', newChart);
        console.log('PatientDetailsModal: current patient dentalChart:', patient.dentalChart);
        const updatedPatient = { ...patient, dentalChart: newChart };
        updatePatient(updatedPatient);
        addNotification(t('notifications.patientUpdated'), NotificationType.SUCCESS);
    }, [patient, updatePatient, addNotification, t]);

    const handleAddTreatmentRecord = useCallback((record: Omit<TreatmentRecord, 'id' | 'patientId'>) => {
        // Add the treatment record
        addTreatmentRecord(patient.id, record);

        // Automatically update dental chart based on affected teeth and treatment type
        if (record.affectedTeeth && record.affectedTeeth.length > 0) {
            const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);
            if (treatmentDef) {
                const newStatus = getToothStatusFromTreatment(treatmentDef.name);
                if (newStatus) {
                    const updatedChart = { ...patient.dentalChart };
                    record.affectedTeeth.forEach(toothId => {
                        if (updatedChart[toothId]) {
                            updatedChart[toothId] = { ...updatedChart[toothId], status: newStatus };
                        }
                    });
                    updatePatient({ ...patient, dentalChart: updatedChart });
                }
            }
        }

        updatePatient({...patient, lastVisit: record.treatmentDate});
        setIsAddTreatmentModalOpen(false);
        addNotification(t('notifications.treatmentAdded'), NotificationType.SUCCESS);
    }, [addTreatmentRecord, patient, updatePatient, addNotification, t, clinicData.treatmentDefinitions]);

    const handleAddPayment = useCallback((payment: Omit<Payment, 'id'>) => {
        addPayment(payment);
        setIsAddPaymentModalOpen(false);
        addNotification(t('notifications.paymentAdded'), NotificationType.SUCCESS);
    }, [addPayment, addNotification, t]);

    const handlePrintInvoice = () => {
        openPrintWindow(t('patientInvoice.title'), <PatientInvoice patient={patient} clinicData={clinicData} />);
    };

    const handlePrintFullReport = () => {
        openPrintWindow(t('patientReport.title'), <PatientFullReport patient={patient} clinicData={clinicData} />);
    };

    const handleAddPrescription = useCallback(async (prescriptionData: Omit<Prescription, 'id' | 'patientId' | 'userId' | 'createdAt' | 'updatedAt'>, items: PrescriptionItem[]) => {
        // Add the prescription
        await addPrescription({
            ...prescriptionData,
            patientId: patient.id
        });

        // Add the prescription items
        for (const item of items) {
            await addPrescriptionItem('', item); // prescriptionId will be set by the function
        }

        setIsAddPrescriptionModalOpen(false);
    }, [patient.id, addPrescription, addPrescriptionItem]);

    // Load attachments for this patient
    const patientAttachments = useMemo(() => {
        return attachments.filter(att => att.patientId === patient.id);
    }, [attachments, patient.id]);

    // Real attachment functions
    const handleUploadAttachments = async (files: File[], descriptions: string[]) => {
        console.log('Uploading attachments:', files, descriptions);

        if (!supabase) {
            addNotification('Supabase client not initialized', NotificationType.ERROR);
            return;
        }

        // Process each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const description = descriptions[i] || '';

            try {
                // Upload to Supabase Storage
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `patient-attachments/${patient.id}/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase!.storage
                    .from('patient-attachments')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('Error uploading file:', uploadError);
                    addNotification(`Failed to upload ${file.name}: ${uploadError.message}`, NotificationType.ERROR);
                    continue;
                }

                // Get public URL
                const { data: { publicUrl } } = supabase!.storage
                    .from('patient-attachments')
                    .getPublicUrl(filePath);

                const attachmentData = {
                    patientId: patient.id,
                    filename: fileName,
                    originalFilename: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    fileUrl: publicUrl,
                    description: description
                };

                await addAttachment(attachmentData);
                addNotification(`${file.name} uploaded successfully`, NotificationType.SUCCESS);
            } catch (error) {
                console.error('Error processing file:', error);
                addNotification(`Failed to upload ${file.name}`, NotificationType.ERROR);
            }
        }
    };

    const handleDeleteAttachment = async (attachmentId: string) => {
        await deleteAttachment(attachmentId);
    };

    const handleViewAttachment = (attachment: PatientAttachment) => {
        if (attachment.fileType.startsWith('image/')) {
            const imageAttachments = patientAttachments.filter(att => att.fileType.startsWith('image/'));
            const index = imageAttachments.findIndex(att => att.id === attachment.id);
            setCurrentImageIndex(index);
            setImageViewerOpen(true);
        }
    };

    const handleImageViewerNavigate = (index: number) => {
        setCurrentImageIndex(index);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-700">{patient.name}</h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onEdit} 
                            className="flex items-center px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                        >
                            <EditIcon /> {t('common.edit')}
                        </button>
                    </div>
                </header>

                <nav className="border-b border-slate-200 bg-slate-50 flex-shrink-0">
                    <ul className="-mb-px flex space-x-4 rtl:space-x-reverse overflow-x-auto text-sm font-medium text-center text-slate-500">
                        {[
                            { key: 'details', label: 'patientDetails.tabDetails' },
                            { key: 'chart', label: 'patientDetails.tabDentalChart' },
                            { key: 'treatments', label: 'patientDetails.tabTreatmentRecords' },
                            { key: 'prescriptions', label: 'patientDetails.tabPrescriptions' },
                            { key: 'financials', label: 'patientDetails.tabFinancials' },
                            { key: 'attachments', label: 'patientDetails.tabAttachments' }
                        ].map(({ key, label }) => (
                            <li key={key}>
                                <button
                                    onClick={() => setActiveTab(key as PatientDetailTab)}
                                    className={`inline-block p-4 border-b-2 ${
                                        activeTab === key ? 'border-primary text-primary' : 'border-transparent hover:text-slate-700 hover:border-slate-300'
                                    }`}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><strong>{t('patientDetails.dob')}:</strong> {patient.dob ? dateFormatter.format(new Date(patient.dob)) : t('common.noDate')}</div>
                                <div><strong>{t('patientDetails.gender')}:</strong> {t(patient.gender.toLowerCase() as 'male' | 'female' | 'other')}</div>
                                <div><strong>{t('patientDetails.phone')}:</strong> {patient.phone}</div>
                                <div><strong>{t('patientDetails.email')}:</strong> {patient.email || '-'}</div>
                                <div className="md:col-span-2"><strong>{t('patientDetails.address')}:</strong> {patient.address || '-'}</div>
                            </div>
                            <hr className="my-4 border-slate-200"/>
                            <div>
                                <h3 className="font-bold text-slate-700 mb-2">{t('patientDetails.medicalHistory')}</h3>
                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{patient.medicalHistory || t('common.na')}</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-700 mb-2">{t('patientDetails.allergies')}</h3>
                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{patient.allergies || t('common.na')}</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-700 mb-2">{t('patientDetails.currentMedications')}</h3>
                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{patient.medications || t('common.na')}</p>
                            </div>
                            <hr className="my-4 border-slate-200"/>
                             <div className="flex justify-start">
                                <button
                                    onClick={handlePrintFullReport}
                                    className="ms-3 bg-slate-500 text-white px-4 py-2 rounded-lg hover:bg-slate-600 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-400"
                                >
                                    <FileReportIcon /> {t('common.print')}
                                </button>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-700 mb-2">{t('patientDetails.emergencyContact')}</h3>
                                <p className="text-sm"><strong>{t('patientDetails.emergencyContactName')}:</strong> {patient.emergencyContactName || '-'}</p>
                                <p className="text-sm"><strong>{t('patientDetails.emergencyContactPhone')}:</strong> {patient.emergencyContactPhone || '-'}</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-700 mb-2">{t('patientDetails.insurance')}</h3>
                                <p className="text-sm"><strong>{t('patientDetails.insuranceProvider')}:</strong> {patient.insuranceProvider || '-'}</p>
                                <p className="text-sm"><strong>{t('patientDetails.policyNumber')}:</strong> {patient.insurancePolicyNumber || '-'}</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-700 mb-2">{t('patientDetails.unstructuredNotes')}</h3>
                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{patient.treatmentNotes || t('common.na')}</p>
                            </div>
                            {patient.images && patient.images.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-slate-700 mb-2">{t('patientDetails.patientImages')}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {patient.images.map((image, index) => (
                                            <div key={index} className="relative">
                                                <img src={image} alt={`${t('patientDetails.patientImage')} ${index + 1}`} className="w-full h-32 object-cover rounded-lg shadow-sm" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'chart' && (
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <DentalChart chartData={patient.dentalChart} onUpdate={handleUpdateDentalChart} />
                        </div>
                    )}

                    {activeTab === 'treatments' && (
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={() => setIsAddTreatmentModalOpen(true)}
                                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-light"
                                >
                                    <PlusIcon /> {t('patientDetails.addTreatmentRecord')}
                                </button>
                            </div>
                            <TreatmentRecordList patient={patient} clinicData={clinicData} onUpdateTreatmentRecord={async (patientId, record) => {
                                await clinicData.updateTreatmentRecord(patientId, record);
                            }} />
                        </div>
                    )}

                    {activeTab === 'prescriptions' && (
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={() => setIsAddPrescriptionModalOpen(true)}
                                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-light"
                                >
                                    <PlusIcon /> {t('patientDetails.addPrescription')}
                                </button>
                            </div>
                            <PrescriptionList
                                patients={[patient]}
                                prescriptions={prescriptions}
                                prescriptionItems={prescriptionItems}
                                dentists={dentists}
                                onUpdatePrescription={async (patientId, prescription) => {
                                    await updatePrescription(prescription);
                                }}
                            />
                        </div>
                    )}
                    
                    {activeTab === 'financials' && (
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="text-lg font-bold text-slate-700 mb-4">{t('financials.patientBalance')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                <div className="bg-neutral-light p-3 rounded-lg text-center">
                                    <p className="text-sm text-slate-600">{t('financials.totalCharges')}</p>
                                    <p className="text-xl font-bold text-slate-800">{currencyFormatter.format(financialSummary.totalCharges)}</p>
                                </div>
                                <div className="bg-neutral-light p-3 rounded-lg text-center">
                                    <p className="text-sm text-slate-600">{t('financials.totalPaid')}</p>
                                    <p className="text-xl font-bold text-slate-800">{currencyFormatter.format(financialSummary.totalPaid)}</p>
                                </div>
                                <div className={`p-3 rounded-lg text-center ${financialSummary.outstandingBalance > 0 ? 'bg-red-100 text-red-800' : financialSummary.outstandingBalance < 0 ? 'bg-green-100 text-green-800' : 'bg-primary-100 text-primary-dark'}`}>
                                    <p className="text-sm font-semibold">{t('financials.outstandingBalance')}</p>
                                    <p className="text-xl font-bold">{currencyFormatter.format(financialSummary.outstandingBalance)}</p>
                                    <p className="text-xs mt-1">
                                        {financialSummary.outstandingBalance > 0 ? t('financials.amountDue') :
                                         financialSummary.outstandingBalance < 0 ? t('financials.overpaid') : t('financials.paidInFull')}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex justify-start gap-3 mb-6 flex-wrap">
                                <button
                                    onClick={() => setIsAddPaymentModalOpen(true)}
                                    className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-emerald-600 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-secondary/50"
                                >
                                    <DollarSignIcon /> {t('financials.addPayment')}
                                </button>
                                <button
                                    onClick={() => setIsAddDiscountModalOpen(true)}
                                    className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                                >
                                    <PercentIcon /> {t('financials.addDiscount')}
                                </button>
                                <button
                                    onClick={handlePrintInvoice}
                                    className="bg-slate-500 text-white px-4 py-2 rounded-lg hover:bg-slate-600 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-400"
                                >
                                    <FileInvoiceIcon /> {t('patientInvoice.title')}
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-slate-700 mb-4">{t('financials.transactions')}</h3>
                             <div className="bg-neutral p-4 rounded-lg shadow-inner max-h-96 overflow-y-auto">
                                {patientPayments.length === 0 && patientTreatmentRecords.length === 0 ? (
                                    <p className="text-center text-slate-500 py-4">{t('financials.noTransactions')}</p>
                                ) : (
                                    <div className="space-y-2">
                                        {/* Display payments first */}
                                        {patientPayments.map(payment => (
                                            <div key={payment.id} className="bg-white p-3 rounded-md shadow-sm flex justify-between items-center border-l-4 border-green-500">
                                                <div>
                                                    <p className="font-bold text-slate-800">{t('financials.payments')} ({t(`paymentMethod.${payment.method}`)})</p>
                                                    <p className="text-sm text-slate-600">
                                                        {dateFormatter.format(new Date(payment.date))}
                                                        {payment.notes && <span className="ms-2 ps-2 border-s border-slate-300">{payment.notes}</span>}
                                                    </p>
                                                </div>
                                                <span className="font-bold text-green-700">{currencyFormatter.format(payment.amount)}</span>
                                            </div>
                                        ))}

                                        {/* Then display charges (treatment records) */}
                                        {patientTreatmentRecords.map(record => {
                                            const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);
                                            return (
                                                <div key={record.id} className="bg-white p-3 rounded-md shadow-sm flex justify-between items-center border-l-4 border-blue-500">
                                                    <div>
                                                        <p className="font-bold text-slate-800">{t('financials.charges')} - {treatmentDef?.name || t('common.unknownTreatment')}</p>
                                                        <p className="text-sm text-slate-600">
                                                            {dateFormatter.format(new Date(record.treatmentDate))}
                                                            {record.notes && <span className="ms-2 ps-2 border-s border-slate-300">{record.notes.slice(0, 50)}{t('common.ellipsis')}</span>}
                                                        </p>
                                                    </div>
                                                    <span className="font-bold text-blue-700">{currencyFormatter.format(record.doctorShare + record.clinicShare)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'attachments' && (
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <PatientAttachments
                                patient={patient}
                                onUpdatePatient={updatePatient}
                            />
                        </div>
                    )}
                </main>
            </div>

            {isAddTreatmentModalOpen && (
                <AddTreatmentRecordModal
                    patientId={patient.id}
                    onClose={() => setIsAddTreatmentModalOpen(false)}
                    onAdd={handleAddTreatmentRecord}
                    clinicData={clinicData}
                />
            )}
            {isAddPaymentModalOpen && (
                <AddPaymentModal
                    patientId={patient.id}
                    clinicData={clinicData}
                    onClose={() => setIsAddPaymentModalOpen(false)}
                    onAdd={handleAddPayment}
                />
            )}
            {isAddDiscountModalOpen && (
                <AddDiscountModal
                    patientId={patient.id}
                    clinicData={clinicData}
                    onClose={() => setIsAddDiscountModalOpen(false)}
                    onAdd={handleAddPayment} // Discount is added as a payment with method 'Discount'
                />
            )}
            {isAddPrescriptionModalOpen && (
                <AddEditPrescriptionModal
                    patient={patient}
                    dentists={dentists}
                    onClose={() => setIsAddPrescriptionModalOpen(false)}
                    onSave={handleAddPrescription}
                />
            )}
            
            {/* Image Viewer Modal */}
            <ImageViewerModal
                attachments={patientAttachments.filter(att => att.fileType.startsWith('image/'))}
                currentIndex={currentImageIndex}
                isOpen={imageViewerOpen}
                onClose={() => setImageViewerOpen(false)}
                onNavigate={handleImageViewerNavigate}
            />
        </div>
    );
};
