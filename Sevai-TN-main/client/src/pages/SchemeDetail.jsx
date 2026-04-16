import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SCHEME_BY_ID } from '../data/schemes.js';
import { useVault } from '../hooks/useVault.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { categoryEmoji, formatRupees } from '../utils/formatters.js';
import SamjhaoButton from '../components/SamjhaoButton.jsx';
import DeadlineVisualizer from '../components/DeadlineVisualizer.jsx';
import CrossSchemeChain from '../components/CrossSchemeChain.jsx';
import { t } from '../data/strings.js';

export default function SchemeDetail() {
  const { id } = useParams();
  const scheme = SCHEME_BY_ID[id];
  const { vault } = useVault();
  const { lang } = useLanguage();
  const nav = useNavigate();

  if (!scheme) {
    return (
      <div className="p-6 text-center text-brand-muted">
        {lang === 'ta' ? 'திட்டம் கிடைக்கவில்லை' : 'Scheme not found'}
      </div>
    );
  }

  return (
    <div className="min-h-full pb-28 bg-brand-bg">
      <header className="bg-brand-green text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => nav(-1)} className="!min-h-0 !min-w-0 p-2 -ml-2">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path d="M15.5 4l-8 8 8 8 1.4-1.4L10.3 12l6.6-6.6z" />
          </svg>
        </button>
        <div className="flex-1 truncate font-semibold">{scheme.name_plain}</div>
      </header>

      <div className="p-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="flex items-start gap-3">
            <div className="text-5xl leading-none">{categoryEmoji(scheme.category)}</div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-brand-ink leading-tight">{scheme.name_plain}</h1>
              <div className="text-xs text-brand-muted mt-1">{scheme.name_official}</div>
              {scheme.benefit_amount > 0 && (
                <div className="mt-3 inline-block bg-brand-saffron/15 text-brand-saffron-dark rounded-full px-3 py-1 text-sm font-bold">
                  {formatRupees(scheme.benefit_amount)}
                  {scheme.benefit_type === 'cash' && (
                    <span className="text-[10px] font-medium">/yr</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <DeadlineVisualizer scheme={scheme} vault={vault} lang={lang} />
        </motion.div>

        <div className="card">
          <SamjhaoButton scheme={scheme} lang={lang} />
          <button onClick={() => nav(`/apply/${scheme.id}`)} className="btn-saffron w-full mt-2">
            {t('apply_now', lang)}
          </button>
        </div>

        <div className="card">
          <h2 className="text-sm font-bold text-brand-muted uppercase tracking-wide mb-2">
            {lang === 'ta' ? 'தேவையான ஆவணங்கள்' : 'Documents needed'}
          </h2>
          <ul className="space-y-1.5">
            {scheme.documents_required.map((d) => (
              <li key={d} className="flex gap-2 text-sm">
                <span>📎</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="text-sm font-bold text-brand-muted uppercase tracking-wide mb-2">
            {lang === 'ta' ? 'முழு விளக்கம்' : 'Full description'}
          </h2>
          <p className="text-sm text-brand-ink leading-relaxed">{scheme.description_long}</p>
        </div>

        <CrossSchemeChain schemeId={scheme.id} vault={vault} lang={lang} />

        <div className="card flex items-center gap-3 bg-brand-green/5 border border-brand-green/15">
          <div className="w-10 h-10 rounded-full bg-brand-green text-white grid place-items-center font-bold">
            ✓
          </div>
          <div className="flex-1 text-sm">
            <div className="text-[11px] uppercase tracking-widest text-brand-muted">
              {t('verified_by', lang)}
            </div>
            <div className="font-semibold text-brand-ink">{scheme.verified_by.name}</div>
            <div className="text-xs text-brand-muted">
              {scheme.verified_by.role} · {scheme.verified_by.district} ·{' '}
              {scheme.verified_by.verified_date}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
