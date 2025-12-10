/**
 * CSV Import Types
 */

export interface CSVParseResult<T> {
  data: T[];
  errors: CSVParseError[];
  meta: CSVParseMeta;
}

export interface CSVParseError {
  type: 'FieldMismatch' | 'TooFewFields' | 'TooManyFields' | 'InvalidValue' | 'MissingRequired';
  code?: string;
  message: string;
  row?: number;
  field?: string;
}

export interface CSVParseMeta {
  delimiter: string;
  linebreak: string;
  aborted: boolean;
  truncated: boolean;
  fields?: string[];
  rowCount: number;
}

export interface CSVParseOptions {
  header?: boolean;
  skipEmptyLines?: boolean;
  transformHeader?: (header: string) => string;
  delimiter?: string;
}

/**
 * Frontline Student Import Format
 */
export interface FrontlineStudentRow {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  grade?: string;
  homeroom?: string;
  campus?: string;
  enrollmentStatus?: string;
}

/**
 * Frontline Course/Class Import Format
 */
export interface FrontlineCourseRow {
  courseId: string;
  courseName: string;
  section?: string;
  teacherId?: string;
  teacherEmail?: string;
  period?: string;
  room?: string;
  term?: string;
}

/**
 * Frontline Enrollment Import Format
 */
export interface FrontlineEnrollmentRow {
  studentId: string;
  courseId: string;
  enrollmentDate?: string;
  role?: 'student' | 'teacher';
}

/**
 * OneRoster User Format
 */
export interface OneRosterUserRow {
  sourcedId: string;
  status: string;
  dateLastModified?: string;
  enabledUser: string;
  orgSourcedIds: string;
  role: string;
  username?: string;
  userIds?: string;
  givenName: string;
  familyName: string;
  middleName?: string;
  identifier?: string;
  email?: string;
  sms?: string;
  phone?: string;
  agentSourcedIds?: string;
  grades?: string;
  password?: string;
}

/**
 * OneRoster Class Format
 */
export interface OneRosterClassRow {
  sourcedId: string;
  status: string;
  dateLastModified?: string;
  title: string;
  grades?: string;
  courseSourcedId: string;
  classCode?: string;
  classType: string;
  location?: string;
  schoolSourcedId: string;
  termSourcedIds: string;
  subjects?: string;
  subjectCodes?: string;
  periods?: string;
}

/**
 * OneRoster Enrollment Format
 */
export interface OneRosterEnrollmentRow {
  sourcedId: string;
  status: string;
  dateLastModified?: string;
  classSourcedId: string;
  schoolSourcedId: string;
  userSourcedId: string;
  role: string;
  primary?: string;
  beginDate?: string;
  endDate?: string;
}

/**
 * Column mapping configuration
 */
export interface ColumnMapping {
  source: string;
  target: string;
  required?: boolean;
  transform?: (value: string) => string;
}

/**
 * Import validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface ValidationWarning {
  row: number;
  field: string;
  message: string;
  value?: string;
}
