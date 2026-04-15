import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { LanguageProvider, useLanguage } from './hooks/useLanguage.js';
import { useVault } from './hooks/useVault.js';
import { useEligibility } from './hooks/useEligibility.js';
import ChatOnboarding from './components/ChatOnboarding.jsx';
import WowReveal from './components/WowReveal.jsx';
import BottomNav from './components/BottomNav.jsx';
import Feed from './pages/Feed.jsx';
import Applications from './pages/Applications.jsx';
import Profile from './pages/Profile.jsx';
import SchemeDetail from './pages/SchemeDetail.jsx';
import Apply from './pages/Apply.jsx';

export default function App() {
  return (
    <LanguageProvider>
      <Shell />
    </LanguageProvider>
  );
}

function Shell() {
  const { vault, setVault, ready } = useVault();
  const { lang, setLang } = useLanguage();
  const [phase, setPhase] = useState('loading'); // loading | onboarding | reveal | app
  const loc = useLocation();
  const nav = useNavigate();
  const { eligible, totalValue } = useEligibility(vault);

  useEffect(() => {
    if (!ready) return;
    if (vault.onboarding_complete) {
      setPhase('app');
    } else {
      setPhase('onboarding');
    }
  }, [ready, vault.onboarding_complete]);

  const handleOnboardingDone = (answers) => {
    setVault({
      ...answers,
      onboarding_complete: true,
      languages_preferred: answers.languages_preferred || [lang],
    });
    setPhase('reveal');
  };

  const goFeed = () => {
    setPhase('app');
    nav('/feed');
  };

  if (phase === 'loading') {
    return (
      <div className="h-full grid place-items-center text-brand-muted">
        {lang === 'ta' ? 'ஏற்றப்படுகிறது...' : 'Loading...'}
      </div>
    );
  }

  if (phase === 'onboarding') {
    return (
      <div className="h-full">
        <ChatOnboarding onComplete={handleOnboardingDone} lang={lang} setLang={setLang} />
      </div>
    );
  }

  if (phase === 'reveal') {
    return (
      <AnimatePresence>
        <WowReveal count={eligible.length} totalValue={totalValue} lang={lang} onContinue={goFeed} />
      </AnimatePresence>
    );
  }

  // Main app
  const showNav = !['/apply', '/scheme'].some((p) => loc.pathname.startsWith(p));

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/scheme/:id" element={<SchemeDetail />} />
          <Route path="/apply/:id" element={<Apply />} />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </div>
      {showNav && <BottomNav lang={lang} />}
    </div>
  );
}
