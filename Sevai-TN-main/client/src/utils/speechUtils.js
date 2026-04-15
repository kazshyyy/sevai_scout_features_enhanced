// Speech helpers — TTS via speechSynthesis, STT via MediaRecorder → backend.

export const getVoices = () =>
  new Promise((resolve) => {
    const v = window.speechSynthesis?.getVoices() ?? [];
    if (v.length) return resolve(v);
    window.speechSynthesis?.addEventListener(
      'voiceschanged',
      () => resolve(window.speechSynthesis.getVoices()),
      { once: true },
    );
    // Safety fallback
    setTimeout(() => resolve(window.speechSynthesis?.getVoices() ?? []), 800);
  });

export const pickVoice = async (lang) => {
  const voices = await getVoices();
  const prefix = lang === 'ta' ? 'ta' : 'en';
  let v = voices.find((x) => x.lang?.toLowerCase().startsWith(prefix));
  if (!v && lang === 'ta') {
    // Fall back to English if no Tamil voice available (common on desktop)
    v = voices.find((x) => x.lang?.toLowerCase().startsWith('en'));
  }
  return v || voices[0] || null;
};

export const hasTamilVoice = async () => {
  const voices = await getVoices();
  return voices.some((v) => v.lang?.toLowerCase().startsWith('ta'));
};

let _currentUtter = null;
export const speak = async (text, lang = 'ta', { rate = 0.92, onEnd } = {}) => {
  if (!('speechSynthesis' in window)) return null;
  stopSpeaking();
  const voice = await pickVoice(lang);
  const utter = new SpeechSynthesisUtterance(text);
  if (voice) utter.voice = voice;
  utter.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
  utter.rate = rate;
  utter.pitch = 1.0;
  utter.onend = () => {
    _currentUtter = null;
    onEnd?.();
  };
  utter.onerror = () => {
    _currentUtter = null;
    onEnd?.();
  };
  _currentUtter = utter;
  window.speechSynthesis.speak(utter);
  return utter;
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  _currentUtter = null;
};

export const isSpeaking = () => !!_currentUtter;

// Pleasant success chime via Web Audio API (two short tones)
export const playSuccessChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    [
      { f: 660, t: 0.0, d: 0.18 },
      { f: 990, t: 0.18, d: 0.28 },
    ].forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + t);
      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.25, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + d + 0.02);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch (e) {
    /* audio unavailable — silent fallback */
  }
};

// Recording helper for voice input during onboarding.
// Returns { start, stop, abort, isRecording }
export const createRecorder = () => {
  let mediaRecorder = null;
  let chunks = [];
  let stream = null;
  let recording = false;

  const start = async () => {
    if (recording) return;
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    chunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    mediaRecorder.start();
    recording = true;
  };

  const stop = () =>
    new Promise((resolve) => {
      if (!mediaRecorder || !recording) return resolve(null);
      mediaRecorder.onstop = () => {
        recording = false;
        stream?.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(blob);
      };
      mediaRecorder.stop();
    });

  const abort = () => {
    if (!recording) return;
    try {
      mediaRecorder?.stop();
    } catch (_) {}
    stream?.getTracks().forEach((t) => t.stop());
    recording = false;
  };

  return { start, stop, abort, isRecording: () => recording };
};
