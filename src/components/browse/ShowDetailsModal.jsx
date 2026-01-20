import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/i18nHelper';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ShowDetailsModal({ show, isOpen, onClose, onTicketClick }) {
  const { t } = useTranslation();
  // Close on escape key and prevent body scroll
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen, onClose]);

  if (!show) return null;

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateRange = (startDate, closeDate) => {
    if (!startDate) return '';
    const start = formatDate(startDate);

    if (!closeDate || closeDate === '2099-12-31') {
      return t('from_date', { date: start });
    }

    const end = formatDate(closeDate);
    return `${start} – ${end}`;
  };

  const parseTags = (tags) => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(Boolean);
    return [];
  };

  const showTags = parseTags(show.tags);

  const hasAffUrl = show.ticket_url_aff && show.ticket_url_aff !== "none";
  const ticketUrl = hasAffUrl
    ? show.ticket_url_aff
    : (show.ticket_url && show.ticket_url !== "none")
      ? show.ticket_url
      : null;
  const urlType = hasAffUrl ? "affiliate" : "direct";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 cursor-pointer"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: '100%', scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: '100%', scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky Header with Close Button */}
              <div className="sticky top-0 z-10 flex justify-end px-4 md:px-6 pt-3 pb-0 bg-white">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="bg-white rounded-full p-2 shadow-lg hover:bg-slate-100 transition-colors touch-manipulation"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 bg-white">
                <div className="px-4 md:px-6 pt-3 pb-6">
                  {/* Two Column Header: Poster Left, Title + Meta Right */}
                  <div className="flex flex-row gap-3 md:gap-6 mb-6">
                    {/* Left: Poster Image */}
                    {show.img && (
                      <div className="w-[35%] md:w-1/3 flex-shrink-0">
                        <div className="aspect-[2/3] max-h-[280px] md:max-h-none bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center rounded-lg overflow-hidden">
                          <img
                            src={show.img}
                            alt={show.show_title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {/* Right: Title and Meta Info */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl md:text-3xl font-bold text-slate-900 mb-3 md:mb-4">
                        {getLocalizedValue(show, 'show_title')}
                      </h2>

                      {/* Meta Info */}
                      <div className="flex flex-col gap-2 md:gap-2 text-sm md:text-sm text-slate-600">
                        {show.venue_id && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#7C2D3E]" />
                            <span>{show.venue_id}</span>
                          </div>
                        )}
                        {show.duration_minutes && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#7C2D3E]" />
                            <span>
                              {formatDuration(show.duration_minutes)}
                              {show.interval && (
                                <span className="text-slate-400 ms-1">
                                  • {show.interval === 'yes' || show.interval === true ? t('with_interval') : t('no_interval')}
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        {show.start_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#7C2D3E]" />
                            <span>{formatDateRange(show.start_date, show.close_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Full Width: About Section */}
                  {show.description && (
                    <div className="mb-6">
                      <h3 className="text-sm md:text-sm font-semibold text-slate-700 mb-2">{t('about_show')}</h3>
                      <p className="text-sm md:text-sm text-slate-600 leading-relaxed">{getLocalizedValue(show, 'description')}</p>
                    </div>
                  )}

                  {/* Full Width: Tags Section */}
                  {showTags.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">{t('tags')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {showTags.map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-slate-100 text-slate-700 text-sm py-1"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ticket Button */}
                  {ticketUrl && (
                    <Button
                      asChild
                      className="w-full bg-[#7C2D3E] hover:bg-[#6B2635] text-white py-6"
                    >
                      <a
                        href={ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onTicketClick(show, ticketUrl, urlType)}
                      >
                        {t('get_tickets')}
                        <ExternalLink className="w-4 h-4 ms-2" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}