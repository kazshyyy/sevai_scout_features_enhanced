import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { relatedEligible } from '../utils/eligibilityEngine.js';
import { categoryEmoji, formatRupees } from '../utils/formatters.js';
import { t } from '../data/strings.js';

// "You also qualify for these" — chained DAG walk of related_scheme_ids.
export default function CrossSchemeChain({ schemeId, vault, lang, variant = 'list' }) {
  const related = relatedEligible(schemeId, vault).slice(0, 3);
  const nav = useNavigate();
  if (related.length === 0) return null;

  if (variant === 'single') {
    // Used on the application confirmation screen — single prominent card
    const first = related[0];
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-brand-saffron/10 border border-brand-saffron/40 rounded-2xl p-4"
      >
        <div className="text-sm font-semibold text-brand-saffron-dark mb-2">
          {lang === 'ta' ? '💡 ஒரு அடி மேல்' : '💡 One more tap'}
        </div>
        <div className="text-base text-brand-ink mb-3">
          {lang === 'ta'
            ? `நீங்கள் ${first.scheme.name_plain} க்கு தகுதியுடையவர். ஒரே தட்டில் விண்ணப்பிக்கலாம்.`
            : `You also qualify for ${first.scheme.name_plain} — apply now in 1 tap?`}
        </div>
        <button
          onClick={() => nav(`/apply/${first.scheme.id}`)}
          className="btn-saffron w-full"
        >
          {lang === 'ta' ? 'இப்போதே விண்ணப்பி' : 'Apply Now'} · {formatRupees(first.scheme.benefit_amount)}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wide mb-2">
        {t('you_also_qualify', lang)}
      </h3>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
        {related.map(({ scheme }) => (
          <button
            key={scheme.id}
            onClick={() => nav(`/scheme/${scheme.id}`)}
            className="shrink-0 bg-white border border-brand-green/20 rounded-2xl px-4 py-3 text-left min-w-[200px] max-w-[240px] active:scale-95 transition-transform !min-h-0"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{categoryEmoji(scheme.category)}</span>
              <span className="text-xs font-semibold text-brand-green bg-brand-green/10 rounded-full px-2 py-0.5">
                {formatRupees(scheme.benefit_amount)}
              </span>
            </div>
            <div className="text-sm font-semibold text-brand-ink leading-snug">
              {scheme.name_plain}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
