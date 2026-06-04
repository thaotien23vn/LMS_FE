import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, FileText, HelpCircle,
  Calendar, LayoutDashboard, Play, CheckCircle2,
  Clock, Lock, Download, ArrowLeft, Trophy,
  TrendingUp, GraduationCap, ExternalLink, Award,
  Zap
} from 'lucide-react';
import { useCourseStore } from '../store/useCourseStore';
import { enrollmentService, type BackendEnrollment } from '../services/enrollment.service';
import { scheduleService } from '../services/schedule.service';
import { progressService } from '../services/progress.service';
import type { CourseProgressResponse } from '../services/progress.service';
import { type ScheduleItem } from '../config/schedule-data';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ExpirationBadge } from '../components/common/ExpirationBadge';
import ForumSection from '../components/course/ForumSection';
import CourseChat from '../components/course/CourseChat';
import { Breadcrumb } from '../components/common/Breadcrumb';

interface TabInfo {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

type CourseStatus = 'learning' | 'completed';

interface ExtendedEnrollment extends BackendEnrollment {
  completedLessonIds?: string[];
  lastAccessedLessonId?: string;
  lastAccessedAt?: string | null;
}

const CourseDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { courses, loadCourseDetail } = useCourseStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [enrollment, setEnrollment] = useState<ExtendedEnrollment | null>(null);
  const [courseStatus, setCourseStatus] = useState<CourseStatus>('learning');
  const [isLoading, setIsLoading] = useState(true);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [courseProgressData, setCourseProgressData] = useState<CourseProgressResponse | null>(null);
  const [finalExamStatus, setFinalExamStatus] = useState<any>(null);

  const course = useMemo(() => courses.find(c => String(c.id) === String(id)), [courses, id]);
  
