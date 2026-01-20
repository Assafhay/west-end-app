import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Theater, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AboutRecommendation from '@/components/results/AboutRecommendation';
import { useTranslation } from 'react-i18next';

export default function WelcomeScreen({ onStart }) {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-br from-[#FAFAF8] via-white to-[#F5F0EB] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-[calc(100vh-200px)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6"
          >
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6957de33ee2bf0b408535143/b2cf63bff_image.png"
              alt="Spotlight Logo"
              className="w-full h-full object-contain"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 tracking-tight"
          >
            {t('welcome_title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-600 text-base md:text-lg mb-6 leading-relaxed"
          >
            {t('welcome_subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-4xl"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => onStart('recommendation')}
                  className="group border-2 border-slate-200 hover:border-transparent text-slate-900 hover:bg-gradient-to-r hover:from-[#7C2D3E] hover:to-[#9B3A4F] hover:text-white rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:shadow-[#7C2D3E]/20 transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center text-center min-h-[140px] md:min-h-[160px] w-full"
                >
                  <span className="text-base md:text-xl font-bold mb-2 md:mb-3">{t('start_fresh')}</span>
                  <span className="text-xs md:text-sm text-slate-600 group-hover:text-white/90 leading-relaxed">
                    {t('start_fresh_desc')}
                  </span>
                </button>

                <button
                  onClick={() => onStart('comparison')}
                  className="group border-2 border-slate-200 hover:border-transparent text-slate-900 hover:bg-gradient-to-r hover:from-[#7C2D3E] hover:to-[#9B3A4F] hover:text-white rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:shadow-[#7C2D3E]/20 transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center text-center min-h-[140px] md:min-h-[160px] w-full"
                >
                  <span className="text-base md:text-xl font-bold mb-2 md:mb-3">{t('cant_decide')}</span>
                  <span className="text-xs md:text-sm text-slate-600 group-hover:text-white/90 leading-relaxed">
                    {t('cant_decide_desc')}
                  </span>
                </button>
              </div>

              <button
                onClick={() => onStart('browse')}
                className="group w-full border-2 border-slate-200 hover:border-transparent text-slate-900 hover:bg-gradient-to-r hover:from-[#7C2D3E] hover:to-[#9B3A4F] hover:text-white rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:shadow-[#7C2D3E]/20 transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center text-center min-h-[100px]"
              >
                <span className="text-base md:text-xl font-bold mb-2">{t('browse_all')}</span>
                <span className="text-xs md:text-sm text-slate-600 group-hover:text-white/90 leading-relaxed">
                  {t('browse_all_desc')}
                </span>
              </button>

              <button
                onClick={() => onStart('recommendation_v2')}
                className="group w-full border-2 border-slate-200 hover:border-transparent text-slate-900 hover:bg-gradient-to-r hover:from-[#7C2D3E] hover:to-[#9B3A4F] hover:text-white rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:shadow-[#7C2D3E]/20 transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center text-center min-h-[100px]"
              >
                <span className="text-base md:text-xl font-bold mb-2">{t('questions_v2')}</span>
                <span className="text-xs md:text-sm text-slate-600 group-hover:text-white/90 leading-relaxed">
                  {t('questions_v2_desc')}
                </span>
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <AboutRecommendation partialExpand={true} collapsible={true} title={t('about_app')} />
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}