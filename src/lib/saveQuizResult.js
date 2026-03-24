import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Saves a completed quiz session to Firestore under:
 *   users/{userId}/quizzes/{autoId}
 *
 * Called after results are computed, only if the user is logged in.
 */
export async function saveQuizResult({ user, answers, results, mode }) {
  if (!user?.id) return; // not logged in — skip silently

  try {
    const quizzesRef = collection(db, 'users', user.id, 'quizzes');

    await addDoc(quizzesRef, {
      // User snapshot
      userEmail: user.email || null,
      userName:  user.full_name || null,

      // Quiz data
      mode,
      answers,

      // Top 3 results — store only what's useful for analysis
      results: results.slice(0, 3).map((r, i) => ({
        rank:        i + 1,
        showTitle:   r.show_title || r.show_title_he || null,
        score:       r.score ?? null,
        explanation: r.llm_explanation?.sentence || null,
      })),

      completedAt: serverTimestamp(),
    });

    console.log('[Firestore] Quiz result saved for', user.email);
  } catch (error) {
    // Non-fatal — never block the user experience
    console.error('[Firestore] Failed to save quiz result:', error);
  }
}
