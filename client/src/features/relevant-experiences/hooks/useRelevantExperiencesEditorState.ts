import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  RelevantExperienceConnection,
  RelevantExperienceNode,
  RelevantExperiencesContentState,
  RelevantExperiencesLayoutNode,
  RelevantExperiencesLayoutState,
} from '../components/relevantExperiences.types';
import {
  getRelevantExperiencesContent,
  saveRelevantExperiencesContent,
} from '../services/relevantExperiencesService';

type RelevantExperiencesLayoutKey = 'lg' | 'md';

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
    ...(content.mdLayout
      ? {
          mdLayout: {
            nodes: content.mdLayout.nodes.map((node) => ({
              ...node,
              layout: { ...node.layout },
            })),
            connections: content.mdLayout.connections.map((connection) => ({
              ...connection,
              viaPoints: connection.viaPoints.map((point) => ({ ...point })),
            })),
          },
        }
      : {}),
  };
}

function cloneLayoutState(layout: RelevantExperiencesLayoutState): RelevantExperiencesLayoutState {
  return {
    nodes: layout.nodes.map((node) => ({
      ...node,
      layout: { ...node.layout },
    })),
    connections: layout.connections.map((connection) => ({
      ...connection,
      viaPoints: connection.viaPoints.map((point) => ({ ...point })),
    })),
  };
}

function createMdLayoutFromBase(content: RelevantExperiencesContentState): RelevantExperiencesLayoutState {
  return {
    nodes: content.nodes.map((node) => ({
      id: node.id,
      layout: { ...node.layout },
    })),
    connections: content.connections.map((connection) => ({
      ...connection,
      viaPoints: connection.viaPoints.map((point) => ({ ...point })),
    })),
  };
}

function mergeLayoutNode(
  node: RelevantExperienceNode,
  layoutNodesById: Map<string, RelevantExperiencesLayoutNode>,
): RelevantExperienceNode {
  const layoutNode = layoutNodesById.get(node.id);
  if (!layoutNode) {
    return node;
  }

  return {
    ...node,
    layout: { ...layoutNode.layout },
  };
}

export function useRelevantExperiencesEditorState(activeLayoutKey: RelevantExperiencesLayoutKey) {
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

  const getActiveLayoutState = useCallback((state: RelevantExperiencesContentState): RelevantExperiencesLayoutState => {
    if (activeLayoutKey === 'lg') {
      return {
        nodes: state.nodes.map((node) => ({
          id: node.id,
          layout: { ...node.layout },
        })),
        connections: state.connections.map((connection) => ({
          ...connection,
          viaPoints: connection.viaPoints.map((point) => ({ ...point })),
        })),
      };
    }

    return state.mdLayout ? cloneLayoutState(state.mdLayout) : createMdLayoutFromBase(state);
  }, [activeLayoutKey]);

  const mergedContent = content
    ? (() => {
        const activeLayout = getActiveLayoutState(content);
        const layoutNodesById = new Map(activeLayout.nodes.map((node) => [node.id, node]));

        return {
          nodes: content.nodes.map((node) => mergeLayoutNode(node, layoutNodesById)),
          connections: activeLayout.connections,
          ...(content.mdLayout ? { mdLayout: cloneLayoutState(content.mdLayout) } : {}),
        } satisfies RelevantExperiencesContentState;
      })()
    : null;

  const updateNode = useCallback((nodeId: string, transform: (node: RelevantExperienceNode) => RelevantExperienceNode) => {
    setContent((prev) => {
      if (!prev) {
        return prev;
      }

      const activeLayout = getActiveLayoutState(prev);
      const layoutNodesById = new Map(activeLayout.nodes.map((node) => [node.id, node]));
      const currentNode = prev.nodes.find((node) => node.id === nodeId);
      if (!currentNode) {
        return prev;
      }

      const mergedNode = mergeLayoutNode(currentNode, layoutNodesById);
      const nextNode = transform(mergedNode);

      return {
        ...prev,
        nodes: prev.nodes.map((node) => (
          node.id === nodeId
            ? {
                ...node,
                type: nextNode.type,
                parentId: nextNode.parentId,
                title: nextNode.title,
                details: nextNode.details,
                tags: nextNode.tags,
                image: nextNode.image,
                icon: nextNode.icon,
                layout: activeLayoutKey === 'lg' ? { ...nextNode.layout } : node.layout,
              }
            : node
        )),
        ...(activeLayoutKey === 'md'
          ? {
              mdLayout: {
                nodes: activeLayout.nodes.map((layoutNode) => (
                  layoutNode.id === nodeId
                    ? { ...layoutNode, layout: { ...nextNode.layout } }
                    : layoutNode
                )),
                connections: activeLayout.connections,
              },
            }
          : {}),
      };
    });
  }, [activeLayoutKey, getActiveLayoutState]);

  const updateConnection = useCallback((
    connectionId: string,
    transform: (connection: RelevantExperienceConnection) => RelevantExperienceConnection,
  ) => {
    setContent((prev) => {
      if (!prev) {
        return prev;
      }

      const activeLayout = getActiveLayoutState(prev);
      const nextConnections = activeLayout.connections.map((connection) => (
        connection.id === connectionId ? transform(connection) : connection
      ));

      if (activeLayoutKey === 'lg') {
        return {
          ...prev,
          connections: nextConnections,
        };
      }

      return {
        ...prev,
        mdLayout: {
          nodes: activeLayout.nodes,
          connections: nextConnections,
        },
      };
    });
  }, [activeLayoutKey, getActiveLayoutState]);

  const addConnection = useCallback((connection: RelevantExperienceConnection) => {
    setContent((prev) => {
      if (!prev) {
        return prev;
      }

      const activeLayout = getActiveLayoutState(prev);
      const nextConnections = [...activeLayout.connections, connection];

      if (activeLayoutKey === 'lg') {
        return {
          ...prev,
          connections: nextConnections,
        };
      }

      return {
        ...prev,
        mdLayout: {
          nodes: activeLayout.nodes,
          connections: nextConnections,
        },
      };
    });
  }, [activeLayoutKey, getActiveLayoutState]);

  const removeConnection = useCallback((connectionId: string) => {
    setContent((prev) => {
      if (!prev) {
        return prev;
      }

      const activeLayout = getActiveLayoutState(prev);
      const nextConnections = activeLayout.connections.filter((connection) => connection.id !== connectionId);

      if (activeLayoutKey === 'lg') {
        return {
          ...prev,
          connections: nextConnections,
        };
      }

      return {
        ...prev,
        mdLayout: {
          nodes: activeLayout.nodes,
          connections: nextConnections,
        },
      };
    });
  }, [activeLayoutKey, getActiveLayoutState]);

  const resetNodeToPersisted = useCallback((nodeId: string) => {
    const persistedState = persistedStateRef.current;
    if (!persistedState) {
      return;
    }

    const persistedNode = persistedState.nodes.find((node) => node.id === nodeId);
    if (!persistedNode) {
      return;
    }

    const persistedLayout = getActiveLayoutState(persistedState).nodes.find((node) => node.id === nodeId)?.layout
      ?? persistedNode.layout;

    updateNode(nodeId, () => ({
      ...persistedNode,
      layout: { ...persistedLayout },
    }));
  }, [getActiveLayoutState, updateNode]);

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
    content: mergedContent,
    rawContent: content,
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
