import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SCHEME_BY_ID } from '../data/schemes.js';
import { useVault } from '../hooks/useVault.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { t } from '../data/strings.js';
import { addApplication } from '../utils/applications.js';
import { appendAudit } from '../utils/sahayakMock.js';
import { DISTRICTS } from '../data/districts.js';
import SuccessAnimation from '../components/SuccessAnimation.jsx';
import CrossSchemeChain from '../components/CrossSchemeChain.jsx';

export default function Apply() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const isSahayak = search.get('sahayak') === '1';
  const scheme = SCHEME_BY_ID[id];
  const { vault: ownVault } = useVault();
  const vault = useMemo(() => {
    if (!isSahayak) return ownVault;
    try {
      return JSON.parse(sessionStorage.getItem('sevai_sahayak_beneficiary') || '{}');
    } catch {
      return ownVault;
    }
  }, [isSahayak, ownVault]);
  const { lang } = useLanguage();
  const nav = useNavigate();

  const [docs, setDocs] = useState({});
  const [showOCR, setShowOCR] = useState(null);
  const [ocrError, setOcrError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRelated, setShowRelated] = useState(false);
  const startRef = useRef(Date.now());
  const elapsedRef = useRef(0);
  const isOnline = navigator.onLine;

  if (!scheme) {
    return <div className="p-6 text-center">Scheme not found</div>;
  }

  const districtLabel = DISTRICTS.find((d) => d.id === vault.district);

  const fields = [
    { label: lang === 'ta' ? 'பெயர்' : 'Name', value: vault.name || (lang === 'ta' ? 'உள்ளிடப்படவில்லை' : 'Not set') },
    { label: lang === 'ta' ? 'வயது' : 'Age', value: vault.age ?? '—' },
    { label: lang === 'ta' ? 'பாலினம்' : 'Gender', value: vault.gender || '—' },
    {
      label: lang === 'ta' ? 'மாவட்டம்' : 'District',
      value: districtLabel ? (lang === 'ta' ? districtLabel.ta : districtLabel.en) : vault.district || '—',
    },
    { label: lang === 'ta' ? 'சாதி' : 'Caste', value: vault.caste || '—' },
    {
      label: lang === 'ta' ? 'ஆண்டு வருமானம்' : 'Annual income',
      value: vault.annual_income ? `₹${vault.annual_income.toLocaleString('en-IN')}` : '—',
    },
    { label: lang === 'ta' ? 'வேலை' : 'Occupation', value: vault.occupation || '—' },
  ];

  const handleDoc = async (docName, file) => {
    if (!file) return;
    setShowOCR(docName);
    setOcrError(null);
    try {
      const formData = new FormData();
      formData.append('document', file);
      
      const res = await fetch('http://localhost:5001/api/ocr', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!data.valid) {
        setOcrError(data.message || 'Invalid document');
      } else {
        setDocs((d) => ({ ...d, [docName]: file.name }));
      }
    } catch (e) {
      console.error(e);
      setOcrError('Failed to parse document. Trying again?');
    } finally {
      setShowOCR(null);
    }
  };

  const allDocsDone = scheme.documents_required.every((d) => docs[d]);

  const handleSubmit = () => {
    if (submitting) return;

    if (!isOnline) {
      // Offline fallback: deep link to SMS 
      const payload = `APPLY SCHEME=${scheme.id} UID=${vault.id || 'new'} NAME=${vault.name}`;
      window.location.href = `sms:55555?body=${encodeURIComponent(payload)}`;
      return;
    }

    setSubmitting(true);
    elapsedRef.current = Math.round((Date.now() - startRef.current) / 1000);
    addApplication({
      scheme_id: scheme.id,
      submitted_at: Date.now(),
      status: 'under_review',
      documents: Object.keys(docs),
      by_sahayak: isSahayak,
    });
    if (isSahayak) {
      appendAudit({
        sahayak_action: 'submitted_application',
        scheme_id: scheme.id,
        beneficiary_id: vault.id,
      });
    }
    setShowSuccess(true);
  };

  const onSuccessDone = () => {
    setShowSuccess(false);
    setShowRelated(true);
  };

  return (
    <div className="min-h-full pb-28 bg-brand-bg">
      <header className="bg-brand-green text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => nav(-1)} className="!min-h-0 !min-w-0 p-2 -ml-2">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path d="M15.5 4l-8 8 8 8 1.4-1.4L10.3 12l6.6-6.6z" />
          </svg>
        </button>
        <div className="flex-1 truncate">
          <div className="font-semibold leading-tight">{scheme.name_plain}</div>
          <div className="text-[11px] opacity-80">
            {isSahayak
              ? lang === 'ta'
                ? 'உதவியாளர் முறையில் விண்ணப்பிக்கிறது'
                : 'Applying via Sahayak mode'
              : lang === 'ta'
              ? 'தானாக நிரப்பப்பட்டுள்ளது'
              : 'Pre-filled from your profile'}
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Review section */}
        <section className="card">
          <h2 className="text-lg font-bold mb-3">{t('apply_review_title', lang)}</h2>
          <dl className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.label}>
                <dt className="text-[11px] text-brand-muted uppercase tracking-wide">{f.label}</dt>
                <dd className="text-sm font-semibold text-brand-ink mt-0.5 break-words">{String(f.value)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 text-[11px] text-brand-green flex items-center gap-1.5">
            <span>🔒</span>
            <span>{t('device_only', lang)}</span>
          </div>
        </section>

        {/* Documents */}
        <section className="card">
          <h2 className="text-lg font-bold mb-3">{t('apply_document_title', lang)}</h2>
          <div className="space-y-2">
            {ocrError && <div className="text-brand-amber font-semibold text-xs mb-2">⚠ {ocrError}</div>}
            {scheme.documents_required.map((d) => {
              const done = !!docs[d];
              return (
                <label
                  key={d}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors cursor-pointer ${
                    done ? 'border-brand-green bg-brand-green/5' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div
                    className={`shrink-0 w-11 h-11 rounded-xl grid place-items-center text-xl ${
                      done ? 'bg-brand-green text-white' : 'bg-gray-100'
                    }`}
                  >
                    {done ? '✓' : '📷'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{d}</div>
                    <div className="text-[11px] text-brand-muted truncate">
                      {done
                        ? docs[d]
                        : t('apply_tap_photo', lang)}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleDoc(d, e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
              );
            })}
          </div>
        </section>

        {/* Submit */}
        <button
          disabled={submitting}
          onClick={handleSubmit}
          className={`w-full ${!isOnline ? 'bg-slate-700 text-white' : 'btn-primary'} ${!allDocsDone ? 'opacity-70' : ''}`}
        >
          {submitting
            ? lang === 'ta'
              ? 'சமர்ப்பிக்கிறது...'
              : 'Submitting...'
            : !isOnline 
            ? 'Submit via SMS (Offline)'
            : t('apply_submit', lang)}
        </button>
        {!allDocsDone && (
          <p className="text-xs text-brand-muted text-center">
            {lang === 'ta'
              ? 'ஆவணங்கள் இல்லாவிட்டாலும் சமர்ப்பிக்கலாம் — பின்னர் சேர்க்கலாம்'
              : 'You can submit without photos — you can add them later'}
          </p>
        )}
      </div>

      {/* OCR processing overlay */}
      <AnimatePresence>
        {showOCR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 grid place-items-center"
          >
            <div className="bg-white rounded-2xl p-6 max-w-xs mx-4 text-center">
              <div className="text-4xl mb-2">📄</div>
              <div className="text-base font-semibold mb-1">
                {lang === 'ta' ? 'ஆவணத்தை படிக்கிறது...' : 'Reading document...'}
              </div>
              <div className="text-xs text-brand-muted">{showOCR}</div>
              <div className="mt-3 h-1 bg-gray-100 rounded overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5 }}
                  className="h-full bg-brand-green"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success animation */}
      {showSuccess && (
        <SuccessAnimation
          schemeName={scheme.name_plain}
          elapsedSeconds={elapsedRef.current}
          lang={lang}
          onDone={onSuccessDone}
        />
      )}

      {/* Post-submit cross-scheme chain */}
      {showRelated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-40 bg-black/40 grid place-items-end"
          onClick={() => nav('/applications')}
        >
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl p-5 w-full max-w-lg mx-auto space-y-4"
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto" />
            <div className="text-center">
              <div className="text-3xl mb-2">🎉</div>
              <h3 className="text-xl font-bold">
                {lang === 'ta' ? 'விண்ணப்பம் சமர்ப்பிக்கப்பட்டது' : 'Application submitted'}
              </h3>
              <p className="text-sm text-brand-muted mt-1">{scheme.name_plain}</p>
            </div>
            <CrossSchemeChain schemeId={scheme.id} vault={vault} lang={lang} variant="single" />
            <button onClick={() => nav('/applications')} className="btn-secondary w-full">
              {lang === 'ta' ? 'விண்ணப்பங்களைக் காண்' : 'See my applications'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
