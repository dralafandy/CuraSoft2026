import React from 'react';
import { View } from '../types';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../contexts/AuthContext';

const UserManagementIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>;

const ToothIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V10.5" />
    </svg>
);
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const PatientsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const SchedulerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const DoctorsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h8a2 2 0 002-2v-3a2 2 0 00-2-2H9.5m3.5-6.5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ReportsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const SuppliersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 1a3 3 0 00-3 3v1h10V4a3 3 0 00-3-3H8zM5 6v10a2 2 0 002 2h10a2 2 0 002-2V6H5z" /></svg>;
const InventoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const LabCaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const ExpensesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const TreatmentDefinitionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const FinancialAccountsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const AccountingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;


interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { t } = useI18n();
  const { user, logout, isAdmin } = useAuth();

  const { userProfile } = useAuth();

  const getNavItems = () => {
    const baseItems = [
      { id: 'dashboard', label: t('sidebar.dashboard'), icon: <DashboardIcon />, permissions: ['view_dashboard'] },
      { id: 'patients', label: t('sidebar.patients'), icon: <PatientsIcon />, permissions: ['view_patients'] },
      { id: 'scheduler', label: t('sidebar.scheduler'), icon: <SchedulerIcon />, permissions: ['view_scheduler'] },
      { id: 'doctors', label: t('sidebar.doctors'), icon: <DoctorsIcon />, permissions: ['view_patients'] },
      { id: 'suppliers', label: t('sidebar.suppliers'), icon: <SuppliersIcon />, permissions: ['view_finance'] },
      { id: 'inventory', label: t('sidebar.inventory'), icon: <InventoryIcon />, permissions: ['view_finance'] },
      { id: 'labCases', label: t('sidebar.labCases'), icon: <LabCaseIcon />, permissions: ['view_finance'] },
      { id: 'expenses', label: t('sidebar.expenses'), icon: <ExpensesIcon />, permissions: ['view_finance'] },
      { id: 'treatmentDefinitions', label: t('sidebar.treatmentDefinitions'), icon: <TreatmentDefinitionsIcon />, permissions: ['view_finance'] },
      { id: 'reports', label: t('sidebar.reports'), icon: <ReportsIcon />, permissions: ['view_reports'] },
      { id: 'accounting', label: t('accounting.title'), icon: <AccountingIcon />, permissions: ['view_reports'] },

      { id: 'settings', label: t('sidebar.settings'), icon: <SettingsIcon />, permissions: ['view_dashboard'] },
    ];

    // Add user management only for admins
    if (isAdmin) {
      baseItems.push({ id: 'userManagement', label: t('sidebar.userManagement'), icon: <UserManagementIcon />, permissions: ['manage_users'] });
    }

    // Filter items based on user permissions
    return baseItems.filter(item =>
      !item.permissions || item.permissions.some(permission =>
        userProfile?.permissions?.includes(permission)
      )
    );
  };

  const navItems = getNavItems();

  // Group the nav items
  const groups = [
    {
      label: t('sidebar.group.records'),
      items: navItems.filter(item => ['dashboard', 'patients', 'doctors', 'treatmentDefinitions', 'suppliers'].includes(item.id)),
    },
    {
      label: t('sidebar.group.appointments'),
      items: navItems.filter(item => item.id === 'scheduler'),
    },
    {
      label: t('sidebar.group.materialsLabs'),
      items: navItems.filter(item => ['inventory', 'labCases'].includes(item.id)),
    },
    {
      label: t('sidebar.group.finance'),
      items: navItems.filter(item => ['expenses'].includes(item.id)),
    },
    {
      label: t('sidebar.group.reports'),
      items: navItems.filter(item => ['reports', 'accounting'].includes(item.id)),
    },
    {
      label: t('sidebar.group.settings'),
      items: navItems.filter(item => ['settings', 'userManagement'].includes(item.id)),
    },
  ];

  return (
    <nav className="hidden md:flex bg-primary-dark text-white w-20 lg:w-64 flex-col transition-all duration-300 print:hidden">
      <div className="flex items-center justify-center lg:justify-start p-4 h-16 border-b border-primary-dark/50">
        <ToothIcon />
        <h1 className="hidden lg:block ms-3 text-xl font-bold">{t('appName')}</h1>
      </div>
      <ul className="flex-1 mt-6">
        {groups.map((group, groupIndex) => (
          <li key={group.label}>
            <div className="mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-1">
                {group.label}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.id} className="px-4">
                    <button
                      onClick={() => setCurrentView(item.id as View)}
                      className={`flex items-center w-full p-3 my-1 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                        currentView === item.id
                          ? 'bg-white/20 text-white shadow-sm'
                          : 'text-sky-100 hover:bg-white/10'
                      }`}
                      aria-current={currentView === item.id ? 'page' : undefined}
                    >
                      {item.icon}
                      <span className="hidden lg:block ms-4 font-semibold">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {groupIndex < groups.length - 1 && (
              <div className="my-4">
                <div className="h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="p-4 border-t border-primary-dark/50 space-y-4">
        <button
          onClick={logout}
          className="flex items-center w-full p-3 rounded-lg text-sky-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label={t('auth.logout.button')}
        >
          <LogoutIcon />
          <span className="hidden lg:block ms-4 font-semibold">{t('auth.logout.button')}</span>
        </button>
        <div className="flex items-center">
            <img src="https://picsum.photos/40/40" alt={t('sidebar.adminProfile')} className="rounded-full" />
            <div className="hidden lg:block ms-3">
                {/* Fix: Replace user.username with user.email, as the Supabase User object does not have a 'username' property. */}
                <p className="font-semibold text-sm">{userProfile?.username || user?.email || t('sidebar.drAdmin')}</p>
                <p className="text-xs text-sky-200">{userProfile?.role || (isAdmin ? 'Admin' : 'User')}</p>
            </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
