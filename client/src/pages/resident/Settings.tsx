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
  const { user, setAuth } = useAuthStore();

  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportYear, setExportYear] = useState<string>('');
  const [exportDateMode, setExportDateMode] = useState<'year' | 'month' | 'range'>('year');
  const [exportMonth, setExportMonth] = useState<string>('');
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');
  const [exportIncludeAnalytics, setExportIncludeAnalytics] = useState(true);
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
    } catch (error) {
      console.error('Failed to fetch profile');
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

  const shortType = (t: string) => {
    if (!t) return '';
    if (t === 'ELECTIVE') return 'Elec';
    if (t === 'SEMI_ELECTIVE') return 'Semi';
    if (t === 'EMERGENCY') return 'Emrg';
    return t.slice(0, 4);
  };

  const getReportLabel = () => {
    const yd = years.find((y: any) => y.id == exportYear);
    const yl = yd ? `Year ${yd.year}` : '';
    if (exportDateMode === 'month' && exportMonth) return `${yl} — ${format(new Date(exportMonth + '-01'), 'MMMM yyyy')}`;
    if (exportDateMode === 'range' && exportStartDate && exportEndDate) return `${yl} — ${fmtDate(exportStartDate)} to ${fmtDate(exportEndDate)}`;
    return `${yl} — Full Year Report`;
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
      let pres = presRes.data;

      if (exportDateMode === 'month' && exportMonth) {
        logs = logs.filter((l: any) => l.date?.startsWith(exportMonth));
        pres = pres.filter((p: any) => p.date?.startsWith(exportMonth));
      } else if (exportDateMode === 'range' && exportStartDate && exportEndDate) {
        logs = logs.filter((l: any) => l.date >= exportStartDate && l.date <= exportEndDate);
        pres = pres.filter((p: any) => p.date >= exportStartDate && p.date <= exportEndDate);
      }
      if (exportCategory) logs = logs.filter((l: any) => l.procedure_category === exportCategory);
      if (exportInstitution) {
        logs = logs.filter((l: any) => l.place_of_practice === exportInstitution);
        pres = pres.filter((p: any) => p.venue === exportInstitution);
      }

      let analytics: any = null;
      if (exportIncludeAnalytics) {
        const r = await api.get(`/analytics/resident?yearId=${exportYear}`);
        analytics = r.data;
      }

      const reportLabel = getReportLabel();
      const doc = new jsPDF('l', 'mm', 'a4');
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      let y = 10;

      // ===== HEADER =====
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pw, 28, 'F');
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 28, pw, 1.5, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('ScalpelDiary', 14, 14);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Surgical Log Book', 14, 21);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(user?.name || '', pw - 14, 12, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(reportLabel, pw - 14, 19, { align: 'right' });
      doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, pw - 14, 25, { align: 'right' });

      y = 35;

      // ===== PROCEDURES TABLE =====
      if (logs.length > 0) {
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Surgical Procedures (${logs.length})`, 10, y); y += 5;

        autoTable(doc, {
          startY: y,
          head: [['#', 'Date', 'MRN', 'Procedure', 'Diagnosis', 'Cat.', 'Type', 'Role', 'Inst.', 'Supervisor', 'Rating']],
          body: logs.map((l: any, i: number) => [
            i + 1, fmtDate(l.date), l.mrn || '', l.procedure || '', l.diagnosis || '',
            l.procedure_category || '', shortType(l.procedure_type),
            (l.surgery_role || '').replace(/_/g, ' '),
            l.place_of_practice || '',
            l.supervisor_name || l.external_supervisor_name || '',
            l.rating ? getRatingLabel(l.rating) : l.status === 'NOT_WITNESSED' ? 'N/A' : l.is_detachment ? 'N/A' : 'Pending',
          ]),
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 138], fontSize: 6.5, cellPadding: 1.8, lineColor: [30, 58, 138], lineWidth: 0.3 },
          bodyStyles: { fontSize: 6.5, cellPadding: 1.5, lineColor: [180, 180, 180], lineWidth: 0.2 },
          alternateRowStyles: { fillColor: [245, 247, 255] },
          columnStyles: {
            0: { cellWidth: 6, halign: 'center' }, 1: { cellWidth: 18 }, 2: { cellWidth: 14 },
            5: { cellWidth: 18 }, 6: { cellWidth: 10, halign: 'center' }, 8: { cellWidth: 16 },
            10: { cellWidth: 15, halign: 'center' }
          },
          margin: { left: 6, right: 6 },
          didParseCell: (data: any) => {
            if (data.column.index === 10 && data.section === 'body') {
              const v = data.cell.text[0];
              if (v === 'Excellent') data.cell.styles.textColor = [22, 163, 74];
              else if (v === 'Good') data.cell.styles.textColor = [37, 99, 235];
              else if (v === 'Satisfactory') data.cell.styles.textColor = [180, 120, 0];
              else if (v === 'Poor') data.cell.styles.textColor = [220, 38, 38];
            }
            if (data.column.index === 6 && data.section === 'body') {
              if (data.cell.text[0] === 'Emrg') data.cell.styles.textColor = [220, 38, 38];
            }
          },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // ===== PRESENTATIONS TABLE =====
      if (pres.length > 0) {
        if (y > ph - 30) { doc.addPage(); y = 12; }
        doc.setTextColor(5, 102, 68);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Presentations (${pres.length})`, 10, y); y += 5;

        autoTable(doc, {
          startY: y,
          head: [['#', 'Date', 'Title', 'Type', 'Venue', 'Moderator', 'Rating']],
          body: pres.map((p: any, i: number) => [
            i + 1, fmtDate(p.date), p.title || '',
            (p.presentation_type || '').replace(/_/g, ' '), p.venue || '',
            p.supervisor_name || p.external_supervisor_name || '',
            p.rating ? getRatingLabel(p.rating) : p.is_detachment ? 'N/A' : 'Pending',
          ]),
          theme: 'grid',
          headStyles: { fillColor: [5, 102, 68], fontSize: 7, cellPadding: 2, lineColor: [5, 102, 68], lineWidth: 0.3 },
          bodyStyles: { fontSize: 7, cellPadding: 1.8, lineColor: [180, 180, 180], lineWidth: 0.2 },
          alternateRowStyles: { fillColor: [240, 253, 245] },
          columnStyles: { 0: { cellWidth: 7, halign: 'center' }, 1: { cellWidth: 20 }, 6: { cellWidth: 16, halign: 'center' } },
          margin: { left: 6, right: 6 },
          didParseCell: (data: any) => {
            if (data.column.index === 6 && data.section === 'body') {
              const v = data.cell.text[0];
              if (v === 'Excellent') data.cell.styles.textColor = [22, 163, 74];
              else if (v === 'Good') data.cell.styles.textColor = [37, 99, 235];
              else if (v === 'Satisfactory') data.cell.styles.textColor = [180, 120, 0];
              else if (v === 'Poor') data.cell.styles.textColor = [220, 38, 38];
            }
          },
        });
      }

      // ===== ANALYTICS — dedicated new page =====
      if (analytics && exportIncludeAnalytics) {
        doc.addPage(); y = 12;
        const hd: [number,number,number] = [30, 58, 138];
        const gr: [number,number,number] = [107, 114, 128];
        const bl: [number,number,number] = [59, 130, 246];
        const lx = 10; const rx = pw / 2 + 10;
        const pct = (n: number, tot: number) => tot > 0 ? `${Math.round((n / tot) * 100)}%` : '';

        doc.setFillColor(245, 247, 255);
        doc.rect(6, y - 2, pw - 12, 8, 'F');
        doc.setTextColor(hd[0], hd[1], hd[2]);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Analytics Summary', 10, y + 3);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(reportLabel, pw - 10, y + 3, { align: 'right' });
        y += 12;

        // Summary stats
        autoTable(doc, {
          startY: y,
          head: [['Metric', 'Value', 'Metric', 'Value']],
          body: [
            ['Total Procedures', String(analytics.totalSurgeries || 0), 'Verified Procedures', String(analytics.verifiedSurgeries || 0)],
            ['Total Presentations', String(analytics.totalPresentations || 0), 'Verified Presentations', String(analytics.verifiedPresentations || 0)],
            ['Avg Procedure Rating', analytics.averageRating ? analytics.averageRating.toFixed(1) : 'N/A', 'Senior Supervisor Rating', analytics.seniorSupervisorRating ? analytics.seniorSupervisorRating.toFixed(1) : 'N/A'],
            ['Avg Presentation Rating', analytics.avgPresentationRating ? analytics.avgPresentationRating.toFixed(1) : 'N/A', '', ''],
          ],
          theme: 'grid', headStyles: { fillColor: hd, fontSize: 8 },
          bodyStyles: { fontSize: 8, cellPadding: 2 },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 25, halign: 'center' }, 2: { fontStyle: 'bold', cellWidth: 50 }, 3: { cellWidth: 25, halign: 'center' } },
          margin: { left: lx, right: pw - 160 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;

        // Role + Procedure Type side by side
        const roleE = analytics.roleDistribution ? Object.entries(analytics.roleDistribution) : [];
        const totR = roleE.reduce((s: number, [, c]: any) => s + parseInt(c), 0);
        const typeE = analytics.procedureTypeDistribution ? Object.entries(analytics.procedureTypeDistribution) : [];
        const totT = typeE.reduce((s: number, [, c]: any) => s + parseInt(c), 0);

        if (roleE.length > 0) {
          autoTable(doc, { startY: y, head: [['Role', 'Count', '%']],
            body: roleE.map(([r, c]: any) => [r.replace(/_/g, ' '), String(c), pct(parseInt(c), totR)]),
            theme: 'striped', headStyles: { fillColor: bl, fontSize: 7.5 },
            bodyStyles: { fontSize: 7.5 }, margin: { left: lx, right: pw / 2 } });
        }
        if (typeE.length > 0) {
          autoTable(doc, { startY: y, head: [['Procedure Type', 'Count', '%']],
            body: typeE.map(([t, c]: any) => [t.replace(/_/g, ' '), String(c), pct(parseInt(c), totT)]),
            theme: 'striped', headStyles: { fillColor: gr, fontSize: 7.5 },
            bodyStyles: { fontSize: 7.5 }, margin: { left: rx, right: 10 } });
        }
        y = (doc as any).lastAutoTable?.finalY + 8 || y + 8;

        // Top procedures + Institution side by side
        const topP = analytics.topProcedures || [];
        const totTP = topP.reduce((s: number, p: any) => s + parseInt(p.count), 0);
        const instP = analytics.institutionProcedures || [];
        const totIP = instP.reduce((s: number, i: any) => s + parseInt(i.count), 0);

        if (topP.length > 0) {
          autoTable(doc, { startY: y, head: [['Top Procedure', 'Count', '%']],
            body: topP.map((p: any) => [p.procedure, p.count, pct(parseInt(p.count), totTP)]),
            theme: 'striped', headStyles: { fillColor: gr, fontSize: 7.5 },
            bodyStyles: { fontSize: 7.5 }, margin: { left: lx, right: pw / 2 } });
        }
        if (instP.length > 0) {
          autoTable(doc, { startY: y, head: [['Institution', 'Count', '%']],
            body: instP.map((i: any) => [i.place_of_practice === 'ABEBECH_GOBENA' ? 'Abebech Gobena' : i.place_of_practice, i.count, pct(parseInt(i.count), totIP)]),
            theme: 'striped', headStyles: { fillColor: gr, fontSize: 7.5 },
            bodyStyles: { fontSize: 7.5 }, margin: { left: rx, right: 10 } });
        }
        y = (doc as any).lastAutoTable?.finalY + 8 || y + 8;

        // Supervisor distribution
        const supD = analytics.supervisorDistribution || [];
        const totS = supD.reduce((s: number, sv: any) => s + parseInt(sv.count), 0);
        if (supD.length > 0) {
          autoTable(doc, { startY: y, head: [['Supervisor', 'Procedures', '%', 'Avg Rating']],
            body: supD.map((s: any) => [s.supervisor_name, s.count, pct(parseInt(s.count), totS), s.avg_rating || '-']),
            theme: 'striped', headStyles: { fillColor: bl, fontSize: 7.5 },
            bodyStyles: { fontSize: 7.5 }, margin: { left: lx, right: pw / 2 } });
        }
      }

      // ===== FOOTER =====
      const tp = (doc as any).getNumberOfPages();
      for (let i = 1; i <= tp; i++) {
        doc.setPage(i);
        doc.setDrawColor(200, 200, 200);
        doc.line(10, ph - 10, pw - 10, ph - 10);
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 140);
        doc.text(`ScalpelDiary  |  ${user?.name}  |  ${reportLabel}  |  Page ${i} of ${tp}`, pw / 2, ph - 6, { align: 'center' });
      }

      doc.save(`ScalpelDiary_${(user?.name || '').replace(/\s+/g, '_')}_Report.pdf`);
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <div className="flex space-x-2 mb-2">
                    {(['year', 'month', 'range'] as const).map(mode => (
                      <button key={mode} onClick={() => setExportDateMode(mode)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${exportDateMode === mode ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {mode === 'year' ? 'Full Year' : mode === 'month' ? 'Month' : 'Custom Range'}
                      </button>
                    ))}
                  </div>
                  {exportDateMode === 'month' && (
                    <input type="month" value={exportMonth} onChange={(e) => setExportMonth(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  )}
                  {exportDateMode === 'range' && (
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm" placeholder="Start" />
                      <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm" placeholder="End" />
                    </div>
                  )}
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
