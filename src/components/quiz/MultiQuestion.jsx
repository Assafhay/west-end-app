import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/i18nHelper';

export default function MultiQuestion({ question, selectedAnswers = [], onSelect, maxSelections }) {
  const { t } = useTranslation();

  const handleSelect = (answerId) => {
    if (selectedAnswers.includes(answerId)) {
      onSelect(selectedAnswers.filter(id => id !== answerId));
    } else if (selectedAnswers.length < maxSelections) {
      onSelect([...selectedAnswers, answerId]);
    }
  };

  const remainingSelections = maxSelections - selectedAnswers.length;

  // Localize answers
  const answers = question.answers.map(a => ({
    ...a,
    text: getLocalizedValue(a, 'answer_text') || a.answer_text
  }));

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 mb-4">
        {remainingSelections > 0
          ? t('select_multiple')
          : t('limit_reached') || 'Maximum selections reached'
        }
      </p>

      {answers.map((answer, index) => {
        const isSelected = selectedAnswers.includes(answer.answer_id);
        const isDisabled = !isSelected && selectedAnswers.length >= maxSelections;

        return (
          <motion.button
            key={answer.answer_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            onClick={() => !isDisabled && handleSelect(answer.answer_id)}
            disabled={isDisabled}
            className={`w-full p-4 rounded-2xl border-2 text-start transition-all duration-200 flex items-center justify-between group ${isSelected
                ? 'border-[#7C2D3E] bg-[#7C2D3E]/5'
                : isDisabled
                  ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                  : 'border-slate-200 bg-white hover:border-[#D4A959]/50 hover:bg-[#FAFAF8]'
              }`}
          >
            <span className={`text-base font-medium ${isSelected ? 'text-[#7C2D3E]' : isDisabled ? 'text-slate-400' : 'text-slate-700'
              }`}>
              {answer.text}
            </span>
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected
                ? 'border-[#7C2D3E] bg-[#7C2D3E]'
                : isDisabled
                  ? 'border-slate-200'
                  : 'border-slate-300 group-hover:border-[#D4A959]'
              }`}>
              {isSelected && <Check className="w-4 h-4 text-white" />}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}