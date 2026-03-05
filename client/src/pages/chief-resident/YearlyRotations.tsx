import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { CalendarDays, Plus } from 'lucide-react';

interface RotationCategory {
  id: number;
  name: string;
  color: string;
  is_active: boolean;
}

interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Resident {
  id: string; // UUID
  name: string;
}

interface YearlyRotation {
  id: number;
  resident_id: string; // UUID
  month_number: number;
  rotation_category_id: number;
  notes: string | null;
}

export default function YearlyRotations() {
  // Predefined distinct colors for categories
  const distinctColors = [
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#84CC16', // Lime
    '#06B6D4', // Cyan
    '#A855F7', // Violet
  ];

  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [categories, setCategories] = useState<RotationCategory[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rotations, setRotations] = useState<YearlyRotation[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<RotationCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    color: distinctColors[0]
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12 calendar month
  const [selectedMonthName, setSelectedMonthName] = useState<string>(months[new Date().getMonth()]);
  const [selectedYearNum, setSelectedYearNum] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'assign' | 'overview'>('assign');
  const [academicYear, setAcademicYear] = useState<any>(null);

  useEffect(() => {
    fetchCategories();
    fetchResidents();
    fetchActiveAcademicYear();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchRotations();
    }
  }, [selectedYear]);

  const fetchActiveAcademicYear = async () => {
    try {
      const response = await api.get('/rotations/academic-years');
      const active = response.data.find((y: AcademicYear) => y.is_active);
      if (active) {
        setSelectedYear(active);
        setAcademicYear(active);
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/rotations/categories');
      setCategories(response.data.filter((c: RotationCategory) => c.is_active));
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

  const fetchRotations = async () => {
    if (!selectedYear) return;
    try {
      const response = await api.get(`/rotations/yearly/${selectedYear.id}`);
      setRotations(response.data);
    } catch (error) {
      console.error('Failed to fetch rotations:', error);
    }
  };

  const getRotationsForMonthAndCategory = (calendarMonth: number, categoryId: number) => {
    // Convert calendar month to month_number
    let monthNumber;
    if (academicYear) {
      const startMonth = academicYear.start_month;
      if (calendarMonth >= startMonth) {
        monthNumber = calendarMonth - startMonth + 1;
      } else {
        monthNumber = 12 - startMonth + calendarMonth + 1;
      }
    } else {
      monthNumber = calendarMonth;
    }
    
    return rotations.filter(r => r.month_number === monthNumber && r.rotation_category_id === categoryId);
  };

  const handleAssignRotationToCategory = async (residentId: string, categoryId: number) => {
    if (!selectedYear) {
      alert('No active academic year found. Please contact administrator.');
      return;
    }

    // Calculate month_number based on calendar month and academic year start
    let monthNumber;
    if (academicYear) {
      const startMonth = academicYear.start_month;
      if (selectedMonth >= startMonth) {
        monthNumber = selectedMonth - startMonth + 1;
      } else {
        monthNumber = 12 - startMonth + selectedMonth + 1;
      }
    } else {
      monthNumber = selectedMonth;
    }
    
    try {
      await api.post('/rotations/assign', {
        academic_year_id: selectedYear.id,
        resident_id: residentId,
        month_number: monthNumber,
        rotation_category_id: categoryId
      });
      
      fetchRotations();
    } catch (error: any) {
      console.error('Failed to assign rotation:', error);
      alert(`Failed to assign rotation: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteRotation = async (rotationId: number) => {
    if (!confirm('Are you sure you want to remove this rotation assignment?')) {
      return;
    }

    try {
      await api.delete(`/rotations/${rotationId}`);
      fetchRotations();
    } catch (error) {
      console.error('Failed to delete rotation:', error);
      alert('Failed to delete rotation');
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryFormData.name.trim()) {
      alert('Category name is required');
      return;
    }

    try {
      await api.post('/rotations/categories', categoryFormData);
      alert('Category created successfully!');
      // Set next distinct color for the form
      const nextColorIndex = categories.length % distinctColors.length;
      setCategoryFormData({ name: '', color: distinctColors[nextColorIndex] });
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
      await api.put(`/rotations/categories/${editingCategory.id}`, categoryFormData);
      alert('Category updated successfully!');
      const nextColorIndex = categories.length % distinctColors.length;
      setCategoryFormData({ name: '', color: distinctColors[nextColorIndex] });
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This will not affect existing assignments.`)) {
      return;
    }

    try {
      await api.delete(`/rotations/categories/${categoryId}`);
      alert('Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  const handleEditCategory = (category: RotationCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      color: category.color
    });
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    const nextColorIndex = categories.length % distinctColors.length;
    setCategoryFormData({ name: '', color: distinctColors[nextColorIndex] });
  };

  return (
    <Layout title="Yearly Rotations">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <CalendarDays size={32} />
          <h2 className="text-2xl font-bold">Yearly Rotation Scheduling</h2>
        </div>
        <p className="text-amber-100">Assign residents to monthly rotations</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-4 flex-wrap gap-3">
            {viewMode === 'assign' && (
              <>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Year:</label>
                  <select
                    value={selectedYearNum}
                    onChange={(e) => setSelectedYearNum(parseInt(e.target.value))}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Month:</label>
                  <select
                    value={selectedMonthName}
                    onChange={(e) => {
                      const monthName = e.target.value;
                      setSelectedMonthName(monthName);
                      setSelectedMonth(months.indexOf(monthName) + 1);
                    }}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    {months.map((month, idx) => (
                      <option key={idx} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('assign')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'assign'
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Assign Mode
              </button>
              <button
                onClick={() => setViewMode('overview')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'overview'
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                View Schedule
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

      {/* Assign Mode - Month Assignment Section */}
      {viewMode === 'assign' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
            <h3 className="text-xl font-bold">
              Assign Residents for {selectedMonthName} {selectedYearNum}
            </h3>
            <p className="text-sm text-amber-100 mt-1">Select residents for each rotation category</p>
          </div>

          {/* Assignment by Category */}
          <div className="p-6">
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <CalendarDays size={64} className="mx-auto mb-4 opacity-50" />
                </div>
                <p className="text-gray-500 mb-4 text-lg">No rotation categories defined yet</p>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  Create Your First Category
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {categories.map(category => {
                  const categoryRotations = getRotationsForMonthAndCategory(selectedMonth, category.id);
                  
                  // Convert hex to RGB for better opacity control
                  const hexToRgb = (hex: string) => {
                    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? {
                      r: parseInt(result[1], 16),
                      g: parseInt(result[2], 16),
                      b: parseInt(result[3], 16)
                    } : { r: 59, g: 130, b: 246 };
                  };
                  
                  const rgb = hexToRgb(category.color);
                  
                  return (
                    <div 
                      key={category.id} 
                      className="rounded-lg overflow-hidden hover:shadow-xl transition-all border border-gray-200 bg-white"
                      style={{
                        boxShadow: `0 1px 3px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`
                      }}
                    >
                      {/* Category Header */}
                      <div 
                        className="p-4 border-l-4"
                        style={{ 
                          borderLeftColor: category.color,
                          background: `linear-gradient(90deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.03) 0%, rgba(255, 255, 255, 1) 100%)`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-1.5 h-12 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <h4 
                                className="font-bold text-lg text-gray-900"
                              >
                                {category.name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {categoryRotations.length === 0 
                                  ? 'No assignments' 
                                  : `${categoryRotations.length} ${categoryRotations.length === 1 ? 'resident' : 'residents'}`
                                }
                              </p>
                            </div>
                          </div>
                          {categoryRotations.length > 0 && (
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                              style={{ 
                                backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
                                color: category.color
                              }}
                            >
                              {categoryRotations.length}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4">
                        {/* Assigned Residents */}
                        {categoryRotations.length > 0 && (
                          <div className="mb-3 space-y-1.5 max-h-40 overflow-y-auto">
                            {categoryRotations.map(rotation => {
                              const resident = residents.find(r => r.id === rotation.resident_id);
                              return (
                                <div
                                  key={rotation.id}
                                  className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-50 transition-colors group"
                                >
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      className="w-1 h-6 rounded-full"
                                      style={{ backgroundColor: category.color }}
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                      {resident?.name || 'Unknown'}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteRotation(rotation.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                                    title="Remove"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Add Resident Dropdown */}
                        <select
                          value=""
                          onChange={(e) => {
                            const residentId = e.target.value;
                            if (residentId) {
                              handleAssignRotationToCategory(residentId, category.id);
                            }
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded hover:border-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 bg-white text-gray-700 transition-colors"
                        >
                          <option value="">+ Add resident</option>
                          {residents
                            .filter(r => !categoryRotations.some(rot => rot.resident_id === r.id))
                            .map(resident => (
                              <option key={resident.id} value={resident.id}>
                                {resident.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overview Mode - Full Year Schedule */}
      {viewMode === 'overview' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
            <h3 className="text-xl font-bold">Full Year Rotation Schedule</h3>
            <p className="text-sm text-amber-100 mt-1">Overview of all rotations for the academic year</p>
          </div>
          
          {categories.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <CalendarDays size={64} className="mx-auto mb-4 opacity-50" />
              </div>
              <p className="text-gray-500 mb-4 text-lg">No categories defined yet</p>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 font-semibold"
              >
                Create Your First Category
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider sticky left-0 bg-white z-10 border-r border-gray-200">
                        Rotation
                      </th>
                      {months.map((month, idx) => (
                        <th key={idx} className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                          {month.substring(0, 3)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, catIdx) => (
                      <tr 
                        key={category.id} 
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          catIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-6 py-4 sticky left-0 bg-inherit z-10 border-r border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-5 h-5 rounded-md shadow-sm flex-shrink-0"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm font-semibold text-gray-900">{category.name}</span>
                          </div>
                        </td>
                        {months.map((_, monthIdx) => {
                          const monthRotations = getRotationsForMonthAndCategory(monthIdx + 1, category.id);
                          const residentCount = monthRotations.length;
                          const residentNames = monthRotations.map(r => {
                            const resident = residents.find(res => res.id === r.resident_id);
                            return resident?.name || 'Unknown';
                          });
                          
                          return (
                            <td 
                              key={monthIdx} 
                              className="px-2 py-3 text-center cursor-pointer hover:bg-opacity-80 transition-all"
                              onClick={() => {
                                setSelectedMonth(monthIdx + 1);
                                setSelectedMonthName(months[monthIdx]);
                                setViewMode('assign');
                              }}
                              title={residentCount > 0 ? residentNames.join(', ') : 'Click to assign residents'}
                            >
                              {residentCount > 0 ? (
                                <div className="flex flex-col items-center space-y-1">
                                  <div 
                                    className="px-3 py-2 rounded-lg font-bold text-sm shadow-sm hover:shadow-md transition-shadow min-w-[60px]"
                                    style={{
                                      backgroundColor: category.color,
                                      color: 'white'
                                    }}
                                  >
                                    {residentCount} {residentCount === 1 ? 'Resident' : 'Residents'}
                                  </div>
                                  {residentCount <= 2 && (
                                    <div className="text-xs text-gray-600 max-w-[90px] truncate">
                                      {residentNames.join(', ')}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all">
                                  <span className="text-xs font-medium">+ Assign</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-t-2 border-amber-200">
                <div className="flex items-start space-x-3">
                  <div className="text-amber-600 mt-0.5">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Quick Tips:</p>
                    <ul className="text-sm text-amber-800 mt-1 space-y-1">
                      <li>• Click any cell to assign or edit residents for that month</li>
                      <li>• Colored badges show the number of residents assigned</li>
                      <li>• Hover over cells to see resident names</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-6">Manage Rotation Categories</h3>
            
            {/* Add/Edit Form */}
            <div className="bg-amber-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold mb-3">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h4>
              <div className="space-y-3">
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="Category name (e.g., ICU, OPD)"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
                
                {/* Color Palette Selector */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Select Color:</label>
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    {distinctColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCategoryFormData({ ...categoryFormData, color })}
                        className={`w-full h-12 rounded-lg transition-all hover:scale-110 ${
                          categoryFormData.color === color 
                            ? 'ring-4 ring-amber-500 ring-offset-2 scale-105' 
                            : 'hover:ring-2 hover:ring-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-600">Or custom:</label>
                    <input
                      type="color"
                      value={categoryFormData.color}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                      className="w-20 h-8 border rounded cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 font-mono">{categoryFormData.color}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {editingCategory ? (
                    <>
                      <button
                        onClick={handleUpdateCategory}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                      >
                        Update Category
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCreateCategory}
                      className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-semibold"
                    >
                      Add Category
                    </button>
                  )}
                </div>
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
