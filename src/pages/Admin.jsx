import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { seedBlogPosts } from '@/lib/seedPosts';

// ── Replace with your Firebase UID (from Firebase Console → Auth → Users)
const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || '';

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '0.9rem',
  border: '1px solid var(--sp-border)',
  borderRadius: 12,
  background: 'var(--sp-surface)',
  color: 'var(--sp-text)',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--sp-text-2)',
  marginBottom: 6,
  letterSpacing: '0.02em',
};

const fieldWrap = { marginBottom: 18 };

const EMPTY_FORM = {
  title: '',
  slug: '',
  tag: 'Review',
  emoji: '✨',
  readTime: 5,
  date: '',
  dateISO: '',
  excerpt: '',
  content: '',
  published: false,
};

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function Admin() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const contentRef = React.useRef(null);

  const insertAtCursor = (before, after = '', placeholder = 'text') => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = form.content.slice(start, end) || placeholder;
    const inserted = before + selected + after;
    const newContent = form.content.slice(0, start) + inserted + form.content.slice(end);
    set('content', newContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL:');
    if (!url) return;
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = form.content.slice(start, end) || 'link text';
    const inserted = `[${selected}](${url})`;
    const newContent = form.content.slice(0, start) + inserted + form.content.slice(end);
    set('content', newContent);
  };

  const isAdmin = user && (user.id === ADMIN_UID || !ADMIN_UID);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleTitleChange = e => {
    const val = e.target.value;
    set('title', val);
    if (!form.slug || form.slug === slugify(form.title)) {
      set('slug', slugify(val));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.slug || !form.content) {
      setError('Title, slug, and content are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = {
        ...form,
        readTime: Number(form.readTime) || 5,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'posts'), data);
      setSaved(true);
      setForm(EMPTY_FORM);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error(err);
      setError('Failed to save. Check Firestore rules and your connection.');
    } finally {
      setSaving(false);
    }
  };

  // ── Access denied ──────────────────────────────────────────
  if (!user) {
    return (
      <div style={{
        background: 'var(--sp-bg)', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12,
      }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--sp-text)' }}>
          {t('admin_sign_in_required')}
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--sp-text-3)' }}>Sign in with the admin Google account.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{
        background: 'var(--sp-bg)', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12,
      }}>
        <p style={{ fontSize: '2rem' }}>🚫</p>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--sp-text)' }}>
          {t('admin_access_denied')}
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--sp-text-3)' }}>Logged in as: {user.email}</p>
      </div>
    );
  }

  // ── Admin form ─────────────────────────────────────────────
  return (
    <div style={{ background: 'var(--sp-bg)', minHeight: '100vh' }}>
      <div style={{
        maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px',
        animation: 'sp-fade-up 0.6s ease both',
      }}>

        <h1 style={{
          fontSize: '1.7rem', fontWeight: 700, letterSpacing: '-0.03em',
          color: 'var(--sp-text)', marginBottom: 6,
        }}>
          ✍️ {t('admin_page_title')}
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--sp-text-3)', marginBottom: 20 }}>
          Signed in as {user.email}
        </p>

        {/* Seed button — one-time use */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            disabled={seeding}
            onClick={async () => {
              setSeeding(true);
              setSeedMsg('');
              try {
                await seedBlogPosts();
                setSeedMsg('✅ Seed complete — check Firestore.');
              } catch (e) {
                setSeedMsg('❌ Seed failed: ' + e.message);
              } finally {
                setSeeding(false);
              }
            }}
            style={{
              background: 'transparent', border: '1px solid var(--sp-border)',
              borderRadius: 100, padding: '8px 18px', fontSize: '0.82rem',
              fontWeight: 600, color: 'var(--sp-text-2)', cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--sp-coral)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--sp-border)'}
          >
            {seeding ? 'Seeding…' : '🌱 Seed static posts to Firestore'}
          </button>
          {seedMsg && <span style={{ fontSize: '0.82rem', color: 'var(--sp-text-2)' }}>{seedMsg}</span>}
        </div>

        {saved && (
          <div style={{
            background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 12,
            padding: '12px 18px', marginBottom: 20, fontSize: '0.88rem', color: '#065f46', fontWeight: 600,
          }}>
            ✅ Post saved successfully!
          </div>
        )}

        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12,
            padding: '12px 18px', marginBottom: 20, fontSize: '0.88rem', color: '#b91c1c',
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{
          background: 'var(--sp-surface)', border: '1px solid var(--sp-border)',
          borderRadius: 'var(--sp-radius)', padding: '28px 28px 24px',
          boxShadow: 'var(--sp-shadow-sm)',
        }}>

          <div style={fieldWrap}>
            <label style={labelStyle}>Title *</label>
            <input
              style={inputStyle}
              value={form.title}
              onChange={handleTitleChange}
              placeholder="Why Hamilton Still Hits Different in 2025"
              required
              onFocus={e => e.target.style.borderColor = 'var(--sp-coral)'}
              onBlur={e => e.target.style.borderColor = 'var(--sp-border)'}
            />
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>Slug *</label>
            <input
              style={inputStyle}
              value={form.slug}
              onChange={e => set('slug', e.target.value)}
              placeholder="hamilton-still-hits-different-2025"
              required
              onFocus={e => e.target.style.borderColor = 'var(--sp-coral)'}
              onBlur={e => e.target.style.borderColor = 'var(--sp-border)'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Tag</label>
              <select
                style={{ ...inputStyle }}
                value={form.tag}
                onChange={e => set('tag', e.target.value)}
                onFocus={e => e.target.style.borderColor = 'var(--sp-coral)'}
                onBlur={e => e.target.style.borderColor = 'var(--sp-border)'}
              >
                {['Review', 'Guide', 'Tips', 'News', 'Opinion'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Emoji</label>
              <input
                style={inputStyle}
                value={form.emoji}
                onChange={e => set('emoji', e.target.value)}
                placeholder="✨"
                onFocus={e => e.target.style.borderColor = 'var(--sp-coral)'}
                onBlur={e => e.target.style.borderColor = 'var(--sp-border)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Read time (min)</label>
              <input
                type="number"
                style={inputStyle}
                value={form.readTime}
                onChange={e => set('readTime', e.target.value)}
                min={1}
                onFocus={e => e.target.style.borderColor = 'var(--sp-coral)'}
                onBlur={e => e.target.style.borderColor = 'var(--sp-border)'}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Display date (e.g. "April 2025")</label>
              <input
                style={inputStyle}
                value={form.date}
                onChange={e => set('date', e.target.value)}
                placeholder="April 2025"
                onFocus={e => e.target.style.borderColor = 'var(--sp-coral)'}
                onBlur={e => e.target.style.borderColor = 'var(--sp-border)'}
              />
            </div>
            <div>
              <label style={labelStyle}>ISO date (YYYY-MM-DD)</label>
              <input
                type="date"
                style={inputStyle}
                value={form.dateISO}
                onChange={e => set('dateISO', e.target.value)}
                onFocus={e => e.target.style.borderColor = 'var(--sp-coral)'}
                onBlur={e => e.target.style.borderColor = 'var(--sp-border)'}
              />
            </div>
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>Excerpt (1–2 sentences shown in listing)</label>
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
              value={form.excerpt}
              onChange={e => set('excerpt', e.target.value)}
              placeholder="A brief summary of the post..."
              onFocus={e => e.target.style.borderColor = 'var(--sp-coral)'}
              onBlur={e => e.target.style.borderColor = 'var(--sp-border)'}
            />
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>Content *</label>

            {/* Formatting toolbar */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'B', title: 'Bold', action: () => insertAtCursor('**', '**', 'bold text') },
                { label: 'H3', title: 'Heading', action: () => insertAtCursor('### ', '', 'Heading') },
                { label: '—', title: 'Divider', action: () => insertAtCursor('\n\n---\n\n', '', '') },
                { label: '🔗 Link', title: 'Insert link', action: insertLink },
              ].map(btn => (
                <button key={btn.label} type="button" title={btn.title} onClick={btn.action} style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
                  border: '1px solid var(--sp-border)', background: 'var(--sp-surface)',
                  color: 'var(--sp-text-2)', cursor: 'pointer',
                }}>
                  {btn.label}
                </button>
              ))}
              <span style={{ fontSize: '0.72rem', color: 'var(--sp-text-3)', alignSelf: 'center', marginLeft: 4 }}>
                Blank line = new paragraph
              </span>
            </div>

            <textarea
              ref={contentRef}
              style={{ ...inputStyle, minHeight: 320, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
              value={form.content}
              onChange={e => set('content', e.target.value)}
              placeholder={"### Heading\n\nParagraph text here.\n\n[Link text](https://example.com)\n\n---\n\nMore text."}
              required
              onFocus={e => e.target.style.borderColor = 'var(--sp-coral)'}
              onBlur={e => e.target.style.borderColor = 'var(--sp-border)'}
            />
          </div>

          {/* Publish toggle + submit */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div
                onClick={() => set('published', !form.published)}
                style={{
                  width: 42, height: 24, borderRadius: 12,
                  background: form.published ? 'var(--sp-coral)' : 'var(--sp-border)',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 3, left: form.published ? 21 : 3,
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                }} />
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--sp-text-2)' }}>
                {form.published ? t('admin_publish') : t('admin_draft')}
              </span>
            </label>

            <button
              type="submit"
              disabled={saving}
              style={{
                background: saving ? 'var(--sp-text-3)' : 'var(--sp-coral)',
                color: '#fff', border: 'none', borderRadius: 100,
                padding: '12px 28px', fontSize: '0.9rem', fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--sp-coral-dark)'; }}
              onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--sp-coral)'; }}
            >
              {saving ? 'Saving…' : `✅ ${t('admin_add_post')}`}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
