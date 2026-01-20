import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { getLocalizedValue } from '@/lib/i18nHelper';

export default function SingleQuestion({ question, selectedAnswer, onSelect }) {
  // Localize answers if available
  const answers = question.answers.map(a => ({
    ...a,
    text: getLocalizedValue(a, 'answer_text') || a.answer_text
  }));

  return (
    <div className="space-y-3">
      {answers.map((answer, index) => {
        const isSelected = selectedAnswer === answer.answer_id;

        return (
          <motion.button
            key={answer.answer_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            onClick={() => onSelect(answer.answer_id)}
            className={`w-full p-4 rounded-2xl border-2 text-start transition-all duration-200 flex items-center justify-between group ${isSelected
                ? 'border-[#7C2D3E] bg-[#7C2D3E]/5'
                : 'border-slate-200 bg-white hover:border-[#D4A959]/50 hover:bg-[#FAFAF8]'
              }`}
          >
            <span className={`text-base font-medium ${isSelected ? 'text-[#7C2D3E]' : 'text-slate-700'}`}>
              {answer.text}
            </span>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                ? 'border-[#7C2D3E] bg-[#7C2D3E]'
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