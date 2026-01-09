import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ToastContainer from './ToastContainer';
import { useNotification } from '../contexts/NotificationContext';

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: UserRole.ADMIN,
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      addNotification('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('user_profiles')
          .update({
            username: formData.username,
            role: formData.role,
            permissions: formData.permissions.length > 0 ? formData.permissions : getDefaultPermissions(formData.role),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        addNotification('User updated successfully', 'success');
      } else {
        // Create new user
        // First create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        // Then create profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authData.user?.id,
            username: formData.username,
            role: formData.role,
            permissions: formData.permissions.length > 0 ? formData.permissions : getDefaultPermissions(formData.role),
            id: authData.user?.id, // Ensure consistent ID
          });

        if (profileError) throw profileError;
        addNotification('User created successfully', 'success');
      }

      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      addNotification(error.message || 'Failed to save user', 'error');
    }
  };

  const getDefaultPermissions = (role: UserRole): string[] => {
    switch (role) {
      case UserRole.ADMIN:
        return ['view_dashboard', 'manage_users', 'view_patients', 'edit_patients', 'view_scheduler', 'edit_scheduler', 'view_reports', 'view_finance', 'edit_finance'];
      case UserRole.DOCTOR:
        return ['view_dashboard', 'view_patients', 'edit_patients', 'view_scheduler', 'edit_scheduler', 'view_reports'];
      case UserRole.ASSISTANT:
        return ['view_dashboard', 'view_patients', 'edit_patients', 'view_scheduler', 'edit_scheduler'];
      case UserRole.RECEPTIONIST:
        return ['view_dashboard', 'view_patients', 'view_scheduler', 'edit_scheduler', 'view_reports'];
      default:
        return [];
    }
  };

  const handleEdit = (userProfile: UserProfile) => {
    setEditingUser(userProfile);
    setFormData({
      username: userProfile.username,
      email: '', // Email not stored in profile, would need separate query
      password: '',
      role: userProfile.role,
      permissions: userProfile.permissions || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      addNotification('User deleted successfully', 'success');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      addNotification('Failed to delete user', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: UserRole.ADMIN,
      permissions: [],
    });
  };

  const openCreateModal = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add New User
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((userProfile) => (
              <tr key={userProfile.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {userProfile.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {userProfile.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(userProfile.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(userProfile)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(userProfile.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                {!editingUser && (
                  <>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                  </>
                )}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setFormData({
                        ...formData,
                        role: newRole,
                        permissions: getDefaultPermissions(newRole) // Reset permissions when role changes
                      });
                    }}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value={UserRole.ADMIN}>Admin</option>
                    <option value={UserRole.DOCTOR}>Doctor</option>
                    <option value={UserRole.ASSISTANT}>Assistant</option>
                    <option value={UserRole.RECEPTIONIST}>Receptionist</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Permissions
                  </label>
                  <div className="max-h-40 overflow-y-auto border rounded p-2">
                    {[
                      { id: 'view_dashboard', label: 'View Dashboard' },
                      { id: 'manage_users', label: 'Manage Users' },
                      { id: 'view_patients', label: 'View Patients' },
                      { id: 'edit_patients', label: 'Edit Patients' },
                      { id: 'view_scheduler', label: 'View Scheduler' },
                      { id: 'edit_scheduler', label: 'Edit Scheduler' },
                      { id: 'view_reports', label: 'View Reports' },
                      { id: 'view_finance', label: 'View Finance' },
                      { id: 'edit_finance', label: 'Edit Finance' },
                    ].map((permission) => (
                      <label key={permission.id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              permissions: checked
                                ? [...prev.permissions, permission.id]
                                : prev.permissions.filter(p => p !== permission.id)
                            }));
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{permission.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Select specific permissions or leave empty to use role defaults
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mr-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default UserManagement;