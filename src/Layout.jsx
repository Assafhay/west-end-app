import React from 'react';
import Nav from '@/components/Nav';
import { useTranslation } from 'react-i18next';

export default function Layout({ children, currentPageName }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <div className="flex-1">
        {children}
      </div>

      <footer style={{
        borderTop: '1px solid var(--sp-border)',
        background: 'var(--sp-surface)',
        padding: '18px 24px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--sp-text-3)', margin: 0 }}>
          {t('footer_made_by')}
          <span style={{ margin: '0 8px' }}>·</span>
          <a
            href="https://instagram.com/tsufi"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--sp-coral)', textDecoration: 'none', fontWeight: 600 }}
          >
            {t('footer_instagram')}
          </a>
          <span style={{ margin: '0 8px' }}>·</span>
          <a
            href="https://tiktok.com/@juicy.theatre"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--sp-coral)', textDecoration: 'none', fontWeight: 600 }}
          >
            {t('footer_tiktok')}
          </a>
        </p>
      </footer>
    </div>
  );
}
