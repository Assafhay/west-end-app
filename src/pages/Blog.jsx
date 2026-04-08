import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchPosts } from '@/lib/contentful';

const sectionLabel = {
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--sp-text-3)',
  margin: '32px 0 12px 2px',
};

export default function Blog() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .catch(err => console.error('Failed to load posts:', err))
      .finally(() => setLoading(false));
  }, []);

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
              📝 {t('nav_blog')}
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 6vw, 2.4rem)', fontWeight: 700,
            lineHeight: 1.15, letterSpacing: '-0.03em', color: 'var(--sp-text)', marginBottom: 8,
          }}>
            {t('blog_page_title')}
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--sp-text-2)', lineHeight: 1.5, margin: 0 }}>
            {t('blog_subtitle')}
          </p>
        </header>

        {/* ── Posts list ─────────────────────── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--sp-text-3)', fontSize: '0.9rem' }}>
            {t('blog_loading')}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--sp-text-3)', fontSize: '0.9rem' }}>
            {t('blog_empty')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {posts.map((post, i) => (
              <Link
                key={post.slug || post.id || i}
                to={`/Blog/${post.slug}`}
                style={{
                  display: 'flex', gap: 20, alignItems: 'flex-start',
                  background: 'var(--sp-surface)', border: '1px solid var(--sp-border)',
                  borderRadius: 'var(--sp-radius)', overflow: 'hidden',
                  textDecoration: 'none', color: 'inherit',
                  boxShadow: 'var(--sp-shadow-sm)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--sp-shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--sp-shadow-sm)'; }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: 110, flexShrink: 0, alignSelf: 'stretch',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.4rem',
                  background: i % 2 === 0
                    ? 'linear-gradient(135deg, #fde3c8, #f9c7a0)'
                    : 'linear-gradient(135deg, #fde8d4, rgba(244,197,106,0.3))',
                }}>
                  {post.emoji}
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '18px 20px 18px 0' }}>
                  <p style={{
                    fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: 'var(--sp-coral)', marginBottom: 6,
                  }}>
                    {post.tag}
                  </p>
                  <h2 style={{
                    fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em',
                    lineHeight: 1.3, color: 'var(--sp-text)', marginBottom: 8,
                  }}>
                    {post.title}
                  </h2>
                  <p style={{
                    fontSize: '0.83rem', color: 'var(--sp-text-2)', lineHeight: 1.5,
                    margin: '0 0 10px', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {post.excerpt}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--sp-text-3)', margin: 0 }}>
                    Tsuf Eden · {post.readTime} {t('min_read')} · {post.date}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── CTA strip ──────────────────────── */}
        <div style={{
          marginTop: 48, textAlign: 'center', padding: '32px 24px',
          background: 'linear-gradient(135deg, #fff3ec 0%, #fde8d4 100%)',
          borderRadius: 'var(--sp-radius)', border: '1px solid rgba(244,169,106,0.2)',
        }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--sp-text)', marginBottom: 14 }}>
            {t('blog_cta_text')}
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--sp-coral)', color: '#fff',
              padding: '12px 24px', borderRadius: 100,
              fontSize: '0.88rem', fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(232,115,74,0.3)',
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
