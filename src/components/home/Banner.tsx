import { CheckCircle2 } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
    {
        image: '/elearning-1.jpg',
        headline: 'Hành Trình Của Bạn Bắt Đầu Từ Đây',
        sub1: 'Hơn 100+ khóa học từ cơ bản đến chuyên sâu — được giảng dạy bởi các chuyên gia hàng đầu',
        sub2: 'Linh hoạt học mọi lúc, mọi nơi — trên điện thoại, máy tính hay máy tính bảng',
    },
    {
        image: '/e-learning.jpg',
        headline: 'Học Mọi Thứ Bạn Muốn',
        sub1: 'Từ lập trình, thiết kế, marketing đến kỹ năng mềm — tất cả trong một nền tảng',
        sub2: 'Lộ trình học tập cá nhân hóa giúp bạn tiến bộ nhanh hơn mỗi ngày',
    },
    {
        image: '/school.png',
        headline: 'Chứng Chỉ Hoàn Thành Nội Bộ',
        sub1: 'Nhận chứng chỉ từ hệ thống khi hoàn thành khóa học đầy đủ',
        sub2: 'Ghi nhận nỗ lực và quá trình học tập của bạn trên nền tảng của chúng tôi',
    },
    {
        image: '/learning.png',
        headline: 'Cộng Đồng Học Tập Sôi Nổi',
        sub1: 'Kết nối với hàng nghìn học viên và giảng viên trên khắp cả nước',
        sub2: 'Đặt câu hỏi, thảo luận và cùng nhau phát triển trong môi trường tích cực',
    },
];

const AUTOPLAY_INTERVAL = 5000;

const Banner: React.FC = () => {
    const navigate = useNavigate();
    const [current, setCurrent] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, []);

    useEffect(() => {
        const timer = setInterval(nextSlide, AUTOPLAY_INTERVAL);
        return () => clearInterval(timer);
    }, [nextSlide]);

    const slide = SLIDES[current];

    return (
        <div className="relative w-full overflow-hidden h-[60vh] md:h-[92vh]">
            {/* Background image with fade transition */}
            {SLIDES.map((s, i) => (
                <div
                    key={s.image}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === current ? 'opacity-100' : 'opacity-0'}`}
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-linear-to-r from-black/80 via-black/50 to-black/10 z-10"></div>
                    <img
                        src={s.image}
                        alt="Banner"
                        className="w-full h-full object-cover"
                    />
                </div>
            ))}

            {/* Text content */}
            <div className="absolute bottom-30 md:left-10 left-3 p-2 flex flex-col md:items-start items-center justify-center gap-2 z-20">
                <p className='md:text-6xl text-4xl font-dancing-script-700 text-amber-400 flex items-center gap-2 transition-all duration-700'>
                    {slide.headline} <CheckCircle2 size={30} />
                </p>
                <p className='text-2xl font-bold text-white max-w-3xl transition-all duration-700'>{slide.sub1}</p>
                <p className='text-xl font-bold text-amber-400 transition-all duration-700'>{slide.sub2}</p>

                <div className="flex gap-2 mt-10">
                    <button
                        onClick={() => navigate('/courses')}
                        className='bg-amber-500 text-white px-8 py-4 text-xl font-black rounded-full hover:bg-amber-600 cursor-pointer transition-all duration-300 shadow-xl shadow-amber-500/20 active:scale-95'
                    >
                        KHÁM PHÁ KHÓA HỌC NGAY
                    </button>
                </div>
            </div>

            {/* Dots navigation */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {SLIDES.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`w-2.5 h-2.5 rounded-full shadow-sm cursor-pointer transition-all duration-300 ${
                            i === current ? 'bg-amber-400 scale-125' : 'bg-white/60 hover:bg-white'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default Banner;
