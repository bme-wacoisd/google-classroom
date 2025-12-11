/**
 * Roster Comparison Utilities
 * Compares Frontline TEAMS roster (source of truth) with Google Classroom
 */

import type {
  FrontlineStudent,
  FrontlineRoster,
  Student,
  Course,
  ComparisonResult,
  RosterDiff,
} from '../types';

const STORAGE_KEY = 'frontlineRoster';

/**
 * Parse Frontline CSV content into structured data
 */
export function parseFrontlineCSV(csvContent: string): FrontlineStudent[] {
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const students: FrontlineStudent[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length >= 6) {
      students.push({
        studentName: row[0].replace(/^"|"$/g, ''),
        course: row[1].replace(/^"|"$/g, ''),
        section: row[2].replace(/^"|"$/g, ''),
        period: row[3].replace(/^"|"$/g, ''),
        day: row[4].replace(/^"|"$/g, ''),
        teacher: row[5].replace(/^"|"$/g, ''),
      });
    }
  }

  return students;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

/**
 * Save Frontline roster to localStorage
 */
export function saveFrontlineRoster(
  students: FrontlineStudent[],
  fileName: string
): FrontlineRoster {
  const roster: FrontlineRoster = {
    students,
    importedAt: new Date().toISOString(),
    fileName,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
  return roster;
}

/**
 * Load Frontline roster from localStorage
 */
export function loadFrontlineRoster(): FrontlineRoster | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as FrontlineRoster;
  } catch {
    return null;
  }
}

/**
 * Clear Frontline roster from localStorage
 */
export function clearFrontlineRoster(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Normalize a name for comparison
 * Handles "Last, First Middle" vs "First Middle Last"
 */
export function normalizeName(name: string): string {
  if (!name) return '';

  // Remove extra whitespace
  let normalized = name.trim().replace(/\s+/g, ' ');

  // If "Last, First" format, convert to "first last" for comparison
  if (normalized.includes(',')) {
    const [last, first] = normalized.split(',').map((s) => s.trim());
    // Take only first name (ignore middle names)
    const firstName = first.split(' ')[0];
    normalized = `${firstName} ${last}`;
  }

  return normalized.toLowerCase();
}

/**
 * Check if two names match
 */
export function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);

  if (n1 === n2) return true;

  // Try matching just first + last name
  const parts1 = n1.split(' ');
  const parts2 = n2.split(' ');

  if (parts1.length >= 2 && parts2.length >= 2) {
    // Compare first and last name
    const first1 = parts1[0];
    const last1 = parts1[parts1.length - 1];
    const first2 = parts2[0];
    const last2 = parts2[parts2.length - 1];

    return first1 === first2 && last1 === last2;
  }

  return false;
}

/**
 * Extract period number from a Google Classroom course name
 * Matches patterns: "3 Chemistry", "3-Chemistry", "Period 3", "(3)", "P3", "Pd 3"
 */
export function extractPeriodFromGCName(name: string): string | null {
  if (!name) return null;

  // Pattern: starts with number followed by space or dash
  let match = name.match(/^(\d+)[\s-]/);
  if (match) return match[1];

  // Pattern: "Period X" or "period X"
  match = name.match(/period\s*(\d+)/i);
  if (match) return match[1];

  // Pattern: "(X)" where X is a number
  match = name.match(/\((\d+)\)/);
  if (match) return match[1];

  // Pattern: "PX" or "Pd X"
  match = name.match(/\bp(\d+)\b/i);
  if (match) return match[1];

  match = name.match(/\bpd\s*(\d+)\b/i);
  if (match) return match[1];

  return null;
}

/**
 * Normalize period string (strip leading zeros)
 */
export function normalizePeriod(period: string): string {
  return parseInt(period.replace(/^0+/, ''), 10).toString();
}

/**
 * Find matching GC course for a Frontline period
 */
export function findMatchingGCCourse(
  period: string,
  gcCourses: Course[]
): Course | undefined {
  const normalizedPeriod = normalizePeriod(period);

  return gcCourses.find((course) => {
    const gcPeriod = extractPeriodFromGCName(course.name);
    return gcPeriod && normalizePeriod(gcPeriod) === normalizedPeriod;
  });
}

/**
 * Get unique periods from Frontline roster
 */
export function getUniquePeriods(students: FrontlineStudent[]): string[] {
  const periods = new Set<string>();
  students.forEach((s) => periods.add(normalizePeriod(s.period)));
  return Array.from(periods).sort((a, b) => parseInt(a) - parseInt(b));
}

/**
 * Get students for a specific period from Frontline roster
 * Deduplicates by student name
 */
