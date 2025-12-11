/**
 * Frontline TEAMS Content Script
 * Extracts student roster data from Take Classroom Attendance
 * Handles A/B/C day rotating schedules with automatic multi-day extraction
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    uniqueDaysNeeded: 3,      // Number of distinct day arrangements to find
    maxWeeksBack: 3,          // Maximum weeks to search back
    maxDaysBack: 21,          // 3 weeks
    extractionDelay: 2000,    // Wait for page to load after date change
  };

  /**
   * Detect which page type we're on
   */
  function detectPageType() {
    const pageTitle = document.querySelector('.pageTitle');
    if (pageTitle) {
      const title = pageTitle.textContent.trim().toLowerCase();
      if (title.includes('attendance')) return 'attendance';
      if (title.includes('roster')) return 'roster';
    }
    if (document.getElementById('tableBodyTable')) return 'attendance';
    if (document.getElementById('scheduleTableBodyTable')) return 'roster';
    return 'unknown';
  }

  /**
   * Get current selected date from the page
   */
  function getCurrentDate() {
    // Look for date picker or date display
    const dateInput = document.querySelector('input[name*="date"], input[name*="Date"], #attendanceDate');
    if (dateInput) return dateInput.value;

    const dateDisplay = document.querySelector('.selectedDate, .current-date, [id*="date"]');
    if (dateDisplay) return dateDisplay.textContent.trim();

    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get the day type (A, B, C, etc.) from the page if displayed
   */
  function getDayType() {
    // Look for day type indicator
    const dayIndicators = document.querySelectorAll('.dayType, .day-indicator, [class*="day-type"]');
    for (const el of dayIndicators) {
      const text = el.textContent.trim();
      if (/^[A-Z]\s*Day$/i.test(text)) {
        return text.charAt(0).toUpperCase();
      }
    }

    // Check table headers or cells for day info
    const dayHeader = document.querySelector('[columnid="rfdCalDayCodeId"]');
    if (dayHeader) {
      const dayCell = document.querySelector('td[title]');
      // Day code might be in cells
    }

    return null;
  }

  /**
   * Extract column headers from table
   */
  function extractColumnHeaders(tableId) {
    const headerTable = document.getElementById(tableId + 'HeaderTable') ||
                        document.querySelector(`#${tableId}Table thead, #${tableId} thead`);
    if (!headerTable) return [];

    const headers = [];
    const headerCells = headerTable.querySelectorAll('th');

    headerCells.forEach((th, index) => {
      const columnId = th.getAttribute('columnid') || `col_${index}`;
      const titleDiv = th.querySelector('.table-handle');
      const title = titleDiv ? titleDiv.getAttribute('title') || titleDiv.textContent : th.textContent;
      headers.push({ index, columnId, title: title.trim() });
    });

    return headers;
  }

  /**
   * Check if we're on the class list page (no students) vs a class roster page (has students)
   */
  function isClassListPage() {
    // Check if page title says "Section Periods" - that's the class list
    const titleSpan = document.querySelector('.sst-title');
    if (titleSpan && titleSpan.textContent.includes('Section Periods')) {
      return true;
    }
    // Check if there's no studentFullName column
    const hasStudentColumn = document.querySelector('th[columnid="studentFullName"], th[columnid="studentName"]');
    return !hasStudentColumn;
  }

  /**
   * Get list of class rows to click through
   */
  function getClassRows() {
    const tableBody = document.getElementById('tableBodyTable');
    if (!tableBody) return [];
    return Array.from(tableBody.querySelectorAll('tr[id^="table-row-"]'));
  }

  /**
   * Extract class info from the section periods list (attendance page)
   */
  function extractClassList() {
    const tableBody = document.getElementById('tableBodyTable');
    if (!tableBody) return [];

    const headers = extractColumnHeaders('table');
    const rows = tableBody.querySelectorAll('tr[id^="table-row-"]');
    const classes = [];

    rows.forEach((row, index) => {
      const cells = row.querySelectorAll('td');
      const rowData = {};

      headers.forEach((header, idx) => {
        if (cells[idx]) {
          rowData[header.columnId] = cells[idx].getAttribute('title') || cells[idx].textContent.trim();
        }
      });

      classes.push({
        index,
        rowId: row.id,
        period: rowData.stuCalPeriodId || '',
        courseDescription: rowData.locCourseShortDesc || '',
        courseId: rowData.distCourseId || '',
        sectionId: rowData.locCrsSectionId || '',
        term: rowData.studentCalTermType || '',
        day: rowData.rfdCalDayCodeId || '',
        teacherName: rowData.teacherName || '',
        element: row
      });
    });

    return classes;
  }

  /**
   * Extract student roster from a class detail page
   */
  function extractStudentRoster() {
    // Look for the roster table - might be rosterTableBodyTable or tableBodyTable
    const possibleIds = ['rosterTableBodyTable', 'tableBodyTable'];
    let tableBody = null;
    let tableId = '';

    for (const id of possibleIds) {
      const el = document.getElementById(id);
      if (el) {
        tableBody = el;
        tableId = id.replace('BodyTable', '');
        break;
      }
    }

    if (!tableBody) return [];

    const headers = extractColumnHeaders(tableId);
    const rows = tableBody.querySelectorAll('tr.odd, tr.even, tr[id^="table-row-"]');
    const students = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length === 0) return;

      const rowData = {};
      headers.forEach((header, index) => {
        if (cells[index]) {
          rowData[header.columnId] = cells[index].getAttribute('title') || cells[index].textContent.trim();
        }
      });

      // Extract student name - check multiple possible column IDs
      const studentName = rowData.studentFullName || rowData.studentName || rowData.stuName || '';

      if (studentName) {
        students.push({
          studentName,
          studentId: rowData.perId || rowData.studentId || '',
          grade: rowData.rfsGradeCode || rowData.stuGradeLevel || '',
          gender: rowData.perGender || '',
          raw: rowData
        });
      }
    });

    return students;
  }

  /**
   * Click on a class row and wait for roster to load
   */
  async function clickClassRow(row) {
    return new Promise((resolve) => {
      // Find clickable element in the row
      const clickable = row.querySelector('a, td[onclick], .clickable') || row.querySelector('td');
      if (clickable) {
        clickable.click();
      } else {
        row.click();
      }
      // Wait for page to potentially update
      setTimeout(resolve, 1500);
    });
  }

  /**
   * Extract all class/student data from the attendance table
   * Now handles both class list page and roster pages
   */
  function extractAttendanceData() {
    // First check if we're on class list vs roster
    if (isClassListPage()) {
      console.log('TEAMS Sync: On class list page (no students visible)');
      // Return the class list info
      const classes = extractClassList();
      return {
        pageType: 'classlist',
        extractedAt: new Date().toISOString(),
        date: getCurrentDate(),
        message: 'This page shows classes, not students. Use "Extract All Days" to navigate into each class.',
        classCount: classes.length,
        classes: classes,
        students: [], // No students on this page
        recordCount: 0
      };
    }

    // We're on a roster page - extract students
    const students = extractStudentRoster();
    const tableBody = document.getElementById('tableBodyTable') || document.getElementById('rosterTableBodyTable');
    const headers = extractColumnHeaders('table') || extractColumnHeaders('rosterTable');

    // Try to get class info from page
    const classInfo = {
      period: document.querySelector('[name="period"], #period')?.value || '',
      courseId: document.querySelector('[name="courseId"], #courseId')?.value || '',
      sectionId: document.querySelector('[name="sectionId"], #sectionId')?.value || ''
    };

    const dayTypes = new Set();
    const records = students.map(s => ({
      ...s,
      ...classInfo,
      day: s.raw?.rfdCalDayCodeId || ''
    }));

    records.forEach(r => {
      if (r.day) dayTypes.add(r.day);
    });

    return {
      pageType: 'roster',
      extractedAt: new Date().toISOString(),
      date: getCurrentDate(),
      dayType: dayTypes.size === 1 ? Array.from(dayTypes)[0] : null,
      dayTypes: Array.from(dayTypes),
      headers,
      recordCount: records.length,
      uniqueStudents: new Set(records.map(r => r.studentName)).size,
      students: records
    };
  }

  /**
   * Extract data from Class Roster List page
   */
  function extractRosterData() {
    const possibleIds = ['rosterTableBodyTable', 'scheduleTableBodyTable', 'tableBodyTable'];
    let tableBody = null;
    let tableId = '';

    for (const id of possibleIds) {
      tableBody = document.getElementById(id);
      if (tableBody) {
        tableId = id.replace('BodyTable', '');
        break;
      }
    }

    if (!tableBody) {
      tableBody = document.querySelector('.ssTable tbody');
    }

    if (!tableBody) return null;

    const headers = extractColumnHeaders(tableId || 'table');
    const rows = tableBody.querySelectorAll('tr.odd, tr.even, tr[id^="table-row-"]');
    const records = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length === 0) return;

      const rowData = {};
      headers.forEach((header, index) => {
        if (cells[index]) {
          rowData[header.columnId] = cells[index].getAttribute('title') || cells[index].textContent.trim();
        }
      });

      records.push({
        rowId: row.id || `row_${records.length}`,
        studentId: rowData.studentId || '',
        studentName: rowData.studentName || rowData.studentFullName || '',
        grade: rowData.stuGradeLevel || '',
        status: rowData.studentCrsReqSchedStatus || '',
        courseId: rowData.courseId || rowData.distCourseId || '',
        courseDescription: rowData.locCourseShortDesc || '',
        sectionId: rowData.locCrsSectionId || '',
        term: rowData.studentCalTermType || '',
        period: rowData.stuCalPeriodId || '',
        day: rowData.rfdCalDayCodeId || '',
        teacher: rowData.locCrsSecTeacherSeqId || rowData.teacherName || '',
        room: rowData.locationRoomNumber || '',
        raw: rowData
      });
    });

    return {
      pageType: 'roster',
      extractedAt: new Date().toISOString(),
      date: getCurrentDate(),
      headers,
      studentCount: records.length,
      students: records
    };
  }

  /**
   * Main extraction function
   */
  function extractData() {
    const pageType = detectPageType();
    console.log('TEAMS Sync: Page type:', pageType);

    switch (pageType) {
      case 'attendance':
        return extractAttendanceData();
      case 'roster':
        return extractRosterData();
      default:
        return {
          pageType: 'unknown',
          url: window.location.href,
          message: 'Navigate to Take Classroom Attendance page'
        };
    }
  }

  /**
   * Save extracted data, merging with existing data from other days
   */
  function saveToStorage(data) {
    if (!data || !data.students) return;

    chrome.storage.local.get(['frontlineData', 'frontlineHistory'], (result) => {
      const history = result.frontlineHistory || [];

      // Add current extraction to history
      history.unshift({
        date: data.date,
        dayType: data.dayType,
        extractedAt: data.extractedAt,
        recordCount: data.recordCount
      });

      // Keep last 30 extractions
      if (history.length > 30) history.length = 30;

      // Merge with existing data
      const existing = result.frontlineData || { students: [], allClasses: new Set() };
      const mergedStudents = [...(existing.students || [])];
      const seenKeys = new Set(mergedStudents.map(s =>
        `${s.studentName}-${s.courseId}-${s.period}-${s.day}`
      ));

      for (const student of data.students) {
        const key = `${student.studentName}-${student.courseId}-${student.period}-${student.day}`;
        if (!seenKeys.has(key)) {
          mergedStudents.push(student);
          seenKeys.add(key);
        }
      }

      const merged = {
        ...data,
        students: mergedStudents,
        recordCount: mergedStudents.length,
        lastExtracted: data.extractedAt,
        extractionCount: history.length
      };

      chrome.storage.local.set({
        frontlineData: merged,
        frontlineHistory: history,
        lastExtracted: new Date().toISOString()
      });

      console.log('TEAMS Sync: Saved', mergedStudents.length, 'total records');
    });
  }

  /**
   * Add floating extract button
   */
  function addExtractButton() {
    if (document.getElementById('teams-sync-button')) return;

    const button = document.createElement('button');
    button.id = 'teams-sync-button';
    button.innerHTML = '📋 Extract Roster';
    button.title = 'Extract for Google Classroom sync';

    button.addEventListener('click', () => {
      const data = extractData();
      if (data && data.students) {
        saveToStorage(data);
        showNotification(`Extracted ${data.recordCount || data.students.length} records`);
        chrome.runtime.sendMessage({ action: 'dataExtracted', data });
      } else {
        showNotification('No data found', 'error');
      }
    });

    document.body.appendChild(button);
  }

  /**
   * Show notification
   */
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `teams-sync-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Check if a date is a weekend
   */
  function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  }

  /**
   * Format date as MM/DD/YYYY for Frontline
   */
  function formatDateForFrontline(date) {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  /**
   * Find and interact with the date picker
   */
  function findDateInput() {
    // Try various selectors for the date input
    const selectors = [
      'input[name*="attendanceDate"]',
      'input[name*="AttendanceDate"]',
      'input[name*="date"]',
      'input.datepicker',
      'input[type="text"][onclick*="calendar"]',
      '#attendanceDate',
      'input[id*="date" i]'
    ];

    for (const selector of selectors) {
      const input = document.querySelector(selector);
      if (input) return input;
    }

    // Look for any input near a calendar icon
    const calendarIcons = document.querySelectorAll('img[src*="calendar"], .fa-calendar, [class*="calendar"]');
    for (const icon of calendarIcons) {
      const parent = icon.closest('td, div, span');
      if (parent) {
        const input = parent.querySelector('input') || parent.previousElementSibling;
        if (input && input.tagName === 'INPUT') return input;
      }
    }

    return null;
  }

  /**
   * Change the date and trigger page reload
   */
  async function changeDate(newDate) {
    const dateInput = findDateInput();
    if (!dateInput) {
      console.error('TEAMS Sync: Could not find date input');
      return false;
    }

    const dateStr = formatDateForFrontline(newDate);
    console.log('TEAMS Sync: Changing date to', dateStr);

    // Set the value
    dateInput.value = dateStr;

    // Trigger change events
    dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    dateInput.dispatchEvent(new Event('blur', { bubbles: true }));

    // Look for a "Go" or refresh button
    const goButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
    for (const btn of goButtons) {
      const text = (btn.value || btn.textContent || '').toLowerCase();
      if (text.includes('go') || text.includes('refresh') || text.includes('search')) {
        btn.click();
        return true;
      }
    }

    // Try submitting the form
    const form = dateInput.closest('form');
    if (form) {
      // Look for submit function or button
      const submitBtn = form.querySelector('input[type="submit"], button[type="submit"]');
      if (submitBtn) {
        submitBtn.click();
        return true;
      }
    }

    // Trigger onchange if it exists
    if (dateInput.onchange) {
      dateInput.onchange();
      return true;
    }

    return true;
  }

  /**
   * Wait for page content to update
   */
  function waitForUpdate(timeout = 3000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const tableBody = document.getElementById('tableBodyTable');
      const initialContent = tableBody?.innerHTML || '';

      const checkUpdate = () => {
        const currentContent = tableBody?.innerHTML || '';
        if (currentContent !== initialContent || Date.now() - startTime > timeout) {
          setTimeout(resolve, 500); // Extra wait for rendering
        } else {
          setTimeout(checkUpdate, 200);
        }
      };

      setTimeout(checkUpdate, 500);
    });
  }

  /**
   * Generate a signature for the class arrangement (to detect A/B/C days)
   * Based on which course/period combinations are present
   */
  function getClassArrangementSignature(data) {
    if (!data?.students?.length) return null;

    // Create a signature from unique course-period combinations
    const combinations = new Set();
    for (const student of data.students) {
      const key = `${student.period || ''}-${student.courseId || student.courseDescription || ''}`;
      combinations.add(key);
    }

    // Sort and join to create consistent signature
    return Array.from(combinations).sort().join('|');
  }

  /**
   * Navigate into each class and extract students
   */
  async function extractStudentsFromAllClasses(progressCallback) {
    const allStudents = [];
    const classes = extractClassList();

    if (classes.length === 0) {
      if (progressCallback) progressCallback('No classes found on this page');
      return allStudents;
    }

    if (progressCallback) {
      progressCallback(`Found ${classes.length} classes. Extracting student rosters...`);
    }

    // We need to navigate into each class - this requires page navigation
    // Store the current URL to return to
    const returnUrl = window.location.href;

    for (let i = 0; i < classes.length; i++) {
      const classInfo = classes[i];
      if (progressCallback) {
        progressCallback(`Extracting Period ${classInfo.period} - ${classInfo.courseDescription} (${i + 1}/${classes.length})...`);
      }

      // Try to find a clickable link in the row
      const rows = document.querySelectorAll('#tableBodyTable tr[id^="table-row-"]');
      const row = rows[i];

      if (row) {
        // Look for link to class roster - typically an anchor or the description cell
        const link = row.querySelector('a[href*="Roster"], a[href*="roster"], td a');
        const descCell = row.querySelector('td:nth-child(5)'); // Description column is usually 5th

        if (link) {
          // Click the link to go to roster page
          // Note: This will navigate away, so we need to handle this differently
          // For now, just log what we found
          console.log('TEAMS Sync: Found roster link for', classInfo.courseDescription);
        }

        // Add class info with placeholder for students (we can't navigate easily)
        // For each class, record the class info - students will need manual extraction per class
      }

      // Add class as a record (without students for now)
      allStudents.push({
        period: classInfo.period,
        courseDescription: classInfo.courseDescription,
        courseId: classInfo.courseId,
        sectionId: classInfo.sectionId,
        term: classInfo.term,
        day: classInfo.day,
        teacherName: classInfo.teacherName,
        studentName: '', // No student name from class list
        isClassRecord: true
      });
    }

    return allStudents;
  }

  /**
   * Automatically extract data from multiple days to capture all rotations
   */
  async function extractMultipleDays(progressCallback) {
    // First, check if we're on class list page
    if (isClassListPage()) {
      if (progressCallback) {
        progressCallback('Detected class list page. Extracting class information...');
      }

      const classes = extractClassList();

      if (classes.length === 0) {
        return {
          pageType: 'classlist',
          error: 'No classes found. Please navigate to Take Classroom Attendance.',
          students: [],
          recordCount: 0
        };
      }

      // On class list page, we can only get class info, not students
      // Return the classes with instruction
      const result = {
        pageType: 'classlist',
        extractedAt: new Date().toISOString(),
        message: 'To get student names, click on a class row in TEAMS to view its roster, then extract from that page.',
        classCount: classes.length,
        classes: classes.map(c => ({
          period: c.period,
          courseDescription: c.courseDescription,
          courseId: c.courseId,
          sectionId: c.sectionId,
          day: c.day,
          term: c.term,
          teacherName: c.teacherName
        })),
        // Create placeholder records with class info but no students
        students: classes.map(c => ({
          period: c.period,
          courseDescription: c.courseDescription,
          courseId: c.courseId,
          sectionId: c.sectionId,
          day: c.day,
          teacherName: c.teacherName,
          studentName: `[Click Period ${c.period} in TEAMS to see students]`,
          isPlaceholder: true
        })),
        recordCount: classes.length
      };

      if (progressCallback) {
        progressCallback(`Found ${classes.length} classes. Click each class in TEAMS to view student rosters.`);
      }

      return result;
    }

    // We're on a roster page - extract students normally
    const uniqueArrangements = new Map();
    const allStudents = [];
    let currentDate = new Date();
    let daysChecked = 0;
    let emptyDays = 0;

    // Get config from storage
    const config = await new Promise(resolve => {
      chrome.storage.local.get(['dayCount'], result => {
        resolve({
          uniqueDaysNeeded: parseInt(result.dayCount) || CONFIG.uniqueDaysNeeded
        });
      });
    });

    if (progressCallback) {
      progressCallback(`Starting extraction from roster page...`);
    }

    // Try to extract from current page first
    const currentData = extractAttendanceData();
    if (currentData?.students?.length > 0) {
      for (const student of currentData.students) {
        student.extractedDate = formatDateForFrontline(currentDate);
      }
      allStudents.push(...currentData.students);

      if (progressCallback) {
        progressCallback(`Extracted ${currentData.students.length} students from current page`);
      }
    }

    // Compile results
    const result = {
      pageType: 'roster',
      extractedAt: new Date().toISOString(),
      multiDay: false,
      daysChecked: 1,
      emptyDays: 0,
      uniqueArrangementsFound: 1,
      students: allStudents,
      recordCount: allStudents.length
    };

    // Deduplicate students
    const seen = new Set();
    result.students = result.students.filter(s => {
      const key = `${s.studentName}-${s.courseId}-${s.period}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    result.recordCount = result.students.length;

    if (progressCallback) {
      progressCallback(`Done! Extracted ${result.recordCount} student records`);
    }

    return result;
  }

  // Message listener
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'extractData':
          const data = extractData();
          if (data) saveToStorage(data);
          sendResponse(data);
          break;
        case 'extractMultipleDays':
          // Async extraction - need to handle differently
          extractMultipleDays((msg) => {
            chrome.runtime.sendMessage({ action: 'extractionProgress', message: msg });
          }).then(data => {
            if (data) saveToStorage(data);
            chrome.runtime.sendMessage({ action: 'extractionComplete', data });
          });
          sendResponse({ started: true });
          break;
        case 'getPageInfo':
          sendResponse({
            pageType: detectPageType(),
            date: getCurrentDate(),
            dayType: getDayType(),
            url: window.location.href
          });
          break;
        case 'clearData':
          chrome.storage.local.remove(['frontlineData', 'frontlineHistory'], () => {
            sendResponse({ success: true });
          });
          return true;
      }
      return true;
    });
  }

  // Initialize
  function init() {
    console.log('TEAMS Sync: Loaded on', window.location.href);
    addExtractButton();

    // Auto-extract if on attendance page
    if (detectPageType() === 'attendance') {
      setTimeout(() => {
        const data = extractData();
        if (data && data.students && data.students.length > 0) {
          saveToStorage(data);
          console.log('TEAMS Sync: Auto-extracted', data.recordCount, 'records');
        }
      }, 1500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.TEAMSSync = { extractData, detectPageType, getCurrentDate, getDayType };
})();
