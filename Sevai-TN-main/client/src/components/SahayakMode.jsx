import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SAHAYAK_PIN, BENEFICIARIES, appendAudit } from '../utils/sahayakMock.js';
import { evaluateAll } from '../utils/eligibilityEngine.js';
import { categoryEmoji, formatRupees } from '../utils/formatters.js';
import { t } from '../data/strings.js';

export default function SahayakMode({ lang, onExit }) {
  const [phase, setPhase] = useState('pin'); // pin | scan | beneficiary
  const [pinInput, setPinInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [beneficiary, setBeneficiary] = useState(null);
  const [err, setErr] = useState(null);
  const nav = useNavigate();

  const submitPin = () => {
    if (pinInput === SAHAYAK_PIN) {
      setErr(null);
      setPhase('scan');
    } else {
      setErr(lang === 'ta' ? 'தவறான PIN' : 'Wrong PIN');
    }
  };

  const submitCode = () => {
    const b = BENEFICIARIES[codeInput.trim()];
    if (b) {
      setBeneficiary(b);
      setPhase('beneficiary');
      setErr(null);
      appendAudit({
        sahayak_action: 'loaded_beneficiary',
        scheme_id: null,
        beneficiary_id: b.id,
      });
    } else {
      setErr(lang === 'ta' ? 'பயனாளி காணப்படவில்லை' : 'Beneficiary not found');
    }
  };

  const initiateFor = (scheme_id) => {
    appendAudit({
      sahayak_action: 'initiated_application',
      scheme_id,
      beneficiary_id: beneficiary.id,
    });
    // Switch to this beneficiary's "vault" temporarily via sessionStorage
    sessionStorage.setItem('sevai_sahayak_beneficiary', JSON.stringify(beneficiary));
    nav(`/apply/${scheme_id}?sahayak=1`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-bg flex flex-col">
      <header className="bg-brand-green text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧑‍🤝‍🧑</span>
          <span className="font-bold">{t('sahayak_title', lang)}</span>
        </div>
        <button
          onClick={onExit}
          className="text-sm bg-white/20 rounded-full px-3 py-1 !min-h-0 !min-w-0"
        >
          {lang === 'ta' ? 'வெளியேறு' : 'Exit'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        <AnimatePresence mode="wait">
          {phase === 'pin' && (
            <motion.div
              key="pin"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="card max-w-sm mx-auto"
            >
              <h2 className="text-lg font-bold mb-1">{t('sahayak_enter_pin', lang)}</h2>
              <p className="text-xs text-brand-muted mb-4">
                {lang === 'ta' ? 'மாதிரி PIN: 9999' : 'Demo PIN: 9999'}
              </p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 focus:border-brand-green outline-none px-4 py-3 text-center text-2xl font-mono tracking-[0.3em]"
              />
              {err && <div className="amber-banner mt-2">{err}</div>}
              <button onClick={submitPin} className="btn-primary w-full mt-4">
                {t('continue', lang)}
              </button>
            </motion.div>
          )}

          {phase === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="card max-w-sm mx-auto"
            >
              <h2 className="text-lg font-bold mb-1">{t('sahayak_scan_code', lang)}</h2>
              <div className="mt-3 mb-4 mx-auto w-40 h-40 rounded-xl bg-gray-900 text-white grid place-items-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10"
                     style={{ backgroundImage: 'repeating-linear-gradient(90deg,#fff 0 4px,transparent 4px 8px),repeating-linear-gradient(0deg,#fff 0 4px,transparent 4px 8px)' }} />
                <div className="relative text-center text-sm leading-tight">
                  <div className="text-3xl mb-1">📷</div>
                  <div>QR mock</div>
                </div>
              </div>
              <p className="text-xs text-brand-muted mb-2">
                {lang === 'ta' ? 'மாதிரி குறியீடுகள்: 100100 · 200200 · 300300' : 'Demo codes: 100100 · 200200 · 300300'}
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="100100"
                className="w-full rounded-xl border-2 border-gray-200 focus:border-brand-green outline-none px-4 py-3 text-center text-xl font-mono tracking-widest"
              />
              {err && <div className="amber-banner mt-2">{err}</div>}
              <button onClick={submitCode} className="btn-primary w-full mt-4">
                {lang === 'ta' ? 'பயனாளியை ஏற்று' : 'Load beneficiary'}
              </button>
            </motion.div>
          )}

          {phase === 'beneficiary' && beneficiary && (
            <BeneficiaryView
              key="b"
              beneficiary={beneficiary}
              lang={lang}
              onInitiate={initiateFor}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BeneficiaryView({ beneficiary, lang, onInitiate }) {
  const { eligible } = evaluateAll(beneficiary);
  const top = eligible.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-4"
    >
      <div className="card">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-full bg-brand-green/15 grid place-items-center text-2xl">
            {beneficiary.gender === 'female' ? '👩' : '👨'}
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg">{beneficiary.name}</div>
            <div className="text-sm text-brand-muted">
              {beneficiary.age} · {beneficiary.occupation.replace('_', ' ')} · {beneficiary.district}
            </div>
            <div className="text-xs text-brand-muted mt-1">
              ₹{beneficiary.annual_income.toLocaleString('en-IN')} / {lang === 'ta' ? 'ஆண்டு' : 'year'} · {beneficiary.caste}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wide mb-2">
          {lang === 'ta' ? 'தகுதியான திட்டங்கள்' : 'Eligible schemes'} ({eligible.length})
        </h3>
        <div className="space-y-2">
          {top.map(({ scheme }) => (
            <div key={scheme.id} className="card flex items-center gap-3">
              <div className="text-2xl">{categoryEmoji(scheme.category)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{scheme.name_plain}</div>
                <div className="text-xs text-brand-muted">{formatRupees(scheme.benefit_amount)}</div>
              </div>
              <button onClick={() => onInitiate(scheme.id)} className="btn-primary !py-2 !px-4 !text-sm">
                {lang === 'ta' ? 'விண்ணப்பி' : 'Apply'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
