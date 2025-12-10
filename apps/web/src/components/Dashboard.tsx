import { useState } from 'react';
import { GoogleUser, Course } from '../types';
import ClassList from './ClassList';
import StudentList from './StudentList';

interface DashboardProps {
  user: GoogleUser;
  onLogout: () => void;
}

function Dashboard({ user, onLogout }: DashboardProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  return (
    <div className="container">
      <div className="user-info">
        <div className="user-details">
          <img src={user.picture} alt={user.name} className="user-avatar" />
          <div>
            <div className="user-name">{user.name}</div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              {user.email}
            </div>
          </div>
        </div>
        <button onClick={onLogout} className="button button-secondary">
          Logout
        </button>
      </div>

      {!selectedCourse ? (
        <ClassList onSelectCourse={setSelectedCourse} />
      ) : (
        <div>
          <button
            onClick={() => setSelectedCourse(null)}
            className="button button-secondary back-button"
          >
            ← Back to Classes
          </button>
          <StudentList course={selectedCourse} />
        </div>
      )}
    </div>
  );
}

export default Dashboard;
