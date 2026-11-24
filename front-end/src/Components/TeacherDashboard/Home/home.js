import React from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../Sidebar/sidebar';
import Stats from '../Stats/stats';
import './home.css';

const Home = () => (
  <main className="pie-educator">
    <div className="pie-educator__layout">
      <Sidebar />

      <div className="pie-educator__content">
        <header className="pie-educator__welcome">
          <h1>Teacher Dashboard</h1>
          <p>Create money lessons and quizzes for your learners.</p>
          <Link className="pie-educator__action" to="/cours/add_course">
            Create a Course <span aria-hidden="true">▸</span>
          </Link>
        </header>

        <Stats />

        <div className="pie-educator__tools">
          <section className="pie-educator__panel" aria-labelledby="educator-courses">
            <h2 id="educator-courses">Courses</h2>
            <p>Open the course list to review or edit lessons.</p>
            <Link to="/cours">Manage Courses</Link>
          </section>

          <section className="pie-educator__panel" aria-labelledby="educator-quizzes">
            <h2 id="educator-quizzes">Quizzes</h2>
            <p>Create a practice quiz with questions and answer choices.</p>
            <Link to="/quiz">Create a Quiz</Link>
          </section>
        </div>
      </div>
    </div>
  </main>
);

export default Home;
