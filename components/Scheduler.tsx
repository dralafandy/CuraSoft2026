import React, { useState, useMemo, useCallback } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { Appointment, AppointmentStatus, Patient, Dentist } from '../types';
import { useI18n } from '../hooks/useI18n';
import { useNotification } from '../contexts/NotificationContext';
import { NotificationType } from '../types';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>;


const AddAppointmentModal: React.FC<{
    onClose: () => void;
    onSave: (appointment: Omit<Appointment, 'id'>) => void;
    clinicData: ClinicData;
    initialDateTime?: Date;
    appointmentToEdit?: Appointment;
}> = ({ onClose, onSave, clinicData, initialDateTime, appointmentToEdit }) => {
    const { t } = useI18n();
    const { addNotification } = useNotification();
    
    const [formData, setFormData] = useState(() => {
        const initial = appointmentToEdit || {
            patientId: '',
            dentistId: '',
            startTime: initialDateTime || new Date(),
            endTime: initialDateTime ? new Date(initialDateTime.getTime() + 60 * 60000) : new Date(Date.now() + 60 * 60000),
            reason: '',
            status: AppointmentStatus.SCHEDULED,
            reminderTime: '1_day_before',
            // FIX: Add reminderSent for new appointments to match the expected type.
            reminderSent: false,
        };
        const formatForInput = (date: Date) => {
            const tzoffset = (new Date()).getTimezoneOffset() * 60000;
            const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
            return localISOTime;
        }

        return {
            ...initial,
            startTime: formatForInput(new Date(initial.startTime)),
            endTime: formatForInput(new Date(initial.endTime)),
        };
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('DEBUG: handleSubmit called with formData:', formData);
        if(!formData.patientId || !formData.dentistId || !formData.startTime || !formData.endTime) {
            console.log('DEBUG: Validation failed - missing required fields');
            addNotification(t('addAppointmentModal.alertFillAllFields'), NotificationType.ERROR);
            return;
        }
        console.log('DEBUG: Validation passed, calling onSave');
        // FIX: Explicitly construct the object to ensure it matches Omit<Appointment, 'id'>
        // This removes the 'id' property when editing and ensures 'reminderSent' is always present.
        onSave({
            patientId: formData.patientId,
            dentistId: formData.dentistId,
            startTime: new Date(formData.startTime),
            endTime: new Date(formData.endTime),
            reason: formData.reason,
            status: formData.status as AppointmentStatus,
            reminderTime: formData.reminderTime as Appointment['reminderTime'],
            reminderSent: formData.reminderSent,
        });
        console.log('DEBUG: onSave called successfully');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-700">{appointmentToEdit ? t('scheduler.editAppointment') : t('scheduler.newAppointment')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('addAppointmentModal.closeAriaLabel')}>
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="patientId" className="block text-sm font-medium text-slate-600">{t('addAppointmentModal.patient')}</label>
                        <select name="patientId" id="patientId" value={formData.patientId} onChange={handleChange} className="mt-1 p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required>
                            <option value="">{t('addAppointmentModal.selectPatient')}</option>
                            {clinicData.patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dentistId" className="block text-sm font-medium text-slate-600">{t('addAppointmentModal.dentist')}</label>
                         <select name="dentistId" id="dentistId" value={formData.dentistId} onChange={handleChange} className="mt-1 p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required>
                            <option value="">{t('addAppointmentModal.selectDentist')}</option>
                            {clinicData.dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startTime" className="block text-sm font-medium text-slate-600">{t('addAppointmentModal.startTime')}</label>
                            <input type="datetime-local" id="startTime" name="startTime" value={formData.startTime} onChange={handleChange} className="mt-1 p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required />
                        </div>
                        <div>
                            <label htmlFor="endTime" className="block text-sm font-medium text-slate-600">{t('addAppointmentModal.endTime')}</label>
                            <input type="datetime-local" id="endTime" name="endTime" value={formData.endTime} onChange={handleChange} className="mt-1 p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-slate-600">{t('addAppointmentModal.reasonForVisit')}</label>
                        <textarea name="reason" id="reason" value={formData.reason} onChange={handleChange} className="mt-1 p-2 border border-slate-300 rounded-lg w-full h-24 focus:ring-primary focus:border-primary" placeholder={t('addAppointmentModal.reasonPlaceholder')} required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                             <label htmlFor="status" className="block text-sm font-medium text-slate-600">{t('scheduler.status')}</label>
                             <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required>
                                {Object.values(AppointmentStatus).map(s => <option key={s} value={s}>{t(`appointmentStatus.${s}`)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="reminderTime" className="block text-sm font-medium text-slate-600">{t('reminders.reminderTime')}</label>
                            <select name="reminderTime" id="reminderTime" value={formData.reminderTime} onChange={handleChange} className="mt-1 p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required>
                                <option value="none">{t('reminders.none')}</option>
                                <option value="1_hour_before">{t('reminders.1_hour_before')}</option>
                                <option value="2_hours_before">{t('reminders.2_hours_before')}</option>
                                <option value="1_day_before">{t('reminders.1_day_before')}</option>
                            </select>
                        </div>
                    </div>
                    <footer className="pt-2 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-dark rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light">{t('addAppointmentModal.schedule')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const AppointmentDetailsModal: React.FC<{
    appointment: Appointment;
    patient?: Patient;
    dentist?: Dentist;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ appointment, patient, dentist, onClose, onEdit, onDelete }) => {
    const { t, locale } = useI18n();
    const dateTimeFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDelete = () => {
        onDelete();
        onClose();
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-700">{t('scheduler.appointmentDetails')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <main className="p-6 space-y-4">
                    <p><strong>{t('addAppointmentModal.patient')}:</strong> {patient?.name || t('common.unknownPatient')}</p>
                    <p><strong>{t('addAppointmentModal.dentist')}:</strong> {dentist?.name || t('common.unknownDentist')}</p>
                    <p><strong>{t('addAppointmentModal.reasonForVisit')}:</strong> {appointment.reason}</p>
                    <p><strong>{t('scheduler.dateTime')}:</strong> {dateTimeFormatter.format(appointment.startTime)}</p>
                    <p><strong>{t('scheduler.duration')}:</strong> {(appointment.endTime.getTime() - appointment.startTime.getTime()) / 60000} {t('scheduler.minutes')}</p>
                    <p><strong>{t('scheduler.status')}:</strong> <span className="font-semibold">{t(`appointmentStatus.${appointment.status}`)}</span></p>
                </main>
                <footer className="pt-2 p-4 flex justify-between items-center bg-slate-50">
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                    >
                        {t('common.delete')}
                    </button>
                    <div className="flex space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-dark rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300">{t('common.close')}</button>
                        <button type="button" onClick={onEdit} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light">{t('common.edit')}</button>
                    </div>
                </footer>
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
                        <header className="p-4 border-b">
                            <h2 className="text-xl font-bold text-slate-700">{t('scheduler.confirmDelete')}</h2>
                        </header>
                        <main className="p-6">
                            <p>{t('scheduler.deleteAppointmentConfirm')}</p>
                        </main>
                        <footer className="pt-2 p-4 flex justify-end space-x-4 bg-slate-50">
                            <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-neutral-dark rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300">{t('common.cancel')}</button>
                            <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300">{t('common.delete')}</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}

const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const Scheduler: React.FC<{ clinicData: ClinicData }> = ({ clinicData }) => {
    const { appointments, patients, dentists, addAppointment, updateAppointment, deleteAppointment } = clinicData;
    const { t, locale } = useI18n();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [modalState, setModalState] = useState<{ type: 'add' | 'details' | 'edit' | null; data?: any }>({ type: null });
    const [workStartHour, setWorkStartHour] = useState(14);
    const [workEndHour, setWorkEndHour] = useState(24);

    const timeFormatter = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: true });
    
    const appointmentsByDay = useMemo(() => {
        const map = new Map<string, Set<string>>();
        appointments.forEach(apt => {
            const dateStr = toLocalDateString(apt.startTime);
            const dentist = dentists.find(d => d.id === apt.dentistId);
            if (dentist) {
                if (!map.has(dateStr)) map.set(dateStr, new Set());
                map.get(dateStr)!.add(dentist.color);
            }
        });
        return map;
    }, [appointments, dentists]);
    const { daysInMonth, firstDayOfMonth } = useMemo(() => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        return {
            daysInMonth: new Date(year, month + 1, 0).getDate(),
            firstDayOfMonth: new Date(year, month, 1).getDay(),
        };
    }, [calendarDate]);

    const handlePrevMonth = () => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const handleNextMonth = () => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    const dailyAppointments = useMemo(() => {
        return appointments
            .filter(apt => isSameDay(apt.startTime, selectedDate))
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }, [appointments, selectedDate]);

    const timeSlots = useMemo(() => {
        if (workEndHour <= workStartHour) return [];
        return Array.from({ length: workEndHour - workStartHour }, (_, i) => workStartHour + i);
    }, [workStartHour, workEndHour]);

    const handleSaveAppointment = (appointmentData: Omit<Appointment, 'id'>) => {
        console.log('DEBUG: handleSaveAppointment called with data:', appointmentData);
        if (modalState.type === 'edit') {
            console.log('DEBUG: Editing existing appointment');
            updateAppointment({ ...appointmentData, id: modalState.data.id });
        } else {
            console.log('DEBUG: Adding new appointment');
            addAppointment(appointmentData);
        }
        setModalState({ type: null });
    };

    const handleDeleteAppointment = (appointmentId: string) => {
        deleteAppointment(appointmentId);
        setModalState({ type: null });
    };

    const handleSlotClick = (hour: number) => {
        const newDate = new Date(selectedDate);
        newDate.setHours(hour, 0, 0, 0);
        setModalState({ type: 'add', data: { initialDateTime: newDate } });
    };
    
    const dateHeaderFormatter = new Intl.DateTimeFormat(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const monthYearFormatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
    const dayOfWeekShortFormatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md flex flex-col h-full">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 print:hidden">
                <div>
                    <h2 className="text-xl font-bold text-slate-700">{dateHeaderFormatter.format(selectedDate)}</h2>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 mt-2">
                        <div className="flex items-center gap-2">
                            <label htmlFor="start-hour" className="font-medium">{t('scheduler.showFrom')}:</label>
                            <select id="start-hour" value={workStartHour} onChange={(e) => setWorkStartHour(parseInt(e.target.value, 10))} className="p-1 border border-slate-300 rounded-md bg-white focus:ring-primary focus:border-primary">
                                {Array.from({length: 24}).map((_, i) => <option key={i} value={i}>{timeFormatter.format(new Date(0,0,0,i))}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="end-hour" className="font-medium">{t('scheduler.to')}:</label>
                            <select id="end-hour" value={workEndHour} onChange={(e) => setWorkEndHour(parseInt(e.target.value, 10))} className="p-1 border border-slate-300 rounded-md bg-white focus:ring-primary focus:border-primary">
                                {Array.from({length: 25}).map((_, i) => i > 0 && <option key={i} value={i}>{timeFormatter.format(new Date(0,0,0,i))}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <button onClick={() => setModalState({ type: 'add', data: { initialDateTime: selectedDate } })} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary-light self-start sm:self-center">{t('scheduler.newAppointment')}</button>
            </header>

            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                <div className="w-full md:w-72 flex-shrink-0 print:hidden">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-slate-700">{monthYearFormatter.format(calendarDate)}</h3>
                        <div className="flex">
                             <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('scheduler.previousWeek')}><ChevronLeftIcon /></button>
                             <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('scheduler.nextWeek')}><ChevronRightIcon /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => <div key={i} className="text-slate-500 font-semibold text-xs">{dayOfWeekShortFormatter.format(new Date(2023, 0, i + 1))}</div>)}
                        {Array.from({length: firstDayOfMonth}).map((_, i) => <div key={`empty-${i}`}></div>)}
                        {Array.from({length: daysInMonth}).map((_, day) => {
                            const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day + 1);
                            const dateStr = toLocalDateString(date);
                            const isSelected = isSameDay(date, selectedDate);
                            const isToday = isSameDay(date, new Date());
                            const dots = appointmentsByDay.get(dateStr);
                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => setSelectedDate(date)}
                                    className={`relative p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-light ${isSelected ? 'bg-primary text-white' : isToday ? 'bg-slate-200' : 'hover:bg-slate-100'}`}
                                >
                                    {day + 1}
                                    {dots && <div className="absolute bottom-1 start-1/2 -translate-x-1/2 flex gap-0.5">{Array.from(dots).slice(0,3).map(color => <span key={color} className={`block w-1.5 h-1.5 rounded-full ${color}`}></span>)}</div>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 relative overflow-y-auto border-s border-e border-slate-200">
                    <div className="grid grid-cols-[auto_1fr] h-full">
                        <div className="w-16 text-end text-sm text-slate-500">
                            {timeSlots.map(hour => (
                                <div key={hour} className="h-16 relative -top-2 pe-2">{timeFormatter.format(new Date(0,0,0,hour))}</div>
                            ))}
                        </div>

                        <div className="relative">
                            {timeSlots.map(hour => {
                                const hourStart = hour;
                                const hourEnd = hour + 1;
                                const appointmentsInHour = dailyAppointments.filter(apt => {
                                    const aptHour = apt.startTime.getHours();
                                    return aptHour >= hourStart && aptHour < hourEnd;
                                });

                                return (
                                    <div key={hour} className="h-16 border-t border-slate-200 flex items-start gap-1 p-1" onClick={() => handleSlotClick(hour)} role="button">
                                        {appointmentsInHour.map(apt => {
                                            const startMinutes = apt.startTime.getHours() * 60 + apt.startTime.getMinutes();
                                            const endMinutes = apt.endTime.getHours() * 60 + apt.endTime.getMinutes();
                                            const durationMinutes = endMinutes - startMinutes;
                                            const height = Math.max((durationMinutes / 60) * 4, 1); // Minimum height

                                            const patient = patients.find(p => p.id === apt.patientId);
                                            const dentist = dentists.find(d => d.id === apt.dentistId);

                                            return (
                                                <div
                                                    key={apt.id}
                                                    className={`flex-1 p-2 rounded-lg text-white shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-lg ${dentist?.color || 'bg-slate-500'}`}
                                                    style={{ height: `${height}rem`, minWidth: '120px' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setModalState({ type: 'details', data: apt });
                                                    }}
                                                >
                                                    <p className="font-semibold text-xs truncate">{patient?.name}</p>
                                                    <p className="text-xs opacity-90 truncate">{apt.reason}</p>
                                                    <p className="text-xs opacity-75 truncate">{dentist?.name}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {modalState.type === 'add' && <AddAppointmentModal onClose={() => setModalState({ type: null })} onSave={handleSaveAppointment} clinicData={clinicData} initialDateTime={modalState.data.initialDateTime} />}
            {modalState.type === 'edit' && <AddAppointmentModal onClose={() => setModalState({ type: null })} onSave={handleSaveAppointment} clinicData={clinicData} appointmentToEdit={modalState.data} />}
            {modalState.type === 'details' && (
                <AppointmentDetailsModal
                    appointment={modalState.data}
                    patient={patients.find(p => p.id === modalState.data.patientId)}
                    dentist={dentists.find(d => d.id === modalState.data.dentistId)}
                    onClose={() => setModalState({ type: null })}
                    onEdit={() => setModalState({ type: 'edit', data: modalState.data })}
                    onDelete={() => handleDeleteAppointment(modalState.data.id)}
                />
            )}
        </div>
    );
};

export default Scheduler;
