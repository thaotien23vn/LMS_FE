import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, User, BookOpen, Calendar, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { teacherService, type BackendReview } from '../../services/teacher.service';
import toast from 'react-hot-toast';

const TeacherReviews: React.FC = () => {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState<BackendReview[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [courseFilter, setCourseFilter] = useState<string>('all');
    const [ratingFilter, setRatingFilter] = useState<string>('all');
    const itemsPerPage = 10;

    const loadReviews = async (page = 1) => {
        try {
            setLoading(true);
            const params: any = { page, limit: itemsPerPage };
            if (courseFilter !== 'all') params.courseId = courseFilter;
            if (ratingFilter !== 'all') params.minRating = Number(ratingFilter);
            const data = await teacherService.getTeacherReviews(params);
            setReviews(data.reviews || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setCurrentPage(data.pagination?.page || 1);
        } catch (err: any) {
            toast.error(err?.message || 'Không thể tải đánh giá');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviews(1);
    }, [courseFilter, ratingFilter]);

    const courses = useMemo(() => {
        const map = new Map<string, string>();
        reviews.forEach(r => {
            if (r.course?.id && r.course?.title) {
                map.set(String(r.course.id), r.course.title);
            }
        });
        return Array.from(map.entries());
    }, [reviews]);

    const averageRating = useMemo(() => {
        if (reviews.length === 0) return 0;
        const total = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        return (total / reviews.length).toFixed(1);
    }, [reviews]);

    const ratingCounts = useMemo(() => {
        const counts = [0, 0, 0, 0, 0];
        reviews.forEach(r => {
            const rating = Math.min(Math.max(Math.round(r.rating || 0), 1), 5);
            counts[5 - rating]++;
        });
        return counts;
    }, [reviews]);

    const maxCount = Math.max(...ratingCounts, 1);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
        });
    };

    return (
        <div className="w-full pb-20">
            <div className="max-w-7xl mx-auto px-4 lg:px-0">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <button
                            onClick={() => navigate('/teacher/dashboard')}
                            className="group flex items-center gap-3 text-gray-400 hover:text-amber-600 font-black uppercase tracking-widest text-[10px] transition-all cursor-pointer mb-4"
                        >
                            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-amber-50 transition-all">
                                <ChevronLeft size={14} />
                            </div>
                            Quay lại Dashboard
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <MessageSquare size={32} className="text-amber-500" />
                            Quản lý Đánh giá
                        </h1>
                        <p className="text-gray-400 mt-2 font-medium">Xem đánh giá từ học viên về các khóa học của bạn</p>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-[24px] p-6 md:p-8 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                                <Star size={28} fill="currentColor" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đánh giá trung bình</p>
                                <p className="text-3xl font-black text-gray-900">{averageRating}</p>
                                <p className="text-xs font-bold text-gray-400">{reviews.length} đánh giá</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 md:p-8 border border-gray-100 shadow-sm md:col-span-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Phân bố đánh giá</p>
                        <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((star, i) => (
                                <div key={star} className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 w-12">
                                        <span className="text-sm font-bold text-gray-700">{star}</span>
                                        <Star size={14} className="text-amber-400" fill="currentColor" />
                                    </div>
                                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-400 rounded-full transition-all"
                                            style={{ width: `${(ratingCounts[i] / maxCount) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 w-8 text-right">{ratingCounts[i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-5 md:p-6 rounded-[24px] border border-gray-100 shadow-sm mb-8">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Khóa học</div>
                            <select
                                className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition-all cursor-pointer"
                                value={courseFilter}
                                onChange={(e) => setCourseFilter(e.target.value)}
                            >
                                <option value="all">Tất cả khóa học</option>
                                {courses.map(([id, title]) => (
                                    <option key={id} value={id}>{title}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Số sao tối thiểu</div>
                            <select
                                className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition-all cursor-pointer"
                                value={ratingFilter}
                                onChange={(e) => setRatingFilter(e.target.value)}
                            >
                                <option value="all">Tất cả sao</option>
                                <option value="5">5 sao</option>
                                <option value="4">4+ sao</option>
                                <option value="3">3+ sao</option>
                                <option value="2">2+ sao</option>
                                <option value="1">1+ sao</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100">
                            <div className="animate-pulse flex justify-center mb-4">
                                <Star size={32} className="text-amber-200" />
                            </div>
                            <p className="text-gray-400 font-bold">Đang tải đánh giá...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100">
                            <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-400 font-bold text-lg">Chưa có đánh giá nào</p>
                            <p className="text-gray-400 text-sm mt-1">Các đánh giá từ học viên sẽ hiển thị ở đây</p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="bg-white rounded-[24px] p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                        {review.user?.avatar ? (
                                            <img src={review.user.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                                        ) : (
                                            <User size={24} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-gray-900">{review.user?.name || 'Học viên'}</span>
                                                <div className="flex items-center gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={14}
                                                            className={i < (review.rating || 0) ? 'text-amber-400' : 'text-gray-200'}
                                                            fill={i < (review.rating || 0) ? 'currentColor' : 'none'}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Calendar size={14} />
                                                <span className="text-xs font-bold">{formatDate(review.createdAt)}</span>
                                            </div>
                                        </div>
                                        {review.course?.title && (
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <BookOpen size={14} className="text-amber-500" />
                                                <span className="text-xs font-bold text-amber-600">{review.course.title}</span>
                                            </div>
                                        )}
                                        {review.comment && (
                                            <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="mt-8 p-5 bg-white rounded-[24px] border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                        <p className="text-xs font-bold text-gray-400">
                            Trang {currentPage} / {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => loadReviews(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => loadReviews(i + 1)}
                                    className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${
                                        currentPage === i + 1
                                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                                            : 'text-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => loadReviews(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherReviews;
