/**
 * CSV Parser Utility
 * Handles parsing and validation of CSV files for roster imports
 */

import Papa from 'papaparse';
import type {
  CSVParseResult,
  CSVParseError,
  CSVParseMeta,
  CSVParseOptions,
  ColumnMapping,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './types';

/**
 * Parse a CSV string into typed data
 */
export function parseCSV<T extends Record<string, unknown>>(
  csvContent: string,
  options: CSVParseOptions = {}
): CSVParseResult<T> {
  const {
    header = true,
    skipEmptyLines = true,
    transformHeader,
    delimiter,
  } = options;

  const result = Papa.parse<T>(csvContent, {
    header,
    skipEmptyLines,
    transformHeader: transformHeader || ((h: string) => h.trim().toLowerCase().replace(/\s+/g, '_')),
    delimiter,
    dynamicTyping: false,
  });

  const errors: CSVParseError[] = result.errors.map((err) => ({
    type: err.type as CSVParseError['type'],
    code: err.code,
    message: err.message,
    row: err.row,
  }));

  const meta: CSVParseMeta = {
    delimiter: result.meta.delimiter,
    linebreak: result.meta.linebreak,
    aborted: result.meta.aborted,
    truncated: result.meta.truncated,
    fields: result.meta.fields,
    rowCount: result.data.length,
  };

  return {
    data: result.data,
    errors,
    meta,
  };
}

/**
 * Parse a CSV file (from input element)
 */
export function parseCSVFile<T extends Record<string, unknown>>(
  file: File,
  options: CSVParseOptions = {}
): Promise<CSVParseResult<T>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const result = parseCSV<T>(content, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('Failed to read file content'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Map CSV data to a target schema using column mappings
 */
export function mapColumns<TSource extends Record<string, unknown>, TTarget>(
  data: TSource[],
  mappings: ColumnMapping[]
): TTarget[] {
  return data.map((row) => {
    const mapped: Record<string, unknown> = {};

    for (const mapping of mappings) {
      const sourceValue = row[mapping.source];
      if (sourceValue !== undefined) {
        const value = String(sourceValue);
        mapped[mapping.target] = mapping.transform ? mapping.transform(value) : value;
      } else if (mapping.required) {
        mapped[mapping.target] = '';
      }
    }

    return mapped as TTarget;
  });
}

/**
 * Validate CSV data against required fields and rules
 */
export function validateCSVData<T extends Record<string, unknown>>(
  data: T[],
  requiredFields: string[],
  customValidators?: Record<string, (value: unknown, row: T, rowIndex: number) => string | null>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  data.forEach((row, rowIndex) => {
    // Check required fields
    for (const field of requiredFields) {
      const value = row[field];
      if (value === undefined || value === null || value === '') {
        errors.push({
          row: rowIndex + 1,
          field,
          message: `Missing required field: ${field}`,
        });
      }
    }

    // Run custom validators
    if (customValidators) {
      for (const [field, validator] of Object.entries(customValidators)) {
        const value = row[field];
        const errorMessage = validator(value, row, rowIndex);
        if (errorMessage) {
          errors.push({
            row: rowIndex + 1,
            field,
            message: errorMessage,
            value: String(value),
          });
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Email validator for CSV validation
 */
export function emailValidator(
  value: unknown,
  _row: Record<string, unknown>,
  _rowIndex: number
): string | null {
  if (!value || String(value).trim() === '') {
    return null; // Let required field check handle empty values
  }
  if (!isValidEmail(String(value))) {
    return `Invalid email format: ${value}`;
  }
  return null;
}

/**
 * Detect the format of a CSV file based on headers
 */
export function detectCSVFormat(headers: string[]): 'frontline' | 'oneroster' | 'unknown' {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  // OneRoster has specific required headers
  const oneRosterIndicators = ['sourceId', 'status', 'dateLastModified'].map((h) =>
    h.toLowerCase()
  );
  if (oneRosterIndicators.some((indicator) => normalizedHeaders.includes(indicator))) {
    return 'oneroster';
  }

  // Frontline typically has these headers
  const frontlineIndicators = ['studentid', 'firstname', 'lastname', 'email'];
  if (frontlineIndicators.every((indicator) => normalizedHeaders.includes(indicator))) {
    return 'frontline';
  }

  return 'unknown';
}

/**
 * Get preview of CSV data (first N rows)
 */
export function getCSVPreview<T extends Record<string, unknown>>(
  data: T[],
  rows: number = 5
): T[] {
  return data.slice(0, rows);
}

/**
 * Convert CSV data back to CSV string
 */
export function toCSVString<T extends Record<string, unknown>>(
  data: T[],
  fields?: string[]
): string {
  return Papa.unparse(data, {
    columns: fields,
    header: true,
  });
}

/**
 * Deduplicate CSV data based on a key field
 */
export function deduplicateByKey<T extends Record<string, unknown>>(
  data: T[],
  keyField: keyof T
): { unique: T[]; duplicates: T[] } {
  const seen = new Map<unknown, T>();
  const duplicates: T[] = [];

  for (const row of data) {
    const key = row[keyField];
    if (seen.has(key)) {
      duplicates.push(row);
    } else {
      seen.set(key, row);
    }
  }

  return {
    unique: Array.from(seen.values()),
    duplicates,
  };
}
