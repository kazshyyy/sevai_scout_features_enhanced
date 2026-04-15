import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from '../hooks/useVault.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { DISTRICTS } from '../data/districts.js';
import { t } from '../data/strings.js';
import { getAuditLog } from '../utils/sahayakMock.js';
import SahayakMode from '../components/SahayakMode.jsx';
import { QRCodeSVG } from 'qrcode.react';

const EDITABLE_FIELDS = [
  { key: 'name', type: 'text', labelTa: 'பெயர்', labelEn: 'Name' },
  { key: 'age', type: 'number', labelTa: 'வயது', labelEn: 'Age' },
  { key: 'gender', type: 'select', options: [['female', '👩'], ['male', '👨']], labelTa: 'பாலினம்', labelEn: 'Gender' },
  { key: 'occupation', type: 'select', options: [
    ['farmer', '🌾 Farmer'], ['student', '📚 Student'], ['daily_wage', '🔨 Daily Wage'],
    ['small_business', '🏪 Small Business'], ['homemaker', '🏠 Homemaker'], ['other', '· Other'],
  ], labelTa: 'வேலை', labelEn: 'Occupation' },
  { key: 'district', type: 'district', labelTa: 'மாவட்டம்', labelEn: 'District' },
  { key: 'annual_income', type: 'number', labelTa: 'ஆண்டு வருமானம் (₹)', labelEn: 'Annual Income (₹)' },
  { key: 'caste', type: 'select', options: [['General', 'General'], ['OBC', 'OBC'], ['SC', 'SC'], ['ST', 'ST']], labelTa: 'சாதி', labelEn: 'Caste' },
  { key: 'ration_card_number', type: 'text', labelTa: 'குடும்ப அட்டை எண்', labelEn: 'Ration Card #' },
  { key: 'aadhaar_last4', type: 'text', labelTa: 'ஆதார் கடைசி 4', labelEn: 'Aadhaar last 4' },
];

