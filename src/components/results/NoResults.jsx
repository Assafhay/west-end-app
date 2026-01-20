import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CalendarX, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function NoResults({ onRetry }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-[#7C2D3E]/10 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-[#7C2D3E]" />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-3">
        {t('no_results')}
      </h2>

      <p className="text-slate-600 mb-8 max-w-sm">
        {t('try_adjusting')}
      </p>

      <Button
        onClick={onRetry}
        className="bg-gradient-to-r from-[#7C2D3E] to-[#9B3A4F] hover:from-[#6B2635] hover:to-[#8A2F42] text-white rounded-xl px-8 py-6 font-semibold shadow-lg"
      >
        <RefreshCw className="w-5 h-5 me-2" />
        {t('start_over')}
      </Button>
    </motion.div>
  );
}