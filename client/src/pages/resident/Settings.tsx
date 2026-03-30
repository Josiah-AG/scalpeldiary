import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Camera, User, Download, FileText, X } from 'lucide-react';
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
  const [showExportModal, setShowExportModal] = useState(false);
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

  const fmtDate = (d: string) => {
    if (!d) return '';
    const dt = new Date(d);
    const day = dt.getDate();
    const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dt.getMonth()];
    const yr = String(dt.getFullYear()).slice(2);
    return `${day}, ${mon}, ${yr}`;
  };

  const handleExportPDF = async () => {
    if (!exportYear) { alert('Please select a year'); return; }
    setExporting(true);
    try {
      const [logsRes, presRes] = await Promise.all([
        api.get(`/logs/my-logs?yearId=${exportYear}`),
        api.get(`/presentations/my-presentations?yearId=${exportYear}`)
      ]);

      let logs = logsRes.data;
      let presentations = presRes.data;

      if (exportMonth) {
        logs = logs.filter((l: any) => l.date?.startsWith(exportMonth));
        presentations = presentations.filter((p: any) => p.date?.startsWith(exportMonth));
      }
      if (exportCategory) logs = logs.filter((l: any) => l.procedure_category === exportCategory);
      if (exportInstitution) {
        logs = logs.filter((l: any) => l.place_of_practice === exportInstitution);
        presentations = presentations.filter((p: any) => p.venue === exportInstitution);
      }

      let analytics: any = null;
      if (exportIncludeAnalytics) {
        const r = await api.get(`/analytics/resident?yearId=${exportYear}`);
        analytics = r.data;
      }

      const yearData = years.find((y: any) => y.id == exportYear);
      const yearLabel = yearData ? `Year ${yearData.year}` : '';
      const monthLabel = exportMonth ? format(new Date(exportMonth + '-01'), 'MMMM yyyy') : 'Full Year';

      const doc = new jsPDF('l', 'mm', 'a4'); // landscape for wider tables
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      let y = 10;

      // === HEADER ===
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pw, 28, 'F');
      // Accent line
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 28, pw, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('ScalpelDiary', 14, 14);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Surgical Log Book', 14, 21);

      // Right side info
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(user?.name || '', pw - 14, 12, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${yearLabel}  |  ${monthLabel}`, pw - 14, 18, { align: 'right' });
      doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, pw - 14, 24, { align: 'right' });

      y = 36;

      // === ANALYTICS SUMMARY ===
      if (analytics && exportIncludeAnalytics) {
        doc.setTextColor(30, 64, 175);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 14, y); y += 7;

        autoTable(doc, {
          startY: y,
          head: [['Procedures', 'Verified', 'Presentations', 'Verified', 'Avg Rating']],
          body: [[
            analytics.totalSurgeries, analytics.verifiedSurgeries,
            analytics.totalPresentations, analytics.verifiedPresentations,
            analytics.averageRating ? analytics.averageRating.toFixed(1) : 'N/A'
          ]],
          theme: 'grid',
          headStyles: { fillColor: [30, 64, 175], fontSize: 8, halign: 'center' },
          bodyStyles: { fontSize: 9, halign: 'center', fontStyle: 'bold' },
          margin: { left: 14, right: pw / 2 + 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // === PROCEDURES TABLE ===
      if (logs.length > 0) {
        if (y > ph - 30) { doc.addPage(); y = 12; }
        doc.setTextColor(30, 64, 175);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(`Procedures (${logs.length})`, 14, y); y += 5;

        autoTable(doc, {
          startY: y,
          head: [['#', 'Date', 'Procedure', 'Diagnosis', 'Category', 'Role', 'Rating']],
          body: logs.map((log: any, i: number) => [
            i + 1,
            fmtDate(log.date),
            log.procedure,
            log.diagnosis,
            log.procedure_category || '',
            (log.surgery_role || '').replace(/_/g, ' '),
            log.rating ? getRatingLabel(log.rating) : log.status === 'NOT_WITNESSED' ? 'N/A' : log.is_detachment ? 'N/A' : 'Pending',
          ]),
          theme: 'striped',
          headStyles: { fillColor: [30, 64, 175], fontSize: 8, cellPadding: 2.5 },
          bodyStyles: { fontSize: 7.5, cellPadding: 2 },
          alternateRowStyles: { fillColor: [240, 245, 255] },
          columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 22 }, 6: { cellWidth: 20, halign: 'center' } },
          margin: { left: 10, right: 10 },
          didParseCell: (data: any) => {
            if (data.column.index === 6 && data.section === 'body') {
              const v = data.cell.text[0];
              if (v === 'Excellent') data.cell.styles.textColor = [22, 163, 74];
              else if (v === 'Good') data.cell.styles.textColor = [37, 99, 235];
              else if (v === 'Satisfactory') data.cell.styles.textColor = [202, 138, 4];
              else if (v === 'Poor') data.cell.styles.textColor = [220, 38, 38];
            }
          },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // === PRESENTATIONS TABLE ===
      if (presentations.length > 0) {
        if (y > ph - 30) { doc.addPage(); y = 12; }
        doc.setTextColor(16, 130, 90);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(`Presentations (${presentations.length})`, 14, y); y += 5;

        autoTable(doc, {
          startY: y,
          head: [['#', 'Date', 'Title', 'Type', 'Venue', 'Moderator', 'Rating']],
          body: presentations.map((p: any, i: number) => [
            i + 1,
            fmtDate(p.date),
            p.title,
            (p.presentation_type || '').replace(/_/g, ' '),
            p.venue || '',
            p.supervisor_name || p.external_supervisor_name || '',
            p.rating ? getRatingLabel(p.rating) : p.is_detachment ? 'N/A' : 'Pending',
          ]),
          theme: 'striped',
          headStyles: { fillColor: [16, 130, 90], fontSize: 8, cellPadding: 2.5 },
          bodyStyles: { fontSize: 7.5, cellPadding: 2 },
          alternateRowStyles: { fillColor: [236, 253, 245] },
          columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 22 }, 6: { cellWidth: 20, halign: 'center' } },
          margin: { left: 10, right: 10 },
          didParseCell: (data: any) => {
            if (data.column.index === 6 && data.section === 'body') {
              const v = data.cell.text[0];
              if (v === 'Excellent') data.cell.styles.textColor = [22, 163, 74];
              else if (v === 'Good') data.cell.styles.textColor = [37, 99, 235];
              else if (v === 'Satisfactory') data.cell.styles.textColor = [202, 138, 4];
              else if (v === 'Poor') data.cell.styles.textColor = [220, 38, 38];
            }
          },
        });
      }

      // Footer
      const tp = (doc as any).getNumberOfPages();
      for (let i = 1; i <= tp; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`ScalpelDiary  |  ${user?.name}  |  Page ${i} of ${tp}`, pw / 2, ph - 6, { align: 'center' });
      }

      doc.save(`ScalpelDiary_${user?.name?.replace(/\s+/g, '_')}_${yearLabel.replace(/\s/g, '')}.pdf`);
      setShowExportModal(false);
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
            Export Report
          </h3>
          <p className="text-sm text-gray-600 mb-4">Export your procedures and presentations as a professional PDF report.</p>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center space-x-2 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <FileText size={18} />
            <span>Export to PDF</span>
          </button>
        </div>

        {/* Export Filter Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
                <h3 className="text-lg font-bold flex items-center"><FileText className="mr-2" size={20} />Export PDF Report</h3>
                <button onClick={() => setShowExportModal(false)} className="hover:bg-green-800 p-2 rounded-lg"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month (optional — leave empty for full year)</label>
                  <input type="month" value={exportMonth} onChange={(e) => setExportMonth(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  {exportMonth && <button onClick={() => setExportMonth('')} className="text-xs text-blue-600 mt-1 hover:underline">Clear</button>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category (optional)</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Institution (optional)</label>
                  <select value={exportInstitution} onChange={(e) => setExportInstitution(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                    <option value="">All Institutions</option>
                    <option value="Y12HMC">Y12HMC</option>
                    <option value="ALERT">ALERT</option>
                    <option value="TASH">TASH</option>
                    <option value="ABEBECH_GOBENA">Abebech Gobena</option>
                  </select>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <input type="checkbox" checked={exportIncludeAnalytics} onChange={(e) => setExportIncludeAnalytics(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-gray-700">Include analytics summary</span>
                </label>
                <div className="flex space-x-3 pt-2">
                  <button onClick={handleExportPDF} disabled={exporting}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-green-300 font-medium transition-colors">
                    <Download size={18} />
                    <span>{exporting ? 'Generating...' : 'Download PDF'}</span>
                  </button>
                  <button onClick={() => setShowExportModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
