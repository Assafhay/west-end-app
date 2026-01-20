import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function ScoreBreakdown({ breakdown }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();

  if (!breakdown) return null;

  const positiveRules = breakdown.score_breakdown.filter(r => r.points > 0);
  const negativeRules = breakdown.score_breakdown.filter(r => r.points < 0);
  const neutralRules = breakdown.score_breakdown.filter(r => r.points === 0);

  return (
    <div className="mt-4">
      <Button
        variant="ghost"
        onClick={() => setExpanded(!expanded)}
        className="w-full justify-between text-xs font-medium text-slate-600 hover:text-slate-900 px-0"
      >
        <span className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          {t('score_breakdown')} ({t('total')}: {breakdown.total_score.toFixed(1)})
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-4 text-xs">
              {/* Filters Passed */}
              {breakdown.filters_passed.length > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-semibold text-green-800 mb-2">✓ {t('filters_passed')}</p>
                  <ul className="space-y-1 text-green-700">
                    {breakdown.filters_passed.map((filter, i) => (
                      <li key={i}>• {filter}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Positive Contributions */}
              {positiveRules.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-semibold text-blue-800 mb-2">+ {t('positive_contributions')}</p>
                  <div className="space-y-2">
                    {positiveRules.map((rule, i) => (
                      <div key={i} className="text-blue-700">
                        <div className="flex justify-between items-start">
                          <span className="flex-1">{rule.reason}</span>
                          <span className="font-mono font-semibold ms-2">+{rule.points.toFixed(1)}</span>
                        </div>
                        <div className="text-blue-600 text-[10px] mt-0.5 opacity-75">
                          {rule.field}: {rule.musical_value} × {rule.weight}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Negative Contributions */}
              {negativeRules.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="font-semibold text-red-800 mb-2">− {t('negative_contributions')}</p>
                  <div className="space-y-2">
                    {negativeRules.map((rule, i) => (
                      <div key={i} className="text-red-700">
                        <div className="flex justify-between items-start">
                          <span className="flex-1">{rule.reason}</span>
                          <span className="font-mono font-semibold ms-2">{rule.points.toFixed(1)}</span>
                        </div>
                        <div className="text-red-600 text-[10px] mt-0.5 opacity-75">
                          {rule.field}: {rule.musical_value} × {rule.weight}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Neutral/Zero Rules */}
              {neutralRules.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-semibold text-slate-600 mb-2">○ {t('zero_impact')}</p>
                  <div className="space-y-1 text-slate-500">
                    {neutralRules.map((rule, i) => (
                      <div key={i}>• {rule.reason} ({rule.field}: {rule.musical_value})</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}