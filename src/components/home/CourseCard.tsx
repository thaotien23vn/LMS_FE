import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Users, BookOpen, Heart, PlayCircle, Zap } from 'lucide-react';
import { type FrontendCourse } from '../../services/course.service';
import { useEnrollmentStore } from '../../store/useEnrollmentStore';
interface CourseCardProps {
    course: FrontendCourse;
    progress?: number;
    isEnrolled?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, progress, isEnrolled: isEnrolledProp }) => {
    const navigate = useNavigate();
    const { enrolledCourses } = useEnrollmentStore();
    const isEnrolled = isEnrolledProp ?? enrolledCourses.some(item => String(item.id) === String(course.id));

    const teacherInitials = (name: string) => {
        const parts = String(name || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        const first = parts[0]?.[0] || '';
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
        return `${first}${last}`.toUpperCase() || 'GV';
    };

    const handleAction = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isEnrolled) {
            navigate(`/course/${course.id}/dashboard`);
        } else {
            navigate(`/course/${course.id}`);
        }
    };

    return (
        <div
            onClick={() => navigate(`/course/${course.id}`)}
            className="group bg-white cursor-pointer rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-amber-100/50 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full relative"
        >
            {/* Image & Badges */}
            <div className="relative aspect-16/10 overflow-hidden">
                <img
                    src={course.image || '/elearning-1.jpg'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Category Badge */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-amber-600 uppercase tracking-wider shadow-sm">
                    {course.category}
                </div>


                {/* Level Badge */}
                <div className="absolute bottom-4 left-4 flex gap-2">
                    <span className="bg-amber-500/90 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {course.level}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1 gap-2">
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-500">
                            <Star size={14} fill="currentColor" />
                            <span className="text-sm font-bold text-gray-700">{course.rating}</span>
                            <span className="text-xs text-gray-400">({course.reviewCount})</span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                // Heart logic
                            }}
                            className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                        >
                            <Heart size={18} />
                        </button>
                    </div>

                    <h3 className="text-base font-bold text-gray-800 line-clamp-2 min-h-12 group-hover:text-amber-600 transition-colors">
                        {course.title}
                    </h3>

                    <p className="text-xs text-gray-600 line-clamp-2">{course.description}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 py-2 border-y border-gray-50 my-1">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Users size={14} className="text-blue-500" />
                        <span className="text-xs font-medium">{course.students.toLocaleString()} học viên</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <BookOpen size={14} className="text-emerald-500" />
                        <span className="text-xs font-medium">{course.totalLessons} bài</span>
                    </div>
                </div>

                {/* Progress Bar - Only show for enrolled courses with progress */}
                {isEnrolled && typeof progress === 'number' && progress > 0 && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 font-medium">Tiến độ</span>
                            <span className="text-emerald-600 font-bold">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Teacher & Price */}
                <div className="mt-auto pt-1 flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {course.teacherAvatar ? (
                            <img src={course.teacherAvatar} alt={course.teacher} className="w-7 h-7 rounded-full border border-amber-100" />
                        ) : (
                            <div className="w-7 h-7 rounded-full border border-amber-100 bg-amber-50 text-amber-700 flex items-center justify-center text-[10px] font-black">
                                {teacherInitials(course.teacher)}
                            </div>
                        )}
                        <span className="text-[11px] font-bold text-gray-600">{course.teacher}</span>
                    </div>
                    {!isEnrolled && (
                        <div className="text-right">
                            <span className={`text-lg font-black ${course.price === 0 ? 'text-emerald-600' : 'text-amber-600'} block leading-none`}>
                                {course.price === 0 ? 'MIỄN PHÍ' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price || 0)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Call to Action (Always visible but highlighted on hover) */}
                <div className="border-t border-gray-100 pt-3 mt-auto space-y-2">
                    {isEnrolled ? (
                        <button
                            onClick={handleAction}
                            className="w-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white py-2.5 rounded-lg font-bold text-[12px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer"
                        >
                            Học tiếp ngay
                            <PlayCircle size={14} />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/course/${course.id}`);
                                }}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-lg font-bold text-[12px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5 active:scale-95"
                            >
                                <Zap size={14} />
                                Mua ngay
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseCard;
