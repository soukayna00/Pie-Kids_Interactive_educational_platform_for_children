import React from 'react';
import { Link } from 'react-router-dom';
import './TeachWithUs.css';

export default function TeachWithUs() {
  return (
    <main className="pie-teach">
      <section className="pie-teach__hero" aria-labelledby="teach-title">
        <div className="pie-teach__inner pie-teach__layout">
          <div className="pie-teach__panel">
            <h1 id="teach-title">Teach <span>With Us</span></h1>
            <p>
              Help kids build money skills through short lessons on saving,
              spending, and budgeting.
            </p>
            <Link className="pie-teach__action" to="/register-enseignant">
              Register as an Educator <span aria-hidden="true">▸</span>
            </Link>
            <Link className="pie-teach__example" to="/courses">Browse sample lessons</Link>
          </div>
          <div className="pie-teach__scene">
            <img src="/assets/mario-shell.png" alt="" className="pie-teach__mario" />
          </div>
        </div>
      </section>

      <section className="pie-teach__guide pie-teach__inner" aria-labelledby="teach-guide">
        <h2 id="teach-guide">What You Can Teach</h2>
        <ul className="pie-teach__topics" role="list">
          <li>
            <span className="pie-teach__icon pie-teach__icon--saving" aria-hidden="true" />
            <h3>Saving</h3>
            <p>Help kids pick a goal and work out how much to save each week.</p>
          </li>
          <li>
            <span className="pie-teach__icon pie-teach__icon--spending" aria-hidden="true" />
            <h3>Spending</h3>
            <p>Use everyday choices to show the difference between needs and wants.</p>
          </li>
          <li>
            <span className="pie-teach__icon pie-teach__icon--budgeting" aria-hidden="true" />
            <h3>Budgeting</h3>
            <p>Show kids how to make a plan for the money they have.</p>
          </li>
        </ul>
      </section>
    </main>
  );
}