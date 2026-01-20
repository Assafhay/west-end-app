import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLocalizedValue } from '@/lib/i18nHelper';

export default function ImageGridQuestion({ question, selectedAnswers = [], onSelect, maxSelections, musicals = [], excludeShowIds = [] }) {
  // Create lookup map: answer_id -> musical data
  const musicalsById = React.useMemo(() => {
    return Object.fromEntries(musicals.map(m => [m.id, m]));
  }, [musicals]);

  // Filter out excluded shows
  const availableAnswers = React.useMemo(() => {
    return question.answers.filter(answer => !excludeShowIds.includes(answer.answer_id));
  }, [question.answers, excludeShowIds]);

  const handleSelect = (answerId) => {
    if (selectedAnswers.includes(answerId)) {
      onSelect(selectedAnswers.filter(id => id !== answerId));
    } else if (selectedAnswers.length < maxSelections) {
      onSelect([...selectedAnswers, answerId]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {availableAnswers.map((answer, index) => {
          const isSelected = selectedAnswers.includes(answer.answer_id);
          const isDisabled = !isSelected && selectedAnswers.length >= maxSelections;

          // Lookup musical data from musicals.json
          const musical = musicalsById[answer.answer_id];
          const img = musical?.img ?? null;
          const title = getLocalizedValue(musical, 'show_title') ?? getLocalizedValue(answer, 'answer_text');

          // Log warning if image is missing
          if (!img && musical) {
            console.warn(`Missing img for musical id: ${answer.answer_id}`);
          }

          return (
            <motion.button
              key={answer.answer_id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => !isDisabled && handleSelect(answer.answer_id)}
              disabled={isDisabled}
              className={cn(
                "relative rounded-xl overflow-hidden transition-all duration-200 group",
                isSelected && "ring-4 ring-[#7C2D3E]",
                isDisabled && "opacity-40 cursor-not-allowed",
                !isSelected && !isDisabled && "hover:ring-2 hover:ring-[#D4A959]"
              )}
            >
              {/* Image */}
              <div className="aspect-[3/4] bg-slate-100">
                {img ? (
                  <img
                    src={img}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                {/* Fallback text tile */}
                <div className={cn("w-full h-full items-center justify-center p-2 bg-slate-200", img ? "hidden" : "flex")}>
                  <span className="text-xs text-center text-slate-600 font-medium">
                    {title}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className={cn(
                "absolute bottom-0 start-0 end-0 p-2 bg-gradient-to-t from-black/80 to-transparent",
                isSelected && "bg-[#7C2D3E]/95"
              )}>
                <p className="text-xs text-white font-medium text-center line-clamp-2">
                  {title}
                </p>
              </div>

              {/* Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 end-2 w-6 h-6 bg-[#7C2D3E] rounded-full flex items-center justify-center shadow-lg"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}