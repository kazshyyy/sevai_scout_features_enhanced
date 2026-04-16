import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../data/strings.js';
import { speak, stopSpeaking } from '../utils/speechUtils.js';

// "Kelungal" button. Fetches summary from backend, caches locally, TTS with waveform.
const localCache = new Map();

export default function SamjhaoButton({ scheme, lang }) {
  const [state, setState] = useState('idle'); // idle | loading | playing | paused
  const [bullets, setBullets] = useState([]);
  const [audioText, setAudioText] = useState('');
  const [error, setError] = useState(null);
  const speakingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (speakingRef.current) stopSpeaking();
    };
  }, []);

  const fetchSummary = async () => {
    const key = `${scheme.id}:${lang}`;
    if (localCache.has(key)) return localCache.get(key);
    const res = await fetch('/api/summarize-scheme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheme, language: lang }),
    });
    if (!res.ok) throw new Error('summary-failed');
    const data = await res.json();
    localCache.set(key, data);
    return data;
  };

  const handleClick = async (e) => {
    e.stopPropagation();
    if (state === 'playing') {
      stopSpeaking();
      speakingRef.current = false;
      setState('paused');
      return;
    }
    if (state === 'paused') {
      setState('playing');
      speakingRef.current = true;
      speak(audioText, lang, { onEnd: () => { speakingRef.current = false; setState('idle'); } });
      return;
    }
    setState('loading');
    setError(null);
    try {
      const data = await fetchSummary();
      setBullets(data.bullets || []);
      setAudioText(data.audio_text || (data.bullets || []).join(' '));
      setState('playing');
      speakingRef.current = true;
      speak(data.audio_text || (data.bullets || []).join(' '), lang, {
        onEnd: () => { speakingRef.current = false; setState('idle'); },
      });
    } catch (err) {
      // Fall back to local description_simple bullets
      const fallback = scheme.description_simple || [];
      setBullets(fallback);
      const joined = fallback.join('. ');
      setAudioText(joined);
      setState('playing');
      speakingRef.current = true;
      speak(joined, lang, {
        onEnd: () => { speakingRef.current = false; setState('idle'); },
      });
      setError(lang === 'ta' ? 'சுருக்கம் உள்ளூர் தகவலில் இருந்து' : 'Summary from local data');
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        onClick={handleClick}
        className="w-full bg-brand-green text-white rounded-2xl px-5 py-4 text-lg font-bold shadow-card active:scale-95 transition-transform flex items-center justify-center gap-3"
      >
        {state === 'loading' && (
          <span className="inline-block">⏳</span>
        )}
        {state === 'playing' && (
          <span className="flex items-end h-6 gap-0.5 text-white">
            <span className="wave-bar h-4" />
            <span className="wave-bar h-6" />
            <span className="wave-bar h-3" />
            <span className="wave-bar h-5" />
            <span className="wave-bar h-4" />
          </span>
        )}
        {state !== 'loading' && state !== 'playing' && <span className="text-xl">🔊</span>}
        <span>
          {state === 'loading'
            ? lang === 'ta' ? 'தயாராகிறது...' : 'Preparing...'
            : state === 'playing'
            ? lang === 'ta' ? 'பேசிக்கொண்டிருக்கிறது... (தடுக்க தட்டு)' : 'Playing... (tap to pause)'
            : state === 'paused'
            ? lang === 'ta' ? 'தொடர தட்டு' : 'Tap to resume'
            : t('listen_kelungal', lang)}
        </span>
      </button>

      <AnimatePresence>
        {bullets.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-1.5 text-[15px] text-brand-ink overflow-hidden"
          >
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-brand-green font-bold">✓</span>
                <span>{b.replace(/^[✓\-•]\s*/, '')}</span>
              </li>
            ))}
            {error && <li className="text-xs text-brand-muted italic">{error}</li>}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
