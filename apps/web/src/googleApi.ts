import { Course, CoursesResponse, Student, StudentsResponse } from './types';

const DISCOVERY_DOCS = ['https://classroom.googleapis.com/$discovery/rest?version=v1'];
const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.profile.emails',
  'https://www.googleapis.com/auth/classroom.profile.photos',
].join(' ');

let gapiInitialized = false;
let gapiClient: typeof gapi.client | null = null;

export const initializeGapi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (gapiInitialized && gapiClient) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            discoveryDocs: DISCOVERY_DOCS,
          });
          gapiClient = gapi.client;
          gapiInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

export const setAccessToken = (token: string) => {
  if (gapiClient) {
    gapiClient.setToken({ access_token: token });
  }
};

export const getCourses = async (): Promise<Course[]> => {
  if (!gapiClient) {
    throw new Error('GAPI client not initialized');
  }

  const allCourses: Course[] = [];
  let pageToken: string | undefined;

  do {
    const response = await gapiClient.request({
      path: 'https://classroom.googleapis.com/v1/courses',
      method: 'GET',
      params: {
        pageSize: 100,
        pageToken,
        courseStates: ['ACTIVE'],
      },
    });

    const data = response.result as CoursesResponse;
    if (data.courses) {
      allCourses.push(...data.courses);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allCourses;
};

export const getStudents = async (courseId: string): Promise<Student[]> => {
  if (!gapiClient) {
    throw new Error('GAPI client not initialized');
  }

  const allStudents: Student[] = [];
  let pageToken: string | undefined;

  do {
    const response = await gapiClient.request({
      path: `https://classroom.googleapis.com/v1/courses/${courseId}/students`,
      method: 'GET',
      params: {
        pageSize: 100,
        pageToken,
      },
    });

    const data = response.result as StudentsResponse;
    if (data.students) {
      allStudents.push(...data.students);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allStudents;
};

export { SCOPES };
