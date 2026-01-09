import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Patient, DentalChartData, Payment, NotificationType, PatientDetailTab, TreatmentRecord, ToothStatus, Prescription, PrescriptionItem, Dentist, PatientAttachment } from '../../types';
import DentalChart from '../DentalChart';
import TreatmentRecordList from './TreatmentRecordList';
import AddTreatmentRecordModal from './AddTreatmentRecordModal';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import AddPaymentModal from './AddPaymentModal';
import AddDiscountModal from './AddDiscountModal';
import EditPaymentModal from './EditPaymentModal';
import DeletePaymentConfirmationModal from './DeletePaymentConfirmationModal';
import { openPrintWindow } from '../../utils/print';
import PatientInvoice from './PatientInvoice';
import PatientFullReport from './PatientFullReport';
import PatientAttachments from './PatientAttachments';
import PrescriptionList from './PrescriptionList';
import AddEditPrescriptionModal from './AddEditPrescriptionModal';
import AddEditPatientModal from './AddEditPatientModal';
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
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19l7-7-7-7" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const DollarSignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 8v4m-4.003-4l-2.003 2.003m7.007-1.414L14.003 10m-3.414-1.414L9 5.586m4.003 2.828l3.004 3.004M9.879 16.121A3 3 0 1012.004 15H12v2.003V20m0-8c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PercentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m-10.5 2.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm10.5 10.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>;
const FileInvoiceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const FileReportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

