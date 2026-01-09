import React, { useState } from 'react';
import { useClinicData } from '../../hooks/useClinicData';
import { DoctorPayment, Dentist } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../contexts/AuthContext';
import AddDoctorPaymentModal from './AddDoctorPaymentModal';

const DoctorAccountsManagement: React.FC<{}> = () => {
   const { t } = useI18n();
   const { userProfile } = useAuth();
   const { doctorPayments, dentists, addDoctorPayment, updateDoctorPayment, deleteDoctorPayment } = useClinicData();
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingPayment, setEditingPayment] = useState<DoctorPayment | null>(null);
   const [selectedDentistId, setSelectedDentistId] = useState<string>('');

  const resetForm = () => {
    setSelectedDentistId('');
    setEditingPayment(null);
  };

  const handleAddPayment = (payment: Omit<DoctorPayment, 'id'>) => {
    addDoctorPayment(payment);
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (payment: DoctorPayment) => {
    setEditingPayment(payment);
    setSelectedDentistId(payment.dentistId);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('common.confirmDelete'))) {
      try {
        await deleteDoctorPayment(id);
      } catch (error) {
        console.error('Error deleting doctor payment:', error);
      }
    }
  };

  const getDentistName = (dentistId: string) => {
    const dentist = dentists.find(d => d.id === dentistId);
    return dentist ? dentist.name : t('common.unknown');
  };

  if (!userProfile?.permissions?.includes('view_finance')) {
    return <div className="text-center py-8">{t('common.accessDenied')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{t('doctorAccounts.title')}</h2>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t('doctorAccounts.doctor')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t('doctorAccounts.amount')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t('doctorAccounts.date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t('doctorAccounts.notes')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {doctorPayments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {getDentistName(payment.dentistId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  ${payment.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {new Date(payment.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {payment.notes || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(payment)}
                    className="text-primary hover:text-primary-dark mr-4"
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(payment.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {doctorPayments.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            {t('doctorAccounts.noPayments')}
          </div>
        )}
      </div>

      {isModalOpen && (
        <AddDoctorPaymentModal
          dentistId={selectedDentistId}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddPayment}
          doctorPayments={doctorPayments}
        />
      )}
    </div>
  );
};

export default DoctorAccountsManagement;
