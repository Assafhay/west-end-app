import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Clock, MapPin, ExternalLink, Calendar, ArrowLeft } from 'lucide-react';
import ShowDetailsModal from '@/components/browse/ShowDetailsModal';

const BASE_URL = "https://raw.githubusercontent.com/Assafhay/westend-data/main";

import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/i18nHelper';

export default function BrowseShows() {
  const { t } = useTranslation();
  const [musicals, setMusicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [quickFilters, setQuickFilters] = useState({
    familyFriendly: false,
    funny: false,
    romantic: false,
    spectacle: false,
    easyEnglish: false,
    mustSee: false,
    hiddenGem: false,
    tsufsFavourites: false,
    offWestEnd: false
  });
  const [modalShow, setModalShow] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const musicalsRes = await fetch(`${BASE_URL}/musicals.json`).then(r => r.json());
        setMusicals(musicalsRes);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load data:', error);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Helper to parse tags (handles both string and array formats)
  const parseTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      return tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    return [];
  };

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set();
    musicals.forEach(m => {
      const tags = parseTags(m.tags);
      tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [musicals]);

  // Filter musicals
  const filteredMusicals = useMemo(() => {
    return musicals.filter(m => {
      // Search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const titleMatch = m.show_title?.toLowerCase().includes(searchLower);
        const descMatch = m.description?.toLowerCase().includes(searchLower);
        if (!titleMatch && !descMatch) return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const musicalTags = parseTags(m.tags);
        const hasAllTags = selectedTags.every(tag => musicalTags.includes(tag));
        if (!hasAllTags) return false;
      }

      // Quick filters
      if (quickFilters.familyFriendly && (m.family_score || 0) < 3) return false;
      if (quickFilters.funny && (m.comedy_score || 0) < 3) return false;
      if (quickFilters.romantic && (m.romance_score || 0) < 3) return false;
      if (quickFilters.spectacle && (m.spectacle_level || 0) < 3) return false;
      if (quickFilters.easyEnglish && (m.english_score || 0) > 1) return false;
      if (quickFilters.mustSee && m.must_see != 1) return false;
      if (quickFilters.hiddenGem && m.hidden_gem != 1) return false;
      if (quickFilters.tsufsFavourites && m.tsufs_best != 3) return false;
      if (quickFilters.offWestEnd && m.off_westend != 1) return false;

      return true;
    });
  }, [musicals, searchText, selectedTags, quickFilters]);

  const handleShowOpen = (show) => {
    setModalShow(show);
  };

  const clearAllFilters = () => {
    setSearchText('');
    setSelectedTags([]);
    setQuickFilters({
      familyFriendly: false,
      funny: false,
      romantic: false,
      spectacle: false,
      easyEnglish: false,
      mustSee: false,
      hiddenGem: false,
      tsufsFavourites: false,
      offWestEnd: false
    });
  };

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

    // Check if close_date is placeholder or missing
    if (!closeDate || closeDate === '2099-12-31') {
      return `From ${start}`;
    }

    const end = formatDate(closeDate);
    return `${start} – ${end}`;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#FAFAF8] via-white to-[#F5F0EB] min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading shows...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#FAFAF8] via-white to-[#F5F0EB] min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <a
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('back_to_home')}</span>
        </a>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('browse_all')}</h1>
          <p className="text-slate-600">{t('browse_all_subtitle')}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={t('search_placeholder')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="ps-10"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mb-4">
            <label className="text-sm font-medium text-slate-700 mb-2 block">{t('quick_filters')}</label>
            <div className="flex flex-wrap gap-2">
              <Badge
                className={`cursor-pointer transition-colors ${quickFilters.familyFriendly ? 'bg-[#7C2D3E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => setQuickFilters(prev => ({ ...prev, familyFriendly: !prev.familyFriendly }))}
              >
                Family Friendly
              </Badge>
              <Badge
                className={`cursor-pointer transition-colors ${quickFilters.funny ? 'bg-[#7C2D3E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => setQuickFilters(prev => ({ ...prev, funny: !prev.funny }))}
              >
                Funny
              </Badge>
              <Badge
                className={`cursor-pointer transition-colors ${quickFilters.romantic ? 'bg-[#7C2D3E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => setQuickFilters(prev => ({ ...prev, romantic: !prev.romantic }))}
              >
                Romantic
              </Badge>
              <Badge
                className={`cursor-pointer transition-colors ${quickFilters.spectacle ? 'bg-[#7C2D3E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => setQuickFilters(prev => ({ ...prev, spectacle: !prev.spectacle }))}
              >
                Big Spectacle
              </Badge>
              <Badge
                className={`cursor-pointer transition-colors ${quickFilters.easyEnglish ? 'bg-[#7C2D3E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => setQuickFilters(prev => ({ ...prev, easyEnglish: !prev.easyEnglish }))}
              >
                Easy English
              </Badge>
              <Badge
                className={`cursor-pointer transition-colors ${quickFilters.mustSee ? 'bg-[#7C2D3E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => setQuickFilters(prev => ({ ...prev, mustSee: !prev.mustSee }))}
              >
                Must See
              </Badge>
              <Badge
                className={`cursor-pointer transition-colors ${quickFilters.hiddenGem ? 'bg-[#7C2D3E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => setQuickFilters(prev => ({ ...prev, hiddenGem: !prev.hiddenGem }))}
              >
                Hidden Gem
              </Badge>
              <Badge
                className={`cursor-pointer transition-colors ${quickFilters.tsufsFavourites ? 'bg-[#7C2D3E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => setQuickFilters(prev => ({ ...prev, tsufsFavourites: !prev.tsufsFavourites }))}
              >
                Tsuf's Favourites
              </Badge>
              <Badge
                className={`cursor-pointer transition-colors ${quickFilters.offWestEnd ? 'bg-[#7C2D3E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => setQuickFilters(prev => ({ ...prev, offWestEnd: !prev.offWestEnd }))}
              >
                Off West End
              </Badge>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchText || selectedTags.length > 0 || Object.values(quickFilters).some(Boolean)) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Clear All Filters
            </Button>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-slate-600">
          {t('showing_results', { count: filteredMusicals.length, total: musicals.length })}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filteredMusicals.map((show) => (
            <motion.div
              key={show.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg md:rounded-2xl shadow-lg overflow-hidden flex flex-col h-full"
            >
              {/* Show Image - Clickable */}
              <div
                className="aspect-[3/4] bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity relative"
                onClick={() => handleShowOpen(show)}
              >
                {show.img ? (
                  <img
                    src={show.img}
                    alt={show.show_title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xl font-bold text-slate-400">
                      {getLocalizedValue(show, 'show_title')}
                    </span>
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-2 end-2 flex flex-col gap-1 pointer-events-none">
                  {show.status === "future" && (
                    <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold text-slate-900 shadow-md" style={{ backgroundColor: '#FFEAB2' }}>
                      Opening soon
                    </span>
                  )}
                  {show.closing_soon && (
                    <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold text-slate-900 shadow-md" style={{ backgroundColor: '#FFEAB2' }}>
                      Closing soon
                    </span>
                  )}
                </div>
              </div>

              {/* Show Info */}
              <div className="p-2 md:p-4 flex flex-col flex-1">
                <div className="flex-1">
                  <h3 className="text-sm md:text-lg font-bold text-slate-900 mb-1 md:mb-2 line-clamp-2">
                    {getLocalizedValue(show, 'show_title')}
                  </h3>

                  <div className="flex flex-col gap-1 text-xs text-slate-600 mb-2 md:mb-3">
                    {show.venue_id && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{show.venue_id}</span>
                      </div>
                    )}
                    {show.duration_minutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{formatDuration(show.duration_minutes)}</span>
                      </div>
                    )}
                    {show.start_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span className="text-xs">{formatDateRange(show.start_date, show.close_date)}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs md:text-sm text-slate-600 line-clamp-2 mb-2 md:mb-3 hidden md:block">
                    {getLocalizedValue(show, 'description')}
                  </p>

                  {/* Tags */}
                  {(() => {
                    const tags = parseTags(show.tags);
                    return tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2 md:mb-3">
                        {tags.slice(0, 2).map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs line-clamp-1">
                            {tag}
                          </Badge>
                        ))}
                        {tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Actions - Pinned to bottom */}
                <div className="flex flex-col md:flex-row gap-1 md:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShowOpen(show)}
                    className="flex-1 text-xs md:text-sm h-7 md:h-9"
                  >
                    {t('details')}
                  </Button>

                  {(() => {
                    const hasAffUrl = show.ticket_url_aff && show.ticket_url_aff !== "none";
                    const ticketUrl = hasAffUrl
                      ? show.ticket_url_aff
                      : (show.ticket_url && show.ticket_url !== "none")
                        ? show.ticket_url
                        : null;

                    return ticketUrl && (
                      <Button
                        asChild
                        size="sm"
                        className="bg-[#7C2D3E] hover:bg-[#6B2635] text-xs md:text-sm h-7 md:h-9"
                      >
                        <a
                          href={ticketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('tickets')}
                          <ExternalLink className="w-3 h-3 ms-1 hidden md:inline" />
                        </a>
                      </Button>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Show Details Modal */}
        <ShowDetailsModal
          show={modalShow}
          isOpen={!!modalShow}
          onClose={() => setModalShow(null)}
        />

        {filteredMusicals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">{t('no_shows_match')}</p>
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="mt-4"
            >
              {t('clear_filters')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
