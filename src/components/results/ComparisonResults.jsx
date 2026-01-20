import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Trophy, MapPin, Clock } from 'lucide-react';
import AboutRecommendation from './AboutRecommendation';
import { base44 } from '@/api/base44Client';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/i18nHelper';

export default function ComparisonResults({ results, onRetry, adminSearchId }) {
  const { t } = useTranslation();
  const winner = results[0];
  const others = results.slice(1);

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleTicketClick = async (show, ticketUrl, urlType, rank) => {
    if (adminSearchId) {
      try {
        // Get current record
        const record = await base44.entities.AdminSearch.get(adminSearchId);

        const clickEvent = {
          ts: new Date().toISOString(),
          show_id: show.id,
          show_title: show.show_title,
          mode: 'comparison',
          url_type: urlType,
          url: ticketUrl,
          rank: rank
        };

        const existingClicks = record.ticket_clicks || [];
        const existingSummary = record.ticket_click_summary || {};

        const currentShowSummary = existingSummary[show.id] || {
          clicked: false,
          url_type: null,
          click_count: 0
        };

        await base44.entities.AdminSearch.update(adminSearchId, {
          ticket_clicked: true,
          ticket_url_type: urlType,
          ticket_show_id: show.id,
          ticket_show_title: show.show_title,
          ticket_url_used: ticketUrl,
          ticket_clicks: [...existingClicks, clickEvent],
          ticket_click_summary: {
            ...existingSummary,
            [show.id]: {
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

  // Helper to render a show card (used for winner)
  const renderWinnerCard = (show) => {
    const showTitle = getLocalizedValue(show, 'show_title');
    const showDesc = getLocalizedValue(show, 'description');

    return (
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-[#7C2D3E]">
        <div className="relative">
          {/* Trophy Badge */}
          <div className="absolute top-4 start-4 z-10">
            <div className="bg-[#7C2D3E] text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-semibold">{t('top_recommendation')}</span>
            </div>
          </div>

          {/* Show Image */}
          <div className="aspect-[16/9] bg-slate-100">
            {show.img ? (
              <img
                src={show.img}
                alt={showTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-400">
                  {showTitle}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            {showTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-4">
            {show.venue_id && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#7C2D3E]" />
                <span>{show.venue_id}</span>
              </div>
            )}
            {show.duration_minutes && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#7C2D3E]" />
                <span>{formatDuration(show.duration_minutes)}</span>
                {show.interval && (
                  <span className="text-slate-400">
                    • {t('with_interval')}
                  </span>
                )}
              </div>
            )}
          </div>

          {showDesc && (
            <p className="text-slate-700 leading-relaxed mb-4">
              {showDesc}
            </p>
          )}

          {/* Why this is #1 */}
          <div className="bg-[#7C2D3E]/5 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('why_we_recommend')}</h3>

            {show.llm_explanation?.sentence ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-700 leading-relaxed">
                  <span dangerouslySetInnerHTML={{
                    __html: show.llm_explanation.sentence
                      .replace(/\*/g, '')
                      .replace(new RegExp(showTitle, 'g'), `<strong>${showTitle}</strong>`)
                  }} />
                </p>
                {show.llm_explanation.bullets && show.llm_explanation.bullets.length > 0 && (
                  <ul className="space-y-2 mt-2">
                    {show.llm_explanation.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-[#7C2D3E] mt-0.5">✓</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-700">{t('great_match')}</p>
            )}
          </div>

          {(() => {
            const hasAffUrl = show.ticket_url_aff && show.ticket_url_aff !== "none";
            const ticketUrl = hasAffUrl
              ? show.ticket_url_aff
              : (show.ticket_url && show.ticket_url !== "none")
                ? show.ticket_url
                : null;
            const urlType = hasAffUrl ? "affiliate" : "direct";

            return ticketUrl && (
              <Button
                asChild
                className="w-full bg-gradient-to-r from-[#7C2D3E] to-[#9B3A4F] hover:from-[#6B2635] hover:to-[#8A2F42] text-white rounded-xl py-6 font-semibold shadow-lg"
              >
                <a
                  href={ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleTicketClick(show, ticketUrl, urlType, 1)}
                >
                  {t('get_tickets')}
                  <ExternalLink className="w-4 h-4 ms-2" />
                </a>
              </Button>
            );
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-[#FAFAF8] via-white to-[#F5F0EB] pb-8">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Winner Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {renderWinnerCard(winner)}
        </motion.div>

        {/* How Others Compare */}
        {others.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8 bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              How the others compare
            </h2>

            <div className="space-y-5">
              {others.map((show, idx) => {
                const showRank = idx + 2;
                const showTitle = getLocalizedValue(show, 'show_title');

                return (
                  <div key={show.id} className="flex items-start gap-3">
                    <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                      {show.img ? (
                        <img
                          src={show.img}
                          alt={showTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-slate-400 font-medium text-center px-1">
                            {showTitle}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {showTitle}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1.5">
                        {show.venue_id && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{show.venue_id}</span>
                          </div>
                        )}
                        {show.duration_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(show.duration_minutes)}</span>
                            {show.interval && (
                              <span className="text-slate-400">
                                • {t('with_interval')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed mb-3">
                        <span dangerouslySetInnerHTML={{
                          __html: show.comparison_reason
                            .replace(/\*/g, '')
                            .replace(new RegExp(showTitle, 'g'), `<strong>${showTitle}</strong>`)
                        }} />
                      </p>

                      {(() => {
                        const hasAffUrl = show.ticket_url_aff && show.ticket_url_aff !== "none";
                        const ticketUrl = hasAffUrl
                          ? show.ticket_url_aff
                          : (show.ticket_url && show.ticket_url !== "none")
                            ? show.ticket_url
                            : null;
                        const urlType = hasAffUrl ? "affiliate" : "direct";

                        return ticketUrl && (
                          <a
                            href={ticketUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-[#7C2D3E] hover:underline font-medium"
                            onClick={() => handleTicketClick(show, ticketUrl, urlType, showRank)}
                          >
                            {t('get_tickets')}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* About This Recommendation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <AboutRecommendation />
        </motion.div>

        {/* Start Over Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Button
            variant="outline"
            onClick={onRetry}
            className="rounded-xl px-6 py-5 border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4 me-2" />
            {t('start_over')}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}