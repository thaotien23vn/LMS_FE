import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Award, FileText, Download, ArrowRight, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';
import { progressService } from '../services/progress.service';
import toast from 'react-hot-toast';

interface FinalQuizCongratulationsProps {
  level?: string;
  score?: number;
  percentageScore?: number;
  certificate?: any;
  levelUp?: any;
}

const FinalQuizCongratulations: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as FinalQuizCongratulationsProps;

  const [isDownloading, setIsDownloading] = useState(false);
  const certificateData = state?.certificate || null;

  useEffect(() => {
    if (!state) navigate('/');
  }, [state, navigate]);

  const handleDownloadCertificate = async () => {
    const courseId = certificateData?.courseId || certificateData?.id || certificateData?.certificateId;
    if (!courseId) { toast.error('Không tìm thấy thông tin chứng chỉ'); return; }
    setIsDownloading(true);
    try {
      await progressService.downloadCertificate(courseId);
      toast.success('Tải chứng chỉ thành công!');
    } catch {
      toast.error('Không thể tải chứng chỉ, vui lòng thử lại');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewCertificate = () => {
    const certId = certificateData?.certificateId || certificateData?.id;
    if (certId) navigate(`/verify/${certId}`);
  };

  if (!state) return null;

  const { level = 'Unknown', score = 0, percentageScore = 0, levelUp } = state;

  const achievements = [
    'Hoàn thành tất cả bài học bắt buộc',
    'Vượt qua bài kiểm tra cuối khóa',
    'Nhận được chứng chỉ nội bộ',
    ...(levelUp ? [`Nâng cấp lên cấp độ ${levelUp.newLevel || level}`] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-4">

        {/* Header card */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 bg-slate-50/50 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center text-amber-500 border border-amber-100">
                <Award size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Hoàn thành khóa học</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chứng chỉ đã được cấp</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5">
              <Sparkles size={12} className="text-amber-500" />
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Xuất sắc</span>
            </div>
          </div>

          <div className="p-8 text-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              Chúc mừng bạn! 🎉
            </h1>
            <p className="text-sm font-bold text-gray-400">
              Bạn đã hoàn thành khoá học này thành công
            </p>
          </div>
        </div>

        {/* Score stats */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 bg-slate-50/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kết quả bài thi cuối khóa</p>
          </div>
          <div className="p-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Điểm số', value: score, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
              { label: 'Tỉ lệ', value: `${percentageScore}%`, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-100' },
              { label: 'Cấp độ', value: level, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} border ${s.border} rounded-[24px] p-5 text-center`}>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">{s.label}</p>
                <p className={`text-2xl font-black ${s.color} tracking-tight`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Level up banner */}
        {levelUp && (
          <div className="bg-white rounded-[40px] border border-amber-100 shadow-sm overflow-hidden">
            <div className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shrink-0">
                <TrendingUp size={20} className="text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Nâng cấp thành công!</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Bạn vừa lên cấp độ {levelUp.newLevel || level}
                </p>
              </div>
              <CheckCircle2 size={20} className="text-amber-500 ml-auto shrink-0" />
            </div>
          </div>
        )}

        {/* Certificate */}
        {certificateData && (
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 bg-slate-50/50 flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center text-amber-500 border border-amber-100">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Chứng chỉ nội bộ</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {certificateData.issuedDate
                    ? `Cấp ngày ${new Date(certificateData.issuedDate).toLocaleDateString('vi-VN')}`
                    : 'Đã xác thực'}
                </p>
              </div>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  {certificateData.title || 'Chứng chỉ hoàn thành khóa học'}
                </h4>
                <p className="text-[11px] font-bold text-gray-400 leading-relaxed">
                  {certificateData.description || 'Bạn đã chứng minh thành thạo tất cả kỹ năng trong khóa học này'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadCertificate}
                  disabled={isDownloading}
                  className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-2xl px-4 py-3 text-[11px] font-bold hover:bg-amber-50 hover:border-amber-100 hover:text-amber-600 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Download size={15} />
                  {isDownloading ? 'Đang tải...' : 'Tải PDF'}
                </button>
                <button
                  onClick={handleViewCertificate}
                  className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-2xl px-4 py-3 text-[11px] font-bold hover:bg-amber-50 hover:border-amber-100 hover:text-amber-600 transition-all cursor-pointer"
                >
                  <FileText size={15} />
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 bg-slate-50/50 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center text-amber-500 border border-amber-100">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Thành tựu của bạn</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{achievements.length} mục đã đạt</p>
            </div>
          </div>
          <div className="px-8 py-4">
            {achievements.map((a, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 py-4 ${i < achievements.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="w-5 h-5 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle2 size={12} className="text-amber-500" />
                </div>
                <span className="text-[11px] font-bold text-slate-600">{a}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/')}
          className="w-full bg-slate-900 text-white py-5 rounded-[28px] font-black text-sm flex items-center justify-center gap-3 hover:bg-amber-500 transition-all shadow-xl shadow-slate-900/10 active:scale-95 cursor-pointer"
        >
          Quay lại trang chủ
          <ArrowRight size={18} />
        </button>

        <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest pb-4">
          Cảm ơn bạn đã hoàn thành khóa học 🌟
        </p>

      </div>
    </div>
  );
};

export default FinalQuizCongratulations;