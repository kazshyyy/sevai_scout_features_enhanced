import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../data/strings.js';
import { DISTRICTS } from '../data/districts.js';
import { speak, stopSpeaking, createRecorder } from '../utils/speechUtils.js';
import { ageBandToNumber, incomeBandToMax, occupationKey } from '../utils/formatters.js';

// WhatsApp-style chat onboarding. Bot asks questions one at a time, large options below.

const STEPS = [
  { key: 'language', prompt: 'bot_greet' },
  { key: 'age', prompt: 'bot_age' },
  { key: 'occupation', prompt: 'bot_occupation' },
  { key: 'district', prompt: 'bot_district' },
  { key: 'annual_income', prompt: 'bot_income' },
  { key: 'caste', prompt: 'bot_caste' },
  { key: 'gender', prompt: 'bot_gender' },
];

const BUBBLE_DELAY = 650;

export default function ChatOnboarding({ onComplete, lang, setLang }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [messages, setMessages] = useState([]);
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [confirmed, setConfirmed] = useState(null); // {field, value, text}
  const scrollRef = useRef(null);
  const recorderRef = useRef(null);

  const step = STEPS[stepIdx];

  // Send bot prompt for the current step
  useEffect(() => {
    if (!step) return;
    setTyping(true);
    const promptText = t(step.prompt, lang);
    const timer = setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: 'bot', text: promptText, lang }]);
      speak(promptText, lang);
    }, BUBBLE_DELAY);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, lang]);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' });
  }, [messages, typing]);

  const pushUser = (text) => setMessages((m) => [...m, { from: 'user', text }]);

  const confirmAndAdvance = (field, value, text) => {
    pushUser(text);
    setAnswers((a) => ({ ...a, [field]: value }));
    setStepIdx((i) => i + 1);
  };

  const handleLanguageChoice = (l) => {
    setLang(l);
    confirmAndAdvance('languages_preferred', [l], l === 'ta' ? 'தமிழ்' : 'English');
  };

  const handleAgeChoice = (band, label) => {
    confirmAndAdvance('age', ageBandToNumber(band), label);
  };

  const handleOccupationChoice = (occEn, label) => {
    confirmAndAdvance('occupation', occupationKey(occEn), label);
  };

  const handleDistrictChoice = (d) => {
    confirmAndAdvance('district', d.id, lang === 'ta' ? d.ta : d.en);
  };

  const handleIncomeChoice = (band, label) => {
    confirmAndAdvance('annual_income', incomeBandToMax(band), label);
  };

  const handleCasteChoice = (c) => {
    confirmAndAdvance('caste', c === 'prefer_not_say' ? null : c, c === 'prefer_not_say' ? t('prefer_not_say', lang) : c);
  };

  const handleGenderChoice = (isFemale, label) => {
    confirmAndAdvance('gender', isFemale ? 'female' : 'male', label);
  };

  // Voice recording → backend /api/extract-intent
  const toggleRecord = async () => {
    if (!recorderRef.current) recorderRef.current = createRecorder();
    const rec = recorderRef.current;
    if (!recording) {
      try {
        await rec.start();
        setRecording(true);
      } catch (err) {
        console.warn('mic permission', err);
        setMessages((m) => [
          ...m,
          { from: 'system', text: lang === 'ta' ? 'மைக் அணுகல் மறுக்கப்பட்டது' : 'Microphone access denied' },
        ]);
      }
    } else {
      const blob = await rec.stop();
      setRecording(false);
      if (!blob) return;
      setTranscribing(true);
      try {
        const fd = new FormData();
        fd.append('audio', blob, 'audio.webm');
        fd.append('language', lang);
        fd.append('field', step.key);
        fd.append('question', t(step.prompt, lang));
        const res = await fetch('/api/extract-intent', { method: 'POST', body: fd });
        const data = await res.json();
        setTranscribing(false);
        if (data?.field && data?.value != null) {
          // Show as a user message and wait for user confirmation before advancing
          setPendingAnswer({ field: data.field, value: data.value, text: String(data.value), confidence: data.confidence });
        } else {
          setMessages((m) => [
            ...m,
            { from: 'system', text: lang === 'ta' ? 'புரிந்துகொள்ள முடியவில்லை. விருப்பத்தை தட்டுங்கள்.' : "Couldn't hear clearly. Please tap an option." },
          ]);
        }
      } catch (err) {
        setTranscribing(false);
        console.warn('extract-intent failed', err);
      }
    }
  };

  const confirmPending = () => {
    if (!pendingAnswer) return;
    const { field, value, text } = pendingAnswer;
    // Heuristic mapping from extracted value → our enum/number
    let storedValue = value;
    if (step.key === 'age') storedValue = typeof value === 'number' ? value : parseInt(value, 10) || 30;
    if (step.key === 'annual_income') storedValue = typeof value === 'number' ? value : 100000;
    confirmAndAdvance(step.key === 'language' ? 'languages_preferred' : step.key, storedValue, text);
    setPendingAnswer(null);
  };

  const rejectPending = () => setPendingAnswer(null);

  // When all steps done, fire final animation + onComplete
  useEffect(() => {
    if (stepIdx === STEPS.length) {
      setTyping(true);
      const finish = t('bot_finishing', lang);
      const timer = setTimeout(() => {
        setTyping(false);
        setMessages((m) => [...m, { from: 'bot', text: finish }]);
        speak(finish, lang);
      }, 400);
      const done = setTimeout(() => {
        onComplete(answers);
      }, 2400);
      return () => {
        clearTimeout(timer);
        clearTimeout(done);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  // ---------- Options renderer ----------
  const options = useMemo(() => {
    if (pendingAnswer) return null;
    if (!step) return null;
    switch (step.key) {
      case 'language':
        return (
          <div className="flex gap-3 flex-wrap justify-center">
            <ChatOpt onClick={() => handleLanguageChoice('ta')}>தமிழ்</ChatOpt>
            <ChatOpt onClick={() => handleLanguageChoice('en')}>English</ChatOpt>
          </div>
        );
      case 'age':
        return (
          <div className="grid grid-cols-3 gap-3">
            {[
              ['under_18', t('age_under_18', lang)],
              ['18_25', t('age_18_25', lang)],
              ['26_40', t('age_26_40', lang)],
              ['41_60', t('age_41_60', lang)],
              ['60_plus', t('age_60_plus', lang)],
            ].map(([k, label]) => (
              <ChatOpt key={k} onClick={() => handleAgeChoice(k, label)}>
                {label}
              </ChatOpt>
            ))}
          </div>
        );
      case 'occupation':
        return (
          <div className="grid grid-cols-2 gap-3">
            {['Farmer', 'Student', 'Daily Wage Worker', 'Small Business', 'Homemaker', 'Other'].map((o) => (
              <ChatOpt key={o} onClick={() => handleOccupationChoice(o, t(`occ_${occupationKey(o)}`, lang))}>
                {t(`occ_${occupationKey(o)}`, lang)}
              </ChatOpt>
            ))}
          </div>
        );
      case 'district':
        return (
          <div className="overflow-x-auto hide-scrollbar -mx-2 px-2">
            <div className="flex gap-2 flex-wrap">
              {DISTRICTS.map((d) => (
                <ChatOpt key={d.id} onClick={() => handleDistrictChoice(d)} size="sm">
                  {lang === 'ta' ? d.ta : d.en}
                </ChatOpt>
              ))}
            </div>
          </div>
        );
      case 'annual_income':
        return (
          <div className="grid grid-cols-2 gap-3">
            {[
              ['under_1l', t('inc_under_1l', lang)],
              ['1_2_5l', t('inc_1_2_5l', lang)],
              ['2_5_5l', t('inc_2_5_5l', lang)],
              ['above_5l', t('inc_above_5l', lang)],
            ].map(([k, label]) => (
              <ChatOpt key={k} onClick={() => handleIncomeChoice(k, label)}>
                {label}
              </ChatOpt>
            ))}
          </div>
        );
      case 'caste':
        return (
          <div className="grid grid-cols-2 gap-3">
            {['General', 'OBC', 'SC', 'ST', 'prefer_not_say'].map((c) => (
              <ChatOpt key={c} onClick={() => handleCasteChoice(c)}>
                {c === 'prefer_not_say' ? t('prefer_not_say', lang) : c}
              </ChatOpt>
            ))}
          </div>
        );
      case 'gender':
        return (
          <div className="flex gap-3 justify-center">
            <ChatOpt onClick={() => handleGenderChoice(true, t('yes', lang))}>{t('yes', lang)}</ChatOpt>
            <ChatOpt onClick={() => handleGenderChoice(false, t('no', lang))}>{t('no', lang)}</ChatOpt>
          </div>
        );
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, lang, pendingAnswer]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-brand-green-dark to-brand-green text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-brand-green-dark/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-brand-saffron flex items-center justify-center text-xl font-bold">
            செ
          </div>
          <div>
            <div className="font-semibold">{t('app_name', lang)}</div>
            <div className="text-xs opacity-80">{t('tagline', lang)}</div>
          </div>
        </div>
        <button
          onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
          className="text-sm underline underline-offset-2 !min-h-0 !min-w-0 px-2 py-1"
        >
          {t('switch_language', lang)}
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-[17px] leading-snug shadow ${
                  m.from === 'user'
                    ? 'bg-brand-saffron text-white rounded-br-sm'
                    : m.from === 'system'
                    ? 'bg-brand-amber/90 text-brand-ink'
                    : 'bg-white text-brand-ink rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
          {typing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white text-brand-ink rounded-2xl rounded-bl-sm px-4 py-3 shadow">
                <span className="inline-flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-brand-muted animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-brand-muted animate-pulse [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-brand-muted animate-pulse [animation-delay:300ms]" />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending voice answer confirmation */}
        {pendingAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white text-brand-ink rounded-2xl p-4 shadow mt-2"
          >
            <div className="text-sm text-brand-muted mb-1">
              {lang === 'ta' ? 'நான் கேட்டது:' : 'I heard:'}
            </div>
            <div className="text-lg font-semibold mb-3">{pendingAnswer.text}</div>
            <div className="flex gap-2">
              <button onClick={confirmPending} className="btn-primary flex-1">
                {lang === 'ta' ? 'சரி' : 'Yes'}
              </button>
              <button onClick={rejectPending} className="btn-secondary flex-1">
                {lang === 'ta' ? 'மீண்டும்' : 'Retry'}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Options tray */}
      <div className="bg-white/10 backdrop-blur p-3 pb-5">
        {transcribing && (
          <div className="text-center text-sm opacity-90 mb-2">
            {lang === 'ta' ? 'கேட்கிறேன்...' : 'Listening...'}
          </div>
        )}
        <div className="bg-white rounded-2xl p-3 text-brand-ink">
          {options}
        </div>

        {/* Mic */}
        <div className="flex justify-center mt-3">
          <button
            onClick={toggleRecord}
            className={`rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition-colors ${
              recording ? 'bg-red-500 animate-pulse-slow' : 'bg-brand-saffron'
            }`}
            aria-label={lang === 'ta' ? 'குரலால் பேசு' : 'Speak answer'}
          >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
              <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3zM5 11a1 1 0 112 0 5 5 0 0010 0 1 1 0 112 0 7 7 0 01-6 6.92V21h-2v-3.08A7 7 0 015 11z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatOpt({ children, onClick, size = 'md' }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl bg-brand-bg border-2 border-brand-green/20 text-brand-ink font-semibold hover:bg-brand-green/5 active:scale-95 transition-transform ${
        size === 'sm' ? 'px-4 py-3 text-sm' : 'px-5 py-4 text-base'
      }`}
    >
      {children}
    </button>
  );
}
