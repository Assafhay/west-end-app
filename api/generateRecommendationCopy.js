// Vercel Serverless Function — ES Module (matches "type": "module" in package.json)

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function callClaude(systemPrompt, userPrompt, expectJson = false) {
  const message = await client.messages.create({
    model: 'claude-3-5-haiku-latest',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = message.content[0]?.text?.trim() || '';
  if (!expectJson) return text;

  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { mode } = payload;

    // ── recommendation ──────────────────────────────────────────────────────
    if (mode === 'recommendation') {
      const { rank, user_preferences, show, already_used_angles } = payload;

      const systemPrompt = `You are a warm, knowledgeable West End theatre concierge writing personalised show recommendations.

Rules:
- Write 2 sentences maximum. Be specific and vivid — mention something concrete about THIS show.
- Connect the show's actual qualities (description, tags, attributes) to the user's preferences.
- Each recommendation must sound different from the others — vary the angle and phrasing.
- Do NOT mention scores, weights, ranking logic, or the word "algorithm".
- Do NOT start with "This show" or "This musical" — use the show's title or a fresh opener.
- Do NOT invent facts not present in the show data.
- Tone: warm, enthusiastic but not over-the-top.`;

      const userPrefsText = Array.isArray(user_preferences) ? user_preferences.join(', ') : '';
      const topReasonsText = Array.isArray(show.top_matching_reasons) ? show.top_matching_reasons.join(', ') : '';
      const usedAnglesText = Array.isArray(already_used_angles) && already_used_angles.length > 0 ? already_used_angles.join(', ') : 'none';
      const tagsText = Array.isArray(show.tags) ? show.tags.join(', ') : '';

      const userPrompt = `User preferences: ${userPrefsText}

Show: ${show.title}
Description: ${show.description || 'N/A'}
Tags: ${tagsText || 'N/A'}
Key attributes: ${JSON.stringify(show.attributes || {})}
Why it matches (top reasons): ${topReasonsText || 'strong overall match'}
Rank: #${rank} of 3 recommendations
Angles already used in higher-ranked recommendations (avoid repeating): ${usedAnglesText}

Write 1–2 specific, vivid sentences explaining why ${show.title} was recommended for this person.`;

      try {
        const explanation = await callClaude(systemPrompt, userPrompt, false);
        return res.status(200).json({ explanation: explanation.trim(), bullets: [] });
      } catch (error) {
        console.error('Claude call failed for recommendation:', error);
        const fallback = show.top_matching_reasons?.length > 0
          ? `${show.title} was recommended because it ${show.top_matching_reasons[0].toLowerCase()}.`
          : `${show.title} is a great match for what you're looking for.`;
        return res.status(200).json({ explanation: fallback, bullets: [] });
      }
    }

    // ── comparison_full ──────────────────────────────────────────────────────
    if (mode === 'comparison_full') {
      const { winner, loser, user_preferences, candidates, forbidden_angles } = payload;

      const systemPrompt = `You write ONE sentence comparing two musicals for a user.
- Pick exactly ONE angle from the candidates list.
- Do NOT use any angle_id listed in forbidden_angles.
- Mention both show titles. Output ONE sentence only.`;

      const userPrefsText = Array.isArray(user_preferences) ? user_preferences.join(', ') : '';
      const candidatesText = (candidates || []).map((c, i) => `${i + 1}. ${c.angle_text} (angle_id: ${c.angle_id})`).join('\n');
      const forbiddenText = Array.isArray(forbidden_angles) && forbidden_angles.length > 0 ? forbidden_angles.join(', ') : 'none';

      const userPrompt = `Winner: ${winner.title}
Other show: ${loser.title}
User preferences: ${userPrefsText}
Candidates:\n${candidatesText}
Forbidden angles: ${forbiddenText}
Write ONE sentence explaining why the winner fits the user better.`;

      try {
        const sentence = await callClaude(systemPrompt, userPrompt, false);
        return res.status(200).json({ sentence: sentence.replace(/\n/g, ' ').trim() });
      } catch (error) {
        return res.status(200).json({ sentence: `${winner.title} is a stronger overall match than ${loser.title}.` });
      }
    }

    // ── comparison_intro ─────────────────────────────────────────────────────
    if (mode === 'comparison_intro') {
      const { winner, compared_shows, user_preferences, language = 'en' } = payload;

      const systemPrompt = `You write short theatre recommendation explanations.
Output MUST be valid JSON only. No markdown. Language: ${language}.
JSON schema: { "winner_reason_sentence": "string" }`;

      const winnerAttrs = winner.attributes ? Object.entries(winner.attributes).map(([k, v]) => `${k}: ${v}`).join(', ') : 'N/A';
      const comparedShowsBlock = (compared_shows || []).map(s =>
        `- ${s.title} | tags: ${Array.isArray(s.tags) ? s.tags.join(', ') : 'N/A'}`
      ).join('\n');

      const userPrompt = `Winner: ${winner.title}
Description: ${winner.description || 'N/A'}
Tags: ${Array.isArray(winner.tags) ? winner.tags.join(', ') : 'N/A'}
Attributes: ${winnerAttrs}
Compared shows:\n${comparedShowsBlock}
User preferences: ${Array.isArray(user_preferences) ? user_preferences.join(', ') : ''}
Return JSON: { "winner_reason_sentence": "..." }`;

      try {
        const result = await callClaude(systemPrompt, userPrompt, true);
        if (result?.winner_reason_sentence) {
          return res.status(200).json({ sentence: result.winner_reason_sentence });
        }
        return res.status(200).json({ sentence: null, needs_fallback: true });
      } catch (error) {
        return res.status(200).json({ sentence: null, needs_fallback: true });
      }
    }

    return res.status(400).json({ error: `Unknown mode: ${mode}` });

  } catch (error) {
    console.error('Unhandled error in generateRecommendationCopy:', error);
    return res.status(200).json({
      explanation: "This show matches what you're looking for.",
      sentence: 'Recommended based on your preferences.',
      bullets: [],
      needs_fallback: true
    });
  }
}
