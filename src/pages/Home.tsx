import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from '../components/home/Banner';
import CourseCard from '../components/home/CourseCard';
import { useCourseStore } from '../store/useCourseStore';
import { useEnrollmentStore } from '../store/useEnrollmentStore';
import { useAuth } from '../context/AuthContext';
import { Sparkles, GraduationCap, Flame, ArrowRight, Users, PlayCircle } from 'lucide-react';
import slideShowLogo from '../config/slide-show';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { courses, loadCourses } = useCourseStore();
    const { enrolledCourses, syncEnrollments, courseProgress } = useEnrollmentStore();

    useEffect(() => {
        loadCourses();
        if (user) {
            syncEnrollments();
        }
    }, [user]);

    // Get enrolled course IDs for filtering
    const enrolledCourseIds = useMemo(() => {
        return new Set(enrolledCourses.map(c => c.id));
    }, [enrolledCourses]);

    // Filter out enrolled courses from discovery sections
    const featuredCourses = useMemo(() => {
        return [...courses]
            .filter(c => !enrolledCourseIds.has(c.id))
            .sort((a, b) => b.students - a.students)
            .slice(0, 8);
    }, [courses, enrolledCourseIds]);

    const latestCourses = useMemo(() => {
        return [...courses]
            .filter(c => !enrolledCourseIds.has(c.id))
            .sort((a, b) => new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime())
            .slice(0, 8);
    }, [courses, enrolledCourseIds]);

    const freeCourses = useMemo(() => {
        return [...courses]
            .filter(c => c.price === 0 && !enrolledCourseIds.has(c.id))
            .sort((a, b) => b.students - a.students)
            .slice(0, 8);
    }, [courses, enrolledCourseIds]);

    const categories = useMemo(() => {
        const set = new Set<string>();
        for (const c of courses) {
            const cat = String((c as any)?.category || '').trim();
            if (cat) set.add(cat);
        }
        return ['Tất cả', ...Array.from(set)];
    }, [courses]);

    const totalLearners = useMemo(() => {
        const total = courses.reduce((sum, c) => sum + Number((c as any)?.students ?? 0), 0);
        return Number.isFinite(total) ? Math.max(0, total) : 0;
    }, [courses]);

    const totalLearnersText = totalLearners > 0
        ? `${totalLearners.toLocaleString()} học viên`
        : 'nhiều học viên';

    return (
        <div className="space-y-20 pb-24 bg-slate-50/80">
            <section>
                <Banner />
            </section>

            {/* Continue Learning Section - Only for logged-in users with enrolled courses */}
            {user && enrolledCourses.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                    <div className="flex items-center justify-between mb-8">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                                <PlayCircle size={14} />
                                Tiếp tục học
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                                👋 Chào mừng trở lại, {user.fullName?.split(' ').pop() || 'bạn'}!
                            </h2>
                            <p className="text-slate-500 font-medium">
                                Bạn đang học {enrolledCourses.length} khóa học. Tiếp tục phát triển kỹ năng nào!
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/my-learning')}
                            className="hidden md:flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-amber-600 transition-all"
                        >
                            Xem tất cả
                            <ArrowRight size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {enrolledCourses.slice(0, 4).map((course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                progress={courseProgress[course.id]}
                                isEnrolled
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Featured Courses Section */}
            <section className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14 relative">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl mix-blend-multiply"></div>
                    
                    <div className="space-y-4 relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-50 to-orange-50 text-red-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-red-100/50 shadow-sm">
                            <Sparkles size={16} className="animate-pulse" />
                            Học nhiều nhất
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                            Khóa học <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">Nổi bật nhất</span> 🧧
                        </h2>
                        <p className="text-slate-500 text-lg font-medium">Lộ trình học tập bài bản, giúp bạn nâng cao kiến thức và kỹ năng thực tế chuẩn bị cho tương lai.</p>
                    </div>

                    <div className="flex flex-wrap gap-2 relative z-10 lg:max-w-md lg:justify-end">
                        {categories.slice(0, 3).map((cat, index) => (
                            <button
                                key={cat}
                                onClick={() => navigate(cat === 'Tất cả' ? '/courses' : `/courses?category=${cat}`)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer hover:-translate-y-1 ${index === 0
                                    ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl shadow-slate-900/20'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-400 hover:text-amber-600 hover:shadow-lg hover:shadow-amber-500/10'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                        {categories.length > 3 && (
                            <button
                                onClick={() => navigate('/courses')}
                                className="px-5 py-2.5 rounded-full text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:border-amber-400 hover:text-amber-600 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1"
                            >
                                +{categories.length - 3} thêm
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {featuredCourses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>

                {/* Latest Courses Section */}
                <div className="mt-20 mb-10 border-t border-slate-100 pt-16 flex justify-between items-end">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                            <Sparkles size={14} className="animate-pulse" />
                            Mới ra mắt
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
                            Khóa học <span className="text-emerald-500">Mới Nhất</span> 🚀
                        </h2>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {latestCourses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>

                {/* Free Courses Section */}
                {freeCourses.length > 0 && (
                    <>
                        <div className="mt-20 mb-10 border-t border-slate-100 pt-16 flex justify-between items-end">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                                    <Users size={14} />
                                    Học bổng
                                </div>
                                <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
                                    Hoàn toàn <span className="text-blue-500">Miễn Phí</span> 🎁
                                </h2>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {freeCourses.map((course) => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    </>
                )}

                <div className="mt-16 flex justify-center">
                    <button
                        onClick={() => navigate('/courses')}
                        className="group relative inline-flex items-center gap-3 px-8 py-3.5 bg-white text-slate-700 font-bold rounded-full overflow-hidden border border-slate-200 transition-all duration-300 hover:border-amber-400 hover:text-amber-700 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 cursor-pointer"
                    >
                        <span className="relative z-10">Khám phá tất cả khóa học</span>
                        <div className="relative z-10 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-amber-100 group-hover:translate-x-1 transition-all duration-300">
                            <ArrowRight size={16} />
                        </div>
                        <div className="absolute inset-0 bg-amber-50/50 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
                    </button>
                </div>
            </section>

            {/* Info Section - Premium Look */}
            <section className="relative bg-white py-24 overflow-hidden border-y border-slate-100">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-50/50 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-50/50 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div className="relative max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="group bg-white/60 backdrop-blur-xl border border-slate-100 p-10 rounded-3xl flex flex-col items-center text-center hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-100 transition-all duration-500 hover:-translate-y-2 cursor-default relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 text-red-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-red-200 transition-all duration-500">
                            <GraduationCap size={36} />
                        </div>
                        <h4 className="relative z-10 text-2xl font-extrabold text-slate-900 mb-4 tracking-tight group-hover:text-red-700 transition-colors">Giảng viên chuyên gia</h4>
                        <p className="relative z-10 text-slate-500 leading-relaxed font-medium">Đội ngũ thầy cô giàu kinh nghiệm, tâm huyết từ các trường chuyên danh tiếng.</p>
                    </div>

                    <div className="group bg-white/60 backdrop-blur-xl border border-slate-100 p-10 rounded-3xl flex flex-col items-center text-center hover:shadow-2xl hover:shadow-amber-500/10 hover:border-amber-100 transition-all duration-500 hover:-translate-y-2 cursor-default relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/0 to-amber-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-lg group-hover:shadow-amber-200 transition-all duration-500">
                            <Flame size={36} />
                        </div>
                        <h4 className="relative z-10 text-2xl font-extrabold text-slate-900 mb-4 tracking-tight group-hover:text-amber-700 transition-colors">Lộ trình bứt phá</h4>
                        <p className="relative z-10 text-slate-500 leading-relaxed font-medium">Giáo trình được thiết kế cá nhân hóa, bám sát cấu trúc đề thi mới nhất.</p>
                    </div>

                    <div className="group bg-white/60 backdrop-blur-xl border border-slate-100 p-10 rounded-3xl flex flex-col items-center text-center hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-100 transition-all duration-500 hover:-translate-y-2 cursor-default relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-blue-200 transition-all duration-500">
                            <Users size={36} />
                        </div>
                        <h4 className="relative z-10 text-2xl font-extrabold text-slate-900 mb-4 tracking-tight group-hover:text-blue-700 transition-colors">Cộng đồng học tập</h4>
                        <p className="relative z-10 text-slate-500 leading-relaxed font-medium">Hỗ trợ 24/7, cùng trao đổi và học hỏi với <span className="font-bold text-blue-600">{totalLearnersText}</span>.</p>
                    </div>
                </div>
            </section>

            {/* Slide Show Logo Section */}
            <section className="py-20 bg-slate-50 border-y border-slate-200 overflow-hidden relative">
                {/* Fade overlays for the marquee effect */}
                <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none hidden md:block"></div>
                <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none hidden md:block"></div>

                <div className="relative max-w-7xl mx-auto px-4 mb-12">
                    <h2 className="text-center text-slate-800 font-black uppercase tracking-[0.25em] text-sm md:text-base mb-3 opacity-80">
                        Đối tác đồng hành cùng chúng tôi
                    </h2>
                    <p className="text-center text-slate-500 font-medium max-w-xl mx-auto text-sm md:text-base">
                        Hơn <span className="font-bold text-slate-800">{totalLearnersText}</span> đã tin tưởng và chọn chúng tôi
                    </p>
                    
                    <div className="flex justify-center mt-6">
                        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full opacity-50"></div>
                    </div>
                </div>

                <div className="marquee-container relative z-0">
                    <div className="marquee-content py-4">
                        {[...slideShowLogo, ...slideShowLogo, ...slideShowLogo].map((logo, index) => (
                            <div
                                key={`${logo.id}-${index}`}
                                className="group cursor-pointer w-40 h-28 md:w-56 md:h-36 flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-slate-200 hover:-translate-y-2 hover:border-amber-200 mx-4"
                            >
                                <img
                                    src={logo.image}
                                    alt={`Partner ${logo.id}`}
                                    className='max-w-full max-h-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500'
                                    style={{ transform: 'scale(0.95)' }}
                                />
                                <p className="text-center text-slate-400 group-hover:text-slate-800 font-extrabold text-[10px] md:text-xs uppercase tracking-[0.2em] mt-4 transition-colors duration-300">{logo.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Home;
