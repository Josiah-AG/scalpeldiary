import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Camera, User, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { getRatingLabel } from '../../utils/ratingUtils';

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>('');
  const [editingSpecialty, setEditingSpecialty] = useState(false);
  const { user, setAuth } = useAuthStore();

  // Export state
  const [exportYear, setExportYear] = useState<string>('');
  const [exportMonth, setExportMonth] = useState<string>('');
  const [exportIncludeAnalytics, setExportIncludeAnalytics] = useState(false);
  const [exportCategory, setExportCategory] = useState<string>('');
  const [exportInstitution, setExportInstitution] = useState<string>('');
  const [years, setYears] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      const response = await api.get('/users/resident-years/me');
      setYears(response.data);
      if (response.data.length > 0) setExportYear(response.data[response.data.length - 1].id);
    } catch (error) { console.error('Failed to fetch years'); }
  };

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
    if (!exportYear) { alert('Please select a year'); return; }
    setExporting(true);
    try {
      // Fetch data
      const [logsRes, presRes] = await Promise.all([
        api.get(`/logs/my-logs?yearId=${exportYear}`),
        api.get(`/presentations/my-presentations?yearId=${exportYear}`)
      ]);

      let logs = logsRes.data;
      let presentations = presRes.data;

      // Apply filters
      if (exportMonth) {
        logs = logs.filter((l: any) => l.date?.startsWith(exportMonth));
        presentations = presentations.filter((p: any) => p.date?.startsWith(exportMonth));
      }
      if (exportCategory) {
        logs = logs.filter((l: any) => l.procedure_category === exportCategory);
      }
      if (exportInstitution) {
        logs = logs.filter((l: any) => l.place_of_practice === exportInstitution);
        presentations = presentations.filter((p: any) => p.venue === exportInstitution);
      }

      // Fetch analytics if needed
      let analytics: any = null;
      if (exportIncludeAnalytics) {
        const analyticsRes = await api.get(`/analytics/resident?yearId=${exportYear}`);
        analytics = analyticsRes.data;
      }

      const yearData = years.find((y: any) => y.id == exportYear);
      const yearLabel = yearData ? `Year ${yearData.year}` : '';
      const monthLabel = exportMonth ? format(new Date(exportMonth + '-01'), 'MMMM yyyy') : 'Full Year';

      // Create PDF
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 15;

      // Header
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('ScalpelDiary', 14, 15);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${user?.name} — ${yearLabel}`, 14, 23);
      doc.text(`Report: ${monthLabel}  |  Generated: ${format(new Date(), 'MMM dd, yyyy')}`, 14, 30);
      y = 42;

      // Analytics summary
      if (analytics && exportIncludeAnalytics) {
        doc.setTextColor(37, 99, 235);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 14, y);
        y += 8;

        doc.setTextColor(60, 60, 60);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const stats = [
          ['Total Procedures', String(analytics.totalSurgeries), 'Verified Procedures', String(analytics.verifiedSurgeries)],
          ['Total Presentations', String(analytics.totalPresentations), 'Verified Presentations', String(analytics.verifiedPresentations)],
          ['Avg Procedure Rating', analytics.averageRating ? analytics.averageRating.toFixed(1) : 'N/A', 'Avg Presentation Rating', analytics.avgPresentationRating ? analytics.avgPresentationRating.toFixed(1) : 'N/A'],
        ];
        autoTable(doc, {
          startY: y,
          head: [['Metric', 'Value', 'Metric', 'Value']],
          body: stats,
          theme: 'grid',
          headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } },
          margin: { left: 14, right: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;

        // Role distribution
        if (analytics.roleDistribution && Object.keys(analytics.roleDistribution).length > 0) {
          doc.setTextColor(37, 99, 235);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('Role Distribution', 14, y);
          y += 6;
          autoTable(doc, {
            startY: y,
            head: [['Role', 'Count']],
            body: Object.entries(analytics.roleDistribution).map(([role, count]) => [role.replace(/_/g, ' '), String(count)]),
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            margin: { left: 14, right: 14 },
            tableWidth: 100,
          });
          y = (doc as any).lastAutoTable.finalY + 10;
        }
      }

      // Procedures table
      if (logs.length > 0) {
        if (y > 240) { doc.addPage(); y = 15; }
        doc.setTextColor(37, 99, 235);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Procedures (${logs.length})`, 14, y);
        y += 6;

        autoTable(doc, {
          startY: y,
          head: [['#', 'Date', 'MRN', 'Procedure', 'Category', 'Role', 'Institution', 'Supervisor', 'Rating']],
          body: logs.map((log: any, i: number) => [
            i + 1,
            log.date ? format(new Date(log.date), 'MM/dd/yy') : '',
            log.mrn,
            log.procedure,
            log.procedure_category || '',
            (log.surgery_role || '').replace(/_/g, ' '),
            log.place_of_practice || '',
            log.supervisor_name || log.external_supervisor_name || '',
            log.rating ? getRatingLabel(log.rating) : log.status === 'NOT_WITNESSED' ? 'N/A' : log.is_detachment ? 'Detachment' : 'Pending',
          ]),
          theme: 'grid',
          headStyles: { fillColor: [37, 99, 235], fontSize: 7, cellPadding: 2 },
          bodyStyles: { fontSize: 7, cellPadding: 1.5 },
          columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 18 }, 2: { cellWidth: 16 } },
          margin: { left: 8, right: 8 },
          didParseCell: (data: any) => {
            if (data.column.index === 8 && data.section === 'body') {
              const val = data.cell.text[0];
              if (val === 'Excellent') data.cell.styles.textColor = [22, 163, 74];
              else if (val === 'Good') data.cell.styles.textColor = [37, 99, 235];
              else if (val === 'Satisfactory') data.cell.styles.textColor = [202, 138, 4];
              else if (val === 'Poor') data.cell.styles.textColor = [220, 38, 38];
            }
          },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // Presentations table
      if (presentations.length > 0) {
        if (y > 240) { doc.addPage(); y = 15; }
        doc.setTextColor(37, 99, 235);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Presentations (${presentations.length})`, 14, y);
        y += 6;

        autoTable(doc, {
          startY: y,
          head: [['#', 'Date', 'Title', 'Type', 'Venue', 'Moderator', 'Rating']],
          body: presentations.map((p: any, i: number) => [
            i + 1,
            p.date ? format(new Date(p.date), 'MM/dd/yy') : '',
            p.title,
            (p.presentation_type || '').replace(/_/g, ' '),
            p.venue || '',
            p.supervisor_name || p.external_supervisor_name || '',
            p.rating ? getRatingLabel(p.rating) : p.status === 'NOT_WITNESSED' ? 'N/A' : p.is_detachment ? 'Detachment' : 'Pending',
          ]),
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129], fontSize: 8, cellPadding: 2 },
          bodyStyles: { fontSize: 8, cellPadding: 1.5 },
          columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 18 } },
          margin: { left: 8, right: 8 },
          didParseCell: (data: any) => {
            if (data.column.index === 6 && data.section === 'body') {
              const val = data.cell.text[0];
              if (val === 'Excellent') data.cell.styles.textColor = [22, 163, 74];
              else if (val === 'Good') data.cell.styles.textColor = [37, 99, 235];
              else if (val === 'Satisfactory') data.cell.styles.textColor = [202, 138, 4];
              else if (val === 'Poor') data.cell.styles.textColor = [220, 38, 38];
            }
          },
        });
      }

      // Footer on each page
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`ScalpelDiary — ${user?.name} — Page ${i}/${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
      }

      const fileName = `ScalpelDiary_${user?.name?.replace(/\s+/g, '_')}_${yearLabel.replace(/\s+/g, '')}_${monthLabel.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setExporting(false);
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
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Download className="mr-2 text-green-600" size={20} />
            Export Report (PDF)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select value={exportYear} onChange={(e) => setExportYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                {years.map((y: any) => (
                  <option key={y.id} value={y.id}>Year {y.year}{y.id === years[years.length - 1]?.id ? ' (Current)' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month (optional)</label>
              <input type="month" value={exportMonth} onChange={(e) => setExportMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
              {exportMonth && (
                <button onClick={() => setExportMonth('')} className="text-xs text-blue-600 mt-1 hover:underline">Clear (export full year)</button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Filter (optional)</label>
              <select value={exportCategory} onChange={(e) => setExportCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                <option value="">All Categories</option>
                <option value="GI Surgery">GI Surgery</option>
                <option value="Hepatobiliary">Hepatobiliary</option>
                <option value="Urology">Urology</option>
                <option value="Orthopedic Surgery">Orthopedic Surgery</option>
                <option value="Plastic Surgery">Plastic Surgery</option>
                <option value="Pediatric Surgery">Pediatric Surgery</option>
                <option value="Cardiothoracic">Cardiothoracic</option>
                <option value="Neurosurgery">Neurosurgery</option>
                <option value="Minor Surgery">Minor Surgery</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Institution Filter (optional)</label>
              <select value={exportInstitution} onChange={(e) => setExportInstitution(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                <option value="">All Institutions</option>
                <option value="Y12HMC">Y12HMC</option>
                <option value="ALERT">ALERT</option>
                <option value="TASH">TASH</option>
                <option value="ABEBECH_GOBENA">Abebech Gobena</option>
              </select>
            </div>
          </div>
          <label className="flex items-center space-x-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={exportIncludeAnalytics} onChange={(e) => setExportIncludeAnalytics(e.target.checked)}
              className="w-4 h-4 text-green-600 rounded" />
            <span className="text-sm text-gray-700">Include analytics summary (stats, role distribution)</span>
          </label>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center space-x-2 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors font-medium"
          >
            <FileText size={18} />
            <span>{exporting ? 'Generating PDF...' : 'Export to PDF'}</span>
          </button>
        </div>
      </div>
    </Layout>
  );
}
