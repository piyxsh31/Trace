import type { User } from './auth';
import type { Sheet } from './sheet';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ row?: number; field: string; message: string }>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  user: User;
}

export interface ImportSheetResponse {
  sheet: Sheet;
}

export interface ListSheetsResponse {
  sheets: Sheet[];
}

export interface SheetResponse {
  sheet: Sheet;
}

export interface SheetProblemsResponse {
  problems: import('./sheet').Problem[];
}

export interface UpdateProblemResponse {
  problem: import('./sheet').Problem;
}

export interface AnalyticsResponse {
  heatmap: Array<{ date: string; count: number }>;
  difficulty: Array<{ name: string; solved: number; total: number; color: string }>;
  topics: Array<{ topic: string; count: number }>;
  recentActivity: Array<{
    id: string;
    name: string;
    difficulty: string;
    solvedAt: string;
    sheetName: string;
  }>;
  totals: {
    totalProblems: number;
    totalSolved: number;
    totalAttempted: number;
  };
  streaks: {
    current: number;
    longest: number;
  };
}
