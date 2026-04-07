import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { blogPosts as staticPosts } from '@/data/blogPosts';

/* Very simple markdown-like renderer — bold (**text**) and paragraphs */
function renderContent(content) {
  if (!content) return null;
  return content.split('\n\n').map((block, i) => {
    // Heading: starts with **text**
    if (/^\*\*[^*]+\*\*$/.test(block.trim())) {
      const text = block.trim().replace(/\*\*/g, '');
      return (
        <h3 key={i} style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--sp-text)', margin: '28px 0 8px', letterSpacing: '-0.01em' }}>
          {text}
        </h3>
      );
    }
    // Inline bold
    const parts = block.split(/\*\*([^*]+)\*\*/g);
    return (
      <p key={i} style={{ fontSize: '0.95rem', lineHeight: 1.75, color: 'var(--sp-text-2)', margin: '0 0 16px' }}>
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j} style={{ color: 'var(--sp-text)', fontWeight: 700 }}>{part}</strong> : part
        )}
      </p>
    );
  });
}

export default function BlogPost() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      try {
        const q = query(collection(db, 'posts'), where('slug', '==', slug), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setPost({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
          // Fallback to static data
          const found = staticPosts.find(p => p.slug === slug);
          setPost(found || null);
        }
      } catch (err) {
        console.error('Failed to load post from Firestore, using static fallback:', err);
        const found = staticPosts.find(p => p.slug === slug);
        setPost(found || null);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
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
