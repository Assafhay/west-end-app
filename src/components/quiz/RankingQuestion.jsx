import React, { useState, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import { getLocalizedValue } from '@/lib/i18nHelper';
import { useTranslation } from 'react-i18next';

export default function RankingQuestion({ question, selectedAnswer, onSelect }) {
  const { t } = useTranslation();
  const [items, setItems] = useState(() => {
    const answers = Array.isArray(question.answers) ? question.answers : [];
    if (selectedAnswer && Array.isArray(selectedAnswer)) {
      return selectedAnswer
        .map(id => answers.find(a => a.answer_id === id))
        .filter(Boolean);
    }
    return answers;
  });

  const [isDragging, setIsDragging] = useState(false);
  const scrollPositionRef = React.useRef(0);

  useEffect(() => {
    const orderedIds = items.map(item => item.answer_id);
    onSelect(orderedIds);
  }, [items]);

  useEffect(() => {
    // Lock body scroll during ranking (not just drag)
    if (isDragging) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
    };
  }, [isDragging]);

  useEffect(() => {
    // While ranking question is mounted, prevent window scroll during any interaction
    const preventScroll = (e) => {
      // Only prevent if it's a wheel event on the page itself
      if (e.target === document || e.target === document.body) {
        // Allow internal scroll container to work
        return;
      }
    };

    window.addEventListener('wheel', preventScroll, { passive: false });
    return () => window.removeEventListener('wheel', preventScroll, { passive: false });
  }, []);

  const handleDragStart = () => {
    console.log('[RANKING] Drag start:', { windowScrollY: window.scrollY });
    setIsDragging(true);
    scrollPositionRef.current = window.scrollY;
    // Restore scroll position multiple times to override any library scroll
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current);
      console.log('[RANKING] After rAF1:', { windowScrollY: window.scrollY });
    });
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current);
      console.log('[RANKING] After rAF2:', { windowScrollY: window.scrollY });
    });
  };

  const handleDragEnd = (result) => {
    console.log('[RANKING] Drag end:', { windowScrollY: window.scrollY });
    setIsDragging(false);

    // Restore scroll position after drop multiple times
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current);
      console.log('[RANKING] After rAF1:', { windowScrollY: window.scrollY });
    });
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current);
      console.log('[RANKING] After rAF2:', { windowScrollY: window.scrollY });
    });

    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    setItems(reorderedItems);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 mb-4">
        {t('ranking_instruction')}
      </p>

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Droppable droppableId="ranking-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
              style={{
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                touchAction: 'pan-y',
                position: 'relative',
                paddingBottom: 'calc(140px + env(safe-area-inset-bottom))'
              }}
            >
              {items.map((item, index) => (
                <Draggable
                  key={String(item.answer_id)}
                  draggableId={String(item.answer_id)}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center gap-3 p-5 bg-white border-2 rounded-xl select-none ${snapshot.isDragging
                        ? 'border-[#7C2D3E] shadow-2xl bg-slate-50 opacity-90'
                        : 'border-slate-200 hover:border-[#7C2D3E] hover:shadow-md'
                        }`}
                      style={{
                        ...provided.draggableProps.style,
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none',
                        touchAction: 'pan-y',
                        WebkitTouchCallout: 'none',
                        minHeight: '76px'
                      }}
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="flex-shrink-0 cursor-move"
                        style={{
                          touchAction: 'none'
                        }}
                      >
                        <GripVertical className={`w-7 h-7 ${snapshot.isDragging ? 'text-[#7C2D3E]' : 'text-slate-400'
                          }`} />
                      </div>

                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#7C2D3E] text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-slate-900 font-medium text-base leading-relaxed block pointer-events-none">
                          {getLocalizedValue(item, 'answer_text')}
                        </span>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}