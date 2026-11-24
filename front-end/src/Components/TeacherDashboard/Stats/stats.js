import { API_BASE_URL } from '../../../apiBase.js';
import React, { useEffect, useState } from 'react';
import './stats.css';

export default function Stats() {
  const [counts, setCounts] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCounts() {
      try {
        const response = await fetch(`${API_BASE_URL}/cours`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Course catalog unavailable');
        const courses = await response.json();
        if (!Array.isArray(courses)) throw new Error('Invalid course list');

        const chapters = courses.reduce((total, course) =>
          total + (course.chapitres?.filter(Boolean).length ?? 0), 0);
        if (!controller.signal.aborted) setCounts({ courses: courses.length, chapters });
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }

    loadCounts();
    return () => controller.abort();
  }, []);

  return (
    <section className="pie-educator-stats" aria-labelledby="educator-stats-title">
      <h2 id="educator-stats-title">Catalog Overview</h2>
      {failed ? (
        <p role="status">Catalog totals are unavailable right now.</p>
      ) : counts === null ? (
        <p role="status">Loading catalog totals…</p>
      ) : (
        <dl className="pie-educator-stats__grid">
          <div>
            <dt>Courses in the catalog</dt>
            <dd>{counts.courses}</dd>
          </div>
          <div>
            <dt>Chapters across courses</dt>
            <dd>{counts.chapters}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}