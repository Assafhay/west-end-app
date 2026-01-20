import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import WelcomeScreen from '@/components/quiz/WelcomeScreen';
import ShowSelector from '@/components/quiz/ShowSelector';
import QuizProgress from '@/components/quiz/QuizProgress';
import SingleQuestion from '@/components/quiz/SingleQuestion';
import MultiQuestion from '@/components/quiz/MultiQuestion';
import ImageGridQuestion from '@/components/quiz/ImageGridQuestion';
import DateRangeQuestion from '@/components/quiz/DateRangeQuestion';
import RankingQuestion from '@/components/quiz/RankingQuestion';
import QuizNavigation from '@/components/quiz/QuizNavigation';
import RecommendationCard from '@/components/results/RecommendationCard';
import ComparisonResults from '@/components/results/ComparisonResults';
import NoResults from '@/components/results/NoResults';
import AboutRecommendation from '@/components/results/AboutRecommendation';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/i18nHelper';

const BASE_URL = "https://raw.githubusercontent.com/Assafhay/westend-data/main";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [musicals, setMusicals] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [weights, setWeights] = useState([]);
  const [questionsV2, setQuestionsV2] = useState(null);
  const [weightsV2, setWeightsV2] = useState(null);
  const [v2LoadError, setV2LoadError] = useState(null);

  const [mode, setMode] = useState(null); // 'recommendation', 'comparison', or 'recommendation_v2'
  const [phase, setPhase] = useState('welcome'); // welcome, show_selection, quiz, results, loading
  const { t, i18n } = useTranslation();

  const [selectedShowIds, setSelectedShowIds] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState([]);
  const [adminSearchId, setAdminSearchId] = useState(null);
  const [scoringError, setScoringError] = useState(null);
  const isSubmittingRef = React.useRef(false);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [musicalsRes, questionsRes, weightsRes] = await Promise.all([
          fetch(`${BASE_URL}/musicals.json`).then(r => r.json()),
          fetch(`${BASE_URL}/questions.json`).then(r => r.json()),
          fetch(`${BASE_URL}/weights.json`).then(r => r.json())
        ]);

        setMusicals(musicalsRes);
        setQuestions(questionsRes);
        setWeights(weightsRes);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load data:', error);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Load V2 data when V2 mode is selected
  useEffect(() => {
    if (mode === 'recommendation_v2' && !questionsV2 && !weightsV2 && !v2LoadError) {
      async function loadV2Data() {
        try {
          const [questionsV2Res, weightsV2Res] = await Promise.all([
            fetch(`${BASE_URL}/questions_v2.json?t=${Date.now()}`).then(r => {
              if (!r.ok) throw new Error('Failed to fetch questions_v2.json');
              return r.json();
            }),
            fetch(`${BASE_URL}/weights_v2.json?t=${Date.now()}`).then(r => {
              if (!r.ok) throw new Error('Failed to fetch weights_v2.json');
              return r.json();
            })
          ]);

          // Validate structures
          if (!questionsV2Res.questions || !Array.isArray(questionsV2Res.questions)) {
            throw new Error('questions_v2.json: questions must be an array');
          }
          if (!weightsV2Res.rules || !Array.isArray(weightsV2Res.rules)) {
            throw new Error('weights_v2.json: rules must be an array');
          }

          setQuestionsV2(questionsV2Res);
          setWeightsV2(weightsV2Res);
        } catch (error) {
          console.error('Failed to load V2 data:', error);
          setV2LoadError(error.message);
        }
      }
      loadV2Data();
    }
  }, [mode, questionsV2, weightsV2, v2LoadError]);

  // Create filtered questions list based on answers and mode
  const filteredQuestions = React.useMemo(() => {
    // V2 mode uses questionsV2
    if (mode === 'recommendation_v2') {
      if (!questionsV2 || !questionsV2.questions) return [];
      return questionsV2.questions.filter(q => {
        // Skip q11_seen_before if user selected first_time
        const exp = answers["q9_experience"];
        const shouldShowQ11 = exp && exp !== "first_time";
        if (q.question_id === "q11_seen_before" && !shouldShowQ11) {
          return false;
        }
        return true;
      });
    }

    // V1 modes use questions
    return questions.filter(q => {
      // Skip q11 if user selected first_time (both modes)
      const exp = answers["q9_experience"];
      const shouldShowQ11 = exp && exp !== "first_time";
      if (q.question_id === "q11_seen_before" && !shouldShowQ11) {
        return false;
      }

      return true;
    });
  }, [questions, questionsV2, answers, mode]);

  // Clear q11 selections when first_time is selected
  React.useEffect(() => {
    const exp = answers["q9_experience"];
    if (exp === "first_time" && answers["q11_seen_before"]) {
      setAnswers(prev => ({ ...prev, q11_seen_before: [] }));
    }
  }, [answers]);

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  const handleAnswerSelect = (answer) => {
    const questionId = currentQuestion.question_id;
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const canProceed = () => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.question_id];

    if (currentQuestion.type === 'single' || currentQuestion.type === 'single_choice') {
      return !!answer;
    } else if (currentQuestion.type === 'multi' || currentQuestion.type === 'multi_select') {
      return Array.isArray(answer) && answer.length > 0;
    } else if (currentQuestion.type === 'date_range') {
      if (!answer) return false;
      if (answer.mode === 'all_dates') return true;
      if (answer.mode === 'specific_dates') {
        return answer.user_start_date && answer.user_end_date;
      }
      return false;
    } else if (currentQuestion.type === 'ranking') {
      return Array.isArray(answer) && answer.length > 0;
    }
    return false;
  };

  const handleNext = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      // On first question, go back to welcome screen
      setPhase('welcome');
      setMode(null);
      setAnswers({});
      setCurrentQuestionIndex(0);
    }
  };

  // V2 Scoring Engine
  const calculateResultsV2 = (candidateShowIds = null) => {
    if (!weightsV2) return [];

    const candidateMusicals = candidateShowIds
      ? musicals.filter(m => candidateShowIds.includes(m.id))
      : musicals;

    // Step 1: Exclude seen-before shows if enabled
    let filteredMusicals = candidateMusicals;
    if (weightsV2.seen_before?.exclude_seen) {
      const seenShowIds = answers.q11_seen_before || [];
      filteredMusicals = filteredMusicals.filter(m => !seenShowIds.includes(m.id));
    }

    // Calculate max values for fields that use inversion
    const fieldMaxValues = {};
    const allRules = Array.isArray(weightsV2.rules) ? weightsV2.rules : [];
    const rankingItems = weightsV2.ranking_question?.items || [];

    // Collect all fields that use inversion
    const invertedFields = new Set();
    allRules.forEach(rule => {
      if (rule.invert && rule.field) {
        invertedFields.add(rule.field);
      }
    });
    rankingItems.forEach(item => {
      if (Array.isArray(item.match)) {
        item.match.forEach(matchRule => {
          if (matchRule.invert && matchRule.field) {
            invertedFields.add(matchRule.field);
          }
        });
      }
    });

    // Calculate max values for inverted fields
    invertedFields.forEach(field => {
      const values = musicals
        .map(m => m[field])
        .filter(v => typeof v === 'number' && !isNaN(v));
      fieldMaxValues[field] = values.length > 0 ? Math.max(...values) : 0;
    });

    // Step 2: Apply filter rules
    const filterRules = (Array.isArray(weightsV2.rules) ? weightsV2.rules : []).filter(r => r.mode === 'filter');

    filteredMusicals = filteredMusicals.filter(musical => {
      for (const rule of filterRules) {
        const answer = answers[rule.question_id];
        if (!answer) continue;

        // Check if this rule applies to this answer
        const ruleAppliesToAnswer =
          (typeof answer === 'string' && rule.answer_id === answer) ||
          (Array.isArray(answer) && answer.includes(rule.answer_id));

        if (!ruleAppliesToAnswer) continue;

        const fieldValue = musical[rule.field];
        let passed = true;

        if (rule.value && typeof rule.value === 'string') {
          if (rule.value.startsWith('>=')) {
            const threshold = parseFloat(rule.value.slice(2));
            passed = fieldValue >= threshold;
          } else if (rule.value.startsWith('<=')) {
            const threshold = parseFloat(rule.value.slice(2));
            passed = fieldValue <= threshold;
          } else if (rule.value.startsWith('!=')) {
            const excludeValue = rule.value.slice(2).trim();
            passed = fieldValue !== excludeValue;
          } else if (rule.value === 'TRUE') {
            passed = fieldValue === true;
          } else if (rule.value === 'FALSE') {
            passed = fieldValue === false;
          }
        }

        if (!passed) return false;
      }
      return true;
    });

    // Step 3: Apply scoring rules
    const scoreRules = (Array.isArray(weightsV2.rules) ? weightsV2.rules : []).filter(r => r.mode === 'score');

    const scoredMusicals = filteredMusicals.map(musical => {
      let totalScore = 0;
      const scoreBreakdown = [];

      // Apply regular scoring rules
      for (const rule of scoreRules) {
        const answer = answers[rule.question_id];
        if (!answer) continue;

        const ruleAppliesToAnswer =
          (typeof answer === 'string' && rule.answer_id === answer) ||
          (Array.isArray(answer) && answer.includes(rule.answer_id));

        if (!ruleAppliesToAnswer) continue;

        const fieldValue = musical[rule.field];
        let points = 0;

        if (fieldValue === undefined || fieldValue === null) {
          points = 0;
        } else if (rule.value === 'TRUE' || rule.value === 'FALSE') {
          const expectedValue = rule.value === 'TRUE';
          points = (fieldValue === expectedValue) ? rule.weight : 0;
        } else if (typeof fieldValue === 'number') {
          // Apply inversion if specified
          if (rule.invert === true) {
            const maxValue = fieldMaxValues[rule.field] || 0;
            points = (maxValue - fieldValue) * rule.weight;
          } else {
            points = fieldValue * rule.weight;
          }
        } else if (typeof fieldValue === 'boolean') {
          points = (fieldValue ? 1 : 0) * rule.weight;
        }

        totalScore += points;
        scoreBreakdown.push({
          question_id: rule.question_id,
          answer_id: rule.answer_id,
          field: rule.field,
          points: points,
          reason_snippet: getLocalizedValue(rule, 'reason_snippet')
        });
      }

      // Apply ranking scoring if exists
      if (weightsV2.ranking_question) {
        const rankingQid = weightsV2.ranking_question.question_id;
        const rankedAnswer = answers[rankingQid];

        if (Array.isArray(rankedAnswer) && rankedAnswer.length > 0) {
          const weightCurve = weightsV2.ranking_question.weight_curve || [7, 6, 5, 4, 3, 2, 1];
          const rankingItems = weightsV2.ranking_question.items || [];

          rankedAnswer.forEach((answerId, index) => {
            const rankWeight = weightCurve[index] || 0;
            const item = rankingItems.find(i => i.item_id === answerId);

            if (item && Array.isArray(item.match)) {
              item.match.forEach(matchRule => {
                const fieldValue = musical[matchRule.field];
                let matchScore = 0;

                if (typeof fieldValue === 'number') {
                  // Apply inversion if specified
                  if (matchRule.invert === true) {
                    const maxValue = fieldMaxValues[matchRule.field] || 0;
                    matchScore = (maxValue - fieldValue) * matchRule.weight;
                  } else {
                    matchScore = fieldValue * matchRule.weight;
                  }
                } else if (typeof fieldValue === 'boolean') {
                  matchScore = (fieldValue ? 1 : 0) * matchRule.weight;
                }

                const rankScore = rankWeight * matchScore;
                totalScore += rankScore;

                scoreBreakdown.push({
                  question_id: rankingQid,
                  answer_id: answerId,
                  field: matchRule.field,
                  points: rankScore,
                  reason_snippet: getLocalizedValue(matchRule, 'reason_snippet'),
                  rank_position: index + 1
                });
              });
            }
          });
        }
      }

      return {
        ...musical,
        total_score: totalScore,
        score_breakdown: scoreBreakdown,
        reasons: scoreBreakdown
          .filter(s => s.points > 0 && s.reason_snippet)
          .sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
          .slice(0, 3)
          .map(s => ({ text: s.reason_snippet, points: s.points }))
      };
    });

    // Step 4: Sort by score
    scoredMusicals.sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      return a.show_title.localeCompare(b.show_title);
    });

    return candidateShowIds ? scoredMusicals : scoredMusicals.slice(0, 3);
  };

  // Enhanced Rules Engine with Full Transparency
  const calculateResults = (candidateShowIds = null) => {
    // If candidateShowIds provided (comparison mode), only score those shows
    const candidateMusicals = candidateShowIds
      ? musicals.filter(m => candidateShowIds.includes(m.id))
      : musicals;
    // Step 1: Expand selected answers into (question_id, answer_id) pairs
    const selectedPairs = [];

    for (const [questionId, answer] of Object.entries(answers)) {
      const question = questions.find(q => q.question_id === questionId);
      if (!question) continue;

      if (question.type === 'single') {
        selectedPairs.push({ question_id: questionId, answer_id: answer });
      } else if (question.type === 'multi') {
        for (const answerId of answer) {
          selectedPairs.push({ question_id: questionId, answer_id: answerId });
        }
      } else if (question.type === 'date_range') {
        if (answer.mode === 'specific_dates') {
          selectedPairs.push({
            question_id: questionId,
            answer_id: 'specific_dates',
            user_start_date: answer.user_start_date,
            user_end_date: answer.user_end_date
          });
        }
      }
    }

    // Step 2: Get applicable rules
    const applicableRules = weights.filter(rule =>
      selectedPairs.some(pair =>
        pair.question_id === rule.question_id && pair.answer_id === rule.answer_id
      )
    );

    // Separate filters and scoring rules
    const filterRules = applicableRules.filter(r => r.mode === 'filter');
    const scoreRules = applicableRules.filter(r => r.mode === 'score');

    // Get date info if specific dates selected - convert to ISO format
    const dateAnswer = selectedPairs.find(p => p.question_id === 'q9_dates' || p.question_id === 'q10_dates');
    let userStartDate = dateAnswer?.user_start_date;
    let userEndDate = dateAnswer?.user_end_date;

    console.log('Date answer found:', dateAnswer);
    console.log('Raw dates:', { userStartDate, userEndDate });

    // Helper function to parse DD/MM/YYYY format
    function parseDdMmYyyy(str) {
      if (!str || typeof str !== 'string') return null;

      // Check if already in ISO format (YYYY-MM-DD)
      if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const dateObj = new Date(str);
        return isNaN(dateObj.getTime()) ? null : dateObj;
      }

      // Parse DD/MM/YYYY format
      if (str.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [dayStr, monthStr, yearStr] = str.split("/");
        const day = Number(dayStr);
        const monthIndex = Number(monthStr) - 1; // 0-based month
        const year = Number(yearStr);
        return new Date(year, monthIndex, day);
      }

      // Try generic date parsing as fallback
      const dateObj = new Date(str);
      return isNaN(dateObj.getTime()) ? null : dateObj;
    }

    // Convert to ISO format (YYYY-MM-DD)
    if (userStartDate && typeof userStartDate === 'string') {
      const parsedDate = parseDdMmYyyy(userStartDate);
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        userStartDate = parsedDate.toISOString().slice(0, 10);
      } else {
        console.error('Failed to parse user_start_date:', userStartDate);
        userStartDate = null;
      }
    }
    if (userEndDate && typeof userEndDate === 'string') {
      const parsedDate = parseDdMmYyyy(userEndDate);
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        userEndDate = parsedDate.toISOString().slice(0, 10);
      } else {
        console.error('Failed to parse user_end_date:', userEndDate);
        userEndDate = null;
      }
    }

    console.log('Processed ISO dates:', { userStartDate, userEndDate });

    // Create context object for filter evaluation (support both naming conventions)
    const filterContext = {
      user_start_date: userStartDate,
      user_end_date: userEndDate,
      userStartDate: userStartDate,
      userEndDate: userEndDate
    };

    // Helper function to resolve operands (placeholders like "user_end_date")
    function resolveOperand(operand, context) {
      if (operand === "user_end_date" || operand === "userEndDate") {
        return context.user_end_date || context.userEndDate;
      }
      if (operand === "user_start_date" || operand === "userStartDate") {
        return context.user_start_date || context.userStartDate;
      }
      return operand; // literal value
    }

    // Debug logging
    console.log('=== FILTER DEBUG ===');
    console.log('Total musicals:', candidateMusicals.length);
    console.log('Filter rules:', filterRules.length);
    console.log('Score rules:', scoreRules.length);
    console.log('Filter context:', filterContext);

    // Step 3: Apply filters FIRST (eliminates shows entirely)
    const musicalFilterResults = candidateMusicals.map(musical => {
      const filtersPassed = [];
      const filtersFailed = [];

      for (const rule of filterRules) {
        const fieldValue = musical[rule.field];
        let passed = false;
        let description = '';

        // Handle date filters: show must be running during user's visit
        // A show is running if: show.start_date <= user.end_date AND show.close_date >= user.start_date
        if ((rule.field === 'start_date' || rule.field === 'close_date') &&
          (rule.value.includes('user_end_date') || rule.value.includes('user_start_date'))) {

          // Parse the operator and operand from rule.value (e.g., "<=user_end_date")
          let operator = '';
          let operand = '';

          if (rule.value.startsWith('<=')) {
            operator = '<=';
            operand = rule.value.slice(2).trim();
          } else if (rule.value.startsWith('>=')) {
            operator = '>=';
            operand = rule.value.slice(2).trim();
          }

          // Resolve the operand to actual date value
          const resolvedDateIso = resolveOperand(operand, filterContext);

          if (!resolvedDateIso || resolvedDateIso === 'undefined') {
            passed = true; // fail-safe: don't filter out everything
            description = `No ${operand} specified - skip filter`;
          } else {
            // Parse dates as timestamps
            const leftTs = Date.parse(fieldValue);
            const rightTs = Date.parse(resolvedDateIso);

            // Guard against NaN
            if (Number.isNaN(leftTs) || Number.isNaN(rightTs)) {
              console.error('DateFilter parse failed:', {
                musical: musical.show_title,
                field: rule.field,
                fieldValue,
                operand,
                resolvedDateIso
              });
              passed = true; // fail-safe: skip this filter
              description = `Invalid date parse - skip filter`;
            } else {
              // Compare timestamps
              if (operator === '<=') {
                passed = leftTs <= rightTs;
              } else if (operator === '>=') {
                // Handle "still running" shows
                if (fieldValue === null || fieldValue === '2099-12-31') {
                  passed = true;
                  description = `Show still running (no close date)`;
                } else {
                  passed = leftTs >= rightTs;
                }
              }

              // Debug output
              console.log(`DateFilter: ${musical.show_title} | ${rule.field} ${operator} ${operand} | RHS=${resolvedDateIso} | rhsTs=${rightTs} | ${passed ? 'PASS' : 'FAIL'}`);

              description = `${rule.field} (${fieldValue}) ${operator} ${operand} (${resolvedDateIso}) = ${passed}`;
            }
          }
        }
        // Handle numeric filters
        else if (rule.value && typeof rule.value === 'string') {
          if (rule.value.startsWith('>=')) {
            const threshold = parseFloat(rule.value.slice(2));
            passed = fieldValue >= threshold;
            description = `${rule.field} (${fieldValue}) >= ${threshold}`;
          } else if (rule.value.startsWith('<=')) {
            const threshold = parseFloat(rule.value.slice(2));
            passed = fieldValue <= threshold;
            description = `${rule.field} (${fieldValue}) <= ${threshold}`;
          } else if (rule.value.startsWith('!=')) {
            const excludeValue = rule.value.slice(2).trim();
            // If field is missing/undefined, we can't match it to exclude, so pass it
            if (fieldValue === undefined || fieldValue === null) {
              passed = true;
              description = `${rule.field} is missing - cannot exclude`;
            } else {
              passed = fieldValue !== excludeValue;
              description = `${musical.show_title} | ${rule.field}=${fieldValue} != ${excludeValue} | ${passed ? 'PASS' : 'FAIL (excluded)'}`;
              console.log(description);
            }
          }
        } else {
          passed = true;
        }

        if (passed) {
          filtersPassed.push(description || getLocalizedValue(rule, 'reason_snippet') || `${rule.field} check passed`);
        } else {
          filtersFailed.push(description || getLocalizedValue(rule, 'reason_snippet') || `${rule.field} check failed`);
        }
      }

      return {
        musical,
        filtersPassed,
        filtersFailed,
        passedAllFilters: filtersFailed.length === 0
      };
    });

    // In comparison mode, keep ALL selected shows even if they fail filters
    // In recommendation mode, only keep shows that passed filters
    const filteredMusicals = candidateShowIds
      ? musicalFilterResults // Keep all in comparison mode
      : musicalFilterResults.filter(r => r.passedAllFilters); // Filter in recommendation mode

    console.log('After filtering:', filteredMusicals.length, 'musicals passed');
    if (filteredMusicals.length === 0 && !candidateShowIds) {
      console.log('NO MUSICALS PASSED FILTERS!');
      console.log('Sample failed musical:', musicalFilterResults[0]);
    }

    // Step 4: Apply scoring ONLY to filtered musicals
    const scoredMusicals = filteredMusicals.map(({ musical, filtersPassed, filtersFailed, passedAllFilters }) => {
      let totalScore = 0;
      const scoreBreakdown = [];

      for (const rule of scoreRules) {
        const fieldValue = musical[rule.field];
        let musicalValue = 0;
        let points = 0;

        // Handle missing fields
        if (fieldValue === undefined || fieldValue === null) {
          musicalValue = 0;
          points = 0;
        }
        // Handle boolean field comparisons with TRUE/FALSE values
        else if (rule.value === 'TRUE' || rule.value === 'FALSE') {
          const expectedValue = rule.value === 'TRUE';
          if (fieldValue === expectedValue) {
            musicalValue = 1;
            points = rule.weight;
          } else {
            musicalValue = 0;
            points = 0;
          }
        }
        // Handle numeric scoring
        else if (typeof fieldValue === 'number') {
          musicalValue = fieldValue;
          points = fieldValue * rule.weight;
        }
        // Handle boolean fields (stored as true/false in JSON)
        else if (typeof fieldValue === 'boolean') {
          musicalValue = fieldValue ? 1 : 0;
          points = musicalValue * rule.weight;
        }

        totalScore += points;

        scoreBreakdown.push({
          question_id: rule.question_id,
          answer_id: rule.answer_id,
          field: rule.field,
          musical_value: musicalValue,
          weight: rule.weight,
          points: points,
          reason_snippet: getLocalizedValue(rule, 'reason_snippet') || `${rule.field} contribution`
        });
      }

      // Step: Select diverse reasons with field diversity
      // Build candidate reasons (exclude zero-impact)
      const candidates = scoreBreakdown
        .filter(item => item.points !== 0 && item.reason_snippet)
        .map(item => ({
          ...item,
          impact: item.points,
          abs_impact: Math.abs(item.points)
        }));

      // Sort by: abs_impact desc, then positive over negative, then stable by field/question/answer
      candidates.sort((a, b) => {
        if (b.abs_impact !== a.abs_impact) return b.abs_impact - a.abs_impact;
        if (a.impact > 0 && b.impact < 0) return -1;
        if (a.impact < 0 && b.impact > 0) return 1;
        // Stable tie-breaker
        if (a.field !== b.field) return a.field.localeCompare(b.field);
        if (a.question_id !== b.question_id) return a.question_id.localeCompare(b.question_id);
        return a.answer_id.localeCompare(b.answer_id);
      });

      // First pass: pick up to 3 with field diversity
      const selected = [];
      const usedFields = new Set();

      for (const candidate of candidates) {
        if (!usedFields.has(candidate.field)) {
          selected.push(candidate);
          usedFields.add(candidate.field);
          if (selected.length === 3) break;
        }
      }

      // Second pass: if we have fewer than 3, fill remaining slots (allowing field repeat)
      if (selected.length < 3) {
        const selectedKeys = new Set(selected.map(s => `${s.field}-${s.question_id}-${s.answer_id}`));
        for (const candidate of candidates) {
          const key = `${candidate.field}-${candidate.question_id}-${candidate.answer_id}`;
          if (!selectedKeys.has(key)) {
            selected.push(candidate);
            selectedKeys.add(key);
            if (selected.length === 3) break;
          }
        }
      }

      // Format reasons for display
      const displayReasons = selected.map(s => ({
        text: s.reason_snippet,
        field: s.field,
        points: s.impact,
        question_id: s.question_id,
        answer_id: s.answer_id
      }));

      return {
        ...musical,
        total_score: totalScore,
        score_breakdown: scoreBreakdown,
        applied_rules: scoreBreakdown, // For comparison analysis
        filters_passed: filtersPassed,
        filters_failed: filtersFailed || [],
        passed_all_filters: passedAllFilters,
        reasons: displayReasons,
        debug_candidates: candidates, // for verification
        breakdown: {
          show_title: musical.show_title,
          total_score: totalScore,
          score_breakdown: scoreBreakdown,
          filters_passed: filtersPassed,
          ranked_candidates: candidates,
          selected_reasons: selected
        }
      };
    });

    // Step 5: Sort results
    // In comparison mode, prioritize shows that passed all filters
    scoredMusicals.sort((a, b) => {
      // In comparison mode, prioritize shows that passed filters
      if (candidateShowIds) {
        if (a.passed_all_filters !== b.passed_all_filters) {
          return b.passed_all_filters ? 1 : -1; // passed filters come first
        }
      }

      // Primary: total_score descending
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      // Secondary: beginner_friendly descending
      if (b.beginner_friendly !== a.beginner_friendly) return b.beginner_friendly - a.beginner_friendly;
      // Tertiary: spectacle_level descending
      if (b.spectacle_level !== a.spectacle_level) return b.spectacle_level - a.spectacle_level;
      // Quaternary: alphabetical
      return a.show_title.localeCompare(b.show_title);
    });

    // In comparison mode, return all scored shows (not just top 3)
    if (candidateShowIds) {
      return scoredMusicals;
    }

    return scoredMusicals.slice(0, 3);
  };

  // Bidirectional human preference mapping (weight-sign aware)
  const fieldToHumanPreference = {
    darkness_level: {
      positive: t('preference.darkness_level.positive'),
      negative: t('preference.darkness_level.negative')
    },
    jukebox: {
      positive: t('preference.jukebox.positive'),
      negative: t('preference.jukebox.negative')
    },
    music_familiarity: {
      positive: t('preference.music_familiarity.positive'),
      negative: t('preference.music_familiarity.negative')
    },
    spectacle_level: {
      positive: t('preference.spectacle_level.positive'),
      negative: t('preference.spectacle_level.negative')
    },
    comedy_score: {
      positive: t('preference.comedy_score.positive'),
      negative: t('preference.comedy_score.negative')
    },
    family_score: {
      positive: t('preference.family_score.positive'),
      negative: t('preference.family_score.negative')
    },
    family_friendly: {
      positive: t('preference.family_friendly.positive'),
      negative: t('preference.family_friendly.negative')
    },
    beginner_friendly: {
      positive: t('preference.beginner_friendly.positive'),
      negative: t('preference.beginner_friendly.negative')
    },
    emotional_intensity: {
      positive: t('preference.emotional_intensity.positive'),
      negative: t('preference.emotional_intensity.negative')
    },
    tone_match: {
      positive: t('preference.tone_match.positive'),
      negative: t('preference.tone_match.negative')
    },
    energy_level: {
      positive: t('preference.energy_level.positive'),
      negative: t('preference.energy_level.negative')
    },
    romance_score: {
      positive: t('preference.romance_score.positive'),
      negative: t('preference.romance_score.negative')
    },
    humor_level: {
      positive: t('preference.humor_level.positive'),
      negative: t('preference.humor_level.negative')
    },
    music_quality: {
      positive: t('preference.music_quality.positive'),
      negative: t('preference.music_quality.negative')
    },
    story_depth: {
      positive: t('preference.story_depth.positive'),
      negative: t('preference.story_depth.negative')
    },
    classic: {
      positive: t('preference.classic.positive'),
      negative: t('preference.classic.negative')
    },
    must_see: {
      positive: t('preference.must_see.positive'),
      negative: t('preference.must_see.negative')
    },
    hidden_gem: {
      positive: t('preference.hidden_gem.positive'),
      negative: t('preference.hidden_gem.negative')
    }
  };

  // Generate field-specific comparison bullets
  const generateFieldComparison = (field, winner, show) => {
    const wValue = winner[field] || 5;
    const sValue = show[field] || 5;

    const comparisons = {
      spectacle_level: [
        t('comparison.spectacle_level.0', { winner: winner.show_title, loser: show.show_title }),
        t('comparison.spectacle_level.1', { winner: winner.show_title, loser: show.show_title })
      ],
      humor_level: [
        t('comparison.humor_level.0', { winner: winner.show_title, loser: show.show_title }),
        t('comparison.humor_level.1', { winner: winner.show_title, loser: show.show_title })
      ],
      comedy_score: [
        t('comparison.comedy_score.0', { winner: winner.show_title, loser: show.show_title }),
        t('comparison.comedy_score.1', { winner: winner.show_title, loser: show.show_title })
      ],
      emotional_intensity: wValue > sValue ? [
        t('comparison.emotional_intensity.high_vs_low.0', { winner: winner.show_title, loser: show.show_title }),
        t('comparison.emotional_intensity.high_vs_low.1', { winner: winner.show_title, loser: show.show_title })
      ] : [
        t('comparison.emotional_intensity.low_vs_high.0', { winner: winner.show_title, loser: show.show_title }),
        t('comparison.emotional_intensity.low_vs_high.1', { winner: winner.show_title, loser: show.show_title })
      ],
      energy_level: [
        t('comparison.energy_level.0', { winner: winner.show_title, loser: show.show_title }),
        t('comparison.energy_level.1', { winner: winner.show_title, loser: show.show_title })
      ],
      beginner_friendly: [
        t('comparison.beginner_friendly.0', { winner: winner.show_title, loser: show.show_title }),
        t('comparison.beginner_friendly.1', { winner: winner.show_title, loser: show.show_title })
      ],
      family_friendly: [
        t('comparison.family_friendly.0', { winner: winner.show_title, loser: show.show_title }),
        t('comparison.family_friendly.1', { winner: winner.show_title, loser: show.show_title })
      ],
      family_score: [
        t('comparison.family_score.0', { winner: winner.show_title, loser: show.show_title }),
        t('comparison.family_score.1', { winner: winner.show_title, loser: show.show_title })
      ],
      jukebox: [
        t('comparison.jukebox.0', { winner: winner.show_title, loser: show.show_title }),
        t('comparison.jukebox.1', { winner: winner.show_title, loser: show.show_title })
      ],
      music_familiarity: [
        t('comparison.music_familiarity.0', { winner: winner.show_title, loser: show.show_title }),
        t('comparison.music_familiarity.1', { winner: winner.show_title, loser: show.show_title })
      ],
      classic: [
        t('comparison.classic.0', { winner: winner.show_title, loser: show.show_title }),
        t('comparison.classic.1', { winner: winner.show_title, loser: show.show_title })
      ],
      romance_score: [
        t('comparison.romance_score.0', { winner: winner.show_title, loser: show.show_title }),
        t('comparison.romance_score.1', { winner: winner.show_title, loser: show.show_title })
      ]
    };

    return comparisons[field] || [
      t('comparison.default.0', { winner: winner.show_title }),
      t('comparison.default.1', { loser: show.show_title })
    ];
  };

  // Generate "Why this is #1" bullets for winner
  const generateWinnerReasons = (winner) => {
    if (!winner.applied_rules || winner.applied_rules.length === 0) return [];

    // Aggregate points by field (positive contributions only)
    const fieldPoints = {};
    winner.applied_rules.forEach(rule => {
      if (rule.points > 0) {
        if (!fieldPoints[rule.field]) {
          fieldPoints[rule.field] = { total: 0, snippets: [] };
        }
        fieldPoints[rule.field].total += rule.points;
        if (rule.reason_snippet) {
          fieldPoints[rule.field].snippets.push(rule.reason_snippet);
        }
      }
    });

    // Sort by total points descending
    const sortedFields = Object.entries(fieldPoints)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 3);

    // Convert to bullets
    return sortedFields.map(([field, data]) => {
      // Use the best snippet or a field template
      if (data.snippets.length > 0) {
        return data.snippets[0];
      }
      return `${t('comparison.strong_on', { preference: fieldToHumanPreference[field] ? fieldToHumanPreference[field].positive : field })}`;
    });
  };

  // Map question answers to fields they affect
  const getExplicitUserFields = (userAnswers) => {
    const explicitFields = new Set();
    const secondaryFields = new Set();

    // Map user answers to fields
    const answerToFields = {
      'q1_show_type': ['classic', 'must_see', 'hidden_gem'],
      'q2_kids': ['family_friendly', 'family_score'],
      'q3_mood': ['tone_match', 'emotional_intensity', 'darkness_level'],
      'q4_themes': ['romance_score', 'comedy_score', 'spectacle_level'],
      'q5_music': ['jukebox', 'music_familiarity', 'music_quality'],
      'q6_english_level': ['beginner_friendly'],
      'q7_duration': ['duration_minutes'],
      'q8_energy': ['energy_level', 'spectacle_level']
    };

    // Secondary fields allowed when user says "no preference"
    const secondaryAllowedFields = [
      'classic', 'hidden_gem', 'must_see',
      'spectacle_level', 'comedy_score', 'darkness_level'
    ];

    Object.entries(userAnswers).forEach(([qid, answer]) => {
      const fields = answerToFields[qid];
      if (fields) {
        fields.forEach(f => explicitFields.add(f));
      }

      // If user said "no preference", allow secondary fields as well
      if (answer === 'no_preference' || answer === 'any') {
        secondaryAllowedFields.forEach(f => secondaryFields.add(f));
      }
    });

    return { explicitFields, secondaryFields };
  };

  // Generate comparison reasons based on scoring deltas
  const generateComparisonReasons = (winner, others, userAnswers) => {
    const usedFields = new Set();
    const { explicitFields, secondaryFields } = getExplicitUserFields(userAnswers);

    console.log('=== COMPARISON REASONS DEBUG ===');
    console.log('Winner:', winner.show_title);
    console.log('Explicit fields:', Array.from(explicitFields));
    console.log('Secondary fields:', Array.from(secondaryFields));

    return others.map(show => {
      console.log(`\n--- Processing: ${show.show_title} (id: ${show.id}) ---`);

      // Check for date failure first
      const hasDateFailure = show.filters_failed?.some(f => f.includes('date') || f.includes('running'));

      // Priority 1: Failed filters (hard constraints)
      if (show.filters_failed && show.filters_failed.length > 0) {
        const hasKidsAnswer = userAnswers.q2_kids === 'yes';
        const wantsShort = userAnswers.q7_duration === 'short';
        const englishLevel = userAnswers.q6_english_level;

        // Priority order: dates > kids > length > English
        if (hasDateFailure) {
          console.log("COMPARE_REASON_DEBUG", {
            showId: show.id,
            winnerId: winner.id,
            failedFilters: show.filters_failed,
            eligibleFields: [],
            chosenField: null,
            reasonType: "dates",
            fallbackWhy: null
          });
          return t('comparison.date_mismatch');
        }

        const kidsFailure = show.filters_failed.find(f => (f.includes('family_friendly') || f.includes('kid')) && hasKidsAnswer);
        if (kidsFailure) {
          console.log("COMPARE_REASON_DEBUG", {
            showId: show.id,
            winnerId: winner.id,
            failedFilters: show.filters_failed,
            eligibleFields: [],
            chosenField: null,
            reasonType: "kids",
            fallbackWhy: null
          });
          return t('comparison.kids_mismatch', { winner: winner.show_title });
        }

        const durationFailure = show.filters_failed.find(f => f.includes('duration') || f.includes('length'));
        if (durationFailure && wantsShort) {
          console.log("COMPARE_REASON_DEBUG", {
            showId: show.id,
            winnerId: winner.id,
            failedFilters: show.filters_failed,
            eligibleFields: [],
            chosenField: null,
            reasonType: "duration",
            fallbackWhy: null
          });
          return t('comparison.duration_mismatch', { winner: winner.show_title });
        }

        const englishFailure = show.filters_failed.find(f => f.includes('english') || f.includes('language'));
        if (englishFailure && (englishLevel === 'basic' || englishLevel === 'easy')) {
          console.log("COMPARE_REASON_DEBUG", {
            showId: show.id,
            winnerId: winner.id,
            failedFilters: show.filters_failed,
            eligibleFields: [],
            chosenField: null,
            reasonType: "english",
            fallbackWhy: null
          });
          return t('comparison.english_mismatch', { winner: winner.show_title });
        }
      }

      // Priority 2: Find explicit preference mismatch

      // Compute effective weights for all fields (from both shows)
      const computeEffectiveWeight = (showData, field) => {
        let totalWeight = 0;
        (showData.applied_rules || []).forEach(rule => {
          if (rule.field === field) {
            totalWeight += rule.weight;
          }
        });
        return totalWeight;
      };

      const fieldPoints = (showData) => {
        const byField = {};
        (showData.applied_rules || []).forEach(rule => {
          if (!byField[rule.field]) byField[rule.field] = 0;
          byField[rule.field] += rule.points;
        });
        return byField;
      };

      const winnerFields = fieldPoints(winner);
      const showFields = fieldPoints(show);

      // Build ALL candidate fields by scoring delta
      const allCandidates = [];
      const allFields = new Set([...Object.keys(winnerFields), ...Object.keys(showFields)]);

      allFields.forEach(field => {
        const wPoints = winnerFields[field] || 0;
        const sPoints = showFields[field] || 0;
        const delta = wPoints - sPoints;

        if (delta > 0.1) {
          // Compute effective weight to determine direction preference
          const effectiveWeight = computeEffectiveWeight(winner, field) + computeEffectiveWeight(show, field);

          // Check if field is allowed
          const isExplicit = explicitFields.has(field);
          const isSecondary = secondaryFields.has(field);
          const isAllowed = isExplicit || isSecondary;

          allCandidates.push({
            field,
            delta,
            isAllowed,
            winnerValue: winner[field],
            showValue: show[field],
            effectiveWeight
          });
        }
      });

      // Sort by delta descending
      allCandidates.sort((a, b) => b.delta - a.delta);

      console.log(`Total candidates: ${allCandidates.length}`);
      console.log('Top candidates:', allCandidates.slice(0, 5).map(c =>
        `${c.field}(delta=${c.delta.toFixed(2)}, weight=${c.effectiveWeight.toFixed(2)}, allowed=${c.isAllowed})`
      ));

      // Iterate through candidates to find first valid one
      let chosenField = null;
      let chosenWeightSign = null;
      let fallbackWhy = null;

      for (const candidate of allCandidates) {
        // Skip if not allowed
        if (!candidate.isAllowed) {
          continue;
        }

        // Skip if already used
        if (usedFields.has(candidate.field)) {
          continue;
        }

        // Weight-sign aware direction validation
        const effectiveWeight = candidate.effectiveWeight;
        const winnerValue = candidate.winnerValue;
        const showValue = candidate.showValue;

        // Skip if no effective weight (not eligible for comparison)
        if (Math.abs(effectiveWeight) < 0.01) {
          console.log(`  Skipped "${candidate.field}": zero effective weight`);
          continue;
        }

        let validDirection = false;

        if (typeof winnerValue === 'number' && typeof showValue === 'number') {
          if (effectiveWeight > 0) {
            // Higher is better
            validDirection = winnerValue > showValue - 0.5;
          } else {
            // Lower is better
            validDirection = winnerValue < showValue + 0.5;
          }
        } else if (typeof winnerValue === 'boolean' && typeof showValue === 'boolean') {
          if (effectiveWeight > 0) {
            validDirection = winnerValue && !showValue;
          } else {
            validDirection = !winnerValue && showValue;
          }
        } else {
          // Trust scoring if values are undefined
          validDirection = true;
        }

        if (!validDirection) {
          console.log(`  Skipped "${candidate.field}": failed direction check (weight=${effectiveWeight}, winner=${winnerValue}, show=${showValue})`);
          continue;
        }

        // Check if mapping exists
        const mapping = fieldToHumanPreference[candidate.field];
        if (!mapping) {
          console.log(`  Skipped "${candidate.field}": no human mapping`);
          continue;
        }

        // Check if appropriate direction exists in mapping
        const direction = effectiveWeight > 0 ? 'positive' : 'negative';
        if (typeof mapping === 'object' && !mapping[direction]) {
          console.log(`  Skipped "${candidate.field}": missing ${direction} mapping`);
          continue;
        }

        // Found valid candidate!
        chosenField = candidate.field;
        chosenWeightSign = effectiveWeight > 0 ? 'positive' : 'negative';
        usedFields.add(candidate.field);
        break;
      }

      // Determine fallback reason if no field chosen
      if (!chosenField) {
        const eligibleCandidates = allCandidates.filter(c => c.isAllowed);
        if (eligibleCandidates.length === 0) {
          fallbackWhy = "noEligibleFields";
        } else if (allCandidates.some(c => c.isAllowed && !fieldToHumanPreference[c.field])) {
          fallbackWhy = "missingMapping";
        } else if (allCandidates.some(c => c.isAllowed)) {
          fallbackWhy = "directionBlocked";
        } else {
          fallbackWhy = "noAppliedRules";
        }
      }

      const eligibleFields = allCandidates.filter(c => c.isAllowed).map(c => c.field);

      console.log("COMPARE_REASON_DEBUG", {
        showId: show.id,
        winnerId: winner.id,
        failedFilters: show.filters_failed || [],
        eligibleFields: eligibleFields,
        chosenField: chosenField || null,
        reasonType: chosenField ? "preference" : "fallback",
        fallbackWhy: fallbackWhy || null
      });

      if (chosenField) {
        const mapping = fieldToHumanPreference[chosenField];
        const humanPreference = typeof mapping === 'object' ? mapping[chosenWeightSign] : mapping;
        const reason = t('comparison.preference_match', { winner: winner.show_title, preference: humanPreference, loser: show.show_title });
        return reason;
      }

      // Fallback: generic
      return t('comparison.overall_match', { winner: winner.show_title, loser: show.show_title });
    });
  };

  const handleSubmit = async () => {
    // Prevent double execution
    if (isSubmittingRef.current) {
      console.warn('[QUIZ_FINISH] Already submitting, ignoring duplicate call');
      return;
    }

    const runTimestamp = Date.now();
    console.log(`[QUIZ_FINISH] Starting run at ${runTimestamp}`);

    isSubmittingRef.current = true;
    setPhase('loading');
    setScoringError(null);

    try {
      console.log('[QUIZ_FINISH] phase=computeScoring', { timestamp: Date.now() });

      const candidatesBeforeFilter = mode === 'comparison'
        ? selectedShowIds.length
        : musicals.length;

      // Use V2 scoring for V2 mode
      const recommendations = mode === 'recommendation_v2'
        ? calculateResultsV2()
        : mode === 'comparison'
          ? calculateResults(selectedShowIds)
          : calculateResults();

      console.log('[QUIZ_FINISH] phase=scoringComplete', {
        resultsCount: recommendations.length,
        timestamp: Date.now()
      });

      const candidatesAfterFilter = recommendations.length;

      console.log('[QUIZ_FINISH] phase=computeComparisons', { timestamp: Date.now() });

      // In comparison mode, add comparison reasons to non-winner shows
      if (mode === 'comparison' && recommendations.length > 0) {
        const winner = recommendations[0];

        // Add "Why this is #1" bullets to winner
        winner.why_winner = generateWinnerReasons(winner);

        if (recommendations.length > 1) {
          const others = recommendations.slice(1);
          const comparisonReasons = generateComparisonReasons(winner, others, answers);

          others.forEach((show, idx) => {
            show.comparison_reason = comparisonReasons[idx];
          });
        }
      }

      console.log('[QUIZ_FINISH] phase=importSDK', { timestamp: Date.now() });

      // Generate LLM explanations for top recommendations
      const { base44 } = await import('@/api/base44Client');

      // Check if any show fails dates (for comparison mode)
      const anyShowFailsDates = mode === 'comparison' && recommendations.some(show =>
        show.filters_failed && show.filters_failed.some(f => f.includes('date') || f.includes('running'))
      );

      console.log('[QUIZ_FINISH] phase=generateLLMExplanations', { timestamp: Date.now() });

      // In comparison mode, generate LLM explanations
      if (mode === 'comparison' && recommendations.length > 0) {
        const winner = recommendations[0];

        // Generate "Why this is #1" for winner
        try {
          console.log('[QUIZ_FINISH] phase=generateWinnerExplanation', { timestamp: Date.now() });
          const winnerUserPreferences = [];
          Object.entries(answers).forEach(([qid, answer]) => {
            const question = questions.find(q => q.question_id === qid);
            if (!question) return;

            if (question.type === 'single') {
              const answerObj = question.answers.find(a => a.answer_id === answer);
              if (answerObj) winnerUserPreferences.push(answerObj.answer_text);
            } else if (question.type === 'multi' && Array.isArray(answer)) {
              answer.forEach(aid => {
                const answerObj = question.answers.find(a => a.answer_id === aid);
                if (answerObj) winnerUserPreferences.push(answerObj.answer_text);
              });
            } else if (question.type === 'date_range' && answer?.mode === 'specific_dates') {
              winnerUserPreferences.push(`Dates: ${answer.user_start_date} to ${answer.user_end_date}`);
            }
          });

          // Build winner and compared shows data
          const buildShowData = (show) => ({
            title: show.show_title,
            description: show.description,
            tags: show.tags || [],
            attributes: {
              family_score: show.family_score,
              spectacle_level: show.spectacle_level,
              comedy_score: show.comedy_score,
              romance_score: show.romance_score,
              classic: show.classic,
              jukebox: show.jukebox,
              darkness_level: show.darkness_level,
              beginner_friendly: show.beginner_friendly,
              english_score: show.english_score,
              high_energy: show.energy_level,
              music_familiarity: show.music_familiarity
            }
          });

          const winnerResponse = await base44.functions.invoke('generateRecommendationCopy', {
            mode: 'comparison_intro',
            language: i18n.language,
            winner: buildShowData(winner),
            compared_shows: recommendations.map(buildShowData),
            user_preferences: winnerUserPreferences
          });

          if (winnerResponse.data && winnerResponse.data.sentence) {
            if (!winner.llm_explanation) {
              winner.llm_explanation = {};
            }
            winner.llm_explanation.sentence = winnerResponse.data.sentence;
            winner.llm_explanation.bullets = [];
          } else if (winnerResponse.data && winnerResponse.data.needs_fallback) {
            // Fallback: deterministic sentence
            const PHRASE = {
              classic: "a more classic musical feel",
              family_score: "a more family-friendly vibe",
              spectacle_level: "bigger visual spectacle",
              comedy_score: "stronger comedy",
              romance_score: "more romance and emotion",
              beginner_friendly: "an easier first musical experience",
              english_score: "more language-heavy storytelling",
              darkness_level: "a darker, more serious tone",
              jukebox: "more familiar hit songs",
              energy_level: "a higher-energy night out",
              music_familiarity: "more recognisable music"
            };

            // Find top differentiators
            const losers = recommendations.slice(1);
            const fieldDeltas = {};

            // Calculate deltas for key fields
            const keyFields = ['classic', 'family_score', 'spectacle_level', 'comedy_score', 'romance_score',
              'beginner_friendly', 'darkness_level', 'jukebox', 'energy_level', 'music_familiarity'];

            keyFields.forEach(field => {
              if (typeof winner[field] === 'number' || typeof winner[field] === 'boolean') {
                const winnerValue = typeof winner[field] === 'boolean' ? (winner[field] ? 10 : 0) : winner[field];
                const avgLoserValue = losers.reduce((sum, loser) => {
                  const loserValue = typeof loser[field] === 'boolean' ? (loser[field] ? 10 : 0) : (loser[field] || 5);
                  return sum + loserValue;
                }, 0) / losers.length;

                fieldDeltas[field] = winnerValue - avgLoserValue;
              }
            });

            // Sort by absolute delta and get top 2
            const topDifferentiators = Object.entries(fieldDeltas)
              .filter(([field]) => field !== 'start_date' && field !== 'close_date')
              .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
              .slice(0, 2)
              .filter(([field, delta]) => Math.abs(delta) > 0.5 && PHRASE[field]);

            let fallbackSentence;
            if (topDifferentiators.length >= 2) {
              fallbackSentence = `${winner.show_title} comes out on top because it matches your preference for ${PHRASE[topDifferentiators[0][0]]} and ${PHRASE[topDifferentiators[1][0]]} better than the other options.`;
            } else if (topDifferentiators.length === 1) {
              fallbackSentence = `${winner.show_title} comes out on top because it matches your preference for ${PHRASE[topDifferentiators[0][0]]} best.`;
            } else {
              fallbackSentence = `${winner.show_title} comes out on top because it best matches your overall preferences.`;
            }

            if (!winner.llm_explanation) {
              winner.llm_explanation = {};
            }
            winner.llm_explanation.sentence = fallbackSentence;
            winner.llm_explanation.bullets = [];
          }
        } catch (error) {
          console.error('Failed to generate winner explanation:', error);
        }

        // Rewrite comparison sentences with LLM
        if (recommendations.length > 1) {
          const others = recommendations.slice(1);

          // Build user preferences list from answers
          const userPreferences = [];
          Object.entries(answers).forEach(([qid, answer]) => {
            const question = questions.find(q => q.question_id === qid);
            if (!question) return;

            if (question.type === 'single') {
              const answerObj = question.answers.find(a => a.answer_id === answer);
              if (answerObj) userPreferences.push(answerObj.answer_text);
            } else if (question.type === 'multi' && Array.isArray(answer)) {
              answer.forEach(aid => {
                const answerObj = question.answers.find(a => a.answer_id === aid);
                if (answerObj) userPreferences.push(answerObj.answer_text);
              });
            } else if (question.type === 'date_range' && answer?.mode === 'specific_dates') {
              userPreferences.push(`Dates: ${answer.user_start_date} to ${answer.user_end_date}`);
            }
          });

          // Helper to build show summary
          const buildShowSummary = (show) => ({
            classic_vs_hidden: show.classic ? 'classic' : (show.hidden_gem ? 'hidden_gem' : (show.must_see ? 'must_see' : 'standard')),
            music_style: show.jukebox ? 'jukebox' : 'original',
            tone: show.darkness_level > 6 ? 'dark' : (show.darkness_level < 4 ? 'light' : 'balanced'),
            energy: show.energy_level > 6 ? 'high' : (show.energy_level < 4 ? 'low' : 'medium'),
            spectacle: show.spectacle_level > 6 ? 'high' : (show.spectacle_level < 4 ? 'low' : 'medium'),
            family_friendly: show.family_friendly === true,
            beginner_friendly: show.beginner_friendly === true,
            length_minutes: show.duration_minutes
          });

          // Helper to generate candidate angles for a show
          const generateCandidates = (winner, loser) => {
            const candidates = [];

            // Compare music style
            if (winner.jukebox !== loser.jukebox) {
              const angleText = winner.jukebox
                ? 'familiar songs (jukebox-style music)'
                : 'original music';
              candidates.push({ angle_id: 'music_style', angle_text: angleText });
            }

            // Compare tone
            if (Math.abs(winner.darkness_level - loser.darkness_level) > 2) {
              const angleText = winner.darkness_level > loser.darkness_level
                ? 'darker, more intense tone'
                : 'lighter, more feel-good tone';
              candidates.push({ angle_id: 'tone', angle_text: angleText });
            }

            // Compare spectacle
            if (Math.abs(winner.spectacle_level - loser.spectacle_level) > 2) {
              const angleText = winner.spectacle_level > loser.spectacle_level
                ? 'big spectacle and visual wow'
                : 'more intimate, story-led approach';
              candidates.push({ angle_id: 'spectacle', angle_text: angleText });
            }

            // Compare energy
            if (Math.abs(winner.energy_level - loser.energy_level) > 2) {
              const angleText = winner.energy_level > loser.energy_level
                ? 'high energy'
                : 'more relaxed pace';
              candidates.push({ angle_id: 'energy', angle_text: angleText });
            }

            // Compare classic vs hidden gem
            if (winner.classic && !loser.classic) {
              candidates.push({ angle_id: 'classic_vs_hidden', angle_text: 'classic musical status' });
            } else if (winner.hidden_gem && !loser.hidden_gem) {
              candidates.push({ angle_id: 'classic_vs_hidden', angle_text: 'something different and unique' });
            } else if (winner.must_see && !loser.must_see) {
              candidates.push({ angle_id: 'classic_vs_hidden', angle_text: 'must-see crowd-pleaser vibe' });
            }

            // Compare family friendliness
            if (winner.family_friendly !== loser.family_friendly) {
              const angleText = winner.family_friendly
                ? 'family-friendly content'
                : 'more adult-focused themes';
              candidates.push({ angle_id: 'family', angle_text: angleText });
            }

            // Compare beginner friendliness
            if (winner.beginner_friendly !== loser.beginner_friendly) {
              const angleText = winner.beginner_friendly
                ? 'easy to follow for first-timers'
                : 'better suited for experienced musical fans';
              candidates.push({ angle_id: 'beginner', angle_text: angleText });
            }

            // If no strong differences found, add generic fallback
            if (candidates.length === 0) {
              candidates.push({ angle_id: 'overall', angle_text: 'overall match to your preferences' });
            }

            return candidates.slice(0, 3); // Return top 3
          };

          const usedAngles = new Set();

          for (const show of others) {
            // Skip LLM if show failed dates
            const hasDateFailure = show.filters_failed && show.filters_failed.some(f =>
              f.includes('date') || f.includes('running')
            );

            if (hasDateFailure) {
              continue; // Keep the deterministic sentence
            }

            // Generate candidate angles for this show
            const candidates = generateCandidates(winner, show);

            try {
              const response = await base44.functions.invoke('generateRecommendationCopy', {
                mode: 'comparison_full',
                winner: {
                  title: winner.show_title,
                  summary: buildShowSummary(winner)
                },
                loser: {
                  title: show.show_title,
                  summary: buildShowSummary(show)
                },
                user_preferences: userPreferences,
                candidates: candidates,
                forbidden_angles: Array.from(usedAngles),
                language: i18n.language
              });

              if (response.data && response.data.sentence) {
                show.comparison_reason = response.data.sentence;

                // Track which angle was likely used
                const usedCandidate = candidates.find(c => !usedAngles.has(c.angle_id));
                if (usedCandidate) {
                  usedAngles.add(usedCandidate.angle_id);
                }
              }
            } catch (error) {
              console.error('Failed to generate comparison sentence for', show.show_title, error);
              // Keep the original deterministic sentence
            }
          }
        }
      }

      // Build comprehensive user preferences list
      const allUserPreferences = [];
      Object.entries(answers).forEach(([qid, answer]) => {
        const question = questions.find(q => q.question_id === qid);
        if (!question) return;

        if (question.type === 'single') {
          const answerObj = question.answers.find(a => a.answer_id === answer);
          if (answerObj) allUserPreferences.push(answerObj.answer_text);
        } else if (question.type === 'multi' && Array.isArray(answer)) {
          answer.forEach(aid => {
            const answerObj = question.answers.find(a => a.answer_id === aid);
            if (answerObj) allUserPreferences.push(answerObj.answer_text);
          });
        }
      });

      console.log('[QUIZ_FINISH] phase=generateRecommendationExplanations', { timestamp: Date.now() });

      const alreadyUsedAngles = [];

      for (const [index, show] of recommendations.slice(0, mode === 'comparison' ? 1 : 3).entries()) {
        try {
          console.log(`[QUIZ_FINISH] phase=generateShowExplanation index=${index}`, { timestamp: Date.now() });
          // Get top matching reasons for this specific show
          const topMatchingReasons = (show.reasons || [])
            .filter(r => r.points > 0)
            .slice(0, 3)
            .map(r => r.text);

          const response = await base44.functions.invoke('generateRecommendationCopy', {
            mode: mode === 'comparison' ? 'comparison' : 'recommendation',
            rank: index + 1,
            user_preferences: allUserPreferences,
            show: {
              title: show.show_title,
              top_matching_reasons: topMatchingReasons
            },
            show: {
              title: show.show_title,
              top_matching_reasons: topMatchingReasons
            },
            already_used_angles: alreadyUsedAngles,
            language: i18n.language
          });

          if (response.data && response.data.explanation) {
            show.llm_explanation = {
              sentence: response.data.explanation,
              bullets: response.data.bullets || []
            };

            // Track the angle used (extract from the explanation or reasons)
            if (topMatchingReasons.length > 0) {
              alreadyUsedAngles.push(topMatchingReasons[0]);
            }
          }
        } catch (error) {
          console.error('Failed to generate LLM explanation for', show.show_title, error);
          // Continue without LLM explanation
        }
      }

      console.log('[QUIZ_FINISH] phase=setResults', {
        resultsCount: recommendations.length,
        timestamp: Date.now()
      });

      setResults(recommendations);
      setPhase('results');

      console.log('[QUIZ_FINISH] phase=adminLogging', { timestamp: Date.now() });

      // Log search to admin database (non-blocking - failures here should not affect UI)
      try {
        const { base44 } = await import('@/api/base44Client');

        // Get or create session ID
        let sessionId = sessionStorage.getItem('quiz_session_id');
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          sessionStorage.setItem('quiz_session_id', sessionId);
        }

        const dateAnswer = Object.entries(answers).find(([qid]) => qid === 'q9_dates' || qid === 'q10_dates');

        // Build LLM outputs for recommendation mode
        let recommendationLlmOutputs = null;
        if (mode === 'recommendation') {
          recommendationLlmOutputs = {
            top_recommendations: recommendations.slice(0, 3).map((r, idx) => ({
              rank: idx + 1,
              show_id: r.id,
              show_title: r.show_title,
              why_recommend_text: r.llm_explanation?.sentence || null,
              bullets: r.llm_explanation?.bullets || [],
              created_at: new Date().toISOString()
            }))
          };
        }

        // Build LLM outputs for comparison mode
        let comparisonLlmOutputs = null;
        if (mode === 'comparison' && recommendations.length > 0) {
          const winner = recommendations[0];
          const losers = recommendations.slice(1);

          comparisonLlmOutputs = {
            winner: {
              show_id: winner.id,
              show_title: winner.show_title,
              why_winner_text: winner.llm_explanation?.sentence || null,
              bullets: winner.llm_explanation?.bullets || []
            },
            per_loser_explanations: losers.map(loser => ({
              loser_show_id: loser.id,
              loser_show_title: loser.show_title,
              compare_sentence: loser.comparison_reason || null
            })),
            created_at: new Date().toISOString()
          };
        }

        // Unified admin search logging
        const adminSearchRecord = {
          mode: mode === 'comparison' ? 'comparison' : 'full_recommendation',
          answers: answers,
          selected_show_ids: mode === 'comparison' ? selectedShowIds : undefined,
          user_start_date: dateAnswer?.[1]?.user_start_date || null,
          user_end_date: dateAnswer?.[1]?.user_end_date || null,
          candidates_before_filter: candidatesBeforeFilter,
          candidates_after_filter: candidatesAfterFilter,
          top_recommendations: recommendations.map((r, idx) => ({
            id: r.id,
            show_title: r.show_title,
            total_score: r.total_score,
            rank: idx + 1
          })),
          recommendation_llm_outputs: recommendationLlmOutputs,
          comparison_llm_outputs: comparisonLlmOutputs
        };

        const createdRecord = await base44.entities.AdminSearch.create(adminSearchRecord);
        setAdminSearchId(createdRecord.id);
        console.log('[QUIZ_FINISH] phase=adminLoggingComplete', { timestamp: Date.now() });
      } catch (adminError) {
        console.error('[QUIZ_FINISH] phase=adminLoggingFailed (non-blocking)', adminError);
        // Don't block the user experience if logging fails - this is non-critical
      }

      console.log(`[QUIZ_FINISH] Success - completed at ${Date.now()}`);

    } catch (error) {
      console.error('[QUIZ_FINISH] CRITICAL ERROR - Run timestamp:', runTimestamp);
      console.error('[QUIZ_FINISH] Error object:', error);
      console.error('[QUIZ_FINISH] Error type:', typeof error);
      console.error('[QUIZ_FINISH] Error name:', error?.name);
      console.error('[QUIZ_FINISH] Error message:', error?.message);
      console.error('[QUIZ_FINISH] Error stack:', error?.stack);
      console.error('[QUIZ_FINISH] Mode:', mode);
      console.error('[QUIZ_FINISH] Answers:', JSON.stringify(answers, null, 2));
      console.error('[QUIZ_FINISH] Questions loaded:', mode === 'recommendation_v2' ? !!questionsV2 : !!questions);
      console.error('[QUIZ_FINISH] Weights loaded:', mode === 'recommendation_v2' ? !!weightsV2 : !!weights);

      // Determine which phase failed by checking the last logged phase
      let failedPhase = 'unknown';
      const stackStr = error?.stack || '';

      if (stackStr.includes('calculateResults') || stackStr.includes('calculateResultsV2')) {
        if (stackStr.includes('ranking')) failedPhase = 'ranking_scoring';
        else if (stackStr.includes('filter')) failedPhase = 'filtering';
        else if (stackStr.includes('score')) failedPhase = 'rules_scoring';
        else if (stackStr.includes('seen_before')) failedPhase = 'seen_before';
        else failedPhase = 'scoring_engine';
      } else if (stackStr.includes('generateRecommendationCopy') || stackStr.includes('invoke')) {
        failedPhase = 'llm_generation';
      } else if (stackStr.includes('generateWinnerReasons') || stackStr.includes('generateComparison')) {
        failedPhase = 'comparison_logic';
      }

      console.error('[QUIZ_FINISH] Failed phase:', failedPhase);

      // CRITICAL: Only set error state if we don't already have results
      if (results.length === 0) {
        setScoringError({
          message: error?.message || 'Unknown error',
          phase: failedPhase,
          timestamp: runTimestamp
        });
        setPhase('error');
      } else {
        // Results already set - just log the error, don't break the UI
        console.error('[QUIZ_FINISH] Error occurred but results already rendered - not showing error screen');
        console.error('[QUIZ_FINISH] Background error:', error);
      }
    } finally {
      isSubmittingRef.current = false;
      console.log(`[QUIZ_FINISH] Cleanup - isSubmitting reset at ${Date.now()}`);
    }
  };

  const handleRetry = () => {
    setMode(null);
    setSelectedShowIds([]);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setResults([]);
    setPhase('welcome');
  };

  const handleModeSelect = (selectedMode) => {
    if (selectedMode === 'browse') {
      window.location.href = '/BrowseShows';
      return;
    }
    setMode(selectedMode);
    if (selectedMode === 'recommendation' || selectedMode === 'recommendation_v2') {
      setPhase('quiz');
    } else if (selectedMode === 'comparison') {
      setPhase('show_selection');
    }
  };

  const handleShowsSelected = (showIds) => {
    setSelectedShowIds(showIds);
    setPhase('quiz');
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#FAFAF8] via-white to-[#F5F0EB] flex items-center justify-center min-h-[70vh] py-12">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#7C2D3E] animate-spin mx-auto mb-4" />
          <p className="text-slate-600">{t('loading_shows')}</p>
        </div>
      </div>
    );
  }

  // V2 config load error
  if (mode === 'recommendation_v2' && v2LoadError) {
    return (
      <div className="bg-gradient-to-br from-[#FAFAF8] via-white to-[#F5F0EB] flex items-center justify-center min-h-[70vh] py-12">
        <div className="text-center max-w-md px-4">
          <p className="text-red-600 font-semibold mb-2">{t('config_load_failed')}</p>
          <p className="text-slate-600 mb-4">{v2LoadError}</p>
          <Button onClick={handleRetry} variant="outline">
            {t('go_back')}
          </Button>
        </div>
      </div>
    );
  }

  // V2 loading state
  if (mode === 'recommendation_v2' && (!questionsV2 || !weightsV2)) {
    return (
      <div className="bg-gradient-to-br from-[#FAFAF8] via-white to-[#F5F0EB] flex items-center justify-center min-h-[70vh] py-12">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#7C2D3E] animate-spin mx-auto mb-4" />
          <p className="text-slate-600">{t('loading_v2')}</p>
        </div>
      </div>
    );
  }

  if (phase === 'welcome') {
    return <WelcomeScreen onStart={handleModeSelect} />;
  }

  if (phase === 'show_selection') {
    return (
      <ShowSelector
        musicals={musicals}
        onContinue={handleShowsSelected}
        onBack={() => setPhase('welcome')}
      />
    );
  }

  if (phase === 'loading') {
    return (
      <div className="bg-gradient-to-br from-[#FAFAF8] via-white to-[#F5F0EB] flex items-center justify-center min-h-[70vh] py-12">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#7C2D3E] animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">{t('calculating_results')}</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="bg-gradient-to-br from-[#FAFAF8] via-white to-[#F5F0EB] flex items-center justify-center min-h-[70vh] py-12">
        <div className="text-center max-w-md px-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <p className="text-red-700 font-semibold text-lg mb-2">
              {t('error_title')}
            </p>
            <p className="text-red-600 text-sm mb-4">
              {t('error_desc')}
            </p>
            {scoringError && (
              <p className="text-xs text-red-500 mb-4 font-mono bg-red-100 p-2 rounded">
                Error: {scoringError.message}
                {scoringError.phase && ` (Phase: ${scoringError.phase})`}
              </p>
            )}
            <p className="text-slate-500 text-xs">
              {t('refresh_suggestion')}
            </p>
          </div>
          <Button
            onClick={handleRetry}
            className="bg-[#7C2D3E] hover:bg-[#6B2635] text-white px-6 py-3"
          >
            {t('try_again')}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    if (results.length === 0) {
      return (
        <div className="bg-gradient-to-br from-[#FAFAF8] via-white to-[#F5F0EB] pb-8">
          <div className="max-w-lg mx-auto px-4 py-8">
            <NoResults onRetry={handleRetry} />
          </div>
        </div>
      );
    }

    if (mode === 'comparison') {
      return <ComparisonResults results={results} onRetry={handleRetry} adminSearchId={adminSearchId} />;
    }

    // Recommendation mode results
    return (
      <div className="bg-gradient-to-br from-[#FAFAF8] via-white to-[#F5F0EB] pb-8">
        <div className="max-w-lg mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-slate-900">
              {t('top_picks_title')}
            </h1>
          </motion.div>

          <div className="space-y-6">
            {results.map((musical, index) => (
              <RecommendationCard
                key={musical.id}
                musical={musical}
                reasons={musical.reasons}
                isMain={index === 0}
                index={index}
                breakdown={musical.breakdown}
                adminSearchId={adminSearchId}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <AboutRecommendation />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center"
          >
            <Button
              variant="outline"
              onClick={handleRetry}
              className="rounded-xl px-6 py-5 border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4 me-2" />
              {t('start_over_fresh')}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Quiz phase
  return (
    <div className="bg-gradient-to-br from-[#FAFAF8] via-white to-[#F5F0EB] pb-8">
      <QuizProgress current={currentQuestionIndex} total={filteredQuestions.length} />

      <div className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {getLocalizedValue(currentQuestion, 'question_text')}
            </h2>

            {/* Helper text for multi-select questions */}
            {(currentQuestion?.type === 'multi' || currentQuestion?.type === 'multi_select') &&
              currentQuestion.max_selections && (
                <p className="text-sm text-slate-500 mb-4">
                  {(() => {
                    const selected = answers[currentQuestion.question_id] || [];
                    const remaining = currentQuestion.max_selections - (Array.isArray(selected) ? selected.length : 0);
                    return remaining > 0
                      ? t('select_more_options', { count: remaining, plural: remaining !== 1 ? 's' : '' })
                      : t('max_selections_reached');
                  })()}
                </p>
              )}

            {(currentQuestion?.type === 'single' || currentQuestion?.type === 'single_choice') && (
              <SingleQuestion
                question={currentQuestion}
                selectedAnswer={answers[currentQuestion.question_id]}
                onSelect={handleAnswerSelect}
              />
            )}

            {currentQuestion?.type === 'ranking' && (
              <RankingQuestion
                question={currentQuestion}
                selectedAnswer={answers[currentQuestion.question_id]}
                onSelect={handleAnswerSelect}
              />
            )}

            {(currentQuestion?.type === 'multi' || currentQuestion?.type === 'multi_select') &&
              currentQuestion.question_id === 'q11_seen_before' &&
              !currentQuestion.dynamic_options && (
                <ImageGridQuestion
                  question={currentQuestion}
                  selectedAnswers={answers[currentQuestion.question_id] || []}
                  onSelect={handleAnswerSelect}
                  maxSelections={currentQuestion.max_selections || 2}
                  musicals={musicals}
                  excludeShowIds={mode === 'comparison' ? selectedShowIds : []}
                />
              )}

            {(currentQuestion?.type === 'multi' || currentQuestion?.type === 'multi_select') &&
              currentQuestion.question_id !== 'q11_seen_before' &&
              !currentQuestion.dynamic_options && (
                <MultiQuestion
                  question={currentQuestion}
                  selectedAnswers={answers[currentQuestion.question_id] || []}
                  onSelect={handleAnswerSelect}
                  maxSelections={currentQuestion.max_selections || 2}
                />
              )}

            {(currentQuestion?.type === 'multi' || currentQuestion?.type === 'multi_select') &&
              currentQuestion.dynamic_options?.source === 'shows' && (
                <ImageGridQuestion
                  question={{
                    ...currentQuestion,
                    answers: musicals.map(m => ({ answer_id: m.id, answer_text: m.show_title }))
                  }}
                  selectedAnswers={answers[currentQuestion.question_id] || []}
                  onSelect={handleAnswerSelect}
                  maxSelections={currentQuestion.max_selections || 2}
                  musicals={musicals}
                  excludeShowIds={[]}
                />
              )}

            {currentQuestion?.type === 'date_range' && (
              <DateRangeQuestion
                question={currentQuestion}
                selectedAnswer={answers[currentQuestion.question_id]}
                onSelect={handleAnswerSelect}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <QuizNavigation
        currentIndex={currentQuestionIndex}
        totalQuestions={filteredQuestions.length}
        canProceed={canProceed() && !isSubmittingRef.current}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
      />
    </div>
  );
}