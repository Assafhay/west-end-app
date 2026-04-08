import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchPosts } from '@/lib/contentful';

/* ── shared style objects ─────────────────────────────────── */
const sectionLabel = {
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--sp-text-3)',
  margin: '28px 0 12px 2px',
};

const cardBase = {
  background: 'var(--sp-surface)',
  border: '1px solid var(--sp-border)',
  borderRadius: 'var(--sp-radius)',
  padding: '26px 22px 22px',
  cursor: 'pointer',
  boxShadow: 'var(--sp-shadow-sm)',
  position: 'relative',
  overflow: 'hidden',
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
  textAlign: 'start',
  width: '100%',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
};

const cardIcon = {
  width: 42,
  height: 42,
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.2rem',
  marginBottom: 14,
  background: 'var(--sp-peach-light)',
};

const cardH2 = {
  fontSize: '1rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: 'var(--sp-text)',
  marginBottom: 5,
};

const cardP = {
  fontSize: '0.82rem',
  lineHeight: 1.5,
  color: 'var(--sp-text-2)',
  margin: 0,
};

const cardCta = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  marginTop: 14,
  fontSize: '0.76rem',
  fontWeight: 600,
  color: 'var(--sp-coral)',
};

/* ── hover helpers ────────────────────────────────────────── */
const onCardEnter   = e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'; e.currentTarget.style.boxShadow = 'var(--sp-shadow-lg)'; };
const onCardLeave   = e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--sp-shadow-sm)'; };
const onBrowseEnter = e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--sp-shadow-md)'; };
const onBrowseLeave = e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--sp-shadow-sm)'; };
const onBlogEnter   = e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--sp-shadow-md)'; };
const onBlogLeave   = e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--sp-shadow-sm)'; };

