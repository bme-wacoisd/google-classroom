/**
 * CSV Parser Tests
 */

import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  mapColumns,
  validateCSVData,
  isValidEmail,
  emailValidator,
  detectCSVFormat,
  getCSVPreview,
  toCSVString,
  deduplicateByKey,
} from './parser';
import type { ColumnMapping } from './types';

describe('parseCSV', () => {
  it('parses simple CSV with headers', () => {
    const csv = `name,email,grade
John Doe,john@example.com,10
Jane Smith,jane@example.com,11`;

    const result = parseCSV(csv);

    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      grade: '10',
    });
    expect(result.data[1]).toEqual({
      name: 'Jane Smith',
      email: 'jane@example.com',
      grade: '11',
    });
    expect(result.meta.fields).toEqual(['name', 'email', 'grade']);
    expect(result.meta.rowCount).toBe(2);
    expect(result.errors).toHaveLength(0);
  });

  it('normalizes headers to lowercase with underscores', () => {
    const csv = `First Name,Last Name,Email Address
John,Doe,john@example.com`;

    const result = parseCSV(csv);

    expect(result.meta.fields).toEqual(['first_name', 'last_name', 'email_address']);
    expect(result.data[0]).toHaveProperty('first_name', 'John');
  });

  it('skips empty lines by default', () => {
    const csv = `name,email
John,john@example.com

Jane,jane@example.com`;

    const result = parseCSV(csv);

    expect(result.data).toHaveLength(2);
  });

  it('respects custom delimiter', () => {
    const csv = `name;email;grade
John;john@example.com;10`;

    const result = parseCSV(csv, { delimiter: ';' });

    expect(result.data[0]).toEqual({
      name: 'John',
      email: 'john@example.com',
      grade: '10',
    });
  });

  it('uses custom transformHeader function', () => {
    const csv = `Name,Email
John,john@example.com`;

    const result = parseCSV(csv, {
      transformHeader: (h) => h.toUpperCase(),
    });

    expect(result.meta.fields).toEqual(['NAME', 'EMAIL']);
    expect(result.data[0]).toHaveProperty('NAME', 'John');
  });

  it('handles CSV with quoted fields', () => {
    const csv = `name,description
"John Doe","A student, from Texas"`;

    const result = parseCSV(csv);

    expect(result.data[0]).toEqual({
      name: 'John Doe',
      description: 'A student, from Texas',
    });
  });
});

