import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { categoryEmoji, formatRupees } from '../utils/formatters.js';
import { t } from '../data/strings.js';
import SamjhaoButton from './SamjhaoButton.jsx';
import DeadlineVisualizer from './DeadlineVisualizer.jsx';

export default function SchemeCard({ scheme, vault, lang, compact = false }) {
  const nav = useNavigate();

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onClick={() => nav(`/scheme/${scheme.id}`)}
      className="card cursor-pointer hover:shadow-cardHover transition-shadow"
    >
      {/* Top row: emoji + title + benefit */}
      <div className="flex items-start gap-3">
        <div className="text-4xl leading-none">{categoryEmoji(scheme.category)}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg md:text-xl font-bold text-brand-ink leading-snug break-words">
            {scheme.name_plain}
          </h3>
          <div className="text-xs text-brand-muted mt-0.5 truncate">{scheme.name_official}</div>
        </div>
        {scheme.benefit_amount > 0 && (
          <span className="shrink-0 bg-brand-saffron/15 text-brand-saffron-dark font-bold rounded-full px-3 py-1 text-sm">
            {formatRupees(scheme.benefit_amount)}
            {scheme.benefit_type === 'cash' && <span className="text-[10px] font-medium">/yr</span>}
          </span>
        )}
      </div>

      {/* Deadline visualizer */}
      <DeadlineVisualizer scheme={scheme} vault={vault} lang={lang} />

      {/* Actions */}
      {!compact && (
        <div className="mt-4 space-y-2">
          <SamjhaoButton scheme={scheme} lang={lang} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              nav(`/apply/${scheme.id}`);
            }}
            className="w-full btn-secondary"
          >
            {t('apply_now', lang)}
          </button>
        </div>
      )}

      {/* Verified by trust badge */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-brand-muted">
        <span className="w-5 h-5 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center text-[11px]">
          ✓
        </span>
        <span>
          <span className="text-brand-ink font-medium">{t('verified_by', lang)}: </span>
          <span className="text-brand-ink">{scheme.verified_by.name}</span>
          <span>, {scheme.verified_by.role}</span>
        </span>
      </div>
    </motion.article>
  );
}
