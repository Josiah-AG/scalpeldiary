import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Activity, Award, Calendar, TrendingUp, Edit2, Trash2, X } from 'lucide-react';
import YearProgressBar from '../../components/YearProgressBar';
import ProgressDetailModal from '../../components/ProgressDetailModal';
import { RotationModal, DutyModal, ActivityModal } from '../../components/TodayOverviewModals';
import { getRatingLabel, getRatingTextColor, getResidentRatingBadge, canSeeExactScores } from '../../utils/ratingUtils';
import { useAuthStore } from '../../store/authStore';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<any>(null);
  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [currentYearNum, setCurrentYearNum] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<any>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [yearProgress, setYearProgress] = useState<any>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [ratedLogsCount, setRatedLogsCount] = useState<number>(0);
  const [todayOverview, setTodayOverview] = useState<any>(null);
  const [showRotationModal, setShowRotationModal] = useState(false);
  const [showDutyModal, setShowDutyModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [yearlyRotations, setYearlyRotations] = useState<any[]>([]);
  const [monthlyDuties, setMonthlyDuties] = useState<any[]>([]);
  const [monthlyActivities, setMonthlyActivities] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    date: '', mrn: '', age: '', sex: 'MALE', diagnosis: '', procedure: '',
    procedureType: 'ELECTIVE', procedureCategory: 'GI Surgery', placeOfPractice: 'Y12HMC',
    surgeryRole: 'PRIMARY_SUPERVISED', supervisorId: '', remark: '',
  });
  const [supervisorsList, setSupervisorsList] = useState<any[]>([]);
  const [showEditPresModal, setShowEditPresModal] = useState(false);
  const [editingPres, setEditingPres] = useState<any>(null);
  const [editPresFormData, setEditPresFormData] = useState({
    date: '', title: '', venue: 'Y12HMC', presentationType: 'CASE_PRESENTATION', description: '', supervisorId: '',
  });
  const navigate = useNavigate();

  // Check if in read-only mode
  const isReadOnlyMode = sessionStorage.getItem('isReadOnlyMode') === 'true';
  const viewingResidentId = sessionStorage.getItem('viewingResidentId');

  useEffect(() => {
    fetchYears();
    fetchTodayOverview();
    if (!isReadOnlyMode) {
      api.get('/users/supervisors').then(r => setSupervisorsList(r.data)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (selectedYear && !isReadOnlyMode) {
      fetchMetrics();
      fetchCalendarData();
      fetchYearProgress();
      // Fetch rated logs count for Year 2+ residents
      if (currentYearNum >= 2) {
        fetchRatedLogsCount();
      }
    } else if (selectedYear && isReadOnlyMode && years.length > 0) {
      // For read-only mode when month changes
      fetchCalendarDataWithYears(selectedYear, years);
      fetchYearProgress();
    }
  }, [selectedYear, currentMonth]);

  const fetchYears = async () => {
    if (isReadOnlyMode && viewingResidentId) {
      const response = await api.get(`/users/resident-years/${viewingResidentId}`);
      const yearsData = response.data;
      setYears(yearsData);
      if (yearsData.length > 0) {
        const latest = yearsData[yearsData.length - 1];
        setSelectedYear(latest.id);
        setCurrentYearNum(latest.year);
        
        // Immediately fetch data with the years data
        await fetchMetricsWithYearId(latest.id, yearsData);
        await fetchCalendarDataWithYears(latest.id, yearsData);
      }
    } else {
      const response = await api.get('/users/resident-years/me');
      setYears(response.data);
      if (response.data.length > 0) {
        const latest = response.data[response.data.length - 1];
        setSelectedYear(latest.id);
        setCurrentYearNum(latest.year);
      }
    }
  };

  const fetchMetricsWithYearId = async (yearId: any, yearsData: any[]) => {
    setLoading(true);
    try {
      const [dashboardRes, presentationsRes] = await Promise.all([
        api.get(`/analytics/dashboard?yearId=${yearId}&residentId=${viewingResidentId}`),
        api.get(`/presentations/stats?yearId=${yearId}&residentId=${viewingResidentId}`)
      ]);
      
      setMetrics({
        ...dashboardRes.data,
        totalPresentations: presentationsRes.data.totalPresentations || 0,
        avgPresentationRating: presentationsRes.data.avgRating || 0
      });
    } catch (error) {
      console.error('Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarDataWithYears = async (yearId: any, yearsData: any[]) => {
    try {
      const yearData = yearsData.find((y: any) => y.id === yearId);
      if (yearData) {
        const [logsRes, presentationsRes] = await Promise.all([
          api.get(`/logs/resident/${viewingResidentId}?year=${yearData.year}`),
          api.get(`/presentations/resident/${viewingResidentId}?year=${yearData.year}`)
        ]);

        const data: any = {};
        if (logsRes) {
          logsRes.data.forEach((log: any) => {
            const logDate = new Date(log.date);
            if (logDate >= startOfMonth(currentMonth) && logDate <= endOfMonth(currentMonth)) {
              const date = format(logDate, 'yyyy-MM-dd');
              if (!data[date]) data[date] = { procedures: 0, presentations: 0 };
              data[date].procedures++;
            }
          });
        }

        if (presentationsRes) {
          presentationsRes.data.forEach((pres: any) => {
            const presDate = new Date(pres.date);
            if (presDate >= startOfMonth(currentMonth) && presDate <= endOfMonth(currentMonth)) {
              const date = format(presDate, 'yyyy-MM-dd');
              if (!data[date]) data[date] = { procedures: 0, presentations: 0 };
              data[date].presentations++;
            }
          });
        }

        setCalendarData(data);
      }
    } catch (error) {
      console.error('Failed to fetch calendar data');
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      let dashboardRes, presentationsRes;
      
      if (isReadOnlyMode && viewingResidentId) {
        [dashboardRes, presentationsRes] = await Promise.all([
          api.get(`/analytics/dashboard?yearId=${selectedYear}&residentId=${viewingResidentId}`),
          api.get(`/presentations/stats?yearId=${selectedYear}&residentId=${viewingResidentId}`)
        ]);
      } else {
        [dashboardRes, presentationsRes] = await Promise.all([
          api.get(`/analytics/dashboard?yearId=${selectedYear}`),
          api.get(`/presentations/stats?yearId=${selectedYear}`)
        ]);
      }
      
      setMetrics({
        ...dashboardRes.data,
        totalPresentations: presentationsRes.data.totalPresentations || 0,
        avgPresentationRating: presentationsRes.data.avgRating || 0
      });
    } catch (error) {
      console.error('Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchYearProgress = async () => {
    try {
      const url = isReadOnlyMode && viewingResidentId
        ? `/progress/year/${selectedYear}?residentId=${viewingResidentId}`
        : `/progress/year/${selectedYear}`;
      const response = await api.get(url);
      setYearProgress(response.data);
    } catch (error) {
      console.error('Failed to fetch year progress');
    }
  };

  const fetchRatedLogsCount = async () => {
    try {
      const response = await api.get('/logs/rated');
      setRatedLogsCount(response.data.length);
    } catch (error) {
      console.error('Failed to fetch rated logs count');
    }
  };

  const fetchTodayOverview = async () => {
    try {
      const residentId = isReadOnlyMode && viewingResidentId ? viewingResidentId : undefined;
      const [rotationRes, dutyRes, activityRes] = await Promise.all([
        api.get(`/rotations/current/${residentId || 'me'}`).catch((err) => {
          console.error('Rotation fetch error:', err.response?.data || err.message);
          return { data: null };
        }),
        api.get('/duties/today', { params: residentId ? { residentId } : {} }).catch(() => ({ data: [] })),
        api.get('/activities/today', { params: residentId ? { residentId } : {} }).catch(() => ({ data: [] }))
      ]);

      console.log('Today overview data:', {
        rotation: rotationRes.data,
        duties: dutyRes.data,
        activities: activityRes.data
      });

      setTodayOverview({
        rotation: rotationRes.data,
        duties: dutyRes.data,
        activities: activityRes.data
      });
    } catch (error) {
      console.error('Failed to fetch today overview:', error);
    }
  };

  const fetchYearlyRotations = async () => {
    try {
      const residentId = isReadOnlyMode && viewingResidentId ? viewingResidentId : undefined;
      const response = await api.get('/rotations/my-rotations', { 
        params: residentId ? { residentId } : {} 
      });
      setYearlyRotations(response.data);
    } catch (error) {
      console.error('Failed to fetch yearly rotations:', error);
    }
  };

  const fetchMonthlyDuties = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const response = await api.get(`/duties/monthly/${year}/${month}`);
      setMonthlyDuties(response.data);
    } catch (error) {
      console.error('Failed to fetch monthly duties:', error);
    }
  };

  const fetchMonthlyActivities = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const response = await api.get(`/activities/monthly/${year}/${month}`);
      setMonthlyActivities(response.data);
    } catch (error) {
      console.error('Failed to fetch monthly activities:', error);
    }
  };

  const handleRotationCardClick = async () => {
    await fetchYearlyRotations();
    setShowRotationModal(true);
  };

  const handleDutyCardClick = async () => {
    await fetchMonthlyDuties();
    setShowDutyModal(true);
  };

  const handleActivityCardClick = async () => {
    await fetchMonthlyActivities();
    setShowActivityModal(true);
  };

  const fetchCalendarData = async () => {
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      let logsRes, presentationsRes;
      
      if (isReadOnlyMode && viewingResidentId) {
        const yearData = years.find(y => y.id === parseInt(selectedYear));
        if (yearData) {
          [logsRes, presentationsRes] = await Promise.all([
            api.get(`/logs/resident/${viewingResidentId}?year=${yearData.year}`),
            api.get(`/presentations/resident/${viewingResidentId}?year=${yearData.year}`)
          ]);
        }
      } else {
        [logsRes, presentationsRes] = await Promise.all([
          api.get(`/logs/my-logs?yearId=${selectedYear}&startDate=${start}&endDate=${end}`),
          api.get(`/presentations/my-presentations?yearId=${selectedYear}&startDate=${start}&endDate=${end}`)
        ]);
      }

      const data: any = {};
      if (logsRes) {
        logsRes.data.forEach((log: any) => {
          const logDate = new Date(log.date);
          // Filter by current month for read-only mode
          if (isReadOnlyMode) {
            if (logDate >= startOfMonth(currentMonth) && logDate <= endOfMonth(currentMonth)) {
              const date = format(logDate, 'yyyy-MM-dd');
              if (!data[date]) data[date] = { procedures: 0, presentations: 0 };
              data[date].procedures++;
            }
          } else {
            const date = format(logDate, 'yyyy-MM-dd');
            if (!data[date]) data[date] = { procedures: 0, presentations: 0 };
            data[date].procedures++;
          }
        });
      }

      if (presentationsRes) {
        presentationsRes.data.forEach((pres: any) => {
          const presDate = new Date(pres.date);
          // Filter by current month for read-only mode
          if (isReadOnlyMode) {
            if (presDate >= startOfMonth(currentMonth) && presDate <= endOfMonth(currentMonth)) {
              const date = format(presDate, 'yyyy-MM-dd');
              if (!data[date]) data[date] = { procedures: 0, presentations: 0 };
              data[date].presentations++;
            }
          } else {
            const date = format(presDate, 'yyyy-MM-dd');
            if (!data[date]) data[date] = { procedures: 0, presentations: 0 };
            data[date].presentations++;
          }
        });
      }

      setCalendarData(data);
    } catch (error) {
      console.error('Failed to fetch calendar data');
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
            <Calendar className="mr-2 text-blue-600" size={20} />
            <span className="hidden sm:inline">{format(currentMonth, 'MMMM yyyy')}</span>
            <span className="sm:hidden">{format(currentMonth, 'MMM yyyy')}</span>
          </h3>
          <div className="flex space-x-1 md:space-x-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
              className="px-2 py-1 md:px-3 md:py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-sm md:text-base"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-2 py-1 md:px-3 md:py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs md:text-base"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
              className="px-2 py-1 md:px-3 md:py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-sm md:text-base"
            >
              →
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-4 mb-4 text-xs md:text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-600"></div>
            <span className="text-gray-600">Procedures</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-600"></div>
            <span className="text-gray-600">Presentations</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div key={`day-${idx}`} className="text-center font-semibold text-gray-600 text-xs md:text-sm py-1 md:py-2">
              <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}</span>
              <span className="sm:hidden">{day}</span>
            </div>
          ))}
          
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayData = calendarData[dateStr];
            const hasActivity = dayData && (dayData.procedures > 0 || dayData.presentations > 0);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dateStr}
                onClick={() => {
                  if (hasActivity) {
                    // Show detail modal
                    const modal = document.createElement('div');
                    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn';
                    modal.onclick = () => modal.remove();
                    modal.innerHTML = `
                      <div class="bg-white rounded-xl shadow-2xl max-w-sm w-full animate-slideUp" onclick="event.stopPropagation()">
                        <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
                          <div class="flex justify-between items-center">
                            <h3 class="text-lg font-bold text-white">${format(day, 'MMMM d, yyyy')}</h3>
                            <button onclick="this.closest('.fixed').remove()" class="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            </button>
                          </div>
                          <p class="text-blue-100 text-sm mt-1">${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day.getDay()]}</p>
                        </div>
                        <div class="p-6 space-y-4">
                          ${dayData.procedures > 0 ? `
                            <div class="bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-4">
                              <div class="flex items-center space-x-3">
                                <div class="bg-blue-600 rounded-lg p-2">
                                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                  </svg>
                                </div>
                                <div>
                                  <p class="font-bold text-blue-900 text-lg">${dayData.procedures} Procedure${dayData.procedures > 1 ? 's' : ''}</p>
                                  <p class="text-blue-700 text-sm">Logged on this day</p>
                                </div>
                              </div>
                            </div>
                          ` : ''}
                          ${dayData.presentations > 0 ? `
                            <div class="bg-green-50 border-l-4 border-green-600 rounded-r-lg p-4">
                              <div class="flex items-center space-x-3">
                                <div class="bg-green-600 rounded-lg p-2">
                                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                                  </svg>
                                </div>
                                <div>
                                  <p class="font-bold text-green-900 text-lg">${dayData.presentations} Presentation${dayData.presentations > 1 ? 's' : ''}</p>
                                  <p class="text-green-700 text-sm">Given on this day</p>
                                </div>
                              </div>
                            </div>
                          ` : ''}
                        </div>
                        <div class="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
                          <button onclick="this.closest('.fixed').remove()" class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                            Close
                          </button>
                        </div>
                      </div>
                    `;
                    document.body.appendChild(modal);
                  }
                }}
                className={`min-h-12 md:min-h-20 p-1 md:p-2 rounded-lg border-2 transition-all ${
                  hasActivity
                    ? 'bg-blue-50 border-blue-300 hover:bg-blue-100 cursor-pointer'
                    : 'bg-white border-gray-200'
                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className={`text-xs md:text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </div>
                {dayData && (
                  <div className="mt-1 flex flex-wrap gap-1 justify-center">
                    {dayData.procedures > 0 && (
                      <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-600" title={`${dayData.procedures} procedure(s)`}></div>
                    )}
                    {dayData.presentations > 0 && (
                      <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-600" title={`${dayData.presentations} presentation(s)`}></div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleEditSurgery = (surgery: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLog(surgery);
    setEditFormData({
      date: surgery.date?.split('T')[0] || surgery.date,
      mrn: surgery.mrn, age: surgery.age?.toString() || '', sex: surgery.sex,
      diagnosis: surgery.diagnosis, procedure: surgery.procedure,
      procedureType: surgery.procedure_type, procedureCategory: surgery.procedure_category || 'GI Surgery',
      placeOfPractice: surgery.place_of_practice, surgeryRole: surgery.surgery_role,
      supervisorId: surgery.supervisor_id, remark: surgery.remark || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateSurgery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    try {
      await api.put('/logs/' + editingLog.id, editFormData);
      alert('Procedure updated successfully');
      setShowEditModal(false);
      setEditingLog(null);
      fetchMetrics();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update procedure');
    }
  };

  const handleDeleteSurgery = async (surgery: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this procedure?\n\n' + surgery.procedure + '\n' + format(new Date(surgery.date), 'MMM dd, yyyy'))) {
      try {
        await api.delete('/logs/' + surgery.id);
        alert('Procedure deleted');
        fetchMetrics();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to delete');
      }
    }
  };

  const handleEditPres = (pres: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPres(pres);
    setEditPresFormData({
      date: pres.date?.split('T')[0] || pres.date,
      title: pres.title, venue: pres.venue,
      presentationType: pres.presentation_type, description: pres.description || '',
      supervisorId: pres.supervisor_id || '',
    });
    setShowEditPresModal(true);
  };

  const handleUpdatePres = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPres) return;
    try {
      await api.put('/presentations/' + editingPres.id, editPresFormData);
      alert('Presentation updated successfully');
      setShowEditPresModal(false);
      setEditingPres(null);
      fetchMetrics();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update presentation');
    }
  };

  const handleDeletePres = async (pres: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this presentation?\n\n' + pres.title + '\n' + format(new Date(pres.date), 'MMM dd, yyyy'))) {
      try {
        await api.delete('/presentations/' + pres.id);
        alert('Presentation deleted');
        fetchMetrics();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to delete');
      }
    }
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      {/* Today's Overview - Mobile Optimized */}
      {todayOverview && (
        <div className="bg-white rounded-xl md:rounded-2xl shadow-xl overflow-hidden mb-6 md:mb-8 border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-4 py-4 md:px-8 md:py-6">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-3">
                <Calendar className="w-5 h-5 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg md:text-2xl font-bold text-white">Today's Overview</h3>
                <p className="text-blue-100 text-xs md:text-sm mt-0.5 md:mt-1">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Content Grid - Mobile Optimized */}
          <div className="p-4 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Current Rotation Card */}
              <div 
                onClick={handleRotationCardClick}
                className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg md:rounded-xl p-4 md:p-6 border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-lg cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-blue-200 rounded-full opacity-10 -mr-12 -mt-12 md:-mr-16 md:-mt-16"></div>
                <div className="relative">
                  <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
                    <div className="bg-blue-600 rounded-lg p-1.5 md:p-2.5">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="text-sm md:text-lg font-bold text-gray-800">Current Rotation</h4>
                  </div>
                  {todayOverview.rotation ? (
                    <div className="space-y-2">
                      <div 
                        className="inline-block px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-sm md:text-lg shadow-sm"
                        style={{ 
                          backgroundColor: todayOverview.rotation.color || '#3B82F6',
                          color: 'white'
                        }}
                      >
                        {todayOverview.rotation.category_name}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Tap to view schedule</p>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-400">
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                      <span className="text-xs md:text-sm font-medium">No rotation assigned</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Today's Duty Card - Always show */}
              <div 
                onClick={handleDutyCardClick}
                className="group relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg md:rounded-xl p-4 md:p-6 border-2 border-amber-200 hover:border-amber-400 transition-all hover:shadow-lg cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-amber-200 rounded-full opacity-10 -mr-12 -mt-12 md:-mr-16 md:-mt-16"></div>
                <div className="relative">
                  <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
                    <div className="bg-amber-600 rounded-lg p-1.5 md:p-2.5">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="text-sm md:text-lg font-bold text-gray-800">Today's Duty</h4>
                  </div>
                  
                  <div className="space-y-2">
                    {todayOverview.duties && todayOverview.duties.length > 0 ? (
                      <>
                        {todayOverview.duties.map((duty: any, idx: number) => (
                          <div 
                            key={`duty-${idx}`} 
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg px-3 py-2 md:px-4 md:py-3 shadow-md"
                          >
                            <p className="font-bold text-xs md:text-base">You are on duty at</p>
                            <p className="font-bold text-base md:text-xl mt-0.5 md:mt-1">{duty.category_name || duty.duty_category_name}</p>
                          </div>
                        ))}
                        <p className="text-xs text-gray-500 mt-2">Tap to view schedule</p>
                      </>
                    ) : (
                      <>
                        <div className="bg-gray-100 text-gray-600 rounded-lg px-3 py-2 md:px-4 md:py-3">
                          <p className="font-bold text-base md:text-xl">No Duty</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Tap to view schedule</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Today's Activities Card */}
              <div 
                onClick={handleActivityCardClick}
                className="group relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg md:rounded-xl p-4 md:p-6 border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-lg cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-purple-200 rounded-full opacity-10 -mr-12 -mt-12 md:-mr-16 md:-mt-16"></div>
                <div className="relative">
                  <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
                    <div className="bg-purple-600 rounded-lg p-1.5 md:p-2.5">
                      <Activity className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <h4 className="text-sm md:text-lg font-bold text-gray-800">Today's Activities</h4>
                  </div>
                  
                  <div className="space-y-2">
                    {todayOverview.activities && todayOverview.activities.length > 0 ? (
                      <>
                        {todayOverview.activities.map((activity: any, idx: number) => (
                          <div 
                            key={`activity-${idx}`} 
                            className="bg-white border-2 border-purple-200 rounded-lg px-3 py-2 md:px-4 md:py-2.5 hover:border-purple-400 transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-purple-500"></div>
                              <p className="text-xs md:text-sm font-semibold text-purple-700">{activity.category_name || activity.activity_category_name}</p>
                            </div>
                          </div>
                        ))}
                        <p className="text-xs text-gray-500 mt-2">Tap to view schedule</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2 text-gray-400">
                          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                          <span className="text-xs md:text-sm font-medium">No activities</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Tap to view schedule</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards - Mobile Optimized: 1 col mobile, 3 cols tablet/desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs md:text-sm font-medium">Total Procedures</p>
              <p className="text-3xl md:text-4xl font-bold mt-1 md:mt-2">{metrics?.totalSurgeries || 0}</p>
              {metrics?.verifiedSurgeries != null && (
                <p className="text-blue-200 text-xs mt-1">({metrics.verifiedSurgeries} Verified)</p>
              )}
            </div>
            <Activity size={32} className="text-blue-200 md:w-10 md:h-10" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs md:text-sm font-medium">Total Presentations</p>
              <p className="text-3xl md:text-4xl font-bold mt-1 md:mt-2">{metrics?.totalPresentations || 0}</p>
              {metrics?.verifiedPresentations != null && (
                <p className="text-green-200 text-xs mt-1">({metrics.verifiedPresentations} Verified)</p>
              )}
            </div>
            <Award size={32} className="text-green-200 md:w-10 md:h-10" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs md:text-sm font-medium">Avg Procedure Rating</p>
              <p className="text-3xl md:text-4xl font-bold mt-1 md:mt-2">
                {!isReadOnlyMode && (metrics?.verifiedSurgeries || 0) < 10 ? '—' : (metrics?.averageRating?.toFixed(1) || 'N/A')}
              </p>
              {!isReadOnlyMode && (metrics?.verifiedSurgeries || 0) < 10 && (
                <p className="text-purple-200 text-xs mt-1">Need 10+ verified</p>
              )}
            </div>
            <TrendingUp size={32} className="text-purple-200 md:w-10 md:h-10" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs md:text-sm font-medium">Avg Presentation Rating</p>
              <p className="text-3xl md:text-4xl font-bold mt-1 md:mt-2">
                {!isReadOnlyMode && (metrics?.verifiedPresentations || 0) < 5 ? '—' : (metrics?.avgPresentationRating?.toFixed(1) || 'N/A')}
              </p>
              {!isReadOnlyMode && (metrics?.verifiedPresentations || 0) < 5 && (
                <p className="text-orange-200 text-xs mt-1">Need 5+ verified</p>
              )}
            </div>
            <Award size={32} className="text-orange-200 md:w-10 md:h-10" />
          </div>
        </div>

        {/* Rated Logs Card - Only for Year 2+ */}
        {currentYearNum >= 2 && (
          <div 
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 text-white cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => navigate('/rated-logs')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-xs md:text-sm font-medium">Rated Logs</p>
                <p className="text-3xl md:text-4xl font-bold mt-1 md:mt-2">{ratedLogsCount}</p>
                <p className="text-indigo-100 text-xs mt-1">As Supervisor</p>
              </div>
              <Award size={32} className="text-indigo-200 md:w-10 md:h-10" />
            </div>
          </div>
        )}
      </div>

      {/* Year Progress Bar */}
      {yearProgress && (
        <div className="mb-8">
          <YearProgressBar 
            progress={yearProgress} 
            onClick={() => setShowProgressModal(true)}
          />
        </div>
      )}

      {/* Calendar */}
      <div className="mb-6 md:mb-8">
        {renderCalendar()}
      </div>

      {/* Progress Detail Modal */}
      {showProgressModal && yearProgress && (
        <ProgressDetailModal
          progress={yearProgress}
          onClose={() => setShowProgressModal(false)}
        />
      )}

      {/* Recent Procedures */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-lg overflow-hidden mb-6 md:mb-8">
        <div className="px-4 py-3 md:px-6 md:py-4 bg-gradient-to-r from-blue-600 to-blue-700 flex justify-between items-center">
          <h3 className="text-base md:text-xl font-bold text-white">Recent Procedures</h3>
          <button
            onClick={() => navigate(isReadOnlyMode ? '/resident-view/all-procedures' : '/all-procedures')}
            className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors text-xs md:text-base"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">MRN</th>
                <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedure</th>
                <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Role</th>
                <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                {!isReadOnlyMode && (
                  <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics?.recentSurgeries?.slice(0, 10).map((surgery: any) => {
                const rowColor = !surgery.rating 
                  ? 'bg-gray-100 hover:bg-gray-200' 
                  : surgery.rating > 50 
                  ? 'bg-green-50 hover:bg-green-100' 
                  : 'bg-red-50 hover:bg-red-100';
                
                return (
                  <tr 
                    key={surgery.id} 
                    className={`cursor-pointer transition-colors ${rowColor}`}
                    onClick={() => {
                      // Show procedure detail modal
                      const modal = document.createElement('div');
                      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
                      modal.innerHTML = `
                        <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                          <div class="flex justify-between items-start mb-4">
                            <h3 class="text-xl font-bold">Procedure Details</h3>
                            <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                          </div>
                          <div class="space-y-3">
                            <p><strong>Date:</strong> ${format(new Date(surgery.date), 'MMM dd, yyyy')}</p>
                            <p><strong>MRN:</strong> ${surgery.mrn}</p>
                            <p><strong>Age:</strong> ${surgery.age}</p>
                            <p><strong>Sex:</strong> ${surgery.sex}</p>
                            <p><strong>Diagnosis:</strong> ${surgery.diagnosis}</p>
                            <p><strong>Procedure:</strong> ${surgery.procedure}</p>
                            <p><strong>Procedure Type:</strong> ${surgery.procedure_type?.replace(/_/g, ' ')}</p>
                            <p><strong>Procedure Category:</strong> ${surgery.procedure_category?.replace(/_/g, ' ') || 'N/A'}</p>
                            <p><strong>Place of Practice:</strong> ${surgery.place_of_practice}</p>
                            <p><strong>Surgery Role:</strong> ${surgery.surgery_role?.replace(/_/g, ' ')}</p>
                            <p><strong>Supervisor:</strong> ${surgery.supervisor_name || 'N/A'}</p>
                            ${surgery.remark ? `<p><strong>Remark:</strong> ${surgery.remark}</p>` : ''}
                            ${surgery.rating ? `
                              <div class="border-t pt-3 mt-3">
                                <p><strong>Rating:</strong> <span class="text-2xl font-bold ${surgery.rating > 50 ? 'text-green-600' : 'text-red-600'}">${surgery.rating}/100</span></p>
                                ${surgery.comment ? `<p class="mt-2"><strong>Comment:</strong> ${surgery.comment}</p>` : ''}
                              </div>
                            ` : '<p class="text-gray-500 italic">Not yet rated</p>'}
                          </div>
                        </div>
                      `;
                      document.body.appendChild(modal);
                    }}
                  >
                    <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-700">{format(new Date(surgery.date), 'MMM dd')}</td>
                    <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 hidden sm:table-cell">{surgery.mrn}</td>
                    <td className="px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm text-gray-700">
                      <div className="line-clamp-2">{surgery.procedure}</div>
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm text-gray-700 hidden md:table-cell">{surgery.surgery_role?.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm">
                      {surgery.status === 'NOT_WITNESSED' ? (
                        <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-gray-400 text-white font-semibold text-xs">N/A</span>
                      ) : surgery.rating ? (
                        (() => {
                          const showExact = canSeeExactScores(user?.role, isReadOnlyMode);
                          const badge = showExact 
                            ? { text: surgery.rating, className: surgery.rating > 50 ? 'bg-green-600 text-white' : 'bg-red-600 text-white' }
                            : getResidentRatingBadge(surgery.rating, surgery.status);
                          return <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full font-semibold text-xs ${badge.className}`}>{badge.text}</span>;
                        })()
                      ) : (
                        <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-gray-600 text-white font-semibold text-xs">Pending</span>
                      )}
                    </td>
                    {!isReadOnlyMode && (
                      <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm hidden sm:table-cell">
                        {surgery.status === 'PENDING' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => handleEditSurgery(surgery, e)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit procedure"
                            >
                              <Edit2 size={14} className="md:w-4 md:h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteSurgery(surgery, e)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete procedure"
                            >
                              <Trash2 size={14} className="md:w-4 md:h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Presentations */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-lg overflow-hidden">
        <div className="px-4 py-3 md:px-6 md:py-4 bg-gradient-to-r from-green-600 to-green-700 flex justify-between items-center">
          <h3 className="text-base md:text-xl font-bold text-white">Recent Presentations</h3>
          <button
            onClick={() => navigate(isReadOnlyMode ? '/resident-view/presentations' : '/presentations')}
            className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors text-xs md:text-base"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Venue</th>
                <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                {!isReadOnlyMode && (
                  <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics?.recentPresentations?.slice(0, 5).map((pres: any) => {
                const rowColor = !pres.rating 
                  ? 'bg-gray-100 hover:bg-gray-200' 
                  : pres.rating > 50 
                  ? 'bg-green-50 hover:bg-green-100' 
                  : 'bg-red-50 hover:bg-red-100';
                
                return (
                  <tr 
                    key={pres.id} 
                    className={`cursor-pointer transition-colors ${rowColor}`}
                    onClick={() => {
                      // Show presentation detail modal
                      const modal = document.createElement('div');
                      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
                      modal.innerHTML = `
                        <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                          <div class="flex justify-between items-start mb-4">
                            <h3 class="text-xl font-bold">Presentation Details</h3>
                            <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                          </div>
                          <div class="space-y-3">
                            <p><strong>Date:</strong> ${format(new Date(pres.date), 'MMM dd, yyyy')}</p>
                            <p><strong>Title:</strong> ${pres.title}</p>
                            <p><strong>Type:</strong> ${pres.presentation_type?.replace(/_/g, ' ')}</p>
                            <p><strong>Venue:</strong> ${pres.venue}</p>
                            ${pres.description ? `<p><strong>Description:</strong> ${pres.description}</p>` : ''}
                            <p><strong>Rated by:</strong> ${pres.supervisor_name || 'Not yet rated'}</p>
                            ${pres.rating ? `
                              <div class="border-t pt-3 mt-3">
                                <p><strong>Rating:</strong> <span class="text-2xl font-bold ${pres.rating > 50 ? 'text-green-600' : 'text-red-600'}">${pres.rating}/100</span></p>
                                ${pres.comment ? `<p class="mt-2"><strong>Comment:</strong> ${pres.comment}</p>` : ''}
                              </div>
                            ` : '<p class="text-gray-500 italic">Not yet rated</p>'}
                          </div>
                        </div>
                      `;
                      document.body.appendChild(modal);
                    }}
                  >
                    <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm">{format(new Date(pres.date), 'MMM dd')}</td>
                    <td className="px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm font-medium text-gray-900">
                      <div className="line-clamp-2">{pres.title}</div>
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm text-gray-700 hidden md:table-cell">{pres.presentation_type?.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm text-gray-700 hidden lg:table-cell">{pres.venue}</td>
                    <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm">
                      {pres.status === 'NOT_WITNESSED' ? (
                        <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-gray-400 text-white font-semibold text-xs">N/A</span>
                      ) : pres.rating ? (
                        <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full font-semibold text-xs ${
                          pres.rating > 50 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {pres.rating}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-gray-600 text-white font-semibold text-xs">Pending</span>
                      )}
                    </td>
                    {!isReadOnlyMode && (
                      <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm hidden sm:table-cell">
                        {pres.status === 'PENDING' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => handleEditPres(pres, e)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit presentation"
                            >
                              <Edit2 size={14} className="md:w-4 md:h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeletePres(pres, e)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete presentation"
                            >
                              <Trash2 size={14} className="md:w-4 md:h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {(!metrics?.recentPresentations || metrics.recentPresentations.length === 0) && (
                <tr>
                  <td colSpan={!isReadOnlyMode ? 6 : 5} className="px-3 py-6 md:px-6 md:py-8 text-center text-gray-500 text-sm">
                    No presentations yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <RotationModal
        isOpen={showRotationModal}
        onClose={() => setShowRotationModal(false)}
        rotations={yearlyRotations}
      />
      <DutyModal
        isOpen={showDutyModal}
        onClose={() => setShowDutyModal(false)}
        duties={monthlyDuties}
      />
      <ActivityModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        activities={monthlyActivities}
      />

      {/* Edit Procedure Modal */}
      {showEditModal && editingLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h3 className="text-xl font-bold">Edit Procedure</h3>
              <button onClick={() => { setShowEditModal(false); setEditingLog(null); }} className="hover:bg-green-800 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateSurgery} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto px-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input type="date" value={editFormData.date} onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">MRN</label>
                  <input type="text" value={editFormData.mrn} onChange={(e) => setEditFormData({ ...editFormData, mrn: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input type="number" value={editFormData.age} onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
                  <select value={editFormData.sex} onChange={(e) => setEditFormData({ ...editFormData, sex: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
                  <input type="text" value={editFormData.diagnosis} onChange={(e) => setEditFormData({ ...editFormData, diagnosis: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Procedure</label>
                  <input type="text" value={editFormData.procedure} onChange={(e) => setEditFormData({ ...editFormData, procedure: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Procedure Type</label>
                  <select value={editFormData.procedureType} onChange={(e) => setEditFormData({ ...editFormData, procedureType: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md">
                    <option value="ELECTIVE">Elective</option>
                    <option value="SEMI_ELECTIVE">Semi-Elective</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                  <select value={editFormData.placeOfPractice} onChange={(e) => setEditFormData({ ...editFormData, placeOfPractice: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md">
                    <option value="Y12HMC">Y12HMC</option>
                    <option value="ALERT">ALERT</option>
                    <option value="ABEBECH_GOBENA">Abebech Gobena</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Surgery Role</label>
                  <select value={editFormData.surgeryRole} onChange={(e) => setEditFormData({ ...editFormData, surgeryRole: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md">
                    <option value="PRIMARY_SURGEON">Primary Surgeon</option>
                    <option value="PRIMARY_SURGEON_ASSISTED">Primary Surgeon (Assisted)</option>
                    <option value="PRIMARY_SUPERVISED">Primary Supervised</option>
                    <option value="FIRST_ASSISTANT">1st Assistant</option>
                    <option value="SECOND_ASSISTANT">2nd Assistant</option>
                    <option value="OBSERVER">Observer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor</label>
                  <select value={editFormData.supervisorId} onChange={(e) => setEditFormData({ ...editFormData, supervisorId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required>
                    <option value="">Select Supervisor</option>
                    {supervisorsList.map((sup: any) => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remark (Optional)</label>
                  <textarea value={editFormData.remark} onChange={(e) => setEditFormData({ ...editFormData, remark: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" rows={3} />
                </div>
              </div>
              <div className="flex space-x-3 mt-6 pt-6 border-t">
                <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium">Update Procedure</button>
                <button type="button" onClick={() => { setShowEditModal(false); setEditingLog(null); }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Presentation Modal */}
      {showEditPresModal && editingPres && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h3 className="text-xl font-bold">Edit Presentation</h3>
              <button onClick={() => { setShowEditPresModal(false); setEditingPres(null); }} className="hover:bg-green-800 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdatePres} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input type="date" value={editPresFormData.date} onChange={(e) => setEditPresFormData({ ...editPresFormData, date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select value={editPresFormData.presentationType} onChange={(e) => setEditPresFormData({ ...editPresFormData, presentationType: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md">
                    <option value="CASE_PRESENTATION">Case Presentation</option>
                    <option value="SEMINAR">Seminar</option>
                    <option value="JOURNAL_CLUB">Journal Club</option>
                    <option value="MORTALITY_MORBIDITY">Mortality & Morbidity</option>
                    <option value="GRAND_ROUND">Grand Round</option>
                    <option value="RESEARCH">Research</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input type="text" value={editPresFormData.title} onChange={(e) => setEditPresFormData({ ...editPresFormData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                  <select value={editPresFormData.venue} onChange={(e) => setEditPresFormData({ ...editPresFormData, venue: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md">
                    <option value="Y12HMC">Y12HMC</option>
                    <option value="ALERT">ALERT</option>
                    <option value="ABEBECH_GOBENA">Abebech Gobena</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor</label>
                  <select value={editPresFormData.supervisorId} onChange={(e) => setEditPresFormData({ ...editPresFormData, supervisorId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md">
                    <option value="">Select Supervisor</option>
                    {supervisorsList.map((sup: any) => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <textarea value={editPresFormData.description} onChange={(e) => setEditPresFormData({ ...editPresFormData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" rows={3} />
                </div>
              </div>
              <div className="flex space-x-3 mt-6 pt-6 border-t">
                <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium">Update Presentation</button>
                <button type="button" onClick={() => { setShowEditPresModal(false); setEditingPres(null); }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