export const PatientDetailsPanel: React.FC<{
    patient: Patient;
    onBack: () => void;
    onEdit: () => void;
    clinicData: ClinicData;
}> = ({ patient, onBack, onEdit, clinicData }) => {
    const { user } = useAuth();
    const { t, locale } = useI18n();
    const { addNotification } = useNotification();
    const { updatePatient, addTreatmentRecord, addPayment, updatePayment, deletePayment, payments, treatmentRecords, prescriptions, prescriptionItems, addPrescription, updatePrescription, deletePrescription, addPrescriptionItem, updatePrescriptionItem, deletePrescriptionItem, attachments, addAttachment, updateAttachment, deleteAttachment } = clinicData;

    const [activeTab, setActiveTab] = useState<PatientDetailTab>('details');
    const [isAddTreatmentModalOpen, setIsAddTreatmentModalOpen] = useState(false);
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [isAddDiscountModalOpen, setIsAddDiscountModalOpen] = useState(false);
    const [isAddPrescriptionModalOpen, setIsAddPrescriptionModalOpen] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
    const [isDeletePaymentModalOpen, setIsDeletePaymentModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
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
        console.log('PatientDetailsPanel: handleUpdateDentalChart called with:', newChart);
        console.log('PatientDetailsPanel: current patient dentalChart:', patient.dentalChart);
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

    const handleEditPayment = useCallback((payment: Payment) => {
        setSelectedPayment(payment);
        setIsEditPaymentModalOpen(true);
    }, []);

    const handleUpdatePayment = useCallback((payment: Payment) => {
        updatePayment(payment);
        setIsEditPaymentModalOpen(false);
        setSelectedPayment(null);
        addNotification(t('notifications.paymentUpdated'), NotificationType.SUCCESS);
    }, [updatePayment, addNotification, t]);

    const handleDeletePayment = useCallback((payment: Payment) => {
        setSelectedPayment(payment);
        setIsDeletePaymentModalOpen(true);
    }, []);

    const handleConfirmDeletePayment = useCallback(() => {
            if (selectedPayment) {
                deletePayment(selectedPayment.id);
                setIsDeletePaymentModalOpen(false);
                setSelectedPayment(null);
                addNotification(t('notifications.paymentDeleted'), NotificationType.SUCCESS);
            }
        }, [selectedPayment, deletePayment, addNotification, t]);
    
        const handleDeleteTreatmentRecord = useCallback((recordId: string) => {
            clinicData.deleteTreatmentRecord(recordId);
            addNotification(t('treatmentDelete.deletedSuccessfully'), NotificationType.SUCCESS);
        }, [clinicData, addNotification, t]);

    const handlePrintInvoice = () => {
        openPrintWindow(t('patientInvoice.title'), <PatientInvoice patient={patient} clinicData={clinicData} />);
    };

    const handlePrintFullReport = () => {
        openPrintWindow(t('patientReport.title'), <PatientFullReport patient={patient} clinicData={clinicData} />);
    };

    const handleAddPrescription = useCallback(async (prescriptionData: Omit<Prescription, 'id' | 'patientId' | 'userId' | 'createdAt' | 'updatedAt'>, items: PrescriptionItem[]) => {
        // Add the prescription
        const newPrescription = await addPrescription({
            ...prescriptionData,
            patientId: patient.id
        });

        // Add the prescription items
        for (const item of items) {
            const { id, prescriptionId, userId, createdAt, updatedAt, ...itemData } = item;
            await addPrescriptionItem(newPrescription.id, itemData);
        }

        setIsAddPrescriptionModalOpen(false);
        addNotification(t('notifications.prescriptionAdded'), NotificationType.SUCCESS);
    }, [patient.id, addPrescription, addPrescriptionItem, addNotification, t]);

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

        // Check if user is authenticated
        if (!user) {
            addNotification('User not authenticated', NotificationType.ERROR);
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

                const now = new Date().toISOString();
                const attachmentData = {
                    patientId: patient.id,
                    filename: fileName,
                    originalFilename: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    fileUrl: publicUrl,
                    description: description,
                    uploadedBy: user.id, // Use the authenticated user's ID
                    createdAt: now,
                    updatedAt: now
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

    const handleSavePatient = useCallback((patientData: Patient | Omit<Patient, 'id' | 'dentalChart'>) => {
        updatePatient(patientData as Patient);
        setShowEditModal(false);
        addNotification(t('notifications.patientUpdated'), NotificationType.SUCCESS);
    }, [updatePatient, addNotification, t]);

    return (
        <div className="min-h-screen bg-neutral">
            <header className="bg-white shadow-sm border-b border-slate-200 p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack} 
                        className="flex items-center px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                        <BackIcon /> {t('common.back')}
                    </button>
                    <h1 className="text-2xl font-bold text-slate-700">{t('patientDetails.title')} - {patient.name}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="flex items-center px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                        <EditIcon /> {t('common.edit')}
                    </button>
                </div>
            </header>

            <nav className="border-b border-slate-200 bg-slate-50">
                <ul className="-mb-px flex space-x-4 rtl:space-x-reverse overflow-x-auto text-sm font-medium text-center text-slate-500 px-4">
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

            <main className="p-6 bg-neutral min-h-[calc(100vh-140px)]">
                {activeTab === 'details' && (
                    <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
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
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <DentalChart chartData={patient.dentalChart} onUpdate={handleUpdateDentalChart} />
                    </div>
                )}

                {activeTab === 'treatments' && (
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setIsAddTreatmentModalOpen(true)}
                                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-light"
                            >
                                <PlusIcon /> {t('patientDetails.addTreatmentRecord')}
                            </button>
                        </div>
                        <TreatmentRecordList
                            patient={patient}
                            clinicData={clinicData}
                            onUpdateTreatmentRecord={async (patientId, record) => {
                                await clinicData.updateTreatmentRecord(patientId, record);
                            }}
                            onDeleteTreatmentRecord={handleDeleteTreatmentRecord}
                        />
                    </div>
                )}

                {activeTab === 'prescriptions' && (
                    <div className="bg-white p-6 rounded-lg shadow-sm">
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
                    <div className="bg-white p-6 rounded-lg shadow-sm">
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
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-green-700">{currencyFormatter.format(payment.amount)}</span>
                                                <button
                                                    onClick={() => handleEditPayment(payment)}
                                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                                    title={t('common.edit')}
                                                >
                                                    <EditIcon />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePayment(payment)}
                                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title={t('common.delete')}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
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
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="space-y-4">
                            {/* Upload Section */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                <div className="space-y-4">
                                    <div className="text-gray-500">
                                        <svg
                                            className="mx-auto h-12 w-12"
                                            stroke="currentColor"
                                            fill="none"
                                            viewBox="0 0 48 48"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                strokeWidth={2}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="file-upload"
                                            className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                        >
                                            {t('patient_attachments.choose_file')}
                                            <input
                                                id="file-upload"
                                                name="file-upload"
                                                type="file"
                                                className="sr-only"
                                                accept="image/*"
                                                multiple
                                                onChange={(e) => {
                                                    const files = e.target.files;
                                                    if (files) {
                                                        handleUploadAttachments(Array.from(files), []);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        {t('patient_attachments.upload_instructions')}
                                    </p>
                                </div>
                            </div>

                            {/* Attachments Grid */}
                            {patientAttachments.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {patientAttachments.map((attachment, index) => (
                                        <div key={attachment.id} className="relative group">
                                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-gray-300 transition-colors">
                                                <img
                                                    src={attachment.fileUrl}
                                                    alt={attachment.originalFilename}
                                                    className="w-full h-full object-cover cursor-pointer"
                                                    onClick={() => handleViewAttachment(attachment)}
                                                />

                                                {/* Overlay with actions */}
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                                                        <button
                                                            onClick={() => handleViewAttachment(attachment)}
                                                            className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600 transition-colors"
                                                            title={t('patient_attachments.view')}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteAttachment(attachment.id)}
                                                            className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600 transition-colors"
                                                            title={t('patient_attachments.delete')}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* File Info */}
                                            <div className="mt-2 text-xs text-gray-600">
                                                <p className="truncate font-medium">{attachment.originalFilename}</p>
                                                <p className="text-gray-400">
                                                    {(attachment.fileSize / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <p className="mt-2">
                                        {t('patient_attachments.no_attachments')}
                                    </p>
                                    <p className="text-sm">
                                        {t('patient_attachments.upload_first')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

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

            {showEditModal && (
                <AddEditPatientModal
                    patient={patient}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleSavePatient}
                />
            )}

            {isEditPaymentModalOpen && selectedPayment && (
                <EditPaymentModal
                    patientId={patient.id}
                    payment={selectedPayment}
                    clinicData={clinicData}
                    onClose={() => {
                        setIsEditPaymentModalOpen(false);
                        setSelectedPayment(null);
                    }}
                    onUpdate={handleUpdatePayment}
                />
            )}

            {isDeletePaymentModalOpen && selectedPayment && (
                <DeletePaymentConfirmationModal
                    payment={selectedPayment}
                    onConfirm={handleConfirmDeletePayment}
                    onCancel={() => {
                        setIsDeletePaymentModalOpen(false);
                        setSelectedPayment(null);
                    }}
                />
            )}
        </div>
    );
};