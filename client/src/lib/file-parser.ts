import Papa from 'papaparse';
import type { ColumnMapping, ParsedFileData, Problem, TraceField } from '@/types/sheet';

const MAX_FILE_SIZE = 1_048_576; // 1 MB
const ACCEPTED_EXTENSIONS = ['.csv', '.json'];

// ── Auto-detection keyword map ────────────────────────────────────────────────

const FIELD_KEYWORDS: Record<TraceField, string[]> = {
  name: ['name', 'title', 'problem', 'question'],
  link: ['link', 'url', 'href'],
  topics: ['topic', 'topics', 'tag', 'tags', 'category', 'categories', 'type'],
  difficulty: ['difficulty', 'level', 'diff'],
};

// ── File validation ───────────────────────────────────────────────────────────

/**
 * Validates file size and extension before attempting to read.
 * Throws a human-readable error string if invalid.
 */
export function validateFile(file: File): void {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported file type "${ext}". Please upload a .csv or .json file.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File is too large (${(file.size / 1_048_576).toFixed(1)} MB). Maximum allowed size is 1 MB.`
    );
  }
}

// ── File reading ──────────────────────────────────────────────────────────────

/**
 * Reads a file as a UTF-8 string and strips the BOM character if present.
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      let text = e.target?.result as string;
      // Strip UTF-8 BOM (\uFEFF) — Excel-generated CSVs and some JSON files include it
      if (text.startsWith('\uFEFF')) {
        text = text.slice(1);
      }
      resolve(text);
    };
    reader.onerror = () => reject(new Error('Failed to read file. Please try again.'));
    reader.readAsText(file, 'UTF-8');
  });
}

// ── CSV parsing ───────────────────────────────────────────────────────────────

/**
 * Parses a CSV file using PapaParse.
 * Handles quoted fields, commas within cells, newlines in cells, and BOM markers.
 */
export async function parseCSVFile(file: File): Promise<ParsedFileData> {
  const text = await readFileAsText(file);

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  // PapaParse returns partial results with non-fatal errors (e.g. FieldMismatch).
  // A missing or empty fields array from meta is the real sign something went wrong.
  if (!result.meta.fields || result.meta.fields.length === 0) {
    throw new Error('Could not read column headers. Make sure the first row of your CSV is a header row.');
  }

  const columns = (result.meta.fields ?? []).filter((c) => c.length > 0);

  if (columns.length === 0) {
    throw new Error('No columns found. Make sure the first row of your CSV is a header row.');
  }

  if (result.data.length === 0) {
    throw new Error('No data rows found in the CSV file.');
  }

  return { columns, rows: result.data };
}

// ── JSON parsing ──────────────────────────────────────────────────────────────

/**
 * Parses a JSON file and auto-detects the array of problem objects.
 * Extracts optional top-level `name` / `description` as sheet metadata.
 */
export async function parseJSONFile(file: File): Promise<ParsedFileData> {
  const text = await readFileAsText(file);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON. Please check the file for syntax errors.');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON must be an object at the top level.');
  }

  const obj = parsed as Record<string, unknown>;

  // Auto-detect: find the first top-level key whose value is a non-empty array of objects
  let rows: Record<string, unknown>[] = [];
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      rows = val as Record<string, unknown>[];
      break;
    }
  }

  if (rows.length === 0) {
    throw new Error(
      'Could not find an array of problems in this JSON file. ' +
        'Make sure the file contains a top-level array or an object with an array property.'
    );
  }

  // Extract column names: union of all keys across all objects (preserving first-appearance order)
  const columnSet = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      columnSet.add(key);
    }
  }
  const columns = Array.from(columnSet);

  // Cast rows to string-compatible shape for the mapper
  const stringRows = rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => [
        k,
        Array.isArray(v) ? v.map(String) : String(v ?? ''),
      ])
    )
  ) as Record<string, string | string[]>[];

  // Extract optional sheet metadata from top-level string fields
  const nameKeys = ['name', 'title', 'sheetName', 'sheet_name'];
  const descKeys = ['description', 'desc', 'about'];
  const suggestedName = nameKeys
    .map((k) => obj[k])
    .find((v) => typeof v === 'string' && v.trim()) as string | undefined;
  const suggestedDescription = descKeys
    .map((k) => obj[k])
    .find((v) => typeof v === 'string' && v.trim()) as string | undefined;

  return { columns, rows: stringRows, suggestedName, suggestedDescription };
}

// ── Mapping utilities ─────────────────────────────────────────────────────────

/**
 * Auto-detects column → Trace field mappings using keyword matching.
 * First checks for an exact match, then for a substring match.
 * First match wins — each Trace field is claimed at most once.
 */
export function detectMappings(columns: string[]): ColumnMapping[] {
  const claimed = new Set<TraceField>();

  return columns.map((col) => {
    const normalized = col.toLowerCase().trim();

    for (const [field, keywords] of Object.entries(FIELD_KEYWORDS) as [TraceField, string[]][]) {
      if (claimed.has(field)) continue;
      // Exact match first (highest confidence)
      if (keywords.includes(normalized)) {
        claimed.add(field);
        return { sourceColumn: col, targetField: field };
      }
    }

    for (const [field, keywords] of Object.entries(FIELD_KEYWORDS) as [TraceField, string[]][]) {
      if (claimed.has(field)) continue;
      // Substring match (e.g. "problem title" contains "title")
      if (keywords.some((kw) => normalized.includes(kw))) {
        claimed.add(field);
        return { sourceColumn: col, targetField: field };
      }
    }

    return { sourceColumn: col, targetField: 'skip' };
  });
}

/**
 * Applies a column mapping to raw parsed rows and returns typed Problem objects.
 * Skips rows where the mapped `name` cell is empty.
 */
export function applyMapping(
  rows: Record<string, string | string[]>[],
  mappings: ColumnMapping[]
): Problem[] {
  // Build a quick lookup from Trace field → source column name
  const fieldToCol: Partial<Record<TraceField, string>> = {};
  for (const m of mappings) {
    if (m.targetField !== 'skip') {
      fieldToCol[m.targetField] = m.sourceColumn;
    }
  }

  const problems: Problem[] = [];

  for (const row of rows) {
    const rawName = fieldToCol.name ? String(row[fieldToCol.name] ?? '').trim() : '';
    if (!rawName) continue; // skip empty rows

    const rawLink = fieldToCol.link ? String(row[fieldToCol.link] ?? '').trim() : '';

    // Topics: handle both comma-separated strings and arrays
    let topics: string[] = [];
    if (fieldToCol.topics) {
      const rawTopics = row[fieldToCol.topics];
      const topicArray = Array.isArray(rawTopics)
        ? rawTopics
        : String(rawTopics ?? '')
            .split(',')
            .map((t) => t.trim());
      topics = topicArray
        .map((t) => String(t).trim().toLowerCase().slice(0, 50))
        .filter((t) => t.length > 0)
        .slice(0, 10);
    }

    // Difficulty: normalize and validate
    let difficulty: Problem['difficulty'] = '';
    if (fieldToCol.difficulty) {
      const raw = String(row[fieldToCol.difficulty] ?? '').toLowerCase().trim();
      if (raw === 'easy' || raw === 'medium' || raw === 'hard') {
        difficulty = raw;
      }
    }

    problems.push({ name: rawName, link: rawLink, topics, difficulty });
  }

  return problems;
}
