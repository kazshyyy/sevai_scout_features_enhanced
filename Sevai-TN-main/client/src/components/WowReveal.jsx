import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { t } from '../data/strings.js';
import { formatRupees } from '../utils/formatters.js';
import { speak } from '../utils/speechUtils.js';

// Full-screen reveal after onboarding. Counts up N schemes + total ₹ value.
export default function WowReveal({ count, totalValue, lang, onContinue }) {
  const [n, setN] = useState(0);
  const [v, setV] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const dur = 1500;
    let raf;
    const tick = (ts) => {
      const p = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(count * eased));
      setV(Math.round(totalValue * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Celebratory TTS
    const msg = t('wow_qualify_for', lang).replace('[N]', String(count));
    speak(msg, lang);

    const auto = setTimeout(() => onContinue(), 3200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(auto);
    };
  }, [count, totalValue, lang, onContinue]);

  return (
    <motion.div
      initial={{ backgroundColor: '#0a0a0a' }}
      animate={{ backgroundColor: '#1B5E20' }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white text-center px-6"
      onClick={onContinue}
    >
      {/* Confetti-ish ring */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-48 h-48 rounded-full bg-white/10 flex items-center justify-center mb-8 relative"
      >
        <div className="absolute inset-0 rounded-full border-4 border-brand-saffron/50 animate-pulse-slow" />
        <span className="text-8xl font-black text-brand-saffron" style={{ letterSpacing: '-0.04em' }}>
          {n}
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="text-2xl md:text-3xl font-bold max-w-md"
      >
        {t('wow_qualify_for', lang).replace('[N]', String(count))}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="mt-8"
      >
        <div className="text-sm opacity-80 uppercase tracking-widest mb-1">
          {t('wow_total_value', lang)}
        </div>
        <div className="text-4xl font-black text-brand-saffron">
          {formatRupees(v)}
          <span className="text-base font-medium opacity-80 ml-1">{t('wow_per_year', lang)}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4 }}
        className="absolute bottom-10 text-sm opacity-70"
      >
        {t('wow_tap_to_continue', lang)}
      </motion.div>
    </motion.div>
  );
}
