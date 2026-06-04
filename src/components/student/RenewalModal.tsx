import { useState, useEffect, useMemo } from 'react';
import { X, Clock, Calendar, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';

interface RenewalOption {
  months: number;
  label: string;
  discount: number;
  badge?: string;
  recommended?: boolean;
}

interface RenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: {
    id: string | number;
    expiresAt?: string;
    enrollmentStatus?: string;
    progressPercent?: number;
    Course?: {
      id: string | number;
      title: string;
      imageUrl?: string;
      price?: number;
      durationType?: 'lifetime' | 'fixed' | 'subscription';
      durationValue?: number;
      durationUnit?: 'days' | 'months' | 'years';
      renewalDiscountPercent?: number;
    };
  } | null;
  onRenew: (months: number) => void;
  isProcessing?: boolean;
}

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

function generatePresets(courseDurationMonths: number, progressPercent: number = 0): RenewalOption[] {
  const presets: RenewalOption[] = [];

  const shortMonths = Math.max(7 / 30, courseDurationMonths * 0.25);
  const halfMonths = courseDurationMonths * 0.5;
  const fullMonths = courseDurationMonths;

  // Short
  presets.push({ months: shortMonths, label: formatDurationLabel(shortMonths), discount: 0 });

  // Half
  if (Math.abs(halfMonths - shortMonths) > 0.3 && Math.abs(halfMonths - fullMonths) > 0.3 && halfMonths < 24) {
    presets.push({ months: halfMonths, label: formatDurationLabel(halfMonths), discount: 5, badge: 'Tiết kiệm 5%' });
  }

  // Full
  presets.push({ months: fullMonths, label: formatDurationLabel(fullMonths), discount: 10, badge: 'Tiết kiệm 10%' });

  // Smart recommendation
  let recIndex = presets.findIndex(p => Math.abs(p.months - fullMonths) < 0.1);
  if (progressPercent < 30) {
    recIndex = 0;
  } else if (progressPercent > 70) {
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

export const RenewalModal: React.FC<RenewalModalProps> = ({
  isOpen,
  onClose,
  enrollment,
  onRenew,
  isProcessing = false,
}) => {
  const course = enrollment?.Course;
  const progressPercent = enrollment?.progressPercent || 0;

  const courseDurationMonths = useMemo(
    () => getCourseDurationMonths(course?.durationValue, course?.durationUnit),
    [course?.durationValue, course?.durationUnit]
  );

  const presets = useMemo(
    () => generatePresets(courseDurationMonths, progressPercent),
    [courseDurationMonths, progressPercent]
  );

  const [selectedMonths, setSelectedMonths] = useState(presets[0]?.months ?? 1);
  const [customMode, setCustomMode] = useState(false);
  const [customMonths, setCustomMonths] = useState(presets[0]?.months ?? 1);

  const basePrice = course?.price || 0;
  const isLifetime = course?.durationType === 'lifetime';

  // Reset default khi presets thay đổi
  useEffect(() => {
    if (presets.length > 0) {
      const rec = presets.find(p => p.recommended) || presets[0];
      setSelectedMonths(rec.months);
      setCustomMonths(rec.months);
    }
  }, [presets]);

  const currentMonths = customMode ? customMonths : selectedMonths;

  const renewalPrice = useMemo(() => {
    if (isLifetime) return { price: 0, originalPrice: 0, discount: 0, discountAmount: 0 };

    const option = presets.find(p => Math.abs(p.months - currentMonths) < 0.01);
    const discount = customMode ? 0 : (option?.discount || 0);
    const pricePerMonth = courseDurationMonths > 0 ? basePrice / courseDurationMonths : basePrice;
    const originalPrice = Math.floor(pricePerMonth * currentMonths);
    const discountAmount = Math.floor(originalPrice * discount / 100);
    const finalPrice = originalPrice - discountAmount;

    return { price: finalPrice, originalPrice, discount, discountAmount };
  }, [currentMonths, customMode, basePrice, courseDurationMonths, isLifetime, presets]);

  if (!isOpen || !enrollment) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Không xác định';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!enrollment.expiresAt) return null;
    const expiry = new Date(enrollment.expiresAt);
    const now = new Date();
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysRemaining();
  const isExpired = daysRemaining !== null && daysRemaining <= 0;
  const isGracePeriod = enrollment.enrollmentStatus === 'grace_period';

  const calculateNewExpiry = () => {
    const startFrom = enrollment.expiresAt && new Date(enrollment.expiresAt) > new Date()
      ? new Date(enrollment.expiresAt)
      : new Date();
    const newDate = new Date(startFrom);
    const daysToAdd = Math.round(currentMonths * 30);
    newDate.setDate(newDate.getDate() + daysToAdd);
    return newDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleRenew = () => {
    onRenew(currentMonths);
  };

  if (isLifetime) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Gia hạn khóa học</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Khóa học vĩnh viễn</p>
            <p className="text-sm text-gray-500 mt-2">
              Khóa học này có thời hạn truy cập vĩnh viễn. Bạn không cần gia hạn.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Gia hạn khóa học</h2>
            <p className="text-sm text-gray-500 mt-1">{course?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Status Alert */}
          {isExpired ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">Khóa học đã hết hạn</p>
                <p className="text-sm text-red-600 mt-1">
                  Bạn cần gia hạn để tiếp tục truy cập nội dung khóa học.
                </p>
              </div>
            </div>
          ) : isGracePeriod ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">Thời gian ân hạn</p>
                <p className="text-sm text-yellow-600 mt-1">
                  Khóa học đã hết hạn nhưng bạn vẫn có thể truy cập trong thời gian ân hạn.
                </p>
              </div>
            </div>
          ) : daysRemaining !== null && daysRemaining <= 7 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800">Sắp hết hạn</p>
                <p className="text-sm text-blue-600 mt-1">
                  Còn {daysRemaining} ngày nữa khóa học sẽ hết hạn ({formatDate(enrollment.expiresAt)})
                </p>
              </div>
            </div>
          ) : null}

          {/* Smart Suggestion */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Gợi ý</p>
              <p className="text-sm text-amber-700 mt-1">
                {getSuggestionText(progressPercent, enrollment.enrollmentStatus)}
              </p>
              {progressPercent > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Tiến độ hiện tại: {Math.round(progressPercent)}%
                </p>
              )}
            </div>
          </div>

          {/* Current Expiry Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Calendar className="w-4 h-4" />
              <span>Hết hạn hiện tại:</span>
              <span className="font-medium text-gray-900">
                {formatDate(enrollment.expiresAt)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Hết hạn sau gia hạn:</span>
              <span className="font-medium text-green-600">{calculateNewExpiry()}</span>
            </div>
          </div>

          {/* Duration Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Chọn thời gian gia hạn
            </label>

            {/* Preset Options */}
            <div className="grid grid-cols-2 gap-3">
              {presets.map((option, idx) => (
                <button
                  key={`${option.label}-${idx}`}
                  onClick={() => {
                    setSelectedMonths(option.months);
                    setCustomMode(false);
                  }}
                  className={`relative border-2 rounded-lg p-4 text-left transition-all ${
                    !customMode && Math.abs(selectedMonths - option.months) < 0.01
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={isProcessing}
                >
                  {option.recommended && (
                    <span className="absolute -top-2 left-4 px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                      Gợi ý
                    </span>
                  )}
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatPrice(Math.floor(
                      (basePrice / Math.max(courseDurationMonths, 0.01)) * option.months * (100 - option.discount) / 100
                    ))}
                  </div>
                  {option.badge && (
                    <div className="text-xs text-green-600 mt-1 font-medium">
                      {option.badge}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Option Toggle */}
            <button
              onClick={() => setCustomMode(!customMode)}
              className={`mt-3 w-full py-3 border-2 rounded-lg font-medium transition-all ${
                customMode
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              disabled={isProcessing}
            >
              {customMode ? '✓ Đang chọn tùy chỉnh' : 'Tùy chỉnh thời gian'}
            </button>

            {/* Custom Input */}
            {customMode && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm text-gray-600 mb-2">
                  Số ngày gia hạn (1–1095):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={1095}
                    step={1}
                    value={Math.round(customMonths * 30)}
                    onChange={(e) => {
                      const days = parseInt(e.target.value) || 1;
                      const clampedDays = Math.min(1095, Math.max(1, days));
                      setCustomMonths(clampedDays / 30);
                    }}
                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-center font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    disabled={isProcessing}
                  />
                  <span className="text-gray-600">ngày</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * Tùy chọn không áp dụng giảm giá
                </p>
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              {renewalPrice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Giá gốc</span>
                  <span className="line-through text-gray-400">
                    {formatPrice(renewalPrice.originalPrice)}
                  </span>
                </div>
              )}
              {renewalPrice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Giảm giá ({renewalPrice.discount}%)</span>
                  <span className="text-green-600">
                    -{formatPrice(renewalPrice.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="font-medium text-gray-900">Tổng thanh toán</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(renewalPrice.price)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t bg-gray-50">
          <button
            onClick={handleRenew}
            disabled={isProcessing}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Gia hạn ngay
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            Bằng việc gia hạn, bạn đồng ý với điều khoản sử dụng và chính sách thanh toán
          </p>
        </div>
      </div>
    </div>
  );
};
