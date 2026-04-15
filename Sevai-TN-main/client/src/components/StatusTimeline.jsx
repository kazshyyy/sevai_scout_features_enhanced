import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { t, tf } from '../data/strings.js';
import { SCHEME_BY_ID } from '../data/schemes.js';

const stages = ['submitted', 'under_review', 'final'];

export default function StatusTimeline({ app, lang }) {
  const scheme = SCHEME_BY_ID[app.scheme_id];
  const nav = useNavigate();
  if (!scheme) return null;

  const isApproved = app.status === 'approved';
  const isRejected = app.status === 'rejected';
  const isReview = app.status === 'under_review' || (!isApproved && !isRejected);

  const nodes = [
    {
      key: 'submitted',
      label: t('status_submitted', lang),
      reached: true,
      color: 'brand-green',
    },
    {
      key: 'under_review',
      label: t('status_under_review', lang),
      reached: isReview || isApproved || isRejected,
      color: isRejected ? 'brand-amber' : 'brand-green',
    },
    {
      key: 'final',
      label: isApproved ? t('status_approved', lang) : isRejected ? t('status_rejected', lang) : t('status_under_review', lang),
      reached: isApproved || isRejected,
      color: isApproved ? 'brand-green' : isRejected ? 'brand-amber' : 'gray',
    },
  ];

  const plainCopy = isApproved
    ? tf('status_plain_approved', lang, { name: scheme.name_plain })
    : isRejected
    ? tf('status_plain_rejected', lang, { name: scheme.name_plain, reason: app.reject_reason || (lang === 'ta' ? 'வருமான சான்றிதழ் இல்லை' : 'Income certificate missing') })
    : tf('status_plain_review', lang, { name: scheme.name_plain });

  // Hindi/Tanglish SMS mock
  const smsMock = isApproved
    ? `Aapka ${scheme.name_plain.split(' ').slice(0, 3).join(' ')} aavedhan swikar ho gaya. ₹${scheme.benefit_amount.toLocaleString('en-IN')} aapke khate mein 7 dinon mein aayega.`
    : isRejected
    ? `Aapka ${scheme.name_plain.split(' ').slice(0, 3).join(' ')} aavedhan ke liye aur document chahiye. Kripya form phir se jama karein.`
    : `Aapka ${scheme.name_plain.split(' ').slice(0, 3).join(' ')} aavedhan process mein hai. 5-7 din mein update milega.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0">
          <h3 className="font-bold text-lg text-brand-ink leading-tight">{scheme.name_plain}</h3>
          <div className="text-xs text-brand-muted mt-0.5">{scheme.name_official}</div>
        </div>
      </div>

      {/* Vertical timeline */}
      <div className="relative pl-6">
        <div className="absolute left-2 top-2 bottom-2 w-[2px] bg-gray-200" />
        {nodes.map((n, i) => (
          <div key={n.key} className="relative mb-4 last:mb-0">
            <div
              className={`absolute -left-[22px] top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-white text-[11px] ${
                n.reached
                  ? n.color === 'brand-green'
                    ? 'bg-brand-green border-brand-green'
                    : 'bg-brand-amber border-brand-amber'
                  : 'bg-white border-gray-300'
              }`}
            >
              {n.reached && i < nodes.length - 1 ? '✓' : ''}
              {n.reached && i === nodes.length - 1 && isApproved && '✓'}
              {n.reached && i === nodes.length - 1 && isRejected && '!'}
            </div>
            <div className={`text-sm font-semibold ${n.reached ? 'text-brand-ink' : 'text-gray-400'}`}>
              {n.label}
            </div>
          </div>
        ))}
      </div>

      {/* Plain-language status sentence */}
      <div
        className={`mt-3 rounded-xl p-3 text-sm ${
          isApproved ? 'bg-brand-green/10 text-brand-green-dark' : isRejected ? 'amber-banner' : 'bg-gray-50 text-brand-ink'
        }`}
      >
        {plainCopy}
      </div>

      {/* Mock SMS preview */}
      <div className="mt-3 bg-gray-900 text-white rounded-xl p-3">
        <div className="text-[10px] uppercase tracking-widest opacity-70 mb-1">
          {t('mock_sms_label', lang)}
        </div>
        <div className="text-sm font-mono leading-snug">{smsMock}</div>
      </div>

      {/* Fix & resubmit */}
      {isRejected && (
        <button
          onClick={() => nav(`/apply/${scheme.id}`)}
          className="btn-saffron w-full mt-3"
        >
          {t('fix_resubmit', lang)}
        </button>
      )}
    </motion.div>
  );
}
