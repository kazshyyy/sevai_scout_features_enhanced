import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useVault } from '../hooks/useVault.js';
import { useEligibility } from '../hooks/useEligibility.js';
import { useLanguage } from '../hooks/useLanguage.js';
import SchemeCard from '../components/SchemeCard.jsx';
import FuzzyMatchCard from '../components/FuzzyMatchCard.jsx';
import { t } from '../data/strings.js';
import { formatRupees } from '../utils/formatters.js';
import { DISTRICTS } from '../data/districts.js';
import { hasTamilVoice } from '../utils/speechUtils.js';

export default function Feed() {
  const { vault } = useVault();
  const { lang, setLang } = useLanguage();
  const { eligible, close_matches, totalValue } = useEligibility(vault);
  const [loading, setLoading] = useState(true);
  const [tamilVoiceBanner, setTamilVoiceBanner] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    (async () => {
      if (lang === 'ta') {
        const ok = await hasTamilVoice();
        setTamilVoiceBanner(!ok);
      } else {
        setTamilVoiceBanner(false);
      }
    })();
  }, [lang]);

  const districtLabel = DISTRICTS.find((d) => d.id === vault.district);
  const districtStr = districtLabel ? (lang === 'ta' ? districtLabel.ta : districtLabel.en) : '';

  return (
    <div className="min-h-full pb-24 bg-brand-bg">
      {/* Hero header */}
      <header className="bg-brand-green text-white px-5 pt-6 pb-8 rounded-b-3xl shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs opacity-80">{t('app_name', lang)}</div>
            <div className="text-sm opacity-90">
              {vault.name
                ? lang === 'ta'
                  ? `வணக்கம், ${vault.name}`
                  : `Hello, ${vault.name}`
                : lang === 'ta'
                ? 'வணக்கம்'
                : 'Hello'}
              {districtStr && <span> · {districtStr}</span>}
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
            className="!min-h-0 !min-w-0 text-xs bg-white/15 rounded-full px-3 py-1.5"
          >
            {lang === 'ta' ? 'EN' : 'த'}
          </button>
        </div>
        <div className="mt-5">
          <div className="text-xs opacity-80 uppercase tracking-widest">
            {lang === 'ta' ? 'உங்களுக்கு தகுதியானவை' : 'You qualify for'}
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-5xl font-black text-brand-saffron">{eligible.length}</span>
            <span className="text-sm opacity-90">
              {lang === 'ta' ? 'திட்டங்கள்' : 'schemes'} · {formatRupees(totalValue)}
              <span className="text-xs opacity-70">{t('wow_per_year', lang)}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Tamil voice banner */}
      {tamilVoiceBanner && (
        <div className="mx-4 mt-3 amber-banner">{t('tamil_voice_unavailable', lang)}</div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="px-5 py-10 text-center">
          <div className="inline-flex items-center gap-3 text-brand-muted">
            <span className="inline-flex gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse [animation-delay:300ms]" />
            </span>
            {t('loading_schemes', lang)}
          </div>
        </div>
      ) : (
        <>
          {/* Cards */}
          <section className="px-4 py-4 space-y-3">
            <h2 className="text-sm font-bold text-brand-muted uppercase tracking-wide px-1">
              {lang === 'ta' ? 'பரிந்துரைக்கப்பட்டவை' : 'Recommended for you'}
            </h2>
            {eligible.length === 0 && (
              <div className="amber-banner">
                {lang === 'ta'
                  ? 'உங்கள் சுயவிவரத்திற்கு பொருந்தும் திட்டங்கள் கிடைக்கவில்லை.'
                  : 'No schemes match your profile yet.'}
              </div>
            )}
            {eligible.map(({ scheme }) => (
              <SchemeCard key={scheme.id} scheme={scheme} vault={vault} lang={lang} />
            ))}
          </section>

          {/* Close matches */}
          {close_matches.length > 0 && (
            <section className="px-4 py-4 space-y-3">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-bold text-brand-saffron-dark uppercase tracking-wide px-1"
              >
                ⚠︎ {t('close_matches', lang)}
              </motion.h2>
              {close_matches.map((entry) => (
                <FuzzyMatchCard key={entry.scheme.id} entry={entry} vault={vault} lang={lang} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
