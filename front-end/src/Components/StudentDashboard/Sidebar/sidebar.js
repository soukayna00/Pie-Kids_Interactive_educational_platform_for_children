import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faChartLine, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import './sidevar.css';

export default function Sidebar() {
  const { pathname, hash } = useLocation();
  const onStudentPage = pathname === '/student';
  const onCourses = onStudentPage && hash === '#my-courses';

  return (
    <nav className="pie-student__nav" aria-label="Student portal">
      <h2>Student Portal</h2>
      <Link to="/student" aria-current={onStudentPage && !onCourses ? 'page' : undefined}>
        <FontAwesomeIcon icon={faChartLine} aria-hidden="true" />
        Dashboard
      </Link>
      <a href="/student#my-courses" aria-current={onCourses ? 'location' : undefined}>
        <FontAwesomeIcon icon={faBookOpen} aria-hidden="true" />
        My Courses
      </a>
      <Link to="/student/quiz" aria-current={pathname === '/student/quiz' ? 'page' : undefined}>
        <FontAwesomeIcon icon={faQuestionCircle} aria-hidden="true" />
        Quizzes
      </Link>
    </nav>
  );
}
