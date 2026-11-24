import { API_BASE_URL } from '../../../apiBase.js';
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Sidebar from '../Sidebar/sidebar';
import './AddCourses.css';


export default function AddCourses() {
  const [options, setOptions] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const submitting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const config = { signal: controller.signal };

    Promise.all([
      axios.get(`${API_BASE_URL}/trancheAge`, config),
      axios.get(`${API_BASE_URL}/competences/all`, config),
    ]).then(([ages, skills]) => {
      if (!controller.signal.aborted) {
        setOptions({ ages: ages.data, skills: skills.data });
      }
    }).catch(() => {
      if (!controller.signal.aborted) setLoadError(true);
    });

    return () => controller.abort();
  }, [attempt]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current) return;

    const data = new FormData(event.currentTarget);
    const title = String(data.get('titre')).trim();
    const description = String(data.get('description')).trim();
    if (!title || !description) {
      setError('Enter a title and description.');
      return;
    }

    data.set('titre', title);
    data.set('description', description);
    data.set('Competences', JSON.stringify(data.getAll('Competences')));
    if (!data.get('trancheAge')) data.delete('trancheAge');
    if (!data.get('Thumbnail')?.name) data.delete('Thumbnail');

    submitting.current = true;
    setPending(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/cours`, data, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setCreated(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We couldn’t create the course. Check your entries and try again.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <main className="pie-add-course">
      <div className="pie-add-course__layout">
        <Sidebar />
        <section className="pie-add-course__panel" aria-labelledby="add-course-title">
          <h1 id="add-course-title">Create a Course</h1>
          {created ? (
            <>
              <p role="status">“{created.titre}” was created.</p>
              <div className="pie-add-course__actions">
                <Link to={`/cours/detailCourse/${created._id}`}>Open Course</Link>
                <button type="button" onClick={() => setCreated(null)}>Create Another</button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>
                Course title
                <input name="titre" required />
              </label>
              <label>
                Description
                <textarea name="description" rows={4} required />
              </label>
              <label>
                Cover image (optional)
                <input type="file" name="Thumbnail" accept="image/*" />
              </label>
              {options ? (
                <>
                  <label>
                    Age range (optional)
                    <select name="trancheAge">
                      <option value="">No age range selected</option>
                      {options.ages.map(({ _id, ageMin, ageMax }) => (
                        <option key={_id} value={_id}>Ages {ageMin}–{ageMax}</option>
                      ))}
                    </select>
                  </label>
                  {options.skills.length > 0 && (
                    <fieldset>
                      <legend>Skills (optional)</legend>
                      <div className="pie-add-course__skills">
                        {options.skills.map(({ _id, Titre }) => (
                          <label key={_id}>
                            <input type="checkbox" name="Competences" value={_id} /> {Titre}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}
                </>
              ) : loadError ? (
                <div>
                  <p role="alert">Age ranges and skills couldn’t load.</p>
                  <button type="button" onClick={() => {
                    setLoadError(false);
                    setAttempt((previous) => previous + 1);
                  }}>Retry</button>
                </div>
              ) : (
                <p role="status">Loading age ranges and skills…</p>
              )}
              {error && <p className="pie-add-course__error" role="alert">{error}</p>}
              <button type="submit" disabled={pending}>
                {pending ? 'Creating course…' : 'Create Course'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
