import React, { useRef, useState } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { useI18n } from '../hooks/useI18n';
import { useNotification } from '../contexts/NotificationContext';
import { NotificationType } from '../types';

const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>;


const Settings: React.FC<{ clinicData: ClinicData }> = ({ clinicData }) => {
    const { t } = useI18n();
    const { addNotification } = useNotification();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { restoreData, ...dataToBackup } = clinicData;

    // Local state for form inputs
    const [clinicInfoForm, setClinicInfoForm] = useState(clinicData.clinicInfo);
    const [whatsappTemplate, setWhatsappTemplate] = useState(clinicData.whatsappMessageTemplate);
    const [reminderTemplate, setReminderTemplate] = useState(clinicData.reminderMessageTemplate);

    const handleBackup = () => {
        try {
            const dataStr = JSON.stringify(dataToBackup, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const date = new Date().toISOString().split('T')[0];
            link.download = `curasoft-backup-${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            addNotification(t('notifications.backupSuccess'), NotificationType.SUCCESS);
        } catch (error) {
            console.error("Backup failed:", error);
            addNotification(t('notifications.backupError'), NotificationType.ERROR);
        }
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (window.confirm(t('settings.restore.confirm'))) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text === 'string') {
                        const restoredData = JSON.parse(text);
                        await restoreData(restoredData);
                        addNotification(t('notifications.restoreSuccess'), NotificationType.SUCCESS);
                        // Reload the page after successful restore to ensure all data is properly loaded
                        setTimeout(() => window.location.reload(), 1000);
                    }
                } catch (error) {
                    console.error("Restore failed:", error);
                    addNotification(t('notifications.restoreError'), NotificationType.ERROR);
                }
            };
            reader.readAsText(file);
        }
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleLoadSampleData = async () => {
        if (window.confirm(t('settings.sampleData.confirm'))) {
            try {
                // Load sample data from the JSON file
                const response = await fetch('/sample-data.json');
                if (!response.ok) {
                    throw new Error('Failed to load sample data file');
                }
                const sampleData = await response.json();

                // Add sample data using the clinic data functions
                // Add patients
                for (const patient of sampleData.patients) {
                    await clinicData.addPatient(patient);
                }

                // Add dentists
                for (const dentist of sampleData.dentists) {
                    await clinicData.addDoctor(dentist);
                }

                // Add suppliers
                for (const supplier of sampleData.suppliers) {
                    await clinicData.addSupplier(supplier);
                }

                // Add inventory items
                for (const item of sampleData.inventoryItems) {
                    await clinicData.addInventoryItem(item);
                }

                // Add expenses
                for (const expense of sampleData.expenses) {
                    await clinicData.addExpense(expense);
                }

                // Add treatment definitions
                for (const treatment of sampleData.treatmentDefinitions) {
                    await clinicData.addTreatmentDefinition(treatment);
                }

                // Add treatment records
                for (const record of sampleData.treatmentRecords) {
                    await clinicData.addTreatmentRecord(record.patientId, record);
                }

                // Add lab cases
                for (const labCase of sampleData.labCases) {
                    await clinicData.addLabCase(labCase);
                }

                // Add payments
                for (const payment of sampleData.payments) {
                    await clinicData.addPayment(payment);
                }

                // Add supplier invoices
                for (const invoice of sampleData.supplierInvoices) {
                    await clinicData.addSupplierInvoice(invoice);
                }

                // Add appointments last (after patients and dentists are created)
                for (const appointment of sampleData.appointments) {
                    await clinicData.addAppointment(appointment);
                }

                addNotification(t('settings.sampleData.success'), NotificationType.SUCCESS);
            } catch (error) {
                console.error("Failed to load sample data:", error);
                addNotification(t('settings.sampleData.error'), NotificationType.ERROR);
            }
        }
    };

    const handleClearData = () => {
        if (window.confirm(t('settings.clear.confirm'))) {
            try {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('curasoft_')) {
                        localStorage.removeItem(key);
                    }
                });
                addNotification(t('settings.clear.success'), NotificationType.SUCCESS);
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                console.error("Failed to clear data:", error);
                addNotification(t('settings.clear.error'), NotificationType.ERROR);
            }
        }
    };

    const handleClearSettings = () => {
        if (window.confirm('هل أنت متأكد من مسح إعدادات العيادة والواتساب؟')) {
            try {
                localStorage.removeItem('curasoft_clinic_info');
                localStorage.removeItem('curasoft_whatsapp_template');
                localStorage.removeItem('curasoft_reminder_template');
                addNotification('تم مسح إعدادات العيادة والواتساب', NotificationType.SUCCESS);
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                console.error("Failed to clear settings:", error);
                addNotification('فشل في مسح الإعدادات', NotificationType.ERROR);
            }
        }
    };

    const handleResetData = () => {
        if (window.confirm('هل أنت متأكد من إعادة تعيين جميع البيانات باستثناء الإعدادات؟ سيتم مسح جميع المرضى والمواعيد والبيانات الأخرى.')) {
            try {
                const settingsKeys = ['curasoft_clinic_info', 'curasoft_whatsapp_template', 'curasoft_reminder_template'];
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('curasoft_') && !settingsKeys.includes(key)) {
                        localStorage.removeItem(key);
                    }
                });
                addNotification('تم إعادة تعيين البيانات بنجاح', NotificationType.SUCCESS);
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                console.error("Failed to reset data:", error);
                addNotification('فشل في إعادة تعيين البيانات', NotificationType.ERROR);
            }
        }
    };

    const handleSaveClinicInfo = () => {
        clinicData.updateClinicInfo(clinicInfoForm);
    };

    const handleSaveWhatsappTemplate = () => {
        clinicData.updateWhatsappMessageTemplate(whatsappTemplate);
    };




    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md space-y-8 max-w-4xl mx-auto">
            {/* Clinic Info Section */}
            <div>
                <h3 className="text-lg font-bold text-slate-700">معلومات العيادة</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4">أدخل معلومات العيادة الأساسية</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">اسم العيادة</label>
                        <input
                            type="text"
                            value={clinicInfoForm.name}
                            onChange={(e) => setClinicInfoForm({...clinicInfoForm, name: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="أدخل اسم العيادة"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">العنوان</label>
                        <input
                            type="text"
                            value={clinicInfoForm.address}
                            onChange={(e) => setClinicInfoForm({...clinicInfoForm, address: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="أدخل عنوان العيادة"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                        <input
                            type="tel"
                            value={clinicInfoForm.phone}
                            onChange={(e) => setClinicInfoForm({...clinicInfoForm, phone: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="أدخل رقم الهاتف"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
                        <input
                            type="email"
                            value={clinicInfoForm.email}
                            onChange={(e) => setClinicInfoForm({...clinicInfoForm, email: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="أدخل البريد الإلكتروني"
                        />
                    </div>
                </div>
                <button
                    onClick={handleSaveClinicInfo}
                    className="mt-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light"
                >
                    حفظ معلومات العيادة
                </button>
            </div>



            {/* Patient WhatsApp Message Template Section */}
            <div className="border-t pt-8">
                <h3 className="text-lg font-bold text-slate-700">قالب رسالة الواتساب للمرضى</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4">خصص رسالة الواتساب المرسلة من قائمة المرضى</p>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">المتغيرات المتاحة:</label>
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                        <code>{`{patientName}`}</code> - اسم المريض<br/>
                        <code>{`{clinicName}`}</code> - اسم العيادة<br/>
                        <code>{`{clinicAddress}`}</code> - عنوان العيادة<br/>
                        <code>{`{clinicPhone}`}</code> - رقم هاتف العيادة
                    </div>
                </div>
                <textarea
                    value={clinicData.whatsappMessageTemplate}
                    onChange={(e) => clinicData.updateWhatsappMessageTemplate(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="أدخل قالب رسالة المريض..."
                />
                <p className="text-xs text-slate-500 mt-2">هذا القالب يُستخدم عند الضغط على أيقونة الواتساب بجانب اسم المريض في قائمة المرضى</p>
            </div>

            {/* Appointment Reminder WhatsApp Template Section */}
            <div className="border-t pt-8">
                <h3 className="text-lg font-bold text-slate-700">قالب رسالة الواتساب للمواعيد</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4">خصص رسالة الواتساب المرسلة لتذكير المرضى بالمواعيد</p>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">المتغيرات المتاحة:</label>
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                        <code>{`{patientName}`}</code> - اسم المريض<br/>
                        <code>{`{doctorName}`}</code> - اسم الطبيب<br/>
                        <code>{`{clinicName}`}</code> - اسم العيادة<br/>
                        <code>{`{appointmentDate}`}</code> - تاريخ الموعد<br/>
                        <code>{`{appointmentTime}`}</code> - وقت الموعد<br/>
                        <code>{`{clinicAddress}`}</code> - عنوان العيادة<br/>
                        <code>{`{clinicPhone}`}</code> - رقم هاتف العيادة
                    </div>
                </div>
                <textarea
                    value={clinicData.reminderMessageTemplate}
                    onChange={(e) => clinicData.updateReminderMessageTemplate(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="أدخل قالب رسالة تذكير الموعد..."
                />
                <p className="text-xs text-slate-500 mt-2">هذا القالب يُستخدم عند إرسال تذكيرات المواعيد عبر الواتساب</p>
            </div>

            {/* Backup Section */}
            <div className="border-t pt-8">
                <h3 className="text-lg font-bold text-slate-700">{t('settings.backup.title')}</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4">{t('settings.backup.description')}</p>
                <button
                    onClick={handleBackup}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-light"
                >
                    <DownloadIcon /> {t('settings.backup.button')}
                </button>
            </div>

            {/* Restore Section */}
            <div className="border-t pt-8">
                <h3 className="text-lg font-bold text-slate-700">{t('settings.restore.title')}</h3>
                <p className="text-sm text-slate-500 mt-1 mb-2">{t('settings.restore.description')}</p>
                <p className="text-sm text-red-600 font-semibold mb-4">{t('settings.restore.warning')}</p>
                <button
                    onClick={handleRestoreClick}
                    className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                    <UploadIcon /> {t('settings.restore.button')}
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                />
            </div>

             {/* Sample Data Section */}
             <div className="border-t pt-8">
                 <h3 className="text-lg font-bold text-green-600">{t('settings.sampleData.title')}</h3>
                 <p className="text-sm text-slate-500 mt-1 mb-4">{t('settings.sampleData.description')}</p>
                 <button
                     onClick={handleLoadSampleData}
                     className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500"
                 >
                     <UploadIcon /> {t('settings.sampleData.button')}
                 </button>
             </div>

             {/* Danger Zone */}
             <div className="border-t pt-8">
                 <h3 className="text-lg font-bold text-red-600">{t('settings.dangerZone.title')}</h3>
                 <p className="text-sm text-slate-500 mb-4">{t('settings.dangerZone.description')}</p>
                 <div className="space-y-4">
                     <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                         <div>
                             <h4 className="font-semibold text-red-800">إعادة تعيين البيانات</h4>
                             <p className="text-sm text-red-700">مسح جميع البيانات (المرضى، المواعيد، المالية، إلخ) مع الحفاظ على الإعدادات</p>
                         </div>
                         <button
                             onClick={handleResetData}
                             className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex-shrink-0"
                         >
                             إعادة تعيين البيانات
                         </button>
                     </div>
                     <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                         <div>
                             <h4 className="font-semibold text-red-800">مسح إعدادات العيادة</h4>
                             <p className="text-sm text-red-700">مسح معلومات العيادة وقالب رسالة الواتساب المحفوظة محلياً</p>
                         </div>
                         <button
                             onClick={handleClearSettings}
                             className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex-shrink-0"
                         >
                             مسح الإعدادات
                         </button>
                     </div>
                     <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                         <div>
                             <h4 className="font-semibold text-red-800">{t('settings.clear.title')}</h4>
                             <p className="text-sm text-red-700">{t('settings.clear.description')}</p>
                         </div>
                         <button
                             onClick={handleClearData}
                             className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex-shrink-0"
                         >
                             {t('settings.clear.button')}
                         </button>
                     </div>
                 </div>
             </div>

        </div>
    );
};

export default Settings;
