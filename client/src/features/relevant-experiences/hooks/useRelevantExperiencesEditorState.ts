import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  RelevantExperienceConnection,
  RelevantExperienceNode,
  RelevantExperiencesContentState,
} from '../components/relevantExperiences.types';
import {
  getRelevantExperiencesContent,
  saveRelevantExperiencesContent,
} from '../services/relevantExperiencesService';

function cloneContentState(content: RelevantExperiencesContentState): RelevantExperiencesContentState {
  return {
    nodes: content.nodes.map((node) => ({
      ...node,
      ...(node.tags ? { tags: [...node.tags] } : {}),
      layout: { ...node.layout },
    })),
    connections: content.connections.map((connection) => ({
      ...connection,
      viaPoints: connection.viaPoints.map((point) => ({ ...point })),
    })),
  };
}

export function useRelevantExperiencesEditorState() {
  const persistedStateRef = useRef<RelevantExperiencesContentState | null>(null);
  const [content, setContent] = useState<RelevantExperiencesContentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    let isMounted = true;

    void getRelevantExperiencesContent()
      .then((nextContent) => {
        if (!isMounted) {
          return;
        }

        const clonedContent = cloneContentState(nextContent);
        persistedStateRef.current = clonedContent;
        setContent(clonedContent);
        setLoadError(false);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        persistedStateRef.current = null;
        setContent(null);
        setLoadError(true);
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

  const updateNode = useCallback((nodeId: string, transform: (node: RelevantExperienceNode) => RelevantExperienceNode) => {
    setContent((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        nodes: prev.nodes.map((node) => (node.id === nodeId ? transform(node) : node)),
      };
    });
  }, []);

  const updateConnection = useCallback((
    connectionId: string,
    transform: (connection: RelevantExperienceConnection) => RelevantExperienceConnection,
  ) => {
    setContent((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        connections: prev.connections.map((connection) => (
          connection.id === connectionId ? transform(connection) : connection
        )),
      };
    });
  }, []);

  const addConnection = useCallback((connection: RelevantExperienceConnection) => {
    setContent((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        connections: [...prev.connections, connection],
      };
    });
  }, []);

  const removeConnection = useCallback((connectionId: string) => {
    setContent((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        connections: prev.connections.filter((connection) => connection.id !== connectionId),
      };
    });
  }, []);

  const resetNodeToPersisted = useCallback((nodeId: string) => {
    const persistedState = persistedStateRef.current;
    if (!persistedState) {
      return;
    }

    const persistedNode = persistedState.nodes.find((node) => node.id === nodeId);
    if (!persistedNode) {
      return;
    }

    updateNode(nodeId, () => ({
      ...persistedNode,
      layout: { ...persistedNode.layout },
    }));
  }, [updateNode]);

  const resetToPersisted = useCallback(() => {
    const persistedState = persistedStateRef.current;
    if (!persistedState) {
      return;
    }

    setContent(cloneContentState(persistedState));
    setSaveFeedback('idle');
  }, []);

  const save = useCallback(async () => {
    if (!content) {
      return;
    }

    setIsSaving(true);
    setSaveFeedback('idle');

    try {
      const nextState = await saveRelevantExperiencesContent(content);
      const clonedState = cloneContentState(nextState);
      persistedStateRef.current = clonedState;
      setContent(clonedState);
      setSaveFeedback('success');
    } catch {
      setSaveFeedback('error');
    } finally {
      setIsSaving(false);
      window.setTimeout(() => setSaveFeedback('idle'), 1800);
    }
  }, [content]);

  return {
    content,
    isLoading,
    loadError,
    setContent,
    updateNode,
    updateConnection,
    addConnection,
    removeConnection,
    resetNodeToPersisted,
    resetToPersisted,
    save,
    isSaving,
    saveFeedback,
  };
}
