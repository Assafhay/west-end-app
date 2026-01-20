import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/i18nHelper';

export default function DateRangeQuestion({ question, selectedAnswer, onSelect }) {
  const [dateMode, setDateMode] = useState(selectedAnswer?.mode || null);
  const [startDate, setStartDate] = useState(selectedAnswer?.user_start_date || '');
  const [endDate, setEndDate] = useState(selectedAnswer?.user_end_date || '');
  const [dateError, setDateError] = useState('');
  const { t } = useTranslation();

  const handleModeSelect = (mode) => {
    setDateMode(mode);
    if (mode === 'all_dates') {
      onSelect({ mode: 'all_dates' });
      setDateError('');
    } else {
      if (startDate && endDate) {
        validateAndUpdate(startDate, endDate);
      }
    }
  };

  const validateAndUpdate = (start, end) => {
    if (start && end) {
      if (new Date(start) > new Date(end)) {
        setDateError(t('date_error_order'));
        return;
      }
      setDateError('');
      onSelect({
        mode: 'specific_dates',
        user_start_date: start,
        user_end_date: end
      });
    }
  };

  const handleStartDateChange = (value) => {
    setStartDate(value);
    if (value && endDate) {
      validateAndUpdate(value, endDate);
    }
  };

  const handleEndDateChange = (value) => {
    setEndDate(value);
    if (startDate && value) {
      validateAndUpdate(startDate, value);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {question.answers.map((answer, index) => {
        const isSelected = dateMode === answer.answer_id;

        return (
          <motion.div
            key={answer.answer_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <button
              onClick={() => handleModeSelect(answer.answer_id)}
              className={`w-full p-4 rounded-2xl border-2 text-start transition-all duration-200 flex items-center justify-between group ${isSelected
                  ? 'border-[#7C2D3E] bg-[#7C2D3E]/5'
                  : 'border-slate-200 bg-white hover:border-[#D4A959]/50 hover:bg-[#FAFAF8]'
                }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className={`w-5 h-5 ${isSelected ? 'text-[#7C2D3E]' : 'text-slate-400'}`} />
                <span className={`text-base font-medium ${isSelected ? 'text-[#7C2D3E]' : 'text-slate-700'}`}>
                  {getLocalizedValue(answer, 'answer_text')}
                </span>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                  ? 'border-[#7C2D3E] bg-[#7C2D3E]'
                  : 'border-slate-300 group-hover:border-[#D4A959]'
                }`}>
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </div>
            </button>
          </motion.div>
        );
      })}

      <AnimatePresence>
        {dateMode === 'specific_dates' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-5 bg-slate-50 rounded-2xl space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm font-medium text-slate-600">
                  {t('arrival_date')}
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  min={today}
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full rounded-xl border-slate-200 focus:border-[#7C2D3E] focus:ring-[#7C2D3E]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm font-medium text-slate-600">
                  {t('departure_date')}
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  min={startDate || today}
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full rounded-xl border-slate-200 focus:border-[#7C2D3E] focus:ring-[#7C2D3E]/20"
                />
              </div>
              {dateError && (
                <p className="text-sm text-red-500 mt-2">{dateError}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}