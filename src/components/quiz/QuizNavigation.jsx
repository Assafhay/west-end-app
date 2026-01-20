import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function QuizNavigation({
  currentIndex,
  totalQuestions,
  canProceed,
  onBack,
  onNext,
  onSubmit
}) {
  const { t } = useTranslation();
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-slate-100 p-4 safe-area-inset-bottom"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          <span className="hidden sm:inline">{t('back')}</span>
        </Button>

        {isLastQuestion ? (
          <Button
            onClick={onSubmit}
            disabled={!canProceed}
            className="flex-1 max-w-xs bg-gradient-to-r from-[#7C2D3E] to-[#9B3A4F] hover:from-[#6B2635] hover:to-[#8A2F42] text-white rounded-xl py-6 font-semibold shadow-lg shadow-[#7C2D3E]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Sparkles className="w-5 h-5 me-2" />
            {t('find_my_show')}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canProceed}
            className="flex-1 max-w-xs bg-gradient-to-r from-[#7C2D3E] to-[#9B3A4F] hover:from-[#6B2635] hover:to-[#8A2F42] text-white rounded-xl py-6 font-semibold shadow-lg shadow-[#7C2D3E]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {t('continue')}
            <ChevronRight className="w-5 h-5 ms-2 rtl:rotate-180" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}