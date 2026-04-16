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

let _currentAudio = null;

export const speak = async (text, lang = 'ta', { rate = 1.0, onEnd } = {}) => {
  stopSpeaking();
  
  try {
    const res = await fetch('http://localhost:5001/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang })
    });
    
    if (!res.ok) throw new Error('TTS failed');
    
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    _currentAudio = audio;
    
    audio.onended = () => {
      _currentAudio = null;
      URL.revokeObjectURL(url);
      onEnd?.();
    };
    
    audio.onerror = () => {
      _currentAudio = null;
      URL.revokeObjectURL(url);
      onEnd?.();
    };

    audio.playbackRate = rate;
    audio.play();

    return audio;
  } catch (err) {
    console.error('Speech synthesis route failed:', err);
    onEnd?.();
    return null;
  }
};

export const stopSpeaking = () => {
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio.currentTime = 0;
    _currentAudio = null;
  }
};

export const isSpeaking = () => !!_currentAudio;

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
