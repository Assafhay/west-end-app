import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, ExternalLink, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/i18nHelper';

// Bolds the show title in a sentence without dangerouslySetInnerHTML.
// Splits on the title string and wraps matches in <strong>.
function renderSentenceWithBoldTitle(sentence, title) {
  if (!title) return sentence;
  const parts = sentence.split(new RegExp(`(${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g'));
  return parts.map((part, i) =>
    part === title ? <strong key={i}>{part}</strong> : part
  );
}

export default function RecommendationCard({ musical, reasons, isMain = false, index = 0, breakdown = null }) {
  const { t, i18n } = useTranslation();

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const showTitle = getLocalizedValue(musical, 'show_title');
  const showDescription = getLocalizedValue(musical, 'description');
  const rawTags = getLocalizedValue(musical, 'tags') || musical.tags;
  const showTags = Array.isArray(rawTags)
    ? rawTags
    : (typeof rawTags === 'string' ? rawTags.split(',').map(tag => tag.trim()).filter(Boolean) : []);

  // --- Type-guarded LLM content ---
  const rawSentence = musical.llm_explanation?.sentence;
  const safeSentence = typeof rawSentence === 'string' ? rawSentence.replace(/\*/g, '') : null;
  const rawBullets = musical.llm_explanation?.bullets;
  const safeBullets = Array.isArray(rawBullets)
    ? rawBullets.filter(b => typeof b === 'string')
    : [];

  const renderWhySection = () => {
    if (safeSentence) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-slate-700 leading-relaxed">
            {renderSentenceWithBoldTitle(safeSentence, showTitle)}
          </p>
          {safeBullets.length > 0 && (
            <ul className="space-y-1.5 mt-2">
              {safeBullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-[#D4A959] flex-shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    if (reasons && reasons.length > 0) {
      const positiveReasons = reasons.filter(r => r.points > 0);
      return (
        <ul className="space-y-1.5">
          {positiveReasons.slice(0, 3).map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="w-4 h-4 text-[#D4A959] flex-shrink-0 mt-0.5" />
              <span>{reason.text}</span>
            </li>
          ))}
          {positiveReasons.length === 0 && (
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="w-4 h-4 text-[#D4A959] flex-shrink-0 mt-0.5" />
              <span>{t('matches_preferences')}</span>
            </li>
          )}
        </ul>
      );
    }

    return <p className="text-sm text-slate-700">{t('great_match')}</p>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className={`bg-white rounded-3xl overflow-hidden shadow-xl ${isMain ? 'ring-2 ring-[#D4A959]' : ''
        }`}
    >
      {isMain && (
        <div className="bg-gradient-to-r from-[#7C2D3E] to-[#9B3A4F] text-white px-4 py-2 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold tracking-wide">{t('top_recommendation')}</span>
        </div>
      )}

      <div className="relative">
        <img
          src={musical.img}
          alt={showTitle}
          className="w-full h-56 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 start-4 end-4">
          <h3 className="text-2xl font-bold text-white drop-shadow-lg">
            {showTitle}
          </h3>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#7C2D3E]" />
            <span>{musical.venue_id}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#7C2D3E]" />
            <span>{formatDuration(musical.duration_minutes)}</span>
            {musical.interval && (
              <span className="text-slate-400">• {t('with_interval')}</span>
            )}
          </div>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
          {showDescription}
        </p>

        {showTags && Array.isArray(showTags) && showTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {showTags.slice(0, 5).map((tag, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs"
              >
                {i18n.language === 'he' ? t(`tag_map.${tag}`, tag) : tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="bg-[#FAFAF8] rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-[#7C2D3E] uppercase tracking-wider mb-2">
              {t('why_we_recommend')}
            </p>
            {renderWhySection()}
          </div>
        </div>

        {(() => {
          const hasAffUrl = musical.ticket_url_aff && musical.ticket_url_aff !== "none";
          const ticketUrl = hasAffUrl
            ? musical.ticket_url_aff
            : (musical.ticket_url && musical.ticket_url !== "none")
              ? musical.ticket_url
              : null;

          return ticketUrl && (
            <Button
              asChild
              className="w-full bg-[#7C2D3E] hover:bg-[#6B2635] text-white rounded-xl py-5 font-semibold"
            >
              <a
                href={ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 me-2" />
                {t('get_tickets')}
              </a>
            </Button>
          );
        })()}
      </div>
    </motion.div>
  );
}
