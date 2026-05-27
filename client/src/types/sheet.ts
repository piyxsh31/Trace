// ── Domain types ──────────────────────────────────────────────────────────────

export interface Sheet {
  id: string;
  name: string;
  description: string;
  problemCount: number;
  solvedCount: number;
  createdAt: string;
}

export interface Problem {
  id?: string; // Optional because new problems being imported don't have IDs yet
  name: string;
  link: string;
  topics: string[];
  difficulty: '' | 'easy' | 'medium' | 'hard';
  status?: 'unsolved' | 'attempted' | 'solved';
  notes?: string;
}

// ── Import flow types ─────────────────────────────────────────────────────────

/** The four Trace fields a file column can be mapped to */
export type TraceField = 'name' | 'link' | 'topics' | 'difficulty';

/** Represents how one source column maps to a Trace field (or is skipped) */
export interface ColumnMapping {
  sourceColumn: string;
  targetField: TraceField | 'skip';
}

/** Raw data extracted from the uploaded file, before column mapping is applied */
export interface ParsedFileData {
  columns: string[];
  rows: Record<string, string | string[]>[];
  suggestedName?: string;
  suggestedDescription?: string;
}

/** Payload sent to POST /api/v1/sheets/import */
export interface ImportPayload {
  name: string;
  description?: string;
  problems: Problem[];
}

/** Step identifiers for the import wizard */
export type ImportStep = 'upload' | 'map' | 'preview';
