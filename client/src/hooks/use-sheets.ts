'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ApiResponse, ListSheetsResponse } from '@/types/api';
import type { Sheet } from '@/types/sheet';

interface UseSheetsReturn {
  sheets: Sheet[];
  isLoading: boolean;
  error: string | null;
  /** Optimistically prepend a newly imported sheet — no refetch needed */
  addSheet: (sheet: Sheet) => void;
  /** Optimistically remove a deleted sheet from state */
  removeSheet: (sheetId: string) => void;
  /** Manually trigger a refetch (e.g. on error recovery) */
  fetchSheets: () => Promise<void>;
}

/**
 * Manages the list of sheets for the authenticated user.
 * Fetches on mount and exposes an optimistic `addSheet` for post-import updates.
 */
export function useSheets(): UseSheetsReturn {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSheets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get<ApiResponse<ListSheetsResponse>>('/sheets');
      setSheets(data.data?.sheets ?? []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load sheets. Please refresh.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  // Optimistic update: prepend the new sheet to the local list immediately
  // after a successful import, without triggering a network refetch.
  const addSheet = useCallback((sheet: Sheet) => {
    setSheets((prev) => [sheet, ...prev]);
  }, []);

  // Optimistic update: remove the deleted sheet from the local list
  const removeSheet = useCallback((sheetId: string) => {
    setSheets((prev) => prev.filter((s) => s.id !== sheetId));
  }, []);

  return { sheets, isLoading, error, addSheet, removeSheet, fetchSheets };
}
