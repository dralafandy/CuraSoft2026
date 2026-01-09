import React, { useState, useMemo } from 'react';
import { Patient, Prescription, PrescriptionItem, Dentist } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useClinicData } from '../../hooks/useClinicData';
import PrescriptionDetailsModal from './PrescriptionDetailsModal';

// Icons for UI elements
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

const PrescriptionList: React.FC<{
    patients: Patient[];
    prescriptions: Prescription[];
    prescriptionItems: PrescriptionItem[];
    dentists: Dentist[];
    onUpdatePrescription?: (patientId: string, prescription: Prescription) => void;
}> = ({ patients, prescriptions, prescriptionItems, dentists, onUpdatePrescription }) => {
    const { t, locale } = useI18n();
    const { clinicInfo } = useClinicData();
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        dentistId: ''
    });

    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });

    const filteredPrescriptions = useMemo(() => {
        let filtered = prescriptions.filter(p => patients.some(pt => pt.id === p.patientId));

        // Search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(prescription => {
                const patient = patients.find(p => p.id === prescription.patientId);
                const dentist = dentists.find(d => d.id === prescription.dentistId);
                const items = prescriptionItems.filter(item => item.prescriptionId === prescription.id);

                return (
                    patient?.name.toLowerCase().includes(term) ||
                    dentist?.name.toLowerCase().includes(term) ||
                    items.some(item => item.medicationName.toLowerCase().includes(term)) ||
                    prescription.notes?.toLowerCase().includes(term)
                );
            });
        }

        // Date range filter
        if (filters.startDate) {
            filtered = filtered.filter(p => new Date(p.prescriptionDate) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            filtered = filtered.filter(p => new Date(p.prescriptionDate) <= new Date(filters.endDate));
        }

        // Doctor filter
        if (filters.dentistId) {
            filtered = filtered.filter(p => p.dentistId === filters.dentistId);
        }

        return filtered.sort((a, b) => new Date(b.prescriptionDate).getTime() - new Date(a.prescriptionDate).getTime());
    }, [prescriptions, patients, dentists, prescriptionItems, searchTerm, filters]);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({ startDate: '', endDate: '', dentistId: '' });
        setSearchTerm('');
    };

    if (filteredPrescriptions.length === 0 && prescriptions.length === 0) {
        return <p className="text-center text-slate-500 py-10">{t('prescriptionList.noPrescriptions')}</p>;
    }

    return (
        <>
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">{t('prescriptionList.searchAndFilters')}</h3>
                    <button
                        onClick={clearFilters}
                        className="text-sm text-slate-600 hover:text-slate-800 underline"
                    >
                        {t('financialFilters.clearAll')}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Input */}
                    <div className="relative">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder={t('prescriptionList.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 ps-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Date Range */}
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 mb-2">
                            {t('financialFilters.startDate')}
                        </label>
                        <input
                            type="date"
                            id="start-date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        />
                    </div>

                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 mb-2">
                            {t('financialFilters.endDate')}
                        </label>
                        <input
                            type="date"
                            id="end-date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Doctor Filter */}
                    <div>
                        <label htmlFor="dentist-filter" className="block text-sm font-medium text-slate-700 mb-2">
                            {t('prescriptionList.doctor')}
                        </label>
                        <select
                            id="dentist-filter"
                            value={filters.dentistId}
                            onChange={(e) => handleFilterChange('dentistId', e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        >
                            <option value="">{t('prescriptionList.allDoctors')}</option>
                            {dentists.map(dentist => (
                                <option key={dentist.id} value={dentist.id}>{dentist.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Active Filters Display */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {searchTerm && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                            {t('prescriptionList.search')}: {searchTerm}
                            <button
                                onClick={() => setSearchTerm('')}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                                ×
                            </button>
                        </span>
                    )}
                    {filters.startDate && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                            {t('financialFilters.startDate')}: {new Date(filters.startDate).toLocaleDateString()}
                            <button
                                onClick={() => handleFilterChange('startDate', '')}
                                className="ml-2 text-green-600 hover:text-green-800"
                            >
                                ×
                            </button>
                        </span>
                    )}
                    {filters.endDate && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                            {t('financialFilters.endDate')}: {new Date(filters.endDate).toLocaleDateString()}
                            <button
                                onClick={() => handleFilterChange('endDate', '')}
                                className="ml-2 text-green-600 hover:text-green-800"
                            >
                                ×
                            </button>
                        </span>
                    )}
                    {filters.dentistId && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                            {t('prescriptionList.doctor')}: {dentists.find(d => d.id === filters.dentistId)?.name}
                            <button
                                onClick={() => handleFilterChange('dentistId', '')}
                                className="ml-2 text-purple-600 hover:text-purple-800"
                            >
                                ×
                            </button>
                        </span>
                    )}
                </div>
            </div>

            {/* Prescriptions List */}
            <div className="space-y-4">
                {filteredPrescriptions.length > 0 ? (
                    filteredPrescriptions.map(prescription => {
                        const patient = patients.find(p => p.id === prescription.patientId);
                        const dentist = dentists.find(d => d.id === prescription.dentistId);
                        const items = prescriptionItems.filter(item => item.prescriptionId === prescription.id);

                        return (
                            <div key={prescription.id} className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg">{t('prescriptionList.prescription')} #{prescription.id.slice(-8)}</h4>
                                        <p className="text-sm text-slate-600">
                                            {t('prescriptionList.patient')}: {patient?.name || t('common.unknownPatient')} |
                                            {dentist?.name || t('common.unknownDentist')} |
                                            {dateFormatter.format(new Date(prescription.prescriptionDate))}
                                        </p>
                                    </div>
                                    <span className="text-sm text-slate-500">{items.length} {t('prescriptionList.items')}</span>
                                </div>
                                <p className="text-sm text-slate-700 mb-3 whitespace-pre-wrap">{prescription.notes || t('prescriptionList.noNotes')}</p>

                                {items.length > 0 && (
                                    <div className="mt-3 p-3 bg-neutral rounded-lg">
                                        <p className="font-semibold text-sm text-slate-700 mb-1">{t('prescriptionList.medications')}:</p>
                                        <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                                            {items.map((item, index) => (
                                                <li key={index}>
                                                    {item.medicationName} - {t('prescriptionList.quantity')}: {item.quantity}
                                                    {item.dosage && ` (${t('prescriptionList.dosage')}: ${item.dosage})`}
                                                    {item.instructions && ` - ${item.instructions}`}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={() => setSelectedPrescription(prescription)}
                                        className="bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary-dark text-xs focus:outline-none focus:ring-2 focus:ring-primary-light"
                                    >
                                        {t('common.viewDetails')}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-center text-slate-500 py-10">
                        {prescriptions.length === 0 ? t('prescriptionList.noPrescriptions') : t('prescriptionList.noPrescriptionsFound')}
                    </p>
                )}
            </div>

            {selectedPrescription && (() => {
                const patient = patients.find(p => p.id === selectedPrescription.patientId);
                return patient ? (
                    <PrescriptionDetailsModal
                        prescription={selectedPrescription}
                        patient={patient}
                        prescriptions={prescriptions}
                        prescriptionItems={prescriptionItems}
                        dentists={dentists}
                        clinicInfo={clinicInfo}
                        onClose={() => setSelectedPrescription(null)}
                        onUpdate={onUpdatePrescription ? (updatedPrescription) => {
                            onUpdatePrescription(selectedPrescription.patientId, updatedPrescription);
                            setSelectedPrescription(null);
                        } : undefined}
                    />
                ) : null;
            })()}
        </>
    );
};

export default PrescriptionList;