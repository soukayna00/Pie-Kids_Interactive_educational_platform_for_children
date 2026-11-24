import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Courses from '../Courses/courses';
import Sidebar from '../Sidebar/sidebar';
import './student.css';

export default function Student() {
  const { authState: { name } } = useAuth();

  return (
    <main className="pie-student">
      <div className="pie-student__layout">
        <Sidebar />

        <div className="pie-student__content">
          <header className="pie-student__welcome">
            <div>
              <h1>{name ? `Welcome back, ${name}!` : 'Your Learning Dashboard'}</h1>
              <p>Open one of your courses or find a new money lesson to try.</p>
              <Link className="pie-student__button" to="/courses">Explore Lessons</Link>
            </div>
            <img src="/assets/toad.png" alt="" />
          </header>

          <Courses />
        </div>
      </div>
    </main>
  );
}
