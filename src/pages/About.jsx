import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const sectionLabel = {
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--sp-text-3)',
  margin: '32px 0 12px 2px',
};

const card = {
  background: 'var(--sp-surface)',
  border: '1px solid var(--sp-border)',
  borderRadius: 'var(--sp-radius)',
  padding: '26px 26px 22px',
  boxShadow: 'var(--sp-shadow-sm)',
};

const stepNum = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: 'var(--sp-peach-light)',
  color: 'var(--sp-coral)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.82rem',
  fontWeight: 700,
  flexShrink: 0,
};

const socialBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 18px',
  borderRadius: 100,
  fontSize: '0.84rem',
  fontWeight: 600,
  textDecoration: 'none',
  background: 'var(--sp-peach-light)',
  color: 'var(--sp-coral)',
  border: '1px solid rgba(232,115,74,0.15)',
  transition: 'background 0.15s',
};

export default function About() {
  const { t } = useTranslation();

  return (
    <div style={{ background: 'var(--sp-bg)', minHeight: '100vh', position: 'relative' }}>

      {/* Warm glow */}
      <div style={{
        position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 600,
        background: 'radial-gradient(ellipse, rgba(244,169,106,0.15) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 680, margin: '0 auto', padding: '0 24px 80px',
        animation: 'sp-fade-up 0.6s ease both',
      }}>

        {/* ── Header ─────────────────────────── */}
        <header style={{ paddingTop: 44, marginBottom: 32 }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'var(--sp-peach-light)', color: 'var(--sp-coral)',
              fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
              padding: '5px 12px', borderRadius: 100,
            }}>
              🎭 {t('nav_about')}
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 6vw, 2.4rem)', fontWeight: 700,
            lineHeight: 1.15, letterSpacing: '-0.03em', color: 'var(--sp-text)', marginBottom: 8,
          }}>
            {t('about_bio_title')}
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--sp-text-2)', lineHeight: 1.5, margin: 0 }}>
            {t('about_bio_tagline')}
          </p>
        </header>

        {/* ── Bio card ───────────────────────── */}
        <div style={{ ...card, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #f7c49a, var(--sp-coral))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
          }}>🎭</div>
          <div>
            <strong style={{ display: 'block', fontSize: '1rem', fontWeight: 700, color: 'var(--sp-text)', marginBottom: 4 }}>
              Tsuf Eden
            </strong>
            <span style={{ fontSize: '0.82rem', color: 'var(--sp-coral)', fontWeight: 600 }}>
              {t('theatre_lover_creator')}
            </span>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--sp-text-2)', marginTop: 10, marginBottom: 0 }}>
              {t('about_recommendation_p1')} {t('about_recommendation_p2')}
            </p>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--sp-text-2)', marginTop: 10, marginBottom: 0 }}>
              {t('about_recommendation_p3')}
            </p>
          </div>
        </div>

        {/* ── What is Spotlight ──────────────── */}
        <p style={sectionLabel}>{t('about_mission_title')}</p>

        <div style={card}>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--sp-text-2)', margin: '0 0 12px' }}>
            {t('about_mission_p1')}
          </p>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--sp-text-2)', margin: 0 }}>
            {t('about_mission_p2')}
          </p>
        </div>

        {/* ── How it works ───────────────────── */}
        <p style={sectionLabel}>{t('about_how_title')}</p>

        <div style={{ ...card, padding: '22px 26px' }}>
          {[
            { n: '1', text: t('about_how_step1') },
            { n: '2', text: t('about_how_step2') },
            { n: '3', text: t('about_how_step3') },
          ].map(({ n, text }) => (
            <div key={n} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: '12px 0',
              borderBottom: n !== '3' ? '1px solid var(--sp-border)' : 'none',
            }}>
              <div style={stepNum}>{n}</div>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.55, color: 'var(--sp-text-2)', margin: '5px 0 0' }}>
                {text}
              </p>
            </div>
          ))}
        </div>

        {/* ── The recommendation engine ──────── */}
        <p style={sectionLabel}>{t('about_ai_title')}</p>

        <div style={{ ...card, background: 'linear-gradient(135deg, #fff3ec 0%, #fde8d4 100%)', border: '1px solid rgba(244,169,106,0.2)' }}>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--sp-text-2)', margin: 0 }}>
            {t('about_recommendation_p4')}
          </p>
        </div>

        {/* ── Social links ───────────────────── */}
        <p style={sectionLabel}>{t('about_social_title')}</p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href="https://instagram.com/tsufi"
            target="_blank"
            rel="noopener noreferrer"
            style={socialBtn}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--sp-peach-mid)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--sp-peach-light)'}
          >
            📸 Instagram
          </a>
          <a
            href="https://tiktok.com/@juicy.theatre"
            target="_blank"
            rel="noopener noreferrer"
            style={socialBtn}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--sp-peach-mid)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--sp-peach-light)'}
          >
            🎵 TikTok
          </a>
          <a
            href="https://spotlight.tsufeden.com"
            target="_blank"
            rel="noopener noreferrer"
            style={socialBtn}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--sp-peach-mid)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--sp-peach-light)'}
          >
            🌐 spotlight.tsufeden.com
          </a>
        </div>

        {/* ── CTA ────────────────────────────── */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--sp-coral)', color: '#fff',
              padding: '14px 28px', borderRadius: 100,
              fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(232,115,74,0.35)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--sp-coral-dark)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--sp-coral)'}
          >
            🎯 {t('start_fresh')}
          </Link>
        </div>

      </div>
    </div>
  );
}