/* ── component ────────────────────────────────────────────── */
export default function WelcomeScreen({ onStart }) {
  const { t } = useTranslation();
  const [previewPosts, setPreviewPosts] = useState([]);

  useEffect(() => {
    fetchPosts()
      .then(posts => setPreviewPosts(posts.slice(0, 2)))
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: 'var(--sp-bg)', minHeight: '100vh', position: 'relative' }}>

      {/* Warm radial glow behind header */}
      <div style={{
        position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 600,
        background: 'radial-gradient(ellipse, rgba(244,169,106,0.18) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Page wrapper */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 680, margin: '0 auto', padding: '0 24px 80px',
        animation: 'sp-fade-up 0.6s ease both',
      }}>

        {/* ── Header ─────────────────────────────── */}
        <header style={{ paddingTop: 44, textAlign: 'center', marginBottom: 36 }}>

          {/* App icon + glow ring */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
            <img
              src="/favicon.png"
              alt="Spotlight"
              style={{
                width: 84, height: 84, borderRadius: 22, display: 'block',
                boxShadow: '0 8px 24px rgba(232,115,74,0.3), 0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <div style={{
              position: 'absolute', inset: -14, borderRadius: 36,
              background: 'radial-gradient(circle, rgba(244,169,106,0.2) 0%, transparent 70%)',
              zIndex: -1,
            }} />
          </div>

          {/* Location badge */}
          <div style={{ marginBottom: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'var(--sp-peach-light)', color: 'var(--sp-coral)',
              fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
              padding: '5px 12px', borderRadius: 100,
            }}>
              📍 London West End
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(1.85rem, 6vw, 2.5rem)', fontWeight: 700,
            lineHeight: 1.15, letterSpacing: '-0.03em', color: 'var(--sp-text)', marginBottom: 10,
          }}>
            {t('home_h1')}
          </h1>

          <p style={{ fontSize: '1rem', color: 'var(--sp-text-2)', lineHeight: 1.5, margin: 0 }}>
            {t('welcome_subtitle')}
          </p>
        </header>

        {/* ── Get started ────────────────────────── */}
        <p style={sectionLabel}>{t('get_started')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12, marginBottom: 12 }}>

          <button onClick={() => onStart('recommendation')} style={cardBase} onMouseEnter={onCardEnter} onMouseLeave={onCardLeave}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,169,106,0.15), transparent 70%)', pointerEvents: 'none' }} />
            <div style={cardIcon}>🎯</div>
            <h2 style={cardH2}>{t('start_fresh')}</h2>
            <p style={cardP}>{t('start_fresh_desc')}</p>
            <span style={cardCta}>{t('lets_go')} →</span>
          </button>

          <button onClick={() => onStart('comparison')} style={cardBase} onMouseEnter={onCardEnter} onMouseLeave={onCardLeave}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,169,106,0.15), transparent 70%)', pointerEvents: 'none' }} />
            <div style={cardIcon}>🤔</div>
            <h2 style={cardH2}>{t('cant_decide')}</h2>
            <p style={cardP}>{t('cant_decide_desc')}</p>
            <span style={cardCta}>{t('compare_cta')} →</span>
          </button>
        </div>

        {/* Browse All — full width */}
        <button
          onClick={() => onStart('browse')}
          style={{
            background: 'linear-gradient(135deg, #fff3ec 0%, #fde8d4 100%)',
            border: '1px solid rgba(244,169,106,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '24px 26px', borderRadius: 'var(--sp-radius)',
            cursor: 'pointer', boxShadow: 'var(--sp-shadow-sm)',
            width: '100%', textAlign: 'start',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={onBrowseEnter}
          onMouseLeave={onBrowseLeave}
        >
          <div>
            <h2 style={cardH2}>{t('browse_all')}</h2>
            <p style={cardP}>{t('browse_all_desc')}</p>
          </div>
          <span style={{ fontSize: '2.2rem', flexShrink: 0, marginInlineStart: 14 }}>🎭</span>
        </button>

        {/* ── Blog strip ─────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '28px 0 14px' }}>
          <p style={{ ...sectionLabel, margin: 0 }}>{t('from_the_blog')}</p>
          <Link
            to="/Blog"
            style={{
              fontSize: '0.78rem', fontWeight: 600, color: 'var(--sp-coral)',
              textDecoration: 'none', padding: '4px 10px', borderRadius: 100,
              background: 'var(--sp-peach-light)', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--sp-peach-mid)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--sp-peach-light)'}
          >
            {t('see_all')} →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
          {previewPosts.map((post, i) => (
            <Link
              key={post.slug}
              to={`/Blog/${post.slug}`}
              style={{
                background: 'var(--sp-surface)', border: '1px solid var(--sp-border)',
                borderRadius: 'var(--sp-radius)', overflow: 'hidden',
                textDecoration: 'none', color: 'inherit', display: 'block',
                boxShadow: 'var(--sp-shadow-sm)', transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={onBlogEnter}
              onMouseLeave={onBlogLeave}
            >
              <div style={{
                height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.4rem',
                background: i === 0
                  ? 'linear-gradient(135deg, #fde3c8, #f9c7a0)'
                  : 'linear-gradient(135deg, #fde8d4, rgba(244,197,106,0.2))',
              }}>
                {post.emoji}
              </div>
              <div style={{ padding: '14px 16px 16px' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sp-coral)', marginBottom: 6 }}>
                  {post.tag}
                </p>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3, color: 'var(--sp-text)', marginBottom: 6 }}>
                  {post.title}
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--sp-text-3)', margin: 0 }}>
                  Tsuf Eden · {post.readTime} min read
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── About card ─────────────────────────── */}
        <p style={{ ...sectionLabel, marginTop: 28 }}>{t('nav_about')}</p>

        <div style={{
          background: 'var(--sp-surface)', border: '1px solid var(--sp-border)',
          borderRadius: 'var(--sp-radius)', padding: '26px 26px 22px', boxShadow: 'var(--sp-shadow-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <img
              src="/tsuf.jpg"
              alt="Tsuf Eden"
              style={{
                width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                objectFit: 'cover', objectPosition: 'center top',
              }}
            />
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--sp-text)' }}>Tsuf Eden</strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--sp-text-3)' }}>{t('theatre_lover_creator')}</span>
            </div>
          </div>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--sp-text-2)', margin: 0 }}>
            {t('about_recommendation_p1')} {t('about_recommendation_p2')}
          </p>
          <Link
            to="/About"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: '0.8rem', fontWeight: 600, color: 'var(--sp-coral)', textDecoration: 'none' }}
          >
            {t('read_more')} →
          </Link>
        </div>

      </div>
    </div>
  );
}
