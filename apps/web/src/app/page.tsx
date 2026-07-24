import Link from 'next/link';
import { Fraunces, Source_Sans_3 } from 'next/font/google';

import './landing.css';

const display = Fraunces({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-landing-display',
  display: 'swap',
});

const sans = Source_Sans_3({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-landing-sans',
  display: 'swap',
});

function LandingVisual() {
  return (
    <div className="landing__visual" aria-hidden="true">
      <svg viewBox="0 0 640 640" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="320" cy="320" r="280" fill="rgba(47, 93, 58, 0.08)" />
        <circle cx="320" cy="320" r="210" fill="rgba(47, 93, 58, 0.1)" />
        <rect
          x="150"
          y="170"
          width="340"
          height="300"
          rx="28"
          fill="#fff"
          fillOpacity="0.88"
          stroke="rgba(47, 93, 58, 0.22)"
          strokeWidth="2"
        />
        <rect x="178" y="206" width="90" height="18" rx="9" fill="rgba(47, 93, 58, 0.55)" />
        <rect x="178" y="246" width="284" height="12" rx="6" fill="rgba(29, 42, 36, 0.12)" />
        <rect x="178" y="274" width="220" height="12" rx="6" fill="rgba(29, 42, 36, 0.1)" />
        <rect x="178" y="320" width="120" height="72" rx="14" fill="rgba(47, 93, 58, 0.16)" />
        <rect x="316" y="320" width="146" height="72" rx="14" fill="rgba(47, 93, 58, 0.1)" />
        <rect x="178" y="410" width="284" height="28" rx="10" fill="rgba(47, 93, 58, 0.2)" />
        <path
          d="M430 120c28 18 48 52 42 88-8 48-58 72-98 58-22-8-38-26-44-48 34 8 72-18 100-98Z"
          fill="rgba(36, 74, 46, 0.28)"
        />
      </svg>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className={`landing ${display.variable} ${sans.variable}`}>
      <nav className="landing__nav">
        <Link href="/" className="landing__brand">
          Equestrian Scheduler
        </Link>
        <Link href="/login" className="landing__nav-link">
          Zaloguj się
        </Link>
      </nav>

      <main className="landing__hero">
        <div className="landing__mark">ES</div>
        <h1 className="landing__title">Equestrian Scheduler</h1>
        <p className="landing__headline">Kalendarz, który ogarnia cały ośrodek.</p>
        <p className="landing__lead">
          Lekcje, konie, hala i zespół w jednym miejscu — bez arkuszy i chaosu w wiadomościach.
        </p>
        <div className="landing__cta">
          <Link href="/login" className="landing__btn landing__btn--primary">
            Przejdź do aplikacji
          </Link>
          <Link href="/register" className="landing__btn landing__btn--ghost">
            Załóż konto
          </Link>
        </div>
      </main>

      <LandingVisual />
    </div>
  );
}
