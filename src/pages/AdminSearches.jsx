import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Search as SearchIcon, Calendar, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminSearches() {
  const [user, setUser] = useState(null);
  const [expandedSearch, setExpandedSearch] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'admin') {
          window.location.href = '/';
        }
      } catch (error) {
        window.location.href = '/';
      }
    }
    checkAuth();
  }, []);

  const { data: searches = [], isLoading } = useQuery({
    queryKey: ['admin-searches'],
    queryFn: async () => {
      const result = await base44.entities.AdminSearch.list('-created_date', 100);
      return result;
    },
    enabled: user?.role === 'admin'
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Access denied. Admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 min-h-[70vh]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Search Analytics</h1>
          <p className="text-slate-600">View all quiz completions and recommendations</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Searches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{searches.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Avg Candidates After Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {searches.length > 0 
                  ? Math.round(searches.reduce((sum, s) => sum + (s.candidates_after_filter || 0), 0) / searches.length)
                  : 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Ticket Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {searches.reduce((sum, s) => sum + ((s.ticket_clicks && s.ticket_clicks.length) || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Searches Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchIcon className="w-5 h-5" />
              Recent Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Loading searches...</div>
            ) : searches.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No searches yet</div>
            ) : (
              <div className="space-y-2">
                {searches.map((search) => (
                  <div key={search.id}>
                    <button
                      onClick={() => setExpandedSearch(expandedSearch === search.id ? null : search.id)}
                      className="w-full"
                    >
                      <Card className="hover:bg-slate-50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4 flex-1">
                             <div className="text-start">
                               <p className="text-sm font-medium text-slate-900">
                                 Session: {search.user_session_id?.slice(-8)}
                               </p>
                               <p className="text-xs text-slate-500">
                                 {new Date(search.created_date).toLocaleString()}
                               </p>
                             </div>

                             <Badge 
                               className={
                                 search.mode === 'comparison' 
                                   ? 'bg-purple-100 text-purple-800 border-purple-200' 
                                   : search.mode === 'full_recommendation'
                                   ? 'bg-amber-100 text-amber-800 border-amber-200'
                                   : 'bg-slate-100 text-slate-600'
                               }
                               variant="outline"
                             >
                               {search.mode === 'comparison' 
                                 ? 'Comparison' 
                                 : search.mode === 'full_recommendation'
                                 ? 'Recommendation'
                                 : 'Unknown'}
                             </Badge>

                             {search.user_start_date && search.user_end_date && (
                               <Badge variant="outline" className="flex items-center gap-1">
                                 <Calendar className="w-3 h-3" />
                                 {search.user_start_date} to {search.user_end_date}
                               </Badge>
                             )}

                             <Badge variant="secondary">
                               {search.candidates_after_filter} / {search.candidates_before_filter} shows
                             </Badge>

                             {search.ticket_clicks && search.ticket_clicks.length > 0 && (
                               <Badge className="bg-green-100 text-green-800 border-green-200">
                                 🎟️ {search.ticket_clicks.length} click{search.ticket_clicks.length !== 1 ? 's' : ''}
                               </Badge>
                             )}
                             </div>
                            
                            {expandedSearch === search.id ? (
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </button>

                    <AnimatePresence>
                      {expandedSearch === search.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <Card className="mt-2 ms-8 bg-slate-50">
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                {/* Answers */}
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-700 mb-2">User Answers</h4>
                                  <div className="text-xs space-y-1 font-mono text-slate-600">
                                    {Object.entries(search.answers || {}).map(([qid, answer]) => (
                                      <div key={qid} className="flex gap-2">
                                        <span className="text-slate-400">{qid}:</span>
                                        <span>{JSON.stringify(answer)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Top Recommendations */}
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Top Recommendations
                                  </h4>
                                  <div className="space-y-2">
                                    {search.top_recommendations?.map((rec, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                                        <div>
                                          <p className="text-sm font-medium text-slate-900">
                                            {idx + 1}. {rec.show_title}
                                          </p>
                                          <p className="text-xs text-slate-500">ID: {rec.id}</p>
                                        </div>
                                        <Badge className="bg-[#7C2D3E] text-white">
                                          Score: {rec.total_score?.toFixed(1)}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Ticket Clicks Section */}
                                {search.ticket_clicks && search.ticket_clicks.length > 0 && (
                                  <div className="border-t border-slate-200 pt-4">
                                    <h4 className="text-sm font-semibold text-slate-700 mb-3">
                                      Ticket Clicks ({search.ticket_clicks.length})
                                    </h4>

                                    {/* Per-Show Summary */}
                                    {search.ticket_click_summary && Object.keys(search.ticket_click_summary).length > 0 && (
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                        <h5 className="text-xs font-semibold text-slate-700 mb-2 uppercase">Per-Show Summary</h5>
                                        <div className="space-y-2">
                                          {Object.entries(search.ticket_click_summary).map(([showId, summary]) => {
                                            const showInfo = search.top_recommendations?.find(r => r.id === showId);
                                            return (
                                              <div key={showId} className="flex items-center justify-between text-sm bg-white rounded p-2">
                                                <span className="font-medium text-slate-900">
                                                  {showInfo?.show_title || showId}
                                                </span>
                                                <div className="flex items-center gap-3 text-xs">
                                                  <Badge className={summary.url_type === 'affiliate' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                                                    {summary.url_type}
                                                  </Badge>
                                                  <span className="font-medium text-slate-600">
                                                    {summary.click_count} click{summary.click_count !== 1 ? 's' : ''}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Click Events Timeline */}
                                    <div>
                                      <h5 className="text-xs font-semibold text-slate-700 mb-2 uppercase">Click Timeline (Latest First)</h5>
                                      <div className="space-y-2">
                                        {[...search.ticket_clicks].reverse().map((click, idx) => (
                                          <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2 text-xs">
                                            <div className="flex items-start justify-between mb-1">
                                              <div className="font-medium text-slate-900">{click.show_title}</div>
                                              <div className="text-slate-500">
                                                {new Date(click.ts).toLocaleString('en-GB', { 
                                                  dateStyle: 'short', 
                                                  timeStyle: 'short' 
                                                })}
                                              </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-slate-600">
                                              <Badge variant="outline" className="text-xs">Rank #{click.rank}</Badge>
                                              <Badge className={click.url_type === 'affiliate' ? 'bg-green-100 text-green-800 text-xs' : 'bg-blue-100 text-blue-800 text-xs'}>
                                                {click.url_type}
                                              </Badge>
                                              <a 
                                                href={click.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-slate-500 hover:text-slate-700 hover:underline truncate max-w-xs"
                                              >
                                                {click.url.length > 60 ? click.url.substring(0, 60) + '...' : click.url}
                                              </a>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                 {/* LLM Output Section */}
                                {(search.recommendation_llm_outputs || search.comparison_llm_outputs) ? (
                                  <div className="border-t border-slate-200 pt-4">
                                    <h4 className="text-sm font-semibold text-slate-700 mb-3">LLM Output</h4>
                                    
                                    {/* Recommendation Mode LLM Output */}
                                    {search.recommendation_llm_outputs?.top_recommendations && (
                                      <div className="space-y-3">
                                        {search.recommendation_llm_outputs.top_recommendations.map((rec, idx) => (
                                          <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <div className="flex items-start justify-between mb-1">
                                              <span className="font-medium text-sm text-blue-900">
                                                Rank {rec.rank}: {rec.show_title}
                                              </span>
                                              {rec.why_recommend_text && (
                                                <button
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(rec.why_recommend_text);
                                                  }}
                                                  className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                                                >
                                                  Copy
                                                </button>
                                              )}
                                            </div>
                                            {rec.why_recommend_text && (
                                              <p className="text-sm text-slate-700 mb-2">{rec.why_recommend_text}</p>
                                            )}
                                            {rec.bullets && rec.bullets.length > 0 && (
                                              <ul className="text-sm text-slate-600 space-y-1 ms-4">
                                                {rec.bullets.map((bullet, bIdx) => (
                                                  <li key={bIdx} className="list-disc">{bullet}</li>
                                                ))}
                                              </ul>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Comparison Mode LLM Output */}
                                    {search.comparison_llm_outputs && (
                                      <div className="space-y-3">
                                        {/* Winner */}
                                        {search.comparison_llm_outputs.winner && (
                                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <div className="flex items-start justify-between mb-1">
                                              <span className="font-medium text-sm text-green-900">
                                                Winner: {search.comparison_llm_outputs.winner.show_title}
                                              </span>
                                              {search.comparison_llm_outputs.winner.why_winner_text && (
                                                <button
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(search.comparison_llm_outputs.winner.why_winner_text);
                                                  }}
                                                  className="text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded hover:bg-green-100"
                                                >
                                                  Copy
                                                </button>
                                              )}
                                            </div>
                                            {search.comparison_llm_outputs.winner.why_winner_text && (
                                              <p className="text-sm text-slate-700 mb-2">{search.comparison_llm_outputs.winner.why_winner_text}</p>
                                            )}
                                            {search.comparison_llm_outputs.winner.bullets && search.comparison_llm_outputs.winner.bullets.length > 0 && (
                                              <ul className="text-sm text-slate-600 space-y-1 ms-4">
                                                {search.comparison_llm_outputs.winner.bullets.map((bullet, bIdx) => (
                                                  <li key={bIdx} className="list-disc">{bullet}</li>
                                                ))}
                                              </ul>
                                            )}
                                          </div>
                                        )}
                                        
                                        {/* Losers */}
                                        {search.comparison_llm_outputs.per_loser_explanations && search.comparison_llm_outputs.per_loser_explanations.length > 0 && (
                                          <div className="space-y-2">
                                            <span className="text-xs font-semibold text-slate-600 uppercase">Comparisons</span>
                                            {search.comparison_llm_outputs.per_loser_explanations.map((loser, idx) => (
                                              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                                <div className="flex items-start justify-between mb-1">
                                                  <span className="font-medium text-sm text-slate-900">
                                                    {loser.loser_show_title}
                                                  </span>
                                                  {loser.compare_sentence && (
                                                    <button
                                                      onClick={() => {
                                                        navigator.clipboard.writeText(loser.compare_sentence);
                                                      }}
                                                      className="text-xs text-slate-600 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100"
                                                    >
                                                      Copy
                                                    </button>
                                                  )}
                                                </div>
                                                {loser.compare_sentence && (
                                                  <p className="text-sm text-slate-700">{loser.compare_sentence}</p>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="border-t border-slate-200 pt-4">
                                    <p className="text-sm text-slate-500 italic">No LLM output saved for this session.</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}