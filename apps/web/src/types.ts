export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

export interface Course {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  room?: string;
  ownerId: string;
  creationTime?: string;
  updateTime?: string;
  enrollmentCode?: string;
  courseState?: string;
  alternateLink?: string;
  teacherGroupEmail?: string;
  courseGroupEmail?: string;
  guardiansEnabled?: boolean;
  calendarId?: string;
}

export interface Student {
  courseId: string;
  userId: string;
  profile: {
    id: string;
    name: {
      givenName: string;
      familyName: string;
      fullName: string;
    };
    emailAddress: string;
    photoUrl?: string;
  };
}

export interface CoursesResponse {
  courses?: Course[];
  nextPageToken?: string;
}

export interface StudentsResponse {
  students?: Student[];
  nextPageToken?: string;
}
