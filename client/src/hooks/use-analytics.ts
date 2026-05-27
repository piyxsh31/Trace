import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { ApiResponse, AnalyticsResponse } from '@/types/api';
import toast from 'react-hot-toast';

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const res = await api.get<ApiResponse<AnalyticsResponse>>('/analytics');
        if (mounted && res.data.success && res.data.data) {
          setData(res.data.data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          const msg = err.response?.data?.message || 'Failed to load analytics';
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    data,
    isLoading,
    error,
  };
}
