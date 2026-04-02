import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { Activity, Plus, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { createPdfHeader, addPdfFooter, jsPDF, autoTable } from '../../utils/pdfExport';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface ActivityCategory {
  id: number;
  name: string;
  color: string;
  is_active: boolean;
}

interface Resident {
  id: string; // UUID
  name: string;
}

interface DailyActivity {
  id: number;
  resident_id: string; // UUID
  activity_date: string;
  activity_category_id: number;
  notes: string | null;
}

export default function MonthlyActivities() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ActivityCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    color: '#3B82F6'
  });
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar'); // Default to calendar
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [assignFormData, setAssignFormData] = useState<{[categoryId: number]: string[]}>({});
  const [viewDate, setViewDate] = useState<number | null>(null);

  // Helper to add a resident to a category in the assign modal
  const addResidentToCategory = (categoryId: number, residentId: string) => {
    if (!residentId) return;
    setAssignFormData(prev => {
      const current = prev[categoryId] || [];
      if (current.includes(residentId)) return prev;
      return { ...prev, [categoryId]: [...current, residentId] };
    });
  };

  const removeResidentFromCategory = (categoryId: number, residentId: string) => {
    setAssignFormData(prev => ({
      ...prev,
      [categoryId]: (prev[categoryId] || []).filter(id => id !== residentId)
    }));
  };

  useEffect(() => {
    fetchCategories();
    fetchResidents();
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [currentDate]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/activities/categories');
      setCategories(response.data.filter((c: ActivityCategory) => c.is_active));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchResidents = async () => {
    try {
      const response = await api.get('/users?role=RESIDENT');
      setResidents(response.data);
    } catch (error) {
      console.error('Failed to fetch residents:', error);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await api.get(`/activities/monthly/${year}/${month}`);
      setActivities(response.data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const getActivitiesForDate = (date: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return activities.filter(a => a.activity_date === dateStr);
  };

  const getCategoryColor = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#3B82F6';
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getResidentName = (residentId: string) => {
    const resident = residents.find(r => r.id === residentId);
    return resident?.name || 'Unknown';
  };

  const handleExportActivities = () => {
    const monthLabel = format(currentDate, 'MMMM yyyy');
    const doc = new jsPDF('l', 'mm', 'a4');
    createPdfHeader(doc, 'Monthly Activity Schedule', monthLabel);
    
    const mStart = startOfMonth(currentDate);
    const mEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: mStart, end: mEnd });
    const firstDayOfWeek = mStart.getDay();
    const pw = doc.internal.pageSize.getWidth();

    // Legend - centered
    let y = 35;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    let totalLegendW = 0;
    categories.forEach(cat => { totalLegendW += 6 + doc.getTextWidth(cat.name) + 8; });
    let lx = (pw - totalLegendW) / 2;
    categories.forEach(cat => {
      const hex = cat.color || '#9333EA';
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      doc.setFillColor(r, g, b);
      doc.roundedRect(lx, y - 2.5, 4, 4, 0.5, 0.5, 'F');
      doc.setTextColor(80, 80, 80);
      doc.text(cat.name, lx + 6, y + 0.5);
      lx += 6 + doc.getTextWidth(cat.name) + 8;
    });
    y += 8;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const cellW = (pw - 20) / 7;
    const weeksNeeded = Math.ceil((firstDayOfWeek + days.length) / 7);
    const availableH = doc.internal.pageSize.getHeight() - y - 15;
    const cellH = Math.min(28, availableH / weeksNeeded);

    doc.setFillColor(30, 58, 138);
    doc.rect(10, y, pw - 20, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    dayNames.forEach((d, i) => {
      doc.text(d, 10 + i * cellW + cellW / 2, y + 5, { align: 'center' });
    });
    y += 7;

    let col = firstDayOfWeek;
    let rowY = y;
    for (let i = 0; i < firstDayOfWeek; i++) {
      doc.setDrawColor(200, 200, 200);
      doc.rect(10 + i * cellW, rowY, cellW, cellH);
    }

    days.forEach(day => {
      const x = 10 + col * cellW;
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(255, 255, 255);
      doc.rect(x, rowY, cellW, cellH, 'FD');

      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(String(day.getDate()), x + 2, rowY + 5);

      const dateStr = format(day, 'yyyy-MM-dd');
      const dayActs = activities.filter(a => a.activity_date === dateStr);
      let dy = rowY + 9;
      dayActs.forEach(a => {
        const cat = categories.find(c => c.id === a.activity_category_id);
        const res = residents.find(r => r.id === a.resident_id);
        if (cat && dy < rowY + cellH - 2) {
          const hex = cat.color || '#9333EA';
          const cr = parseInt(hex.slice(1, 3), 16);
          const cg = parseInt(hex.slice(3, 5), 16);
          const cb = parseInt(hex.slice(5, 7), 16);
          doc.setFillColor(cr, cg, cb);
          doc.roundedRect(x + 1, dy - 3, cellW - 2, 5, 0.8, 0.8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          const label = res?.name || '';
          doc.text(label, x + cellW / 2, dy + 0.5, { maxWidth: cellW - 3, align: 'center' });
          dy += 6;
        }
      });

      col++;
      if (col > 6) {
        col = 0;
        rowY += cellH;
      }
    });
    while (col > 0 && col <= 6) {
      doc.setDrawColor(200, 200, 200);
      doc.rect(10 + col * cellW, rowY, cellW, cellH);
      col++;
    }

    addPdfFooter(doc, `Activity Schedule — ${monthLabel}`);
    doc.save(`ScalpelDiary_Activities_${format(currentDate, 'yyyy_MM')}.pdf`);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth();
    const firstDay = getFirstDayOfMonth();
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-gray-50"></div>);
    }

    // Days of the month
    for (let date = 1; date <= daysInMonth; date++) {
      const dayActivities = getActivitiesForDate(date);
      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      
      days.push(
        <div 
          key={date} 
          className={`min-h-[120px] border border-gray-200 p-2 cursor-pointer transition-colors ${
            isWeekend 
              ? 'bg-blue-50 hover:bg-blue-100' 
              : 'bg-white hover:bg-amber-50'
          }`}
          onClick={() => setViewDate(date)}
        >
          <div className={`font-semibold mb-2 ${isWeekend ? 'text-blue-700' : 'text-gray-700'}`}>
            {date}
          </div>
          <div className="space-y-1">
            {dayActivities.map(activity => (
              <div
                key={activity.id}
                className="text-xs p-1 rounded"
                style={{
                  backgroundColor: getCategoryColor(activity.activity_category_id) + '30',
                  borderLeft: `3px solid ${getCategoryColor(activity.activity_category_id)}`
                }}
              >
                <div className="font-medium">{getResidentName(activity.resident_id)}</div>
                <div className="text-gray-600">{getCategoryName(activity.activity_category_id)}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const handleCreateCategory = async () => {
    if (!categoryFormData.name.trim()) {
      alert('Category name is required');
      return;
    }

    try {
      await api.post('/activities/categories', categoryFormData);
      alert('Category created successfully!');
      setCategoryFormData({ name: '', color: '#3B82F6' });
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryFormData.name.trim()) {
      alert('Category name is required');
      return;
    }

    try {
      await api.put(`/activities/categories/${editingCategory.id}`, categoryFormData);
      alert('Category updated successfully!');
      setCategoryFormData({ name: '', color: '#3B82F6' });
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      return;
    }

    try {
      await api.delete(`/activities/categories/${categoryId}`);
      alert('Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  const handleEditCategory = (category: ActivityCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      color: category.color
    });
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: '', color: '#3B82F6' });
  };

  const handleOpenAssignModal = (date: number) => {
    setSelectedDate(date);
    const dayActivities = getActivitiesForDate(date);
    
    // Pre-populate form with existing assignments (multiple residents per category)
    const formData: {[categoryId: number]: string[]} = {};
    categories.forEach(category => {
      const existingActivities = dayActivities.filter(a => a.activity_category_id === category.id);
      formData[category.id] = existingActivities.map(a => a.resident_id);
    });
    
    setAssignFormData(formData);
    setShowAssignModal(true);
  };

  const handleSaveAssignments = async () => {
    if (selectedDate === null) return;

    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    
    try {
      // Delete existing activities for this date
      const existingActivities = getActivitiesForDate(selectedDate);
      for (const activity of existingActivities) {
        await api.delete(`/activities/${activity.id}`);
      }

      // Create new assignments (multiple residents per category)
      for (const [categoryId, residentIds] of Object.entries(assignFormData)) {
        for (const residentId of (residentIds as string[])) {
          if (residentId) {
            await api.post('/activities/assign', {
              resident_id: residentId,
              activity_date: dateStr,
              activity_category_id: parseInt(categoryId)
            });
          }
        }
      }

      setShowAssignModal(false);
      setSelectedDate(null);
      fetchActivities();
      alert('Activities assigned successfully!');
    } catch (error: any) {
      console.error('Failed to assign activities:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to assign activities: ${errorMsg}`);
    }
  };

  const handleAssignActivity = async (date: number, residentId: string, categoryId: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    
    try {
      await api.post('/activities/assign', {
        resident_id: residentId,
        activity_date: dateStr,
        activity_category_id: categoryId
      });
      
      fetchActivities();
    } catch (error: any) {
      console.error('Failed to assign activity:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to assign activity: ${errorMsg}`);
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!confirm('Are you sure you want to delete this activity assignment?')) {
      return;
    }

    try {
      await api.delete(`/activities/${activityId}`);
      fetchActivities();
    } catch (error) {
      console.error('Failed to delete activity:', error);
      alert('Failed to delete activity');
    }
  };

  const renderTableView = () => {
    const daysInMonth = getDaysInMonth();
    
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold sticky left-0 bg-amber-600">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Day</th>
                {categories.map(category => (
                  <th key={category.id} className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                    No categories defined. Please add categories first.
                  </td>
                </tr>
              ) : (
                Array.from({ length: daysInMonth }, (_, i) => i + 1).map(date => {
                  const dayActivities = getActivitiesForDate(date);
                  const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayOfWeek = dateObj.getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  
                  return (
                    <tr key={date} className={isWeekend ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-gray-50'}>
                      <td className={`px-4 py-3 text-sm font-medium sticky left-0 ${
                        isWeekend ? 'text-blue-700 bg-blue-50' : 'text-gray-900 bg-white'
                      }`}>
                        {currentDate.toLocaleDateString('en-US', { month: 'short' })} {date}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isWeekend ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                        {dayName}
                      </td>
                      {categories.map(category => {
                        const catActivities = dayActivities.filter(a => a.activity_category_id === category.id);
                        return (
                          <td key={category.id} className="px-2 py-2">
                            <div className="space-y-1">
                              {catActivities.map(activity => (
                                <div key={activity.id} className="flex items-center justify-between bg-gray-50 rounded px-1 py-0.5">
                                  <span className="text-xs font-medium text-gray-900 truncate">
                                    {getResidentName(activity.resident_id)}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteActivity(activity.id)}
                                    className="text-xs text-red-500 hover:text-red-700 ml-1 flex-shrink-0"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <select
                                onChange={(e) => {
                                  const residentId = e.target.value;
                                  if (residentId) {
                                    handleAssignActivity(date, residentId, category.id);
                                    e.target.value = '';
                                  }
                                }}
                                className="text-xs border rounded px-1 py-1 text-gray-400 w-full bg-white"
                                defaultValue=""
                              >
                                <option value="">+ Add</option>
                                {residents
                                  .filter(r => !catActivities.some(a => a.resident_id === r.id))
                                  .map(resident => (
                                    <option key={resident.id} value={resident.id}>
                                      {resident.name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <Layout title="Monthly Activities">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Activity size={32} />
              <h2 className="text-2xl font-bold">Monthly Activity Scheduling</h2>
            </div>
            <p className="text-amber-100">Track daily clinical activities for residents</p>
          </div>
          <button onClick={handleExportActivities} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors">
            <Download size={18} /><span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={24} />
            </button>
            <h3 className="text-xl font-bold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Calendar View
              </button>
            </div>
            
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center space-x-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
            >
              <Plus size={20} />
              <span>Manage Categories</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table or Calendar View */}
      {viewMode === 'table' ? renderTableView() : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="grid grid-cols-7 gap-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-3 text-center font-semibold">
                {day}
              </div>
            ))}
            {loading ? (
              <div className="col-span-7 p-8 text-center text-gray-500">
                Loading activities...
              </div>
            ) : (
              renderCalendar()
            )}
          </div>
        </div>
      )}

      {/* Day Detail View Modal (desktop - shows grouped activities) */}
      {viewDate !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setViewDate(null)}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                {currentDate.toLocaleDateString('en-US', { month: 'long' })} {viewDate}, {currentDate.getFullYear()}
              </h3>
              <button onClick={() => setViewDate(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            {(() => {
              const dayActs = getActivitiesForDate(viewDate);
              if (dayActs.length === 0) return <p className="text-gray-400 text-center py-4">No activities assigned</p>;
              
              // Group by category
              const grouped: {[catId: number]: DailyActivity[]} = {};
              dayActs.forEach(a => {
                if (!grouped[a.activity_category_id]) grouped[a.activity_category_id] = [];
                grouped[a.activity_category_id].push(a);
              });
              
              return (
                <div className="space-y-3">
                  {Object.entries(grouped).map(([catId, acts]) => {
                    const cat = categories.find(c => c.id === parseInt(catId));
                    return (
                      <div key={catId} className="rounded-lg p-3" style={{ backgroundColor: (cat?.color || '#888') + '15', borderLeft: `4px solid ${cat?.color || '#888'}` }}>
                        <div className="font-semibold text-sm mb-1" style={{ color: cat?.color || '#888' }}>{cat?.name || 'Unknown'}</div>
                        <div className="flex flex-wrap gap-1">
                          {acts.map(a => (
                            <span key={a.id} className="text-xs bg-white rounded px-2 py-1 shadow-sm">{getResidentName(a.resident_id)}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            
            <button
              onClick={() => { setViewDate(null); handleOpenAssignModal(viewDate); }}
              className="w-full mt-4 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 font-semibold"
            >
              Edit Assignments
            </button>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedDate !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              Assign Activities for {currentDate.toLocaleDateString('en-US', { month: 'long' })} {selectedDate}
            </h3>
            
            <div className="space-y-4 mb-6">
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No activity categories defined. Please add categories first.
                </p>
              ) : (
                categories.map(category => (
                  <div key={category.id} className="border rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: category.color }} />
                      <span className="text-sm font-semibold text-gray-700">{category.name}</span>
                    </div>
                    <div className="space-y-1 mb-2">
                      {(assignFormData[category.id] || []).map(resId => (
                        <div key={resId} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                          <span className="text-sm">{getResidentName(resId)}</span>
                          <button onClick={() => removeResidentFromCategory(category.id, resId)} className="text-red-500 text-xs hover:text-red-700">Remove</button>
                        </div>
                      ))}
                    </div>
                    <select
                      value=""
                      onChange={(e) => addResidentToCategory(category.id, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">+ Add resident</option>
                      {residents
                        .filter(r => !(assignFormData[category.id] || []).includes(r.id))
                        .map(resident => (
                          <option key={resident.id} value={resident.id}>{resident.name}</option>
                        ))}
                    </select>
                  </div>
                ))
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSaveAssignments}
                className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 font-semibold"
              >
                Save Assignments
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedDate(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-6">Manage Activity Categories</h3>
            
            {/* Add/Edit Form */}
            <div className="bg-amber-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold mb-3">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="Category name (e.g., OPD, OR)"
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Color:</label>
                  <input
                    type="color"
                    value={categoryFormData.color}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                    className="w-16 h-10 border rounded cursor-pointer"
                  />
                </div>
                {editingCategory ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdateCategory}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                    >
                      Update
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleCreateCategory}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 whitespace-nowrap"
                  >
                    Add Category
                  </button>
                )}
              </div>
            </div>

            {/* Categories List */}
            <div className="space-y-2 mb-4">
              <h4 className="font-semibold mb-3">Existing Categories ({categories.length})</h4>
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No categories yet. Add one above.</p>
              ) : (
                categories.map(category => (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                setShowCategoryModal(false);
                handleCancelEdit();
              }}
              className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