  // Prefer backend unified progress (lectures + quizzes), fallback to FE computation.
  const progress = useMemo(() => {
    if (courseProgressData) {
      const completedLectures = Number(courseProgressData.completedLectures ?? 0);
      const totalLectures = Number(courseProgressData.totalLectures ?? 0);
      const completedQuizzes = Number(courseProgressData.completedQuizzes ?? 0);
      const totalQuizzes = Number(courseProgressData.totalQuizzes ?? 0);
      const completed = completedLectures + completedQuizzes;
      const total = totalLectures + totalQuizzes;
      return {
        completed,
        total,
        percent: Math.max(0, Math.min(100, Math.round(Number(courseProgressData.courseProgress ?? 0)))),
      };
    }

    if (!course?.curriculum) return { completed: 0, total: 0, percent: 0 };

    let completed = 0;
    let total = 0;
    course.curriculum.forEach(module => {
      module.lessons?.forEach((lesson: any) => {
        total++;
        if (lesson.isCompleted || completedLessonIds.includes(lesson.id)) {
          completed++;
        }
      });
    });

    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [courseProgressData, course, completedLessonIds]);
  
  // Status: only mark completed when final exam is passed
  useEffect(() => {
    if (progress.percent === 100 && finalExamStatus?.passed) {
      setCourseStatus('completed');
    } else {
      setCourseStatus('learning');
    }
  }, [progress.percent, finalExamStatus]);
  
  useEffect(() => {
    const init = async () => {
      if (!id) return;
      setIsLoading(true);
      
      try {
        // Load course detail
        if (!course || !course.curriculum?.length) {
          await loadCourseDetail(id);
        }
        
        // Load enrollment data
        enrollmentService.clearCache();
        const enrollments = await enrollmentService.listMyEnrollments();
        const en = enrollments.find(e => String(e.courseId) === String(id)) || null;
        setEnrollment(en);

        // Redirect to course details if not enrolled (and not teacher/admin)
        if (!en && user?.role === 'STUDENT') {
          toast.error('Bạn chưa ghi danh khóa học này');
          navigate(`/course/${id}`);
          return;
        }

        // Load course progress to get completed lessons
        if (en) {
          try {
            const progressData = await progressService.getCourseProgress(id);
            setCourseProgressData(progressData);
            const completedIds = progressData.lecturesProgress
              .filter(p => p.isCompleted)
              .map(p => String(p.lectureId));
            // Add completed quizzes
            const completedQuizIds = progressData.quizProgress?.quizDetails
              .filter(q => q.passed)
              .map(q => `quiz-${q.quizId}`) || [];
            setCompletedLessonIds([...completedIds, ...completedQuizIds]);

            // Load final exam status
            try {
              const finalExam = await progressService.getFinalExamStatus(id!);
              setFinalExamStatus(finalExam);
            } catch (e) {
              console.error('Failed to load final exam status:', e);
              setFinalExamStatus(null);
            }
          } catch (err) {
            console.error('Failed to load course progress:', err);
            setCourseProgressData(null);
          }
        } else {
          setCourseProgressData(null);
          setFinalExamStatus(null);
        }

      } catch (err) {
        console.error('Failed to load course dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, [id, course?.id, loadCourseDetail]);
  
  const tabs: TabInfo[] = [
    { id: 'overview', label: 'Tổng quan', icon: <LayoutDashboard size={18} /> },
    { id: 'content', label: 'Nội dung', icon: <BookOpen size={18} /> },
    { id: 'resources', label: 'Tài liệu', icon: <FileText size={18} /> },
    { id: 'quizzes', label: 'Bài kiểm tra', icon: <HelpCircle size={18} /> },
    { id: 'schedule', label: 'Lịch học', icon: <Calendar size={18} /> },
  ];
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <BookOpen size={64} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy khóa học</h2>
          <p className="text-gray-500 mb-6">Khóa học bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <button
            onClick={() => navigate('/my-learning')}
            className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all"
          >
            Về trang Học tập
          </button>
        </div>
      </div>
    );
  }
  
  const lastAccessedLesson = enrollment?.lastAccessedLessonId;
  
  return (
    <div className="min-h-screen bg-slate-50/80">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/my-learning')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <div className="mb-0.5">
                  <Breadcrumb 
                    items={[
                      { label: 'Khóa học của tôi', path: '/my-learning' },
                      { label: course.title }
                    ]} 
                  />
                </div>
                <p className="text-xs text-gray-500">{course.teacher || 'Giảng viên'}</p>
              </div>
            </div>
            
            {/* Status Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              {courseStatus === 'completed' && (
                <>
                  <button
                    onClick={async () => {
                      try {
                        toast.loading('Đang khởi tạo chứng chỉ...', { id: 'cert' });
                        await progressService.downloadCertificate(id!);
                        toast.success('Tải chứng chỉ thành công!', { id: 'cert' });
                      } catch (err: any) {
                        toast.error(err.message || 'Lỗi tải chứng chỉ', { id: 'cert' });
                      }
                    }}
                    className="mr-2 px-3 py-1.5 rounded-md text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm hover:shadow-md transition-all flex items-center gap-1"
                  >
                    <Download size={16} /> Tải PDF
                  </button>
                  <button
                    onClick={() => {
                      const certId = (courseProgressData as any)?.certificateData?.certificateId || `CERT-${id}-${user?.id}`;
                      navigate(`/verify/${certId}`);
                    }}
                    className="mr-2 px-3 py-1.5 rounded-md text-sm font-bold bg-white text-emerald-600 border border-emerald-200 shadow-sm hover:bg-emerald-50 transition-all flex items-center gap-1"
                  >
                    <Award size={16} /> Xem Online
                  </button>
                </>
              )}
              <button
                onClick={() => setCourseStatus('learning')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  courseStatus === 'learning'
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Đang học
              </button>
              <button
                onClick={() => setCourseStatus('completed')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  courseStatus === 'completed'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Hoàn thành
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden sticky top-24">
              {/* Progress Card */}
              <div className="relative p-6 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Trophy size={18} />
                    </div>
                    <span className="font-bold text-sm tracking-wide">Tiến độ học tập</span>
                  </div>
                  <div className="flex items-end gap-3 mb-3">
                    <span className="text-4xl font-black tracking-tight">{progress.percent}%</span>
                    <span className="text-sm font-medium opacity-90 mb-1.5">{progress.completed}/{progress.total} bài</span>
                  </div>
                  <div className="h-2.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                      className="h-full bg-white rounded-full relative"
                      style={{ width: `${progress.percent}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    >
                      <div className="absolute inset-0 bg-white/50 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="p-3 space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                      activeTab === tab.id
                        ? 'bg-amber-50 text-amber-700 font-bold shadow-sm ring-1 ring-amber-500/20'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className={`transition-transform duration-300 ${activeTab === tab.id ? 'text-amber-600 scale-110' : 'text-gray-400 group-hover:scale-110 group-hover:text-amber-500'}`}>
                      {tab.icon}
                    </div>
                    <span className="flex-1 text-sm">{tab.label}</span>
                    {tab.badge ? (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full shadow-sm">
                        {tab.badge}
                      </span>
                    ) : null}
                  </button>
                ))}
              </nav>
              
              {/* Continue Learning CTA */}
              {lastAccessedLesson && (
                <div className="p-3 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/course/${id}/lesson/${lastAccessedLesson}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-amber-500 transition-all"
                  >
                    <Play size={16} className="fill-current" />
                    Tiếp tục học
                  </button>
                </div>
              )}

              {/* Final Exam Banner */}
              {finalExamStatus?.hasFinalExam && (
                <div className="p-3 border-t border-gray-100">
                  {finalExamStatus.passed ? (
                    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                      <Award size={18} />
                      <span className="text-sm font-bold">Đã hoàn thành bài thi cuối khoá</span>
                    </div>
                  ) : progress.percent >= 100 ? (
                    <div className="space-y-2">
                      <div className="px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Bài thi cuối khoá đã mở khóa</p>
                      </div>
                      <button
                        onClick={() => navigate(`/quiz/${finalExamStatus.quizId}`)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:scale-[1.02] transition-all shadow-amber-500/25 shadow-lg"
                      >
                        <Zap size={16} className="fill-current" />
                        Làm bài thi cuối khoá
                      </button>
                      <p className="text-[10px] text-center text-slate-400 font-bold">
                        
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
                      <Lock size={16} />
                      <span className="text-xs font-bold">Học xong tất cả bài để mở khóa</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1 min-w-0 w-full">
            {activeTab === 'overview' && (
              <OverviewSection
                course={course}
                enrollment={enrollment}
                progress={progress}
                finalExamStatus={finalExamStatus}
                onContinue={() => navigate(`/course/${id}/lesson/${lastAccessedLesson || course.curriculum?.[0]?.lessons?.[0]?.id}`)}
                onRenew={() => navigate(`/course/${id}/renew`)}
                onStartFinalExam={() => finalExamStatus?.quizId && navigate(`/quiz/${finalExamStatus.quizId}`)}
              />
            )}
            {activeTab === 'content' && (
              <ContentSection course={course} enrollment={enrollment} onNavigate={navigate} />
            )}
            {activeTab === 'resources' && (
              <ResourcesSection course={course} />
            )}
            {activeTab === 'forum' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <ForumSection courseId={id || ''} type="course" />
              </div>
            )}
            {activeTab === 'chat' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <CourseChat
                  courseId={id || ''}
                  userRole={(user?.role?.toLowerCase() as 'student' | 'teacher' | 'admin') || 'student'}
                />
              </div>
            )}
            {activeTab === 'quizzes' && (
              <QuizzesSection course={course} />
            )}
            {activeTab === 'schedule' && (
              <ScheduleSection courseId={id || ''} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

// Overview Section Component
const OverviewSection: React.FC<any> = ({ course, enrollment, progress, finalExamStatus, onContinue, onRenew, onStartFinalExam }) => {
  // Check if expired (by date OR by status)
  const isExpiredByDate = enrollment?.expiresAt && new Date() > new Date(enrollment.expiresAt);
  const isExpiredByStatus = enrollment?.enrollmentStatus === 'expired';
  const isExpired = isExpiredByDate || isExpiredByStatus;
  const isGracePeriod = enrollment?.enrollmentStatus === 'grace_period';
  const stats = [
    { icon: <BookOpen size={20} />, label: 'Tổng số bài học', value: progress.total },
    { icon: <CheckCircle2 size={20} />, label: 'Đã hoàn thành', value: progress.completed },
    { 
        icon: <Clock size={20} />, 
        label: 'Thời hạn', 
        value: course.durationType === 'lifetime' 
            ? 'Vĩnh viễn'
            : course.durationType === 'fixed' && course.durationValue
                ? `${course.durationValue} ${course.durationUnit === 'months' ? 'tháng' : course.durationUnit === 'years' ? 'năm' : 'ngày'}`
                : 'Vĩnh viễn',
        badge: enrollment?.expiresAt ? (
            <ExpirationBadge 
                expiresAt={enrollment.expiresAt} 
                enrollmentStatus={enrollment.enrollmentStatus} 
                size="sm" 
            />
        ) : null
    },
    { icon: <GraduationCap size={20} />, label: 'Giảng viên', value: course.teacher || 'N/A' },
    {
      icon: <Zap size={20} />,
      label: 'Bài thi cuối khoá',
      value: finalExamStatus?.hasFinalExam
        ? (finalExamStatus.passed ? 'Đã đạt' : 'Chưa làm')
        : 'Không có',
      badge: finalExamStatus?.hasFinalExam && !finalExamStatus.passed && progress.percent >= 100 ? (
        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-full">Có thể làm</span>
      ) : null,
    },
  ];
  
  return (
    <div className="space-y-8">
      {/* Expiration Warning */}
      {(isExpired || isGracePeriod) && progress.percent < 100 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <Clock size={24} className="text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-1">
                {isGracePeriod ? 'Thời gian ân hạn' : 'Khóa học đã hết hạn'}
              </h3>
              <p className="text-red-700 text-sm">
                {isGracePeriod 
                  ? 'Khóa học đã hết hạn nhưng bạn vẫn trong thời gian ân hạn. Hãy gia hạn ngay để không bị gián đoạn.'
                  : 'Khóa học đã hết hạn. Bạn cần gia hạn để tiếp tục học.'
                }
              </p>
            </div>
            <button
              onClick={onRenew}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
            >
              Gia hạn ngay
            </button>
          </div>
        </div>
      )}
      
      {/* Welcome Card */}
      <div className="relative bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 rounded-3xl p-8 text-white overflow-hidden shadow-xl shadow-slate-900/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10 flex items-start justify-between">
          <div className="max-w-lg">
            <h2 className="text-3xl font-extrabold mb-3 tracking-tight">Chào mừng trở lại!</h2>
            <p className="text-slate-400 mb-6 text-lg">Hôm nay là một ngày tuyệt vời để tiếp tục hành trình học tập của bạn.</p>
            <div className="flex items-center gap-3">
              <button
                onClick={isExpired ? onRenew : onContinue}
                className={`group flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold transition-all duration-300 hover:-translate-y-0.5 ${
                  isExpired 
                    ? 'bg-slate-700 text-slate-300 cursor-not-allowed grayscale' 
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:shadow-lg hover:shadow-amber-500/25'
                }`}
              >
                <div className="bg-white/20 p-1.5 rounded-full">
                  {isExpired ? <Lock size={16} /> : <Play size={16} className="fill-current" />}
                </div>
                {isExpired ? 'Đã hết hạn' : 'Tiếp tục học'}
              </button>
              {finalExamStatus?.hasFinalExam && !finalExamStatus.passed && progress.percent >= 100 && (
                <button
                  onClick={onStartFinalExam}
                  className="group flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold transition-all duration-300 hover:-translate-y-0.5 bg-white text-amber-600 hover:shadow-lg hover:shadow-white/25"
                >
                  <Zap size={16} className="fill-current" />
                  Làm bài thi cuối khoá
                </button>
              )}
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full"></div>
              <div className="relative w-28 h-28 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform duration-300">
                <Trophy size={56} className="text-amber-400 drop-shadow-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        {stats.map((stat, idx) => (
          <div key={idx} className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-amber-50/80 text-amber-500 rounded-xl group-hover:scale-110 group-hover:bg-amber-100 transition-all duration-300">
                {stat.icon}
              </div>
              {stat.badge && <div className="ml-auto">{stat.badge}</div>}
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">{stat.value}</p>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg">
            <TrendingUp size={20} className="text-amber-500" />
          </div>
          Hoạt động gần đây
        </h3>
        {enrollment?.lastAccessedAt ? (
          <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100/60 rounded-2xl hover:bg-white hover:border-amber-100 hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shadow-sm -rotate-3">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Lần học cuối</p>
              <p className="text-sm text-slate-500 mt-0.5">{new Date(enrollment.lastAccessedAt).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <TrendingUp size={32} className="text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Chưa có hoạt động nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Content Section Component
const ContentSection: React.FC<any> = ({ course, enrollment, onNavigate }) => {
  const completedLessons = enrollment?.completedLessonIds || [];
  const isEnrolled = !!enrollment;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/30">
        <h2 className="font-bold text-slate-900 text-xl">Nội dung khóa học</h2>
        <p className="text-sm text-slate-500 mt-1">Theo dõi tiến độ học tập và lịch trình chi tiết</p>
      </div>

      <div className="divide-y divide-slate-100">
        {course.curriculum?.map((module: any, mIdx: number) => (
          <div key={module.id} className="p-6 sm:p-8 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-4 mb-6">
              <div className="px-3.5 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-xs font-bold tracking-wide rounded-lg uppercase shadow-sm">
                Phần {mIdx + 1}
              </div>
              <h3 className="font-bold text-slate-900 text-lg">{module.title}</h3>
            </div>

            <div className="space-y-3">
              {module.lessons?.map((lesson: any, lIdx: number) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const isLocked = !isEnrolled && !lesson.isPreview && (!isCompleted && lIdx > 0 && !completedLessons.includes(module.lessons[lIdx - 1]?.id));

                return (
                  <button
                    key={lesson.id}
                    onClick={() => !isLocked && onNavigate(`/course/${course.id}/lesson/${lesson.id}`)}
                    disabled={isLocked}
                    className={`group w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left ${
                      isLocked
                        ? 'bg-slate-50/60 opacity-70 cursor-not-allowed'
                        : 'bg-white border border-slate-100 shadow-sm hover:border-amber-200 hover:shadow-md hover:shadow-amber-500/5 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-600'
                        : isLocked
                        ? 'bg-slate-100 text-slate-400'
                        : 'bg-amber-100 text-amber-600 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white'
                    }`}>
                      {isCompleted ? <CheckCircle2 size={18} /> : isLocked ? <Lock size={16} /> : <Play size={16} className={isLocked ? '' : 'ml-0.5 fill-current'} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate transition-colors ${isCompleted ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900 group-hover:text-amber-600'}`}>
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={12} className="text-slate-400" />
                        <p className="text-xs text-slate-500 font-medium">{lesson.duration || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {isCompleted && (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                        Hoàn thành
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Resources Section Component
const ResourcesSection: React.FC<any> = ({ course }) => {
  const resources = useMemo(() => {
    const allResources: any[] = [];
    course.curriculum?.forEach((module: any) => {
      module.lessons?.forEach((lesson: any) => {
        if (lesson.attachments?.length) {
          lesson.attachments.forEach((att: any) => {
            allResources.push({ ...att, lessonTitle: lesson.title });
          });
        }
      });
    });
    return allResources;
  }, [course]);
  
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/30">
        <h2 className="font-bold text-slate-900 text-xl">Tài liệu khóa học</h2>
        <p className="text-sm text-slate-500 mt-1">Tất cả tài liệu đính kèm từ các bài học</p>
      </div>
      
      {resources.length > 0 ? (
        <div className="p-6 gap-4 grid grid-cols-1 md:grid-cols-2">
          {resources.map((resource, idx) => (
            <div key={idx} className="group p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-100 transition-all duration-300">
                  <FileText size={24} className="text-amber-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{resource.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{resource.lessonTitle}</p>
                </div>
              </div>
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                download
                className="flex items-center justify-center w-10 h-10 bg-slate-50 text-slate-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                title="Tải xuống"
              >
                <Download size={18} />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <FileText size={40} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">Chưa có tài liệu nào</p>
        </div>
      )}
    </div>
  );
};

// Quizzes Section Component
const QuizzesSection: React.FC<any> = ({ course }) => {
  const quizzes = useMemo(() => {
    const allQuizzes: any[] = [];
    course.curriculum?.forEach((module: any) => {
      module.lessons?.forEach((lesson: any) => {
        if (lesson.type === 'quiz') {
          allQuizzes.push(lesson);
        }
      });
    });
    return allQuizzes;
  }, [course]);
  
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/30">
        <h2 className="font-bold text-slate-900 text-xl">Bài kiểm tra</h2>
        <p className="text-sm text-slate-500 mt-1">Danh sách bài kiểm tra và kết quả</p>
      </div>
      
      {quizzes.length > 0 ? (
        <div className="p-6 gap-4 grid grid-cols-1">
          {quizzes.map((quiz, idx) => (
            <div key={idx} className="group p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-100 transition-all duration-300">
                  <HelpCircle size={24} className="text-purple-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">{quiz.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={14} className="text-slate-400" />
                    <p className="text-sm text-slate-500">Thời gian: {quiz.duration || 'Không giới hạn'}</p>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-purple-50 text-purple-700 rounded-xl font-bold hover:bg-purple-600 hover:text-white transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <ExternalLink size={16} />
                Làm bài
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <HelpCircle size={40} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">Khóa học không có bài kiểm tra</p>
        </div>
      )}
    </div>
  );
};

// Schedule Section Component
const ScheduleSection: React.FC<{ courseId: string }> = ({ courseId }) => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user?.role) return;
      
      setIsLoading(true);
      try {
        const data = await scheduleService.getSchedule({});
        // Filter schedule items related to this course if courseId is provided
        const filteredSchedule = courseId 
          ? data.schedule.filter((item: any) => item.courseId === Number(courseId) || !item.courseId)
          : data.schedule;
        setSchedule(filteredSchedule.slice(0, 5)); // Get first 5 items
      } catch (err) {
        console.error('Failed to load schedule:', err);
        setSchedule([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSchedule();
  }, [courseId, user?.role]);
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden p-12 text-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Đang tải lịch học...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/30">
        <h2 className="font-bold text-slate-900 text-xl">Lịch học & Thi</h2>
        <p className="text-sm text-slate-500 mt-1">Các sự kiện quan trọng của khóa học</p>
      </div>
      
      {schedule.length > 0 ? (
        <div className="p-6 space-y-4">
          {schedule.map((item: any, idx: number) => (
            <div key={idx} className="group p-5 bg-white border border-slate-100 rounded-2xl flex items-start gap-4 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-amber-100 transition-all duration-300">
                <Calendar size={24} className="text-amber-500" />
              </div>
              <div className="flex-1 mt-1">
                <p className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{item.title}</p>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-2 mt-3 text-sm font-medium text-slate-400 bg-slate-50 inline-flex px-3 py-1 rounded-lg">
                  <Clock size={14} className="text-slate-500" />
                  <span>{new Date(item.startAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>
              <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-lg shadow-sm ${
                item.type === 'live' ? 'bg-red-50 text-red-600 border border-red-100' : 
                item.type === 'deadline' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                'bg-blue-50 text-blue-600 border border-blue-100'
              }`}>
                {item.type === 'live' ? 'Trực tiếp' : item.type === 'deadline' ? 'Hạn chót' : 'Học tập'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Calendar size={40} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium mb-1">Chưa có lịch học nào được cập nhật</p>
          <p className="text-sm text-slate-400">Giảng viên sẽ cập nhật lịch thi khi có</p>
        </div>
      )}
    </div>
  );
};

export default CourseDashboard;
