import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { categoryEmoji, formatRupees } from '../utils/formatters.js';
import { tf, t } from '../data/strings.js';

export default function FuzzyMatchCard({ entry, vault, lang }) {
  const { scheme, fuzzy } = entry;
  const [showTip, setShowTip] = useState(false);
  const nav = useNavigate();

  const badgeLabel =
    fuzzy?.type === 'age'
      ? tf('eligible_in_months', lang, { n: fuzzy.months })
      : t('check_panchayat', lang);

  const tipText =
    fuzzy?.type === 'age'
      ? lang === 'ta'
        ? `இந்த திட்டத்திற்கு குறைந்தபட்ச வயது ${scheme.eligibility.min_age}. நீங்கள் விரைவில் தகுதி பெறுவீர்கள்.`
        : `Minimum age is ${scheme.eligibility.min_age}. You'll qualify soon.`
      : lang === 'ta'
      ? `உங்கள் வருமானம் வரம்புக்கு அருகில் உள்ளது (₹${(scheme.eligibility.income_max_annual || 0).toLocaleString('en-IN')}). வேலை வருமான சான்றிதழை காட்டி பரிசீலிக்கப்படலாம்.`
      : `Your income is close to the limit (₹${(scheme.eligibility.income_max_annual || 0).toLocaleString('en-IN')}). With a work income certificate you may still qualify.`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => nav(`/scheme/${scheme.id}`)}
      className="bg-white rounded-2xl p-5 shadow-card cursor-pointer border-2 border-dashed border-brand-amber/70"
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl leading-none opacity-70">{categoryEmoji(scheme.category)}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-brand-ink leading-snug">{scheme.name_plain}</h3>
          <div className="text-[11px] text-brand-muted mt-0.5 truncate">{scheme.name_official}</div>
        </div>
        {scheme.benefit_amount > 0 && (
          <span className="shrink-0 bg-gray-100 text-brand-muted font-semibold rounded-full px-2.5 py-1 text-xs">
            {formatRupees(scheme.benefit_amount)}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 bg-brand-amber/15 text-brand-saffron-dark rounded-full px-3 py-1.5 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-brand-amber" />
          {badgeLabel}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowTip((s) => !s);
          }}
          className="!min-h-0 !min-w-0 w-6 h-6 rounded-full bg-gray-100 text-brand-muted text-[11px] font-bold"
          aria-label="Why"
        >
          ?
        </button>
      </div>

      {showTip && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 text-xs text-brand-muted bg-gray-50 rounded-lg p-2.5"
        >
          {tipText}
        </motion.div>
      )}
    </motion.article>
  );
}
