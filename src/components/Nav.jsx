import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import GoogleSignIn from '@/components/auth/GoogleSignIn';

export default function Nav() {
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { label: t('nav_home'),  to: '/' },
    { label: t('nav_blog'),  to: '/Blog' },
    { label: t('nav_about'), to: '/About' },
  ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(250,248,245,0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--sp-border)',
    }}>
      <div style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '0 24px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #fde3c8, #f9c7a0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            boxShadow: '0 2px 6px rgba(232,115,74,0.25)',
            flexShrink: 0,
          }}>🎭</div>
          <span style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'var(--sp-text)',
            letterSpacing: '-0.02em',
          }}>Spotlight</span>
        </Link>

        {/* Right side: nav links + language + sign-in */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {navLinks.map(({ label, to }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: active ? 600 : 500,
                    color: active ? 'var(--sp-coral)' : 'var(--sp-text-2)',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    borderRadius: 100,
                    background: active ? 'var(--sp-peach-light)' : 'transparent',
                    transition: 'background 0.15s, color 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                      e.currentTarget.style.color = 'var(--sp-text)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--sp-text-2)';
                    }
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Sign in / user avatar */}
          <GoogleSignIn />
        </div>
      </div>
    </nav>
  );
}
