import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook, faPlusCircle, faQuestionCircle, faTachometerAlt,
} from '@fortawesome/free-solid-svg-icons';
import './sidebar.css';

export default function Sidebar() {
  const { pathname } = useLocation();
  const inCourseDetails = /^\/cours\/(detailCourse|editCourse)\//i.test(pathname);

  return (
    <nav className="pie-teacher-nav" aria-label="Teacher dashboard">
      <h2>Teacher Portal</h2>
      <ul>
        <li>
          <NavLink to="/home" end>
            <FontAwesomeIcon icon={faTachometerAlt} aria-hidden="true" /> Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/cours" end aria-current={inCourseDetails ? 'location' : undefined}>
            <FontAwesomeIcon icon={faBook} aria-hidden="true" /> My Courses
          </NavLink>
        </li>
        <li>
          <NavLink to="/cours/add_course">
            <FontAwesomeIcon icon={faPlusCircle} aria-hidden="true" /> Add Course
          </NavLink>
        </li>
        <li>
          <NavLink to="/quiz">
            <FontAwesomeIcon icon={faQuestionCircle} aria-hidden="true" /> Create a Quiz
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
