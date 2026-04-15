import { NavLink } from 'react-router-dom';
import { t } from '../data/strings.js';

const items = [
  { to: '/feed', labelKey: 'nav_feed', emoji: '🏠' },
  { to: '/applications', labelKey: 'nav_apps', emoji: '📄' },
  { to: '/profile', labelKey: 'nav_profile', emoji: '👤' },
];

export default function BottomNav({ lang }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-gray-100 z-40">
      <div className="max-w-lg mx-auto grid grid-cols-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2.5 !min-h-0 text-xs transition-colors ${
                isActive ? 'text-brand-green font-bold' : 'text-brand-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {item.emoji}
                </span>
                <span>{t(item.labelKey, lang)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
