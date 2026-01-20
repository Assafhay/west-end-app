import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, ExternalLink, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/i18nHelper';

export default function RecommendationCard({ musical, reasons, isMain = false, index = 0, breakdown = null, adminSearchId }) {
  const { t } = useTranslation();

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleTicketClick = async (ticketUrl, urlType, rank) => {
    if (adminSearchId) {
      try {
        // Get current record
        const record = await base44.entities.AdminSearch.get(adminSearchId);

        const clickEvent = {
          ts: new Date().toISOString(),
          show_id: musical.id,
          show_title: musical.show_title,
          mode: 'recommendation',
          url_type: urlType,
          url: ticketUrl,
          rank: rank
        };

        const existingClicks = record.ticket_clicks || [];
        const existingSummary = record.ticket_click_summary || {};

        const currentShowSummary = existingSummary[musical.id] || {
          clicked: false,
          url_type: null,
          click_count: 0
        };

        await base44.entities.AdminSearch.update(adminSearchId, {
          ticket_clicked: true,
          ticket_url_type: urlType,
          ticket_show_id: musical.id,
          ticket_show_title: musical.show_title,
          ticket_url_used: ticketUrl,
          ticket_clicks: [...existingClicks, clickEvent],
          ticket_click_summary: {
            ...existingSummary,
            [musical.id]: {
              clicked: true,
              url_type: urlType,
              click_count: currentShowSummary.click_count + 1
            }
          }
        });
      } catch (error) {
        console.error('Failed to track ticket click:', error);
      }
    }
  };

  const showTitle = getLocalizedValue(musical, 'show_title');
  const showDescription = getLocalizedValue(musical, 'description');
  const showTags = getLocalizedValue(musical, 'tags') || musical.tags; // Fallback if tags not localized yet (often arrays need special handling or just assumed same)
  // Note: tags are currently just strings, so if we want localized tags we'd need tags_he: ["...", "..."]

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

        <p className="text-slate-600 text-sm leading-relaxed">
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
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="bg-[#FAFAF8] rounded-2xl p-4 space-y-3">
          {/* User-facing positive reasons only */}
          <div>
            <p className="text-xs font-semibold text-[#7C2D3E] uppercase tracking-wider mb-2">
              {t('why_we_recommend')}
            </p>

            {musical.llm_explanation ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-700 leading-relaxed">
                  <span dangerouslySetInnerHTML={{
                    __html: musical.llm_explanation.sentence
                      .replace(/\*/g, '')
                      .replace(new RegExp(showTitle, 'g'), `<strong>${showTitle}</strong>`)
                  }} />
                </p>
                {musical.llm_explanation.bullets && musical.llm_explanation.bullets.length > 0 && (
                  <ul className="space-y-1.5 mt-2">
                    {musical.llm_explanation.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-[#D4A959] flex-shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : reasons && reasons.length > 0 ? (
              <ul className="space-y-1.5">
                {reasons.filter(r => r.points > 0).slice(0, 3).map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-[#D4A959] flex-shrink-0 mt-0.5" />
                    <span>{reason.text}</span>
                  </li>
                ))}
                {reasons.filter(r => r.points > 0).length === 0 && (
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-[#D4A959] flex-shrink-0 mt-0.5" />
                    <span>{t('matches_preferences')}</span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-slate-700">{t('great_match')}</p>
            )}
          </div>
        </div>

        {(() => {
          const hasAffUrl = musical.ticket_url_aff && musical.ticket_url_aff !== "none";
          const ticketUrl = hasAffUrl
            ? musical.ticket_url_aff
            : (musical.ticket_url && musical.ticket_url !== "none")
              ? musical.ticket_url
              : null;
          const urlType = hasAffUrl ? "affiliate" : "direct";

          return ticketUrl && (
            <Button
              asChild
              className="w-full bg-[#7C2D3E] hover:bg-[#6B2635] text-white rounded-xl py-5 font-semibold"
            >
              <a
                href={ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleTicketClick(ticketUrl, urlType, index + 1)}
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