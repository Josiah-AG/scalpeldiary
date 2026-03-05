import { useState } from 'react';
import Layout from '../../components/Layout';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';

export default function SupervisorSettings() {
  const { user, setUser } = useAuthStore();
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilePicture) return;

    const formData = new FormData();
    formData.append('profilePicture', profilePicture);

    try {
      const response = await api.post('/users/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser({ ...user!, profilePicture: response.data.profilePicture });
      setMessage('Profile picture updated successfully!');
      setError('');
      setProfilePicture(null);
      setPreviewUrl(null);
    } catch (err) {
      setError('Failed to upload profile picture');
      setMessage('');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await api.post('/users/change-password', {
        currentPassword,
        newPassword
      });
      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <Layout title="Settings">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Picture Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
          
          <div className="flex items-center space-x-6 mb-4">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {previewUrl || user?.profilePicture ? (
                <img 
                  src={previewUrl || user?.profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl text-gray-400">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Upload a new profile picture
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-sm"
              />
            </div>
          </div>

          {profilePicture && (
            <button
              onClick={handleProfilePictureUpload}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Upload Picture
            </button>
          )}
        </div>

        {/* Password Change Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Change Password
            </button>
          </form>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
    </Layout>
  );
}
