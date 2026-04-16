import { useState } from 'react';
import { motion } from 'framer-motion';
import { deadlineColor } from '../utils/formatters.js';
import { daysUntil } from '../utils/eligibilityEngine.js';
import { saveReminder, hasReminder } from '../utils/applications.js';
import { t } from '../data/strings.js';

export default function DeadlineVisualizer({ scheme, vault, lang }) {
  const days = daysUntil(scheme.deadline);
  const clamped = Math.max(0, Math.min(60, days));
  const pct = (60 - clamped) / 60; // fills left→right as deadline approaches
  const color = deadlineColor(days);
  const [reminded, setReminded] = useState(hasReminder(scheme.id));
  const myDistrict = vault?.district;
  const districtCount = scheme.district_applicants?.[myDistrict] ?? 0;
  const districtLabel = myDistrict || 'your area';

  const handleBell = (e) => {
    e.stopPropagation();
    saveReminder(scheme.id);
    setReminded(true);
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-black" style={{ color }}>
            {Math.max(0, days)}
          </span>
          <span className="text-sm text-brand-muted">{t('days_left', lang)}</span>
        </div>
        <button
          onClick={handleBell}
          className="!min-h-0 !min-w-0 p-2 rounded-full hover:bg-gray-100 relative"
          aria-label="Save reminder"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill={reminded ? color : 'none'} stroke={color} strokeWidth="2">
            <path d="M18 16v-5a6 6 0 10-12 0v5l-2 2h16l-2-2zM9 20a3 3 0 006 0" />
          </svg>
        </button>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      {districtCount > 0 && (
        <div className="mt-1.5 text-xs text-brand-muted">
          <span className="font-semibold text-brand-ink">{districtCount.toLocaleString()}</span>{' '}
          {lang === 'ta'
            ? `பேர் ${districtLabel} மாவட்டத்தில் இந்த மாதம் விண்ணப்பித்துள்ளனர்`
            : `people from ${districtLabel} applied this month`}
        </div>
      )}
      {reminded && (
        <div className="mt-1.5 text-xs text-brand-green font-medium">
          {t('reminder_saved', lang)}
        </div>
      )}
    </div>
  );
}
