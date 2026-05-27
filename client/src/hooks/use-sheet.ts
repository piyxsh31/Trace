'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ApiResponse, SheetResponse, SheetProblemsResponse, UpdateProblemResponse } from '@/types/api';
import type { Sheet, Problem } from '@/types/sheet';

interface UseSheetReturn {
  sheet: Sheet | null;
  problems: Problem[];
  isLoading: boolean;
  error: string | null;
  updateProblem: (id: string, updates: Partial<Problem>) => Promise<void>;
  fetchSheetData: () => Promise<void>;
}

export function useSheet(sheetId: string): UseSheetReturn {
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSheetData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sheetRes, problemsRes] = await Promise.all([
        api.get<ApiResponse<SheetResponse>>(`/sheets/${sheetId}`),
        api.get<ApiResponse<SheetProblemsResponse>>(`/sheets/${sheetId}/problems`),
      ]);

      if (sheetRes.data.data?.sheet) {
        setSheet(sheetRes.data.data.sheet);
      }
      if (problemsRes.data.data?.problems) {
        setProblems(problemsRes.data.data.problems);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load sheet details.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [sheetId]);

  useEffect(() => {
    if (sheetId) {
      fetchSheetData();
    }
  }, [fetchSheetData, sheetId]);

  // Optimistic update for problem status, difficulty, topics, notes
  const updateProblem = async (id: string, updates: Partial<Problem>) => {
    // 1. Snapshot previous state
    const previousProblems = [...problems];

    // 2. Optimistic UI update
    setProblems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    // 3. Background API request
    try {
      const { data } = await api.patch<ApiResponse<UpdateProblemResponse>>(`/problems/${id}`, updates);
      
      // We could optionally sync the exact response back:
      // if (data.data?.problem) {
      //   setProblems((prev) => prev.map((p) => (p.id === id ? data.data.problem : p)));
      // }
    } catch (err) {
      // 4. Rollback on failure
      setProblems(previousProblems);
      throw err;
    }
  };

  return { sheet, problems, isLoading, error, updateProblem, fetchSheetData };
}