export function getStudentsForPeriod(
  students: FrontlineStudent[],
  period: string
): FrontlineStudent[] {
  const normalizedPeriod = normalizePeriod(period);
  const seen = new Set<string>();
  const result: FrontlineStudent[] = [];

  for (const student of students) {
    if (normalizePeriod(student.period) === normalizedPeriod) {
      const key = normalizeName(student.studentName);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(student);
      }
    }
  }

  return result.sort((a, b) => a.studentName.localeCompare(b.studentName));
}

/**
 * Get the primary course name for a period (most common)
 */
export function getCourseNameForPeriod(
  students: FrontlineStudent[],
  period: string
): string {
  const periodStudents = getStudentsForPeriod(students, period);
  const courseCounts = new Map<string, number>();

  periodStudents.forEach((s) => {
    courseCounts.set(s.course, (courseCounts.get(s.course) || 0) + 1);
  });

  let maxCourse = '';
  let maxCount = 0;
  courseCounts.forEach((count, course) => {
    if (count > maxCount) {
      maxCount = count;
      maxCourse = course;
    }
  });

  return maxCourse;
}

/**
 * Compare Frontline roster with Google Classroom data
 */
export function compareRosters(
  frontlineStudents: FrontlineStudent[],
  gcCourses: Course[],
  gcStudentsByCourse: Record<string, Student[]>
): RosterDiff {
  const periods = getUniquePeriods(frontlineStudents);
  const comparisons: ComparisonResult[] = [];
  const unmatchedPeriods: string[] = [];

  let totalFrontline = 0;
  let totalGC = 0;
  let totalMissing = 0;
  let totalExtra = 0;
  let totalMatched = 0;

  for (const period of periods) {
    const flStudents = getStudentsForPeriod(frontlineStudents, period);
    const courseName = getCourseNameForPeriod(frontlineStudents, period);
    const gcCourse = findMatchingGCCourse(period, gcCourses);

    const flNames = flStudents.map((s) => s.studentName);
    totalFrontline += flNames.length;

    if (!gcCourse) {
      unmatchedPeriods.push(period);
      comparisons.push({
        period,
        courseName,
        frontlineStudents: flNames,
        gcStudents: [],
        missingFromGC: flNames,
        extraInGC: [],
        matched: [],
      });
      totalMissing += flNames.length;
      continue;
    }

    const gcStudents = gcStudentsByCourse[gcCourse.id] || [];
    const gcNames = gcStudents.map((s) => s.profile.name.fullName);
    totalGC += gcNames.length;

    // Find missing (in Frontline but not in GC)
    const missing: string[] = [];
    const matched: string[] = [];

    for (const flName of flNames) {
      const found = gcNames.some((gcName) => namesMatch(flName, gcName));
      if (found) {
        matched.push(flName);
      } else {
        missing.push(flName);
      }
    }

    // Find extra (in GC but not in Frontline)
    const extra: string[] = [];
    for (const gcName of gcNames) {
      const found = flNames.some((flName) => namesMatch(flName, gcName));
      if (!found) {
        extra.push(gcName);
      }
    }

    totalMissing += missing.length;
    totalExtra += extra.length;
    totalMatched += matched.length;

    comparisons.push({
      period,
      courseName,
      gcCourseId: gcCourse.id,
      gcCourseName: gcCourse.name,
      frontlineStudents: flNames,
      gcStudents: gcNames,
      missingFromGC: missing,
      extraInGC: extra,
      matched,
    });
  }

  return {
    comparisons: comparisons.sort(
      (a, b) => parseInt(a.period) - parseInt(b.period)
    ),
    unmatchedPeriods,
    summary: {
      totalFrontline,
      totalGC,
      totalMissing,
      totalExtra,
      totalMatched,
    },
  };
}

/**
 * Compare for a single class/period
 */
export function compareForPeriod(
  frontlineStudents: FrontlineStudent[],
  period: string,
  gcStudents: Student[]
): ComparisonResult {
  const flStudents = getStudentsForPeriod(frontlineStudents, period);
  const courseName = getCourseNameForPeriod(frontlineStudents, period);

  const flNames = flStudents.map((s) => s.studentName);
  const gcNames = gcStudents.map((s) => s.profile.name.fullName);

  const missing: string[] = [];
  const matched: string[] = [];

  for (const flName of flNames) {
    const found = gcNames.some((gcName) => namesMatch(flName, gcName));
    if (found) {
      matched.push(flName);
    } else {
      missing.push(flName);
    }
  }

  const extra: string[] = [];
  for (const gcName of gcNames) {
    const found = flNames.some((flName) => namesMatch(flName, gcName));
    if (!found) {
      extra.push(gcName);
    }
  }

  return {
    period,
    courseName,
    frontlineStudents: flNames,
    gcStudents: gcNames,
    missingFromGC: missing,
    extraInGC: extra,
    matched,
  };
}
