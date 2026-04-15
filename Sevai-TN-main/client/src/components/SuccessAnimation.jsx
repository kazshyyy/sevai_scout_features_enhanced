import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { t, tf } from '../data/strings.js';
import { formatTime, formatTimeTa } from '../utils/formatters.js';
import { playSuccessChime, speak } from '../utils/speechUtils.js';

export default function SuccessAnimation({ schemeName, elapsedSeconds, lang, onDone }) {
  useEffect(() => {
    playSuccessChime();
    const msg = t('apply_success', lang);
    speak(msg, lang);
    const timer = setTimeout(() => onDone?.(), 2200);
    return () => clearTimeout(timer);
  }, [lang, onDone]);

  const timeLabel = lang === 'ta' ? formatTimeTa(elapsedSeconds) : formatTime(elapsedSeconds);

  return (
    <motion.div
      initial={{ backgroundColor: '#FAFAF5' }}
      animate={{ backgroundColor: '#1B5E20' }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white text-center px-6"
    >
      {/* Animated SVG check */}
      <motion.div
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 18 }}
        className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center mb-8"
      >
        <svg viewBox="0 0 50 50" width="84" height="84">
          <circle cx="25" cy="25" r="22" fill="none" stroke="white" strokeWidth="2.5" opacity="0.5" />
          <path
            d="M14 26 L22 34 L36 18"
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="check-draw"
            style={{ animationDelay: '0.5s' }}
          />
        </svg>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="text-2xl font-bold max-w-md leading-snug"
      >
        {t('apply_success', lang)}
      </motion.h2>

      {schemeName && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-3 text-base opacity-90"
        >
          {schemeName}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-8 bg-white/10 rounded-2xl px-5 py-3 text-sm"
      >
        {tf('apply_time_taken', lang, { t: timeLabel })}
      </motion.div>
    </motion.div>
  );
}
