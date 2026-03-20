// Vercel Serverless Function — Node.js runtime
// Replaces the Base44/Deno edge function that called base44.integrations.Core.InvokeLLM
// Now calls the Anthropic Claude API directly.

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Call Claude and return parsed JSON.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {boolean} expectJson - if true, wraps output in JSON parse
 */
async function callClaude(systemPrompt, userPrompt, expectJson = false) {
  const message = await client.messages.create({
    model: 'claude-3-5-haiku-latest',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = message.content[0]?.text?.trim() || '';

  if (!expectJson) return text;

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

export default async function handler(req, res) {
  // CORS headers so the front-end on any domain can reach this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    const { mode } = payload;

    // ─────────────────────────────────────────────
    // MODE: comparison_full
    // One sentence comparing winner vs a loser
    // ─────────────────────────────────────────────
    if (mode === 'comparison_full') {
      const { winner, loser, user_preferences, candidates, forbidden_angles } = payload;

      const systemPrompt = `You write ONE sentence comparing two musicals for a user.

Hard rules:
- Use ONLY the provided user preferences and candidate angles.
- Pick exactly ONE angle from the candidates list.
- You MUST NOT use any angle_id listed in forbidden_angles.
- Do NOT invent show facts.
- Do NOT reuse wording patterns from other sentences.
- Mention both show titles.
- Output ONE sentence only.`;

      const userPrefsText = Array.isArray(user_preferences) ? user_preferences.join(', ') : '';
      const candidatesText = candidates.map((c, i) => `${i + 1}. ${c.angle_text} (angle_id: ${c.angle_id})`).join('\n');
      const forbiddenText = Array.isArray(forbidden_angles) && forbidden_angles.length > 0
        ? forbidden_angles.join(', ')
        : 'none';

      const userPrompt = `Winner: ${winner.title}
Other show: ${loser.title}

User preferences:
${userPrefsText}

Candidates (ordered best to worst):
${candidatesText}

Forbidden angles (must not use):
${forbiddenText}

Write ONE sentence explaining why the winner fits the user better than the other show.
Choose the first candidate angle that is not forbidden.`;

      try {
        const sentence = await callClaude(systemPrompt, userPrompt, false);
        return res.status(200).json({ sentence: sentence.replace(/\n/g, ' ').trim() });
      } catch (error) {
        console.error('Claude call failed for comparison_full:', error);
        return res.status(200).json({
          sentence: `${winner.title} is a stronger overall match for what you're looking for than ${loser.title}.`
        });
      }
    }

    // ─────────────────────────────────────────────
    // MODE: recommendation
    // 1–2 sentence explanation per ranked show
    // ─────────────────────────────────────────────
    if (mode === 'recommendation') {
      const { rank, user_preferences, show, already_used_angles } = payload;

      const systemPrompt = `You are a theatre concierge explaining why a musical was recommended.

Rules:
- Use ONLY the provided user preferences and show reasons.
- Do NOT invent facts about the show.
- Do NOT mention scores, ranking logic, or internal systems.
- Avoid generic phrases like "suitable for your group" unless you explain WHY.
- Each recommendation should sound slightly different from others.
- Focus on the show's strongest match to the user's preferences.
- Keep it warm, concise, and natural.`;

      const userPrefsText = Array.isArray(user_preferences) ? user_preferences.join(', ') : '';
      const topReasonsText = Array.isArray(show.top_matching_reasons) ? show.top_matching_reasons.join(', ') : '';
      const usedAnglesText = Array.isArray(already_used_angles) && already_used_angles.length > 0
        ? already_used_angles.join(', ')
        : 'none';

      const userPrompt = `User preferences:
${userPrefsText}

Recommended show:
${show.title}

Top reasons this show matches the user:
${topReasonsText}

This show is ranked #${rank} in the recommendations.
Angles already used by higher-ranked recommendations:
${usedAnglesText}

Write 1–2 sentences explaining why this show was recommended.
Avoid repeating angles already used if possible.`;

      try {
        const explanation = await callClaude(systemPrompt, userPrompt, false);
        return res.status(200).json({ explanation: explanation.trim(), bullets: [] });
      } catch (error) {
        console.error('Claude call failed for recommendation:', error);
        const fallbackExplanation = show.top_matching_reasons?.length > 0
          ? `${show.title} was recommended because it ${show.top_matching_reasons[0].toLowerCase()}.`
          : `${show.title} is a great match for what you're looking for.`;
        return res.status(200).json({ explanation: fallbackExplanation, bullets: [] });
      }
    }

    // ─────────────────────────────────────────────
    // MODE: comparison_intro
    // Why the winner is #1 overall
    // ─────────────────────────────────────────────
    if (mode === 'comparison_intro') {
      const { winner, compared_shows, user_preferences, language = 'en' } = payload;

      const systemPrompt = `You write short, user-facing theatre recommendation explanations.

Hard rules:
- Output MUST be valid JSON only. No markdown, no extra text.
- Use the user's language: ${language}. (If language is "he", write Hebrew; otherwise English.)
- Write exactly ONE sentence for "winner_reason_sentence".
- Do NOT mention internal ids, field names, weights, scores, "algorithm", or "LLM".
- Do NOT use asterisks (*) or any markdown formatting.
- Do NOT mention date availability as the reason the winner is #1.
- Prefer specific user preferences in plain words.
- Avoid generic fluff.

JSON schema:
{
  "winner_reason_sentence": "string"
}`;

      const comparedShowsBlock = compared_shows.map(show => {
        const attrs = show.attributes
          ? Object.entries(show.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')
          : 'N/A';
        return `- Show: ${show.title}\n  - tags: ${Array.isArray(show.tags) ? show.tags.join(', ') : 'N/A'}\n  - attributes: ${attrs}`;
      }).join('\n');

      const winnerAttrs = winner.attributes
        ? Object.entries(winner.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')
        : 'N/A';

      const userPrefsText = Array.isArray(user_preferences) ? user_preferences.join(', ') : '';

      const userPrompt = `Task: Write one sentence explaining why the WINNER is #1 for this user.

Context:
- language: ${language}
- Winner show:
  - title: ${winner.title}
  - description: ${winner.description || 'N/A'}
  - tags: ${Array.isArray(winner.tags) ? winner.tags.join(', ') : 'N/A'}
  - attributes: ${winnerAttrs}

- Compared shows:
${comparedShowsBlock}

User preferences:
${userPrefsText}

Important:
- Do NOT mention dates/availability as the reason the winner is #1.
- Output JSON only.

Return:
{
  "winner_reason_sentence": "..."
}`;

      try {
        const result = await callClaude(systemPrompt, userPrompt, true);
        if (result?.winner_reason_sentence) {
          const sentence = result.winner_reason_sentence;
          const hasForbidden =
            sentence.includes('*') ||
            /\b(score|weight|algorithm|LLM|id)\b/i.test(sentence) ||
            /date|availab|running/i.test(sentence);

          if (!hasForbidden) {
            return res.status(200).json({ sentence });
          }
        }
        return res.status(200).json({ sentence: null, needs_fallback: true });
      } catch (error) {
        console.error('Claude call failed for comparison_intro:', error);
        return res.status(200).json({ sentence: null, needs_fallback: true });
      }
    }

    return res.status(400).json({
      error: `Unknown mode: ${mode}. Supported: comparison_full, recommendation, comparison_intro`
    });

  } catch (error) {
    console.error('Error in generateRecommendationCopy:', error);
    return res.status(200).json({
      sentence: 'Recommended based on your preferences.',
      explanation: 'This show matches what you\'re looking for.',
      bullets: [],
      needs_fallback: true
    });
  }
}
