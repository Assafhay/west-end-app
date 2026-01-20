import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/i18nHelper';

export default function ShowSelector({ musicals, onContinue, onBack }) {
  const { t } = useTranslation();
  const [selectedShows, setSelectedShows] = useState([]);
  const [error, setError] = useState('');

  const handleToggle = (showId) => {
    if (selectedShows.includes(showId)) {
      setSelectedShows(selectedShows.filter(id => id !== showId));
      setError('');
    } else {
      if (selectedShows.length >= 4) {
        setError(t('max_compare_error'));
        return;
      }
      setSelectedShows([...selectedShows, showId]);
      setError('');
    }
  };

  const canContinue = selectedShows.length >= 2 && selectedShows.length <= 4;

  return (
    <div className="bg-gradient-to-br from-[#FAFAF8] via-white to-[#F5F0EB] pb-32">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            {t('select_shows_to_compare')}
          </h1>
          <p className="text-slate-600 text-base">
            {t('choose_2_to_4')}
          </p>
        </motion.div>

        <div className="mb-6 text-center">
          <p className="text-sm text-slate-500">
            {selectedShows.length === 0 && t('select_at_least_2')}
            {selectedShows.length === 1 && t('select_at_least_1_more')}
            {selectedShows.length >= 2 && selectedShows.length < 4 &&
              t('selected_count_more', { count: selectedShows.length, remaining: 4 - selectedShows.length })}
            {selectedShows.length === 4 && t('max_selected')}
          </p>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 flex items-center justify-center gap-2 text-red-600"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          {musicals.map((musical, index) => {
            const isSelected = selectedShows.includes(musical.id);
            const isDisabled = !isSelected && selectedShows.length >= 4;

            return (
              <motion.button
                key={musical.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => !isDisabled && handleToggle(musical.id)}
                disabled={isDisabled}
                className={cn(
                  "relative rounded-xl overflow-hidden transition-all duration-200 group",
                  isSelected && "ring-4 ring-[#7C2D3E]",
                  isDisabled && "opacity-40 cursor-not-allowed",
                  !isSelected && !isDisabled && "hover:ring-2 hover:ring-[#D4A959]"
                )}
              >
                <div className="aspect-[3/4] bg-slate-100">
                  {musical.img ? (
                    <img
                      src={musical.img}
                      alt={musical.show_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2 bg-slate-200">
                      <span className="text-xs text-center text-slate-600 font-medium">
                        {getLocalizedValue(musical, 'show_title')}
                      </span>
                    </div>
                  )}
                </div>

                <div className={cn(
                  "absolute bottom-0 start-0 end-0 p-2 bg-gradient-to-t from-black/80 to-transparent",
                  isSelected && "bg-[#7C2D3E]/95"
                )}>
                  <p className="text-xs text-white font-medium text-center line-clamp-2">
                    {getLocalizedValue(musical, 'show_title')}
                  </p>
                </div>

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

        <div className="fixed bottom-0 start-0 end-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-slate-600 hover:text-slate-900"
            >
              {t('back')}
            </Button>
            <Button
              onClick={() => onContinue(selectedShows)}
              disabled={!canContinue}
              className="flex-1 max-w-xs bg-gradient-to-r from-[#7C2D3E] to-[#9B3A4F] hover:from-[#6B2635] hover:to-[#8A2F42] text-white rounded-xl py-6 font-semibold shadow-lg shadow-[#7C2D3E]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t('continue')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}