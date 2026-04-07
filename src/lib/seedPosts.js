/**
 * seedPosts.js
 * Run this once from the browser console (or a temporary admin UI button)
 * to seed Firestore with the static blog posts.
 *
 * Usage (browser console while signed in as admin):
 *   import { seedBlogPosts } from './lib/seedPosts';
 *   seedBlogPosts();
 *
 * Or call it from Admin.jsx with a one-time button.
 */
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { blogPosts } from '@/data/blogPosts';

export async function seedBlogPosts() {
  let seeded = 0;
  let skipped = 0;

  for (const post of blogPosts) {
    // Check if slug already exists
    const q = query(collection(db, 'posts'), where('slug', '==', post.slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      console.log(`⏭  Skipped (already exists): ${post.slug}`);
      skipped++;
      continue;
    }

    await addDoc(collection(db, 'posts'), {
      ...post,
      published: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Seeded: ${post.slug}`);
    seeded++;
  }

  console.log(`\nDone — seeded ${seeded}, skipped ${skipped}.`);
}
