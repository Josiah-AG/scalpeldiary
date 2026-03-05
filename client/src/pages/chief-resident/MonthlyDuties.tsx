import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { ClipboardCheck, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface DutyCategory {
  id: number;
  name: string;
  color: string;
  is_active: boolean;
}

interface Resident {
  id: string; // UUID
  name: string;
}

interface MonthlyDuty {
  id: number;
  resident_id: string; // UUID
  duty_date: string;
  duty_category_id: number;
  notes: string | null;
}

export default function MonthlyDuties() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [categories, setCategories] = useState<DutyCategory[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [duties, setDuties] = useState<MonthlyDuty[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DutyCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    color: '#3B82F6'
  });
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar'); // Default to calendar
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [assignFormData, setAssignFormData] = useState<{[categoryId: number]: string | ''}>({});

  useEffect(() => {
    fetchCategories();
    fetchResidents();
  }, []);

  useEffect(() => {
    fetchDuties();
  }, [currentDate]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/duties/categories');
      setCategories(response.data.filter((c: DutyCategory) => c.is_active));
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

  const fetchDuties = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await api.get(`/duties/monthly/${year}/${month}`);
      setDuties(response.data);
    } catch (error) {
      console.error('Failed to fetch duties:', error);
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

  const getDutyForDate = (date: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return duties.filter(d => d.duty_date === dateStr);
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
      const dayDuties = getDutyForDate(date);
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
          onClick={() => handleOpenAssignModal(date)}
        >
          <div className={`font-semibold mb-2 ${isWeekend ? 'text-blue-700' : 'text-gray-700'}`}>
            {date}
          </div>
          <div className="space-y-1">
            {dayDuties.map(duty => (
              <div
                key={duty.id}
                className="text-xs p-1 rounded"
                style={{
                  backgroundColor: getCategoryColor(duty.duty_category_id) + '30',
                  borderLeft: `3px solid ${getCategoryColor(duty.duty_category_id)}`
                }}
              >
                <div className="font-medium">{getResidentName(duty.resident_id)}</div>
                <div className="text-gray-600">{getCategoryName(duty.duty_category_id)}</div>
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
      await api.post('/duties/categories', categoryFormData);
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
      await api.put(`/duties/categories/${editingCategory.id}`, categoryFormData);
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
      await api.delete(`/duties/categories/${categoryId}`);
      alert('Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  const handleEditCategory = (category: DutyCategory) => {
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
    const dayDuties = getDutyForDate(date);
    
    // Pre-populate form with existing assignments
    const formData: {[categoryId: number]: string | ''} = {};
    categories.forEach(category => {
      const existingDuty = dayDuties.find(d => d.duty_category_id === category.id);
      formData[category.id] = existingDuty ? existingDuty.resident_id : '';
    });
    
    setAssignFormData(formData);
    setShowAssignModal(true);
  };

  const handleSaveAssignments = async () => {
    if (selectedDate === null) return;

    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    
    try {
      // Delete existing duties for this date
      const existingDuties = getDutyForDate(selectedDate);
      for (const duty of existingDuties) {
        await api.delete(`/duties/${duty.id}`);
      }

      // Create new assignments
      for (const [categoryId, residentId] of Object.entries(assignFormData)) {
        if (residentId) {
          await api.post('/duties/assign', {
            resident_id: residentId,
            duty_date: dateStr,
            duty_category_id: parseInt(categoryId)
          });
        }
      }

      setShowAssignModal(false);
      setSelectedDate(null);
      fetchDuties();
      alert('Duties assigned successfully!');
    } catch (error: any) {
      console.error('Failed to assign duties:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to assign duties: ${errorMsg}`);
    }
  };

  const handleAssignDuty = async (date: number, residentId: string, categoryId: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    
    try {
      await api.post('/duties/assign', {
        resident_id: residentId,
        duty_date: dateStr,
        duty_category_id: categoryId
      });
      
      fetchDuties();
    } catch (error: any) {
      console.error('Failed to assign duty:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to assign duty: ${errorMsg}`);
      alert('Failed to assign duty');
    }
  };

  const handleDeleteDuty = async (dutyId: number) => {
    if (!confirm('Are you sure you want to delete this duty assignment?')) {
      return;
    }

    try {
      await api.delete(`/duties/${dutyId}`);
      fetchDuties();
    } catch (error) {
      console.error('Failed to delete duty:', error);
      alert('Failed to delete duty');
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
                  const dayDuties = getDutyForDate(date);
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
                        const duty = dayDuties.find(d => d.duty_category_id === category.id);
                        return (
                          <td key={category.id} className="px-2 py-2">
                            {duty ? (
                              <div className="flex flex-col items-center space-y-1">
                                <span className="text-xs font-medium text-gray-900 text-center">
                                  {getResidentName(duty.resident_id)}
                                </span>
                                <button
                                  onClick={() => handleDeleteDuty(duty.id)}
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <select
                                onChange={(e) => {
                                  const residentId = e.target.value;
                                  if (residentId) {
                                    handleAssignDuty(date, residentId, category.id);
                                  }
                                }}
                                className="text-xs border rounded px-1 py-1 text-gray-500 w-full bg-white"
                                defaultValue=""
                              >
                                <option value="">Assign...</option>
                                {residents.map(resident => (
                                  <option key={resident.id} value={resident.id}>
                                    {resident.name}
                                  </option>
                                ))}
                              </select>
                            )}
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
    <Layout title="Monthly Duties">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <ClipboardCheck size={32} />
          <h2 className="text-2xl font-bold">Monthly Duty Scheduling</h2>
        </div>
        <p className="text-amber-100">Assign daily duties to residents</p>
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
                Loading duties...
              </div>
            ) : (
              renderCalendar()
            )}
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedDate !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              Assign Duties for {currentDate.toLocaleDateString('en-US', { month: 'long' })} {selectedDate}
            </h3>
            
            <div className="space-y-4 mb-6">
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No duty categories defined. Please add categories first.
                </p>
              ) : (
                categories.map(category => (
                  <div key={category.id} className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                      {category.name}:
                    </label>
                    <select
                      value={assignFormData[category.id] || ''}
                      onChange={(e) => setAssignFormData({
                        ...assignFormData,
                        [category.id]: e.target.value || ''
                      })}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Not assigned</option>
                      {residents.map(resident => (
                        <option key={resident.id} value={resident.id}>
                          {resident.name}
                        </option>
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
            <h3 className="text-xl font-semibold mb-6">Manage Duty Categories</h3>
            
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
                  placeholder="Category name (e.g., EOPD, ICU)"
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
