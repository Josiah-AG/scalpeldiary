import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Camera, User } from 'lucide-react';

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>('');
  const [editingSpecialty, setEditingSpecialty] = useState(false);
  const { user, setAuth } = useAuthStore();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/users/me');
      setProfilePicture(response.data.profile_picture || '');
      setSpecialty(response.data.specialty || '');
    } catch (error) {
      console.error('Failed to fetch profile');
    }
  };

  const handleUpdateSpecialty = async () => {
    try {
      await api.put('/users/specialty', { specialty });
      alert('Specialty updated successfully');
      setEditingSpecialty(false);
    } catch (error) {
      alert('Failed to update specialty');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      alert('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      alert('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        await api.post('/users/profile-picture', { profilePicture: base64String });
        setProfilePicture(base64String);
        
        // Update auth store with new profile picture
        if (user) {
          const updatedUser = { ...user, profile_picture: base64String };
          setAuth(updatedUser, useAuthStore.getState().token!);
        }
        
        alert('Profile picture updated successfully');
      } catch (error) {
        alert('Failed to upload profile picture');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get('/logs/my-logs');
      const logs = response.data;

      const doc = new jsPDF();
      doc.text('Surgical Logs', 14, 15);

      autoTable(doc, {
        startY: 25,
        head: [['Date', 'Procedure', 'Diagnosis', 'Role', 'Rating']],
        body: logs.map((log: any) => [
          log.date,
          log.procedure,
          log.diagnosis,
          log.surgery_role,
          log.rating || 'N/A',
        ]),
      });

      doc.save('surgical-logs.pdf');
    } catch (error) {
      alert('Failed to export logs');
    }
  };

  return (
    <Layout title="Settings">
      <div className="max-w-4xl space-y-8">
        {/* Profile Picture Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <User className="mr-2 text-blue-600" size={20} />
            Profile Information
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={64} className="text-white" />
                )}
              </div>
              <label
                htmlFor="profile-upload"
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg transition-colors"
              >
                <Camera size={20} />
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h4 className="text-xl font-bold text-gray-900">{user?.name}</h4>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-sm text-gray-500 mt-2">
                Click the camera icon to upload a new profile picture
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Max size: 2MB • Formats: JPG, PNG, GIF
              </p>
            </div>
          </div>
          
          {/* Specialty Field */}
          <div className="mt-6 pt-6 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
            {editingSpecialty ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., General Surgery"
                />
                <button
                  onClick={handleUpdateSpecialty}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingSpecialty(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-gray-900">{specialty || 'Not set'}</p>
                <button
                  onClick={() => setEditingSpecialty(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Export Logs Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Export Logs</h3>
          <button
            onClick={handleExportPDF}
            className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors"
          >
            Export to PDF
          </button>
        </div>
      </div>
    </Layout>
  );
}
