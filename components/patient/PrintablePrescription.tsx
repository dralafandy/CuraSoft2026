import React from 'react';
import { Prescription, PrescriptionItem, Patient, Dentist } from '../../types';
import { useI18n } from '../../hooks/useI18n';

const PrintStyles = () => (
  <style>{`
    @media print {
      @page {
        size: A4;
        margin: 1cm;
      }
      body {
        font-size: 12px;
        line-height: 1.4;
      }
      .print-header {
        margin-bottom: 1.5rem;
        page-break-after: avoid;
      }
      .print-section {
        margin-bottom: 1rem;
        page-break-inside: avoid;
      }
      table {
        font-size: 10px;
      }
      h1 {
        font-size: 18px;
      }
      h2, h3, h4 {
        font-size: 14px;
      }
    }
  `}</style>
);

interface PrintablePrescriptionProps {
  prescription: Prescription;
  patient: Patient;
  prescriptionItems: PrescriptionItem[];
  dentist: Dentist;
  clinicInfo: any;
}

const PrintablePrescription: React.FC<PrintablePrescriptionProps> = ({
  prescription,
  patient,
  prescriptionItems,
  dentist,
  clinicInfo
}) => {
  const { t, locale } = useI18n();

  const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <PrintStyles />
      <div className="p-4 bg-white text-slate-900" dir="rtl">
        <header className="print-header text-center mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">{clinicInfo.name || t('appName')}</h1>
            <div className="text-sm text-slate-600 space-y-1">
              {clinicInfo.address && <p>{clinicInfo.address}</p>}
              <div className="flex justify-center gap-4">
                {clinicInfo.phone && <span>{t('common.phone')}: {clinicInfo.phone}</span>}
                {clinicInfo.email && <span>{t('common.email')}: {clinicInfo.email}</span>}
              </div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">{t('prescriptionDetails.title')}</h2>
          <p className="text-md text-slate-600">{t('prescriptionDetails.prescriptionId')}: {prescription.id.slice(-8)}</p>
        </header>

        <main>
          <div className="print-section space-y-6">
            {/* Patient and Prescription Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-bold text-slate-700 mb-2">{t('prescriptionDetails.patientInfo')}</h3>
                <p className="text-sm"><strong>{t('prescriptionDetails.patientName')}:</strong> {patient.name}</p>
                <p className="text-sm"><strong>{t('prescriptionDetails.patientId')}:</strong> {patient.id.slice(-8)}</p>
                <p className="text-sm"><strong>{t('prescriptionDetails.patientPhone')}:</strong> {patient.phone}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-bold text-slate-700 mb-2">{t('prescriptionDetails.prescriptionInfo')}</h3>
                <p className="text-sm"><strong>{t('prescriptionDetails.dentist')}:</strong> {dentist?.name || t('common.unknownDentist')}</p>
                <p className="text-sm"><strong>{t('prescriptionDetails.date')}:</strong> {dateFormatter.format(new Date(prescription.prescriptionDate))}</p>
              </div>
            </div>

            {/* Notes */}
            {prescription.notes && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-bold text-slate-700 mb-2">{t('prescriptionDetails.notes')}</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{prescription.notes}</p>
              </div>
            )}

            {/* Medications */}
            <div>
              <h3 className="text-lg font-bold text-slate-700 mb-4">{t('prescriptionDetails.medications')}</h3>

              {prescriptionItems.length === 0 ? (
                <p className="text-center text-slate-500 py-8">{t('prescriptionDetails.noMedications')}</p>
              ) : (
                <div className="space-y-4">
                  {prescriptionItems.map((item, index) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-slate-800 text-lg">{item.medicationName}</h4>
                        <span className="text-sm text-slate-500">#{index + 1}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {item.dosage && (
                          <div>
                            <strong className="text-slate-600">{t('prescriptionDetails.dosage')}:</strong>
                            <p className="text-slate-800">{item.dosage}</p>
                          </div>
                        )}
                        <div>
                          <strong className="text-slate-600">{t('prescriptionDetails.quantity')}:</strong>
                          <p className="text-slate-800">{item.quantity}</p>
                        </div>
                        {item.instructions && (
                          <div className="md:col-span-3">
                            <strong className="text-slate-600">{t('prescriptionDetails.instructions')}:</strong>
                            <p className="text-slate-800">{item.instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-center">
              <p className="text-sm text-slate-600">{t('prescriptionDetails.footerNote')}</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PrintablePrescription;