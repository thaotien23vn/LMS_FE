import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, AlertCircle, CreditCard, Lightbulb } from 'lucide-react';
import { enrollmentService, type RenewalPriceResponse } from '../services/enrollment.service';
import toast from 'react-hot-toast';

// Helpers: scale presets theo thời hạn khóa học
function getCourseDurationMonths(value?: number, unit?: string): number {
  if (!value) return 1;
  switch (unit) {
    case 'days': return value / 30;
    case 'months': return value;
    case 'years': return value * 12;
    default: return 1;
  }
}

function formatDurationLabel(months: number): string {
  const totalDays = Math.round(months * 30);
  if (totalDays < 30) return `${totalDays} ngày`;
  if (months < 1) return `${Math.round(months * 10) / 10} tháng`;
  if (months < 12) return `${Math.round(months)} tháng`;
  const years = Math.floor(months / 12);
  const remMonths = Math.round(months % 12);
  if (remMonths === 0) return `${years} năm`;
  return `${years} năm ${remMonths} tháng`;
}

function generatePresets(courseDurationMonths: number, progressPercent: number = 0) {
  const presets: { months: number; label: string; discount: number; badge?: string; recommended?: boolean }[] = [];

  const shortMonths = Math.max(7 / 30, courseDurationMonths * 0.25);
  const halfMonths = courseDurationMonths * 0.5;
  const fullMonths = courseDurationMonths;

  presets.push({ months: shortMonths, label: formatDurationLabel(shortMonths), discount: 0 });

  if (Math.abs(halfMonths - shortMonths) > 0.3 && Math.abs(halfMonths - fullMonths) > 0.3 && halfMonths < 24) {
    presets.push({ months: halfMonths, label: formatDurationLabel(halfMonths), discount: 5, badge: 'Tiết kiệm 5%' });
  }

  presets.push({ months: fullMonths, label: formatDurationLabel(fullMonths), discount: 10, badge: 'Tiết kiệm 10%' });

  let recIndex = presets.findIndex(p => Math.abs(p.months - fullMonths) < 0.1);
  if (progressPercent < 30) recIndex = 0;
  else if (progressPercent > 70) {
    recIndex = presets.findIndex(p => Math.abs(p.months - halfMonths) < 0.1);
    if (recIndex < 0) recIndex = 0;
  }
  if (recIndex >= 0 && recIndex < presets.length) {
    presets[recIndex].recommended = true;
    presets[recIndex].badge = presets[recIndex].badge || 'Phù hợp nhất';
  }

  return presets;
}

function getSuggestionText(progressPercent: number = 0, enrollmentStatus?: string): string {
  if (enrollmentStatus === 'expired' || enrollmentStatus === 'grace_period') {
    return 'Khóa học đã hết hạn. Bạn nên gia hạn đủ thời hạn để hoàn thành.';
  }
  if (progressPercent < 30) {
    return 'Bạn mới bắt đầu học. Chọn gói ngắn để thử trước, hoặc gói đầy đủ nếu muốn học lâu dài.';
  }
  if (progressPercent > 70) {
    return 'Bạn đã học được hơn 70%. Chọn gói ngắn hoặc nửa thời hạn là đủ để hoàn thành.';
  }
  return 'Bạn đang học ổn định. Gói đầy đủ khóa học là lựa chọn phù hợp nhất.';
}

