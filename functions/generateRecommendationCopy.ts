import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Try to get user info but don't fail if not authenticated (for public site)
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (error) {
      // User not authenticated - this is OK for public access
      console.log('No authenticated user - proceeding as anonymous');
    }

    const payload = await req.json();
    const { mode } = payload;
    
    // Handle comparison_full mode (full context comparison)
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
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          response_json_schema: {
            type: "object",
            properties: {
              sentence: { type: "string" }
            },
            required: ["sentence"]
          }
        });

        if (result && result.sentence) {
          return Response.json({ sentence: result.sentence });
        }
      } catch (error) {
        console.error('LLM call failed for comparison full:', error);
        // Continue to fallback - don't throw 500
      }

      // Fallback to deterministic sentence
      return Response.json({
        sentence: `${winner.title} is a stronger overall match for what you're looking for than ${loser.title}.`
      });
    }
    
    // Handle recommendation mode (per-show explanation)
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
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `${systemPrompt}\n\n${userPrompt}`
        });

        if (result && typeof result === 'string') {
          return Response.json({
            explanation: result.trim(),
            bullets: []
          });
        }
      } catch (error) {
        console.error('LLM call failed for recommendation:', error);
        // Continue to fallback - don't throw 500
      }

      // Fallback to deterministic format
      const fallbackExplanation = show.top_matching_reasons && show.top_matching_reasons.length > 0
        ? `${show.title} was recommended because it ${show.top_matching_reasons[0].toLowerCase()}.`
        : `${show.title} is a great match for what you're looking for.`;
      
      return Response.json({
        explanation: fallbackExplanation,
        bullets: []
      });
    }
    
    // Handle comparison_intro mode (why winner is #1)
    if (mode === 'comparison_intro') {
      const { winner, compared_shows, user_preferences, language = 'en' } = payload;
      
      const systemPrompt = `You write short, user-facing theatre recommendation explanations.

Hard rules:
- Output MUST be valid JSON only. No markdown, no extra text.
- Use the user's language: ${language}. (If language is "he", write Hebrew and use RTL-friendly punctuation; otherwise write English.)
- Write exactly ONE sentence for the "winner_reason_sentence".
- Do NOT mention internal ids, field names, weights, scores, "algorithm", or "LLM".
- Do NOT use asterisks (*) or any markdown formatting.
- Do NOT mention date availability as the reason the winner is #1.
- You may mention availability only when explaining why a LOSER loses (but not needed for this task).
- Prefer specific user preferences in plain words (e.g., "story-driven", "classic musical", "big spectacle", "easy English", "family-friendly", "funny", "romantic", "darker themes").
- Avoid generic fluff. No exaggerations. No spoilers.

Uniqueness:
- If multiple preferences exist, pick 2–3 that best distinguish the winner vs the other compared shows.
- Do not repeat the same phrasing you used in previous sentences (if provided).

JSON schema:
{
  "winner_reason_sentence": "string"
}`;

      // Build compared shows block
      const comparedShowsBlock = compared_shows.map(show => {
        const attrs = [];
        if (show.attributes) {
          for (const [key, value] of Object.entries(show.attributes)) {
            attrs.push(`${key}: ${value}`);
          }
        }
        return `- Show: ${show.title}
  - tags: ${Array.isArray(show.tags) ? show.tags.join(', ') : 'N/A'}
  - attributes: ${attrs.join(', ') || 'N/A'}`;
      }).join('\n');

      // Build winner attributes
      const winnerAttrs = [];
      if (winner.attributes) {
        for (const [key, value] of Object.entries(winner.attributes)) {
          winnerAttrs.push(`${key}: ${value}`);
        }
      }

      // Build user preferences block
      const userPrefsText = Array.isArray(user_preferences) ? user_preferences.join(', ') : '';

      const userPrompt = `Task: Write one sentence explaining why the WINNER is #1 for this user in COMPARISON MODE.

Context:
- language: ${language}
- Winner show:
  - title: ${winner.title}
  - description: ${winner.description || 'N/A'}
  - tags: ${Array.isArray(winner.tags) ? winner.tags.join(', ') : 'N/A'}
  - attributes: ${winnerAttrs.join(', ') || 'N/A'}

- Compared shows (including losers):
${comparedShowsBlock}

User preferences (derived from answers + weights + Q11 if answered):
${userPrefsText}

Important:
- Do NOT mention dates/availability as the reason the winner is #1.
- Do NOT mention internal ids or numeric scores.
- Output JSON only per the schema.

Return:
{
  "winner_reason_sentence": "..."
}`;

      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          response_json_schema: {
            type: "object",
            properties: {
              winner_reason_sentence: { type: "string" }
            },
            required: ["winner_reason_sentence"]
          }
        });

        if (result && result.winner_reason_sentence) {
          // Validate the sentence doesn't mention forbidden content
          const sentence = result.winner_reason_sentence;
          const hasForbiddenContent = 
            sentence.includes('*') ||
            /\b(score|weight|algorithm|LLM|id)\b/i.test(sentence) ||
            (sentence.toLowerCase().includes('date') || sentence.toLowerCase().includes('availab') || sentence.toLowerCase().includes('running'));
          
          if (!hasForbiddenContent) {
            return Response.json({ sentence });
          }
        }
      } catch (error) {
        console.error('LLM call failed for comparison intro:', error);
        // Continue to fallback - don't throw 500
      }

      // Fallback: Deterministic sentence using differentiators
      // This will be handled by the calling code
      return Response.json({ sentence: null, needs_fallback: true });
    }
    
    // If we got here, mode is not recognized - return error
    return Response.json({ 
      error: `Unknown mode: ${mode}. Supported modes: comparison_full, recommendation, comparison_intro` 
    }, { status: 400 });

  } catch (error) {
    console.error('Error in generateRecommendationCopy:', error);
    
    // Return a graceful fallback instead of 500
    return Response.json({ 
      sentence: "Recommended based on your preferences.",
      explanation: "This show matches what you're looking for.",
      bullets: [],
      needs_fallback: true
    }, { status: 200 });
  }
});