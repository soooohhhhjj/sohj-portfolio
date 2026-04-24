import { useCallback, useEffect, useRef, useState } from 'react';
import { getSkillsContent, saveSkillsContent } from '../services/skillsService';
import type {
  SkillsCard,
  SkillsContentState,
  SkillsLine,
  SkillsLayoutState,
  SkillsTitleLayout,
} from '../types/skills.types';
import {
  cloneSkillsContentState,
  normalizeSkillsContent,
} from '../utils/skillsContent';

type SkillsLayoutKey = 'lg' | 'md';

function cloneLayoutState(layout: SkillsLayoutState): SkillsLayoutState {
  return {
    cards: layout.cards.map((card) => ({
      ...card,
      layout: { ...card.layout },
    })),
  };
}

function createMdLayoutFromBase(content: SkillsContentState): SkillsLayoutState {
  return {
    cards: content.cards.map((card) => ({
      id: card.id,
      layout: { ...card.layout },
    })),
  };
}

function mergeLayoutCard(card: SkillsCard, layoutCardsById: Map<string, SkillsLayoutState['cards'][number]>): SkillsCard {
  const layoutCard = layoutCardsById.get(card.id);

  if (!layoutCard) {
    return card;
  }

  return {
    ...card,
    layout: { ...layoutCard.layout },
  };
}

