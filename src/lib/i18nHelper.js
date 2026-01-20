import i18n from '@/i18n';

/**
 * Returns the localized value of a field from an object.
 * If the current language is 'he' and a '_he' suffixed field exists, returns that.
 * Otherwise returns the standard field value.
 * 
 * @param {Object} obj - The data object (e.g., musical, question)
 * @param {string} field - The base field name (e.g., 'title', 'description')
 * @returns {any} The localized value
 */
export const getLocalizedValue = (obj, field) => {
    if (!obj) return '';

    const currentLang = i18n.language;
    const localizedField = `${field}_${currentLang}`;

    // 1. Try explicit localized field in data (source of truth if exists)
    if (currentLang !== 'en' && obj[localizedField]) {
        return obj[localizedField];
    }

    // 2. Try i18n key lookup for Questions
    if (obj.question_id) {
        // question_text lookup
        if (field === 'question_text') {
            const key = `questions.${obj.question_id}.question_text`;
            if (i18n.exists(key)) return i18n.t(key);
        }
        // answer_text lookup (if obj is an answer object inside a question context - tricky, usually we just have the answer obj)
        // BUT, our i18nHelper call site for answers is usually `getLocalizedValue(answer, 'answer_text')`
        // Answer objects don't always have parent question_id attached.
    }

    // 3. Try i18n key lookup for Answers (if obj has answer_id)
    if (obj.answer_id && field === 'answer_text') {
        // We try to find the answer in any question? No, keys are nested under questions.
        // We need the question_id to be robust. 
        // However, some answers are unique enough (e.g. family_kids).
        // Let's iterate questions to find it? No, too slow.
        // For now, let's rely on data OR assume caller provides context? No.
        // Let's try a best-effort flattened lookup or structured lookup if likely.

        // Actually, looking at the code, SingleQuestion passes `question.answers.map`.
        // We could attach question_id to the answer object in the map?
        // But here we only see `obj`.

        // Let's try to infer or just map known unique IDs.
        // OR: iterate `questions` in i18n resources?

        // Optimization: In our i18n structure, we nested answers under questions.
        // `questions.q1_group.answers.family_kids`

        // Let's try to match known patterns or just look in all questions?
        // There are only a few questions. This is fast enough.
        const allQuestions = i18n.getResourceBundle(currentLang, 'translation').questions;
        if (allQuestions) {
            for (const qKey in allQuestions) {
                if (allQuestions[qKey].answers && allQuestions[qKey].answers[obj.answer_id]) {
                    return allQuestions[qKey].answers[obj.answer_id];
                }
            }
        }
    }

    // 4. Try i18n key lookup for Reasons
    if (field === 'reason_snippet' && typeof obj[field] === 'string') {
        const val = obj[field];
        // Replace dots with something else or just try? i18n keys with dots are tricky.
        // But our values don't have dots.
        const key = `reasons.${val}`;
        if (i18n.exists(key)) return i18n.t(key);
    }

    return obj[field];
};

/**
 * Helper hook-like function to be used inside components if needed, or just import straight.
 * For now, direct import is fine.
 */
