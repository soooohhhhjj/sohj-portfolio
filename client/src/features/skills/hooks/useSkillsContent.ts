import { useEffect, useState } from 'react';
import { getSkillsContent } from '../services/skillsService';
import type { SkillsContentState } from '../types/skills.types';
import { normalizeSkillsContent } from '../utils/skillsContent';

type UseSkillsContentState = {
  content: SkillsContentState | null;
  isLoading: boolean;
  error: string | null;
};

export function useSkillsContent() {
  const [state, setState] = useState<UseSkillsContentState>({
    content: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    void getSkillsContent()
      .then((content) => {
        if (!isMounted) {
          return;
        }

        setState({
          content: normalizeSkillsContent(content),
          isLoading: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setState({
          content: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load skills.',
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    ...state,
    content: state.content ? normalizeSkillsContent(state.content) : null,
  };
}