export function useSkillsEditorState(activeLayoutKey: SkillsLayoutKey) {
  const persistedStateRef = useRef<SkillsContentState | null>(null);
  const contentRef = useRef<SkillsContentState | null>(null);
  const [content, setContent] = useState<SkillsContentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    let isMounted = true;

    void getSkillsContent()
      .then((nextContent) => {
        if (!isMounted) {
          return;
        }

        const normalizedContent = cloneSkillsContentState(normalizeSkillsContent(nextContent));
        persistedStateRef.current = normalizedContent;
        contentRef.current = normalizedContent;
        setContent(normalizedContent);
        setError(null);
      })
      .catch((nextError: unknown) => {
        if (!isMounted) {
          return;
        }

        persistedStateRef.current = null;
        contentRef.current = null;
        setContent(null);
        setError(nextError instanceof Error ? nextError.message : 'Failed to load skills.');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getActiveLayoutState = useCallback((state: SkillsContentState): SkillsLayoutState => {
    if (activeLayoutKey === 'lg') {
      return {
        cards: state.cards.map((card) => ({
          id: card.id,
          layout: { ...card.layout },
        })),
      };
    }

    return state.mdLayout ? cloneLayoutState(state.mdLayout) : createMdLayoutFromBase(state);
  }, [activeLayoutKey]);

  const mergedContent = content
    ? (() => {
        const activeLayout = getActiveLayoutState(content);
        const layoutCardsById = new Map(activeLayout.cards.map((card) => [card.id, card]));

        return {
          ...content,
          cards: content.cards.map((card) => mergeLayoutCard(card, layoutCardsById)),
          ...(content.mdLayout ? { mdLayout: cloneLayoutState(content.mdLayout) } : {}),
        } satisfies SkillsContentState;
      })()
    : null;

  const updateCard = useCallback((cardId: string, transform: (card: SkillsCard) => SkillsCard) => {
    setContent((prev) => {
      if (!prev) {
        return prev;
      }

      const activeLayout = getActiveLayoutState(prev);
      const layoutCardsById = new Map(activeLayout.cards.map((card) => [card.id, card]));
      const currentCard = prev.cards.find((card) => card.id === cardId);

      if (!currentCard) {
        return prev;
      }

      const mergedCard = mergeLayoutCard(currentCard, layoutCardsById);
      const nextCard = transform(mergedCard);

      const nextContent = {
        ...prev,
        cards: prev.cards.map((card) => (
          card.id === cardId
            ? {
                ...card,
                title: nextCard.title,
                frontLabel: nextCard.frontLabel,
                backLabel: nextCard.backLabel,
                currentStacks: nextCard.currentStacks,
                previousStacks: nextCard.previousStacks,
                layout: activeLayoutKey === 'lg' ? { ...nextCard.layout } : card.layout,
              }
            : card
        )),
        ...(activeLayoutKey === 'md'
          ? {
              mdLayout: {
                cards: activeLayout.cards.map((layoutCard) => (
                  layoutCard.id === cardId
                    ? { ...layoutCard, layout: { ...nextCard.layout } }
                    : layoutCard
                )),
              },
            }
          : {}),
      };

      const clonedState = cloneSkillsContentState(nextContent);
      contentRef.current = clonedState;
      setSaveFeedback('idle');
      return clonedState;
    });
  }, [activeLayoutKey, getActiveLayoutState]);

  const updateLine = useCallback((lineId: string, transform: (line: SkillsLine) => SkillsLine) => {
    setContent((prev) => {
      if (!prev) {
        return prev;
      }

      const currentLine = (prev.lines ?? []).find((line) => line.id === lineId);

      if (!currentLine) {
        return prev;
      }

      const nextLine = transform(currentLine);
      const nextContent = {
        ...prev,
        lines: (prev.lines ?? []).map((line) => (
          line.id === lineId
            ? {
                ...line,
                layout: { ...nextLine.layout },
              }
            : line
        )),
      };

      const clonedState = cloneSkillsContentState(nextContent);
      contentRef.current = clonedState;
      setSaveFeedback('idle');
      return clonedState;
    });
  }, []);

  const addLine = useCallback((line: SkillsLine) => {
    setContent((prev) => {
      if (!prev) {
        return prev;
      }

      const nextContent = {
        ...prev,
        lines: [...(prev.lines ?? []), { ...line, layout: { ...line.layout } }],
      };

      const clonedState = cloneSkillsContentState(nextContent);
      contentRef.current = clonedState;
      setSaveFeedback('idle');
      return clonedState;
    });
  }, []);

  const removeLine = useCallback((lineId: string) => {
    setContent((prev) => {
      if (!prev) {
        return prev;
      }

      const nextContent = {
        ...prev,
        lines: (prev.lines ?? []).filter((line) => line.id !== lineId),
      };

      const clonedState = cloneSkillsContentState(nextContent);
      contentRef.current = clonedState;
      setSaveFeedback('idle');
      return clonedState;
    });
  }, []);

  const updateTitleLayout = useCallback((transform: (layout: SkillsTitleLayout) => SkillsTitleLayout) => {
    setContent((prev) => {
      if (!prev) {
        return prev;
      }

      const currentLayout = prev.titleLayout ?? { x: 335, y: 26 };
      const nextContent = {
        ...prev,
        titleLayout: { ...transform(currentLayout) },
      };

      const clonedState = cloneSkillsContentState(nextContent);
      contentRef.current = clonedState;
      setSaveFeedback('idle');
      return clonedState;
    });
  }, []);

  const resetToPersisted = useCallback(() => {
    const persistedState = persistedStateRef.current;

    if (!persistedState) {
      return;
    }

    const nextState = cloneSkillsContentState(persistedState);
    contentRef.current = nextState;
    setContent(nextState);
    setSaveFeedback('idle');
  }, []);

  const save = useCallback(async () => {
    const stateToSave = contentRef.current;

    if (!stateToSave) {
      return;
    }

    setIsSaving(true);
    setSaveFeedback('idle');

    try {
      const nextState = cloneSkillsContentState(normalizeSkillsContent(await saveSkillsContent(stateToSave)));
      persistedStateRef.current = nextState;
      contentRef.current = nextState;
      setContent(nextState);
      setSaveFeedback('success');
    } catch {
      setSaveFeedback('error');
    } finally {
      setIsSaving(false);
      window.setTimeout(() => setSaveFeedback('idle'), 1800);
    }
  }, []);

  return {
    content: mergedContent,
    isLoading,
    error,
    updateCard,
    updateLine,
    addLine,
    removeLine,
    updateTitleLayout,
    resetToPersisted,
    save,
    isSaving,
    saveFeedback,
  };
}