const RenewEnrollment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [renewalPrice, setRenewalPrice] = useState<RenewalPriceResponse | null>(null);
  const [months, setMonths] = useState(1);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [selectedDiscount, setSelectedDiscount] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const [customMonths, setCustomMonths] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const enrollments = await enrollmentService.listMyEnrollments();
        const en = enrollments.find(e => String(e.courseId) === String(id));
        if (!en) {
          toast.error('Không tìm thấy ghi danh');
          navigate(`/course/${id}`);
          return;
        }
        setEnrollment(en);
        setCourse(en.Course);

        const cd = getCourseDurationMonths((en.Course as any)?.durationValue, (en.Course as any)?.durationUnit);
        const generated = generatePresets(cd, en.progressPercent || 0);
        const rec = generated.find(p => p.recommended) || generated[0];
        setSelectedMonths(rec.months);
        setSelectedDiscount(rec.discount);
        setCustomMonths(rec.months);
        setMonths(rec.months);

        const price = await enrollmentService.getRenewalPrice(en.id, rec.months, rec.discount);
        setRenewalPrice(price);
      } catch (err: any) {
        toast.error(err.message || 'Không thể tải thông tin gia hạn');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, navigate]);

  // Reload price when months change
  useEffect(() => {
    const loadPrice = async () => {
      if (!enrollment) return;
      try {
        const discount = customMode ? 0 : selectedDiscount;
        const price = await enrollmentService.getRenewalPrice(enrollment.id, months, discount);
        setRenewalPrice(price);
      } catch (err) {
        console.error('Failed to load renewal price:', err);
      }
    };
    loadPrice();
  }, [months, selectedDiscount, customMode, enrollment?.id]);

  const handleRenew = () => {
    if (!enrollment || !course) return;
    const m = customMode ? customMonths : selectedMonths;
    const discount = customMode ? 0 : selectedDiscount;
    navigate(`/payment?courseId=${id}&type=renewal&enrollmentId=${enrollment.id}&months=${m}&discountPercent=${discount}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const isExpired = enrollment?.expiresAt && new Date() > new Date(enrollment.expiresAt);
  const isGracePeriod = enrollment?.enrollmentStatus === 'grace_period';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(`/course/${id}/dashboard`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Quay lại dashboard
        </button>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Status Header */}
          <div className={`p-6 ${isExpired ? 'bg-red-50' : 'bg-amber-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isExpired ? 'bg-red-100' : 'bg-amber-100'}`}>
                <Clock size={24} className={isExpired ? 'text-red-600' : 'text-amber-600'} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isGracePeriod ? 'Thời gian ân hạn' : isExpired ? 'Khóa học đã hết hạn' : 'Gia hạn khóa học'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {course?.title}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Current Status */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hết hạn lúc:</span>
                <span className="font-medium">
                  {enrollment?.expiresAt ? new Date(enrollment.expiresAt).toLocaleDateString('vi-VN') : 'Vĩnh viễn'}
                </span>
              </div>
              {enrollment?.gracePeriodEndsAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ân hạn đến:</span>
                  <span className="font-medium text-red-600">
                    {new Date(enrollment.gracePeriodEndsAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Số lần đã gia hạn:</span>
                <span className="font-medium">{enrollment?.renewalCount || 0}</span>
              </div>
            </div>

            {/* Smart Suggestion */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Gợi ý</p>
                <p className="text-sm text-amber-700 mt-1">
                  {getSuggestionText(enrollment?.progressPercent || 0, enrollment?.enrollmentStatus)}
                </p>
                {(enrollment?.progressPercent || 0) > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Tiến độ hiện tại: {Math.round(enrollment.progressPercent)}%
                  </p>
                )}
              </div>
            </div>

            {/* Duration Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Thời gian gia hạn
                </label>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setCustomMode(false)}
                    className={`px-3 py-1 text-xs rounded-md transition-all ${
                      !customMode ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    Gói có sẵn
                  </button>
                  <button
                    onClick={() => setCustomMode(true)}
                    className={`px-3 py-1 text-xs rounded-md transition-all ${
                      customMode ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    Tùy chỉnh
                  </button>
                </div>
              </div>

              {!customMode ? (
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const cd = getCourseDurationMonths(course?.durationValue, course?.durationUnit);
                    return generatePresets(cd, enrollment?.progressPercent || 0);
                  })().map((opt, idx) => (
                    <button
                      key={`${opt.label}-${idx}`}
                      onClick={() => {
                        setSelectedMonths(opt.months);
                        setSelectedDiscount(opt.discount);
                        setMonths(opt.months);
                      }}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        Math.abs(selectedMonths - opt.months) < 0.01
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {opt.recommended && (
                        <span className="absolute -top-2 left-3 px-2 py-0.5 bg-amber-600 text-white text-xs font-medium rounded-full">
                          Gợi ý
                        </span>
                      )}
                      <div className="font-bold text-gray-900">{opt.label}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {opt.badge || (opt.discount > 0 ? `Giảm ${opt.discount}%` : 'Không giảm giá')}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-3 items-end">
                    <div className="w-32">
                      <label className="block text-xs text-gray-500 mb-1">Số ngày</label>
                      <input
                        type="number"
                        min="1"
                        max="1095"
                        step="1"
                        value={Math.round(customMonths * 30)}
                        onChange={(e) => {
                          const days = parseInt(e.target.value) || 1;
                          const clampedDays = Math.min(1095, Math.max(1, days));
                          const months = clampedDays / 30;
                          setCustomMonths(months);
                          setMonths(months);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="VD: 15"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Nhập số ngày gia hạn tùy ý (1–1095 ngày)
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                Khóa học gốc: {getCourseDurationMonths(course?.durationValue, course?.durationUnit) < 1
                  ? `${Math.round(getCourseDurationMonths(course?.durationValue, course?.durationUnit) * 30)} ngày`
                  : `${Math.round(getCourseDurationMonths(course?.durationValue, course?.durationUnit))} tháng`}.
                {customMode ? ' Tùy chọn theo nhu cầu thực tế.' : ' Chọn gói phù hợp với tiến độ học của bạn.'}
              </p>
            </div>

            {/* Price */}
            {renewalPrice && (
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Giá gốc:</span>
                  <span className="line-through text-gray-400">
                    {renewalPrice.originalPrice.toLocaleString()}đ
                  </span>
                </div>
                {renewalPrice.discountAmount > 0 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-green-600">Giảm giá ({renewalPrice.discountPercent}%):</span>
                    <span className="text-green-600">-{renewalPrice.discountAmount.toLocaleString()}đ</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-amber-200">
                  <span className="font-bold text-gray-900">Tổng thanh toán:</span>
                  <span className="text-2xl font-black text-amber-600">
                    {renewalPrice.renewalPrice.toLocaleString()}đ
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Hết hạn mới: {new Date(renewalPrice.newExpiry).toLocaleDateString('vi-VN')}
                </div>
              </div>
            )}

            {/* Warning */}
            {isExpired && !isGracePeriod && (
              <div className="flex items-start gap-3 bg-red-50 p-4 rounded-xl">
                <AlertCircle size={20} className="text-red-600 mt-0.5" />
                <div className="text-sm text-red-700">
                  Khóa học đã hết hạn. Bạn cần gia hạn để tiếp tục truy cập nội dung.
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/course/${id}/dashboard`)}
                className="flex-1 py-3.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Để sau
              </button>
              <button
                onClick={handleRenew}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:shadow-lg hover:shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard size={20} />
                Thanh toán & Gia hạn
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewEnrollment;
