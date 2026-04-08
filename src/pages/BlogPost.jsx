import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchPostBySlug } from '@/lib/contentful';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';

const richTextOptions = {
  renderMark: {
    [MARKS.BOLD]: text => <strong style={{ color: 'var(--sp-text)', fontWeight: 700 }}>{text}</strong>,
    [MARKS.ITALIC]: text => <em style={{ fontStyle: 'italic' }}>{text}</em>,
  },
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node, children) => (
      <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--sp-text-2)', margin: '0 0 18px' }}>{children}</p>
    ),
    [BLOCKS.HEADING_2]: (node, children) => (
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--sp-text)', margin: '40px 0 12px', letterSpacing: '-0.02em' }}>{children}</h2>
    ),
    [BLOCKS.HEADING_3]: (node, children) => (
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sp-text)', margin: '36px 0 10px', letterSpacing: '-0.02em' }}>{children}</h3>
    ),
    [BLOCKS.HR]: () => (
      <hr style={{ border: 'none', borderTop: '1px solid var(--sp-border)', margin: '32px 0' }} />
    ),
    [INLINES.HYPERLINK]: (node, children) => (
      <a href={node.data.uri} target="_blank" rel="noopener noreferrer"
        style={{ color: 'var(--sp-coral)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
        {children}
      </a>
    ),
  },
};

function renderContent(content) {
  if (!content) return null;
  return documentToReactComponents(content, richTextOptions);
}

export default function BlogPost() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPostBySlug(slug)
      .then(setPost)
      .catch(err => console.error('Failed to load post:', err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div style={{ background: 'var(--sp-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--sp-text-3)', fontSize: '0.9rem' }}>{t('loading')}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ background: 'var(--sp-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--sp-text)' }}>Post not found</p>
        <Link to="/Blog" style={{ color: 'var(--sp-coral)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
          ← {t('nav_blog')}
        </Link>
      </div>
    );
  }

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

        {/* ── Back link ──────────────────────── */}
        <div style={{ paddingTop: 36, marginBottom: 28 }}>
          <Link
            to="/Blog"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: '0.82rem', fontWeight: 600, color: 'var(--sp-text-2)',
              textDecoration: 'none', padding: '6px 12px', borderRadius: 100,
              background: 'var(--sp-surface)', border: '1px solid var(--sp-border)',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--sp-coral)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--sp-text-2)'}
          >
            ← {t('nav_blog')}
          </Link>
        </div>

        {/* ── Hero image ─────────────────────── */}
        <div style={{
          height: 200, borderRadius: 'var(--sp-radius)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '4rem', marginBottom: 28,
          background: 'linear-gradient(135deg, #fde3c8, #f9c7a0)',
          boxShadow: 'var(--sp-shadow-sm)',
        }}>
          {post.emoji}
        </div>

        {/* ── Post header ────────────────────── */}
        <p style={{
          fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--sp-coral)', marginBottom: 10,
        }}>
          {post.tag}
        </p>

        <h1 style={{
          fontSize: 'clamp(1.6rem, 5vw, 2.1rem)', fontWeight: 700,
          lineHeight: 1.2, letterSpacing: '-0.03em', color: 'var(--sp-text)', marginBottom: 12,
        }}>
          {post.title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f7c49a, var(--sp-coral))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
          }}>🎭</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--sp-text-3)', margin: 0 }}>
            Tsuf Eden · {post.readTime} {t('min_read')} · {post.date}
          </p>
        </div>

        {/* ── Divider ────────────────────────── */}
        <div style={{ height: 1, background: 'var(--sp-border)', marginBottom: 28 }} />

        {/* ── Content ────────────────────────── */}
        <article>
          {renderContent(post.content)}
        </article>

        {/* ── Footer CTA ─────────────────────── */}
        <div style={{
          marginTop: 48, padding: '28px 26px',
          background: 'linear-gradient(135deg, #fff3ec 0%, #fde8d4 100%)',
          borderRadius: 'var(--sp-radius)', border: '1px solid rgba(244,169,106,0.2)',
          textAlign: 'center',
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