describe('mapColumns', () => {
  it('maps source columns to target columns', () => {
    const data = [
      { first: 'John', last: 'Doe', mail: 'john@example.com' },
      { first: 'Jane', last: 'Smith', mail: 'jane@example.com' },
    ];

    const mappings: ColumnMapping[] = [
      { source: 'first', target: 'firstName', required: true },
      { source: 'last', target: 'lastName', required: true },
      { source: 'mail', target: 'email', required: true },
    ];

    const result = mapColumns(data, mappings);

    expect(result).toEqual([
      { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
    ]);
  });

  it('applies transform function to values', () => {
    const data = [{ name: '  John  ' }];

    const mappings: ColumnMapping[] = [
      { source: 'name', target: 'name', transform: (v) => v.trim() },
    ];

    const result = mapColumns(data, mappings);

    expect(result[0]).toEqual({ name: 'John' });
  });

  it('sets empty string for missing required fields', () => {
    const data = [{ name: 'John' }];

    const mappings: ColumnMapping[] = [
      { source: 'name', target: 'name', required: true },
      { source: 'email', target: 'email', required: true },
    ];

    const result = mapColumns(data, mappings);

    expect(result[0]).toEqual({ name: 'John', email: '' });
  });

  it('skips missing non-required fields', () => {
    const data = [{ name: 'John' }];

    const mappings: ColumnMapping[] = [
      { source: 'name', target: 'name' },
      { source: 'email', target: 'email' },
    ];

    const result = mapColumns(data, mappings);

    expect(result[0]).toEqual({ name: 'John' });
    expect(result[0]).not.toHaveProperty('email');
  });
});

describe('validateCSVData', () => {
  it('returns valid for data with all required fields', () => {
    const data = [
      { name: 'John', email: 'john@example.com' },
      { name: 'Jane', email: 'jane@example.com' },
    ];

    const result = validateCSVData(data, ['name', 'email']);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors for missing required fields', () => {
    const data = [
      { name: 'John', email: '' },
      { name: '', email: 'jane@example.com' },
    ];

    const result = validateCSVData(data, ['name', 'email']);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toEqual({
      row: 1,
      field: 'email',
      message: 'Missing required field: email',
    });
    expect(result.errors[1]).toEqual({
      row: 2,
      field: 'name',
      message: 'Missing required field: name',
    });
  });

  it('treats null and undefined as missing', () => {
    const data = [{ name: null }, { name: undefined }];

    const result = validateCSVData(data as unknown as Record<string, unknown>[], ['name']);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it('runs custom validators', () => {
    const data = [
      { email: 'valid@example.com' },
      { email: 'invalid-email' },
    ];

    const validators = {
      email: (value: unknown) => {
        if (value && !String(value).includes('@')) {
          return 'Invalid email';
        }
        return null;
      },
    };

    const result = validateCSVData(data, [], validators);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(2);
    expect(result.errors[0].message).toBe('Invalid email');
  });
});

describe('isValidEmail', () => {
  it('returns true for valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  it('returns false for invalid emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('emailValidator', () => {
  const emptyRow = {};

  it('returns null for valid emails', () => {
    expect(emailValidator('test@example.com', emptyRow, 0)).toBeNull();
  });

  it('returns error message for invalid emails', () => {
    expect(emailValidator('invalid', emptyRow, 0)).toBe('Invalid email format: invalid');
  });

  it('returns null for empty values (let required field check handle)', () => {
    expect(emailValidator('', emptyRow, 0)).toBeNull();
    expect(emailValidator(null, emptyRow, 0)).toBeNull();
    expect(emailValidator(undefined, emptyRow, 0)).toBeNull();
  });
});

describe('detectCSVFormat', () => {
  it('detects OneRoster format', () => {
    const headers = ['sourcedId', 'status', 'dateLastModified', 'givenName', 'familyName'];
    expect(detectCSVFormat(headers)).toBe('oneroster');
  });

  it('detects Frontline format', () => {
    const headers = ['studentId', 'firstName', 'lastName', 'email', 'grade'];
    expect(detectCSVFormat(headers)).toBe('frontline');
  });

  it('returns unknown for unrecognized format', () => {
    const headers = ['column1', 'column2', 'column3'];
    expect(detectCSVFormat(headers)).toBe('unknown');
  });

  it('handles case-insensitive header matching', () => {
    const headers = ['STUDENTID', 'FIRSTNAME', 'LASTNAME', 'EMAIL'];
    expect(detectCSVFormat(headers)).toBe('frontline');
  });

  it('handles headers with whitespace', () => {
    const headers = ['  studentId  ', ' firstName ', 'lastName', 'email'];
    expect(detectCSVFormat(headers)).toBe('frontline');
  });
});

describe('getCSVPreview', () => {
  it('returns first N rows', () => {
    const data = [
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 5 },
      { id: 6 },
    ];

    const preview = getCSVPreview(data, 3);

    expect(preview).toHaveLength(3);
    expect(preview.map((r) => r.id)).toEqual([1, 2, 3]);
  });

  it('defaults to 5 rows', () => {
    const data = Array.from({ length: 10 }, (_, i) => ({ id: i }));

    const preview = getCSVPreview(data);

    expect(preview).toHaveLength(5);
  });

  it('returns all rows if fewer than requested', () => {
    const data = [{ id: 1 }, { id: 2 }];

    const preview = getCSVPreview(data, 5);

    expect(preview).toHaveLength(2);
  });
});

describe('toCSVString', () => {
  it('converts data array to CSV string', () => {
    const data = [
      { name: 'John', email: 'john@example.com' },
      { name: 'Jane', email: 'jane@example.com' },
    ];

    const csv = toCSVString(data);

    expect(csv).toContain('name,email');
    expect(csv).toContain('John,john@example.com');
    expect(csv).toContain('Jane,jane@example.com');
  });

  it('respects specified field order', () => {
    const data = [{ b: 2, a: 1, c: 3 }];

    const csv = toCSVString(data, ['a', 'b', 'c']);

    // Handle both Windows (\r\n) and Unix (\n) line endings
    expect(csv.split(/\r?\n/)[0]).toBe('a,b,c');
  });

  it('handles values with commas by quoting', () => {
    const data = [{ name: 'Doe, John', city: 'Austin' }];

    const csv = toCSVString(data);

    expect(csv).toContain('"Doe, John"');
  });
});

describe('deduplicateByKey', () => {
  it('removes duplicate entries based on key field', () => {
    const data = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
      { id: '1', name: 'John Duplicate' },
      { id: '3', name: 'Bob' },
    ];

    const { unique, duplicates } = deduplicateByKey(data, 'id');

    expect(unique).toHaveLength(3);
    expect(unique.map((r) => r.id)).toEqual(['1', '2', '3']);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]).toEqual({ id: '1', name: 'John Duplicate' });
  });

  it('keeps first occurrence of duplicate', () => {
    const data = [
      { id: 'A', value: 'first' },
      { id: 'A', value: 'second' },
    ];

    const { unique } = deduplicateByKey(data, 'id');

    expect(unique[0].value).toBe('first');
  });

  it('returns empty duplicates array when no duplicates', () => {
    const data = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ];

    const { unique, duplicates } = deduplicateByKey(data, 'id');

    expect(unique).toHaveLength(2);
    expect(duplicates).toHaveLength(0);
  });
});
