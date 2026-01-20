import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { useTranslation } from 'react-i18next';

export default function AboutRecommendation({ defaultExpanded = false, collapsible = true, title, partialExpand = false }) {
  const { t } = useTranslation();
  const displayTitle = title || t('about_recommendation_title');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showPreview, setShowPreview] = useState(partialExpand);

  return (
    <div className="w-full">
      {collapsible ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `${displayTitle} — ${t('collapse')}` : `${displayTitle} — ${t('expand')}`}
          className="w-full flex items-center justify-between py-3 px-4 text-start hover:bg-slate-50 rounded-lg transition-colors duration-200 min-h-[44px]"
        >
          <span className="text-slate-900 font-semibold text-[15px] md:text-[17px]">
            {displayTitle}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <ChevronDown className="w-5 h-5 text-slate-500" />
          </motion.div>
        </button>
      ) : (
        <div className="py-2 px-4">
          <h3 className="text-slate-900 font-semibold text-[15px] md:text-[17px]">
            {displayTitle}
          </h3>
        </div>
      )}

      <AnimatePresence>
        {(isExpanded || !collapsible || showPreview) && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : { height: "auto", opacity: 1 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={collapsible ? { height: 0, opacity: 0 } : {}}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="bg-[#F8F8F8] border border-[#E6E6E6] rounded-lg p-4 md:p-5 mt-2 space-y-4">
              <p className="text-[#444] text-[14px] md:text-[15px] leading-relaxed">
                {t('about_recommendation_p1')}
              </p>

              {(isExpanded || !collapsible) && (
                <>
                  <p className="text-[#444] text-[14px] md:text-[15px] leading-relaxed">
                    {t('about_recommendation_p2')}
                  </p>

                  <p className="text-[#444] text-[14px] md:text-[15px] leading-relaxed">
                    {t('about_recommendation_p3')}
                  </p>

                  <p className="text-[#444] text-[14px] md:text-[15px] leading-relaxed">
                    {t('about_recommendation_p4')}
                  </p>
                </>
              )}

              {showPreview && !isExpanded && (
                <button
                  onClick={() => {
                    setIsExpanded(true);
                    setShowPreview(false);
                  }}
                  className="text-[#7C2D3E] text-[14px] font-medium hover:underline"
                >
                  {t('read_more')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}