import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function QuizProgress({ current, total }) {
  const { t } = useTranslation();
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="w-full px-4 pt-6 pb-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-slate-500 tracking-wide uppercase">
          {t('quiz_progress', { current: current + 1, total })}
        </span>
        <span className="text-xs font-medium text-[#7C2D3E]">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#7C2D3E] to-[#D4A959]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}