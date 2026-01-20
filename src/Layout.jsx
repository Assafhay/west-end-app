import React from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function Layout({ children, currentPageName }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        {children}
      </div>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="absolute top-1/2 -translate-y-1/2 end-4">
            <LanguageSwitcher />
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mb-1">
            {t('footer_made_by')}
          </p>
          <p className="text-slate-500 text-xs sm:text-sm">
            <a
              href="https://instagram.com/tsufi"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700 transition-colors"
            >
              {t('footer_instagram')}
            </a>
            <span className="mx-2">|</span>
            <a
              href="https://tiktok.com/@juicy.theatre"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700 transition-colors"
            >
              {t('footer_tiktok')}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}