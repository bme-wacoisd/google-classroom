/**
 * Compare Frontline TEAMS roster with Google Classroom
 * Frontline is source of truth
 */

const RosterCompare = {
  /**
   * Normalize student name for comparison
   */
  normalizeName(name) {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/,\s*/g, ', '); // Normalize "Last,First" to "Last, First"
  },

  /**
   * Parse "Last, First" format to {first, last}
   */
  parseName(name) {
    const normalized = this.normalizeName(name);
    if (normalized.includes(',')) {
      const [last, first] = normalized.split(',').map(s => s.trim());
      return { first, last, full: `${first} ${last}` };
    }
    const parts = normalized.split(' ');
    return {
      first: parts[0] || '',
      last: parts.slice(1).join(' ') || '',
      full: normalized
    };
  },

  /**
   * Check if two names match (handles "Last, First" vs "First Last")
   */
  namesMatch(name1, name2) {
    const n1 = this.parseName(name1);
    const n2 = this.parseName(name2);

    // Exact match on full name
    if (n1.full === n2.full) return true;

    // Match first and last separately
    if (n1.first === n2.first && n1.last === n2.last) return true;

    // Try reversed
    if (n1.first === n2.last && n1.last === n2.first) return true;

    return false;
  },

  /**
   * Find matching student in Google Classroom by name
   */
  findInGoogleClassroom(frontlineStudent, gcStudents) {
    for (const gc of gcStudents) {
      if (this.namesMatch(frontlineStudent, gc.name)) {
        return gc;
      }
    }
    return null;
  },

  /**
   * Main comparison function
   * @param frontlineData - Data extracted from Frontline TEAMS
   * @param gcData - Data from Google Classroom API
   * @returns Comparison results
   */
  compare(frontlineData, gcData) {
    const results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFrontline: 0,
        totalGoogleClassroom: 0,
        matched: 0,
        missingFromGC: 0,
        extraInGC: 0,
        wrongClass: 0
      },
      byCourse: {},
      issues: [],
      missingFromGC: [],
      extraInGC: [],
      wrongClass: []
    };

    // Get unique students from Frontline (by name)
    const frontlineStudents = new Map();
    const frontlineByCourse = new Map();

    for (const student of (frontlineData.students || [])) {
      const name = this.normalizeName(student.studentName || student.teacherName);
      if (!name) continue;

      if (!frontlineStudents.has(name)) {
        frontlineStudents.set(name, {
          name: student.studentName || student.teacherName,
          courses: new Set(),
          raw: student
        });
      }

      const courseKey = student.courseDescription || student.courseId || 'Unknown';
      frontlineStudents.get(name).courses.add(courseKey);

      if (!frontlineByCourse.has(courseKey)) {
        frontlineByCourse.set(courseKey, new Set());
      }
      frontlineByCourse.get(courseKey).add(name);
    }

    // Get unique students from Google Classroom
    const gcStudents = new Map();
    const gcByCourse = new Map();

    for (const student of (gcData.allStudents || [])) {
      const name = this.normalizeName(student.name);
      if (!name) continue;

      if (!gcStudents.has(name)) {
        gcStudents.set(name, {
          name: student.name,
          email: student.email,
          courses: new Set(),
          raw: student
        });
      }

      const courseKey = student.courseName || 'Unknown';
      gcStudents.get(name).courses.add(courseKey);

      if (!gcByCourse.has(courseKey)) {
        gcByCourse.set(courseKey, new Set());
      }
      gcByCourse.get(courseKey).add(name);
    }

    results.summary.totalFrontline = frontlineStudents.size;
    results.summary.totalGoogleClassroom = gcStudents.size;

    // Find students missing from Google Classroom
    for (const [name, student] of frontlineStudents) {
      let found = false;

      // Try to find by exact name match
      if (gcStudents.has(name)) {
        found = true;
      } else {
        // Try fuzzy match
        for (const [gcName, gcStudent] of gcStudents) {
          if (this.namesMatch(name, gcName)) {
            found = true;
            break;
          }
        }
      }

      if (!found) {
        results.missingFromGC.push({
          name: student.name,
          courses: Array.from(student.courses),
          source: 'frontline'
        });
        results.summary.missingFromGC++;
      } else {
        results.summary.matched++;
      }
    }

    // Find extra students in Google Classroom (not in Frontline)
    for (const [name, student] of gcStudents) {
      let found = false;

      if (frontlineStudents.has(name)) {
        found = true;
      } else {
        for (const [flName] of frontlineStudents) {
          if (this.namesMatch(name, flName)) {
            found = true;
            break;
          }
        }
      }

      if (!found) {
        results.extraInGC.push({
          name: student.name,
          email: student.email,
          courses: Array.from(student.courses),
          source: 'google_classroom'
        });
        results.summary.extraInGC++;
      }
    }

    // Build issues list for display
    results.issues = [
      ...results.missingFromGC.map(s => ({
        type: 'missing',
        severity: 'error',
        message: `${s.name} is in Frontline but NOT in Google Classroom`,
        student: s.name,
        courses: s.courses
      })),
      ...results.extraInGC.map(s => ({
        type: 'extra',
        severity: 'warning',
        message: `${s.name} is in Google Classroom but NOT in Frontline`,
        student: s.name,
        email: s.email,
        courses: s.courses
      }))
    ];

    // Sort issues by type (missing first) then by name
    results.issues.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'missing' ? -1 : 1;
      return a.student.localeCompare(b.student);
    });

    return results;
  }
};

if (typeof window !== 'undefined') {
  window.RosterCompare = RosterCompare;
}
