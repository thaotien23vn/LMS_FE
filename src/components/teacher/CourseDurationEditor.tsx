import { useState } from 'react';

interface CourseDurationEditorProps {
  value: {
    durationType: 'lifetime' | 'fixed' | 'subscription';
    durationValue?: number;
    durationUnit?: 'days' | 'months' | 'years';
    renewalDiscountPercent?: number;
    gracePeriodDays?: number;
  };
  onChange: (value: any) => void;
}

import { Clock } from 'lucide-react';

const durationTypes = [
  { id: 'lifetime', label: 'Vĩnh viễn', desc: 'Truy cập mãi mãi' },
  { id: 'fixed', label: 'Có thời hạn', desc: 'Hết hạn sau thời gian định trước' },
];

const quickDurations = [
  { value: 1, unit: 'months', label: '1 tháng' },
  { value: 3, unit: 'months', label: '3 tháng' },
  { value: 6, unit: 'months', label: '6 tháng' },
];

export const CourseDurationEditor: React.FC<CourseDurationEditorProps> = ({
  value,
  onChange,
}) => {
  const [showCustom, setShowCustom] = useState(false);

  const handleTypeChange = (type: string) => {
    const updates: any = { durationType: type };
    
    if (type === 'lifetime') {
      updates.durationValue = null;
      updates.durationUnit = null;
    } else if (type === 'fixed' && !value.durationValue) {
      // Default to 6 months for fixed duration
      updates.durationValue = 6;
      updates.durationUnit = 'months';
    }
    
    onChange({ ...value, ...updates });
    setShowCustom(false);
  };

  const handleQuickSelect = (item: typeof quickDurations[0]) => {
    onChange({
      ...value,
      durationType: 'fixed',
      durationValue: item.value,
      durationUnit: item.unit as any,
    });
    setShowCustom(false);
  };

  const getDurationDisplay = () => {
    if (value.durationType === 'lifetime') return 'Vĩnh viễn';
    if (!value.durationValue || !value.durationUnit) return 'Chưa chọn';
    
    const unitLabels: Record<string, string> = {
      days: 'ngày',
      months: 'tháng',
      years: 'năm',
    };
    
    return `${value.durationValue} ${unitLabels[value.durationUnit]}`;
  };

  return (
    <div className="space-y-4">
      {/* Duration Type Selection - Compact */}
      <div>
        <label className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2">
          <Clock size={12} className="text-amber-500" />
          Thời hạn truy cập
        </label>
        <div className="grid grid-cols-2 gap-2">
          {durationTypes.map((type) => (
            <label
              key={type.id}
              className={`border rounded-xl p-3 cursor-pointer transition-all hover:border-amber-300 ${
                value.durationType === type.id
                  ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500'
                  : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="durationType"
                value={type.id}
                checked={value.durationType === type.id}
                onChange={() => handleTypeChange(type.id)}
                className="sr-only"
              />
              <div className="font-bold text-sm text-gray-900 text-center">{type.label}</div>
              <div className="text-[10px] text-gray-500 mt-1 text-center leading-tight">{type.desc}</div>
            </label>
          ))}
        </div>
      </div>

      {/* Fixed Duration Configuration - Compact */}
      {value.durationType === 'fixed' && (
        <div className="bg-gray-50 p-4 rounded-xl space-y-4">
          {/* Quick Select */}
          <div className="flex gap-4">
            {quickDurations.map((item) => (
              <button
                key={`${item.value}-${item.unit}`}
                type="button"
                onClick={() => handleQuickSelect(item)}
                className={`flex-1 py-4 rounded-xl text-sm font-bold transition-colors ${
                  value.durationValue === item.value && value.durationUnit === item.unit
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-amber-300'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = !showCustom;
                setShowCustom(next);
                if (next) {
                  // Convert any existing preset (months) into days so presets un-highlight
                  const currentVal = value.durationValue || 0;
                  const currentUnit = value.durationUnit;
                  const totalDays = currentUnit === 'months' ? currentVal * 30 : currentVal;
                  onChange({
                    ...value,
                    durationType: 'fixed',
                    durationValue: totalDays,
                    durationUnit: 'days',
                  });
                }
              }}
              className={`flex-1 py-4 rounded-xl text-sm font-bold transition-colors ${
                showCustom
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-amber-300'
              }`}
            >
              Tùy
            </button>
          </div>

          {/* Custom Input */}
          {showCustom && (
            <div className="flex items-center gap-5 mt-2 bg-white p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={value.durationUnit === 'days' && value.durationValue ? Math.floor((value.durationValue || 0) / 30) : (value.durationValue || 0)}
                  onChange={(e) => {
                    const months = parseInt(e.target.value) || 0;
                    const days = value.durationUnit === 'days' ? (value.durationValue || 0) % 30 : 0;
                    onChange({
                      ...value,
                      durationType: 'fixed',
                      durationValue: months * 30 + days,
                      durationUnit: 'days',
                    });
                  }}
                  className="w-20 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-amber-500 outline-none"
                  placeholder="0"
                />
                <span className="text-gray-500 text-sm font-medium">tháng</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={value.durationUnit === 'days' && value.durationValue ? (value.durationValue || 0) % 30 : 0}
                  onChange={(e) => {
                    const days = parseInt(e.target.value) || 0;
                    const months = value.durationUnit === 'days' ? Math.floor((value.durationValue || 0) / 30) : (value.durationValue || 0);
                    onChange({
                      ...value,
                      durationType: 'fixed',
                      durationValue: months * 30 + days,
                      durationUnit: 'days',
                    });
                  }}
                  className="w-20 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-amber-500 outline-none"
                  placeholder="0"
                />
                <span className="text-gray-500 text-sm font-medium">ngày</span>
              </div>
            </div>
          )}

          {/* Selected Display */}
          <div className="p-3 bg-amber-100 rounded-lg">
            <span className="text-xs text-amber-800 font-medium">
              Học viên có <strong>{getDurationDisplay()}</strong> để hoàn thành khóa học
            </span>
          </div>

          {/* Compact Renewal Settings */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">
                Giảm giá gia hạn
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={value.renewalDiscountPercent || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    onChange({
                      ...value,
                      renewalDiscountPercent: Math.min(100, Math.max(0, val)),
                    });
                  }}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-amber-500 outline-none"
                />
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">
                Ân hạn sau hết hạn
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={value.gracePeriodDays ?? 7}
                  onChange={(e) => onChange({ 
                    ...value, 
                    gracePeriodDays: parseInt(e.target.value) || 0 
                  })}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-amber-500 outline-none"
                />
                <span className="text-gray-500 text-sm">ngày</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