export default function Profile() {
  const { vault, setVault, resetVault } = useVault();
  const { lang, setLang } = useLanguage();
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');
  const [showSahayak, setShowSahayak] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const audit = getAuditLog();

  const startEdit = (key, current) => {
    setEditing(key);
    setDraft(current ?? '');
  };

  const saveEdit = () => {
    if (editing === 'age' || editing === 'annual_income') {
      setVault({ [editing]: Number(draft) || 0 });
    } else {
      setVault({ [editing]: draft || null });
    }
    setEditing(null);
  };

  const renderValue = (f) => {
    const v = vault[f.key];
    if (f.type === 'district') {
      const d = DISTRICTS.find((x) => x.id === v);
      return d ? (lang === 'ta' ? d.ta : d.en) : '—';
    }
    if (f.type === 'select' && f.options) {
      const match = f.options.find(([k]) => k === v);
      return match ? match[1] : v || '—';
    }
    if (f.key === 'annual_income' && v) return `₹${Number(v).toLocaleString('en-IN')}`;
    if (v == null || v === '') return '—';
    return String(v);
  };

  return (
    <div className="min-h-full pb-24 bg-brand-bg">
      <header className="bg-brand-green text-white px-5 pt-6 pb-6 rounded-b-3xl shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('profile_title', lang)}</h1>
            <p className="text-xs opacity-80 mt-1">{vault.name || '—'}</p>
          </div>
          <button
            onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
            className="!min-h-0 !min-w-0 text-xs bg-white/15 rounded-full px-3 py-1.5"
          >
            {lang === 'ta' ? 'EN' : 'த'}
          </button>
        </div>
      </header>

      <div className="p-4 space-y-3">
        {/* Privacy banner */}
        <div className="bg-brand-green/10 text-brand-green-dark rounded-2xl p-4 flex gap-3 items-start">
          <span className="text-2xl">🔒</span>
          <div className="flex-1 text-sm">
            <div className="font-bold mb-0.5">{t('device_only', lang)}</div>
            <div className="text-xs opacity-90">{t('profile_privacy', lang)}</div>
          </div>
          <button onClick={() => setShowQR(true)} className="bg-white p-2 rounded-lg shadow-sm font-bold text-xs">QR</button>
        </div>

        {/* Fields */}
        <div className="card divide-y divide-gray-100">
          {EDITABLE_FIELDS.map((f) => (
            <div key={f.key} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-brand-muted">
                    {lang === 'ta' ? f.labelTa : f.labelEn}
                  </div>
                  {editing === f.key ? (
                    <EditInput field={f} draft={draft} setDraft={setDraft} lang={lang} />
                  ) : (
                    <div className="font-semibold text-brand-ink mt-0.5 break-words">{renderValue(f)}</div>
                  )}
                </div>
                {editing === f.key ? (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(null)} className="!min-h-0 px-3 py-1 text-sm text-brand-muted">
                      ✕
                    </button>
                    <button onClick={saveEdit} className="!min-h-0 bg-brand-green text-white rounded-lg px-3 py-1 text-sm font-semibold">
                      {t('save', lang)}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(f.key, vault[f.key])}
                    className="!min-h-0 text-xs text-brand-green font-semibold underline underline-offset-2 px-2 py-1"
                  >
                    {t('edit', lang)}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Helper activity */}
        {audit.length > 0 && (
          <div className="card">
            <button
              onClick={() => setAuditOpen((o) => !o)}
              className="w-full flex items-center justify-between !min-h-0"
            >
              <span className="font-semibold">{t('helper_activity', lang)}</span>
              <span className="text-sm text-brand-muted">
                {audit.length} · {auditOpen ? '▲' : '▼'}
              </span>
            </button>
            <AnimatePresence>
              {auditOpen && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 space-y-2 overflow-hidden"
                >
                  {audit.slice(0, 20).map((a, i) => (
                    <li key={i} className="text-xs bg-gray-50 rounded-lg p-2">
                      <div className="font-semibold">{a.sahayak_action.replace(/_/g, ' ')}</div>
                      <div className="text-brand-muted mt-0.5">
                        {a.scheme_id ? `${a.scheme_id} · ` : ''}beneficiary {a.beneficiary_id} ·{' '}
                        {new Date(a.timestamp).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Sahayak login */}
        <button
          onClick={() => setShowSahayak(true)}
          className="w-full card flex items-center gap-3 active:scale-[0.99] transition-transform"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-saffron/15 text-2xl grid place-items-center">
            🧑‍🤝‍🧑
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold">{t('sahayak_login', lang)}</div>
            <div className="text-xs text-brand-muted">
              {lang === 'ta'
                ? 'மற்றவர்களுக்காக விண்ணப்பிக்க'
                : 'Apply on behalf of others'}
            </div>
          </div>
          <span className="text-brand-muted">›</span>
        </button>

        {/* Reset */}
        <button
          onClick={() => {
            if (confirm(lang === 'ta' ? 'சரி, புதிதாக தொடங்கவா?' : 'Reset and start fresh?')) {
              resetVault();
              location.href = '/';
            }
          }}
          className="!min-h-0 block mx-auto text-xs text-brand-muted underline underline-offset-2 py-3"
        >
          {lang === 'ta' ? 'சுயவிவரத்தை அழி' : 'Reset profile'}
        </button>
      </div>

      {showSahayak && <SahayakMode lang={lang} onExit={() => setShowSahayak(false)} />}

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setShowQR(false)}
          >
            <div className="bg-white p-6 rounded-2xl flex flex-col items-center">
              <h3 className="font-bold mb-4">Scan to fetch profile</h3>
              <div className="bg-white p-2 border-4 border-black rounded-xl">
                 <QRCodeSVG value={JSON.stringify(vault)} size={200} />
              </div>
              <button className="mt-4 btn-secondary" onClick={() => setShowQR(false)}>Close</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EditInput({ field, draft, setDraft, lang }) {
  if (field.type === 'select') {
    return (
      <select
        value={draft || ''}
        onChange={(e) => setDraft(e.target.value)}
        className="mt-1 w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-base"
      >
        <option value="">—</option>
        {field.options.map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
        ))}
      </select>
    );
  }
  if (field.type === 'district') {
    return (
      <select
        value={draft || ''}
        onChange={(e) => setDraft(e.target.value)}
        className="mt-1 w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-base"
      >
        <option value="">—</option>
        {DISTRICTS.map((d) => (
          <option key={d.id} value={d.id}>{lang === 'ta' ? d.ta : d.en}</option>
        ))}
      </select>
    );
  }
  return (
    <input
      type={field.type}
      value={draft ?? ''}
      onChange={(e) => setDraft(e.target.value)}
      className="mt-1 w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-base"
    />
  );
}
