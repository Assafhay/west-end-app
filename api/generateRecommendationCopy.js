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

function getRecommendationSystemPrompt(language) {
  switch (language) {
    case 'he':
      return `את יועצת תיאטרון מוזיקלי ישראלית, חברה של המשתמשת, כותבת המלצות בעברית ישראלית יומיומית ונשית.

כללים:
- כתבי 2–3 משפטים בעברית ישראלית קולוקוויאלית, בגוף נקבה.
- היי ספציפית וחיה — אזכרי משהו קונקרטי על ההצגה הזאת.
- חברי בין האיכויות של ההצגה להעדפות של המשתמשת.
- כל המלצה חייבת להישמע שונה מהאחרות — שני את הזווית וניסוח.
- אסור לאזכר ניקוד, משקלים, לוגיקת דירוג, או המילה "אלגוריתם".
- אל תתחילי עם "ההצגה הזו" או "המחזמר הזה" — השתמשי בשם ההצגה או פתיחה רעננה.
- אל תמציאי עובדות שלא קיימות בנתוני ההצגה.
- אסור: אימוג'ים, הרבה סימני קריאה, "וואו", "ממש", "מדהים" כמילים ריקות.
- טון: חמה, נלהבת אבל לא מוגזמת.`;

    case 'fr':
      return `Tu es une conseillère en comédies musicales du West End londonien, amie de l'utilisateur, rédigeant des recommandations en français naturel et chaleureux.

Règles :
- Écris 2–3 phrases maximum en français naturel et conversationnel.
- Sois précise et vivante — mentionne quelque chose de concret sur CE spectacle.
- Relie les qualités du spectacle aux préférences de l'utilisateur.
- Chaque recommandation doit sembler différente des autres — varie l'angle et la formulation.
- Ne mentionne PAS les scores, pondérations, logique de classement, ni le mot "algorithme".
- Ne commence PAS par "Ce spectacle" ou "Cette comédie musicale" — utilise le titre ou une ouverture fraîche.
- N'invente pas de faits absents des données du spectacle.
- Ton : chaleureux, enthousiaste mais sans excès.`;

    case 'es':
      return `Eres una asesora de musicales del West End londinense, amiga del usuario, escribiendo recomendaciones en español natural y cálido.

Reglas:
- Escribe 2–3 frases máximo en español natural y conversacional.
- Sé específica y vívida — menciona algo concreto sobre ESTE espectáculo.
- Conecta las cualidades del espectáculo con las preferencias del usuario.
- Cada recomendación debe sonar diferente a las demás — varía el ángulo y la formulación.
- NO menciones puntuaciones, pesos, lógica de clasificación, ni la palabra "algoritmo".
- NO empieces con "Este espectáculo" o "Este musical" — usa el título o una apertura fresca.
- No inventes datos ausentes en la información del espectáculo.
- Tono: cálido, entusiasta pero sin exceso.`;

    case 'ar':
      return `أنتِ مستشارة مسرح غنائي من الويست إند اللندني، صديقة للمستخدم، تكتبين توصيات بالعربية الطبيعية والدافئة.

القواعد:
- اكتبي 2–3 جمل كحد أقصى بعربية طبيعية وودية.
- كوني محددة وحيوية — اذكري شيئاً ملموساً عن هذا العرض تحديداً.
- اربطي صفات العرض بتفضيلات المستخدم.
- يجب أن تبدو كل توصية مختلفة عن الأخرى — غيّري الزاوية والصياغة.
- لا تذكري النقاط أو الأوزان أو منطق التصنيف أو كلمة "خوارزمية".
- لا تبدئي بـ"هذا العرض" أو "هذه المسرحية" — استخدمي العنوان أو افتتاحية جديدة.
- لا تخترعي حقائق غير موجودة في بيانات العرض.
- النبرة: دافئة، متحمسة لكن غير مبالغ فيها.`;

    default:
      return `You are a warm, knowledgeable West End theatre concierge writing personalised show recommendations.

Rules:
- Write 2–3 sentences maximum. Be specific and vivid — mention something concrete about THIS show.
- Connect the show's actual qualities (description, tags, attributes) to the user's preferences.
- Each recommendation must sound different from the others — vary the angle and phrasing.
- Do NOT mention scores, weights, ranking logic, or the word "algorithm".
- Do NOT start with "This show" or "This musical" — use the show's title or a fresh opener.
- Do NOT invent facts not present in the show data.
- Tone: warm, enthusiastic but not over-the-top.`;
  }
}

function getComparisonSystemPrompt(language) {
  switch (language) {
    case 'he':
      return `את כותבת משפט אחד בעברית ישראלית יומיומית, בגוף נקבה, המשווה בין שני מחזות זמר.
- בחרי זווית אחת בדיוק מרשימת המועמדים.
- אל תשתמשי בזווית שמופיעה ב-forbidden_angles.
- אזכרי את שמות שתי ההצגות. פלטי משפט אחד בלבד.`;
    case 'fr':
      return `Tu écris UNE phrase en français comparant deux comédies musicales pour un utilisateur.
- Choisis exactement UN angle dans la liste des candidats.
- N'utilise PAS d'angle_id listé dans forbidden_angles.
- Mentionne les deux titres. Produis UNE seule phrase.`;
    case 'es':
      return `Escribes UNA frase en español comparando dos musicales para un usuario.
- Elige exactamente UN ángulo de la lista de candidatos.
- NO uses ningún angle_id listado en forbidden_angles.
- Menciona ambos títulos. Produce UNA sola frase.`;
    case 'ar':
      return `تكتبين جملة واحدة بالعربية تقارن بين مسرحيتين غنائيتين لمستخدم.
- اختاري زاوية واحدة فقط من قائمة المرشحين.
- لا تستخدمي أي angle_id مدرج في forbidden_angles.
- اذكري كلا العنوانين. أخرجي جملة واحدة فقط.`;
    default:
      return `You write ONE sentence comparing two musicals for a user.
- Pick exactly ONE angle from the candidates list.
- Do NOT use any angle_id listed in forbidden_angles.
- Mention both show titles. Output ONE sentence only.`;
  }
}

function getWriteInstruction(language, title) {
  switch (language) {
    case 'he': return `כתבי 2–3 משפטים ספציפיים ותוססים בעברית ישראלית יומיומית המסבירים למה ${title} הומלצה לאדם הזה.`;
    case 'fr': return `Écrivez 2–3 phrases spécifiques et vivantes en français expliquant pourquoi ${title} a été recommandé pour cette personne.`;
    case 'es': return `Escribe 2–3 frases específicas y vívidas en español explicando por qué se recomendó ${title} para esta persona.`;
    case 'ar': return `اكتب 2–3 جمل محددة وحيوية باللغة العربية توضح لماذا تم اقتراح ${title} لهذا الشخص.`;
    default: return `Write 2–3 specific, vivid sentences explaining why ${title} was recommended for this person.`;
  }
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
      const { rank, user_preferences, show, already_used_angles, language = 'en' } = payload;

      const systemPrompt = getRecommendationSystemPrompt(language);

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

${getWriteInstruction(language, show.title)}`;

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
      const { winner, loser, user_preferences, candidates, forbidden_angles, language = 'en' } = payload;

      const systemPrompt = getComparisonSystemPrompt(language);

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
