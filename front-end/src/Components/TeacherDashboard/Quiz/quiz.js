import { API_BASE_URL } from '../../../apiBase.js';
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../Sidebar/sidebar';
import './quiz.css';

const newQuestion = () => ({ text: '', explanation: '', options: ['', ''], correct: null });

export default function QuizForm() {
  const [questions, setQuestions] = useState(() => [newQuestion()]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const submitting = useRef(false);

  function updateQuestion(index, update) {
    setQuestions((previous) => previous.map((question, position) =>
      position === index ? update(question) : question
    ));
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;

    const form = event.currentTarget;
    const fields = new FormData(form);
    const title = String(fields.get('title')).trim();
    setError('');
    setSaved('');

    if (!title || questions.some((question) =>
      !question.text.trim() || question.correct === null ||
      question.options.some((option) => !option.trim())
    )) {
      setError('Enter a quiz title, complete every question and answer, and mark one correct answer per question.');
      return;
    }

    const quiz = {
      title,
      description: String(fields.get('description')).trim(),
      questions: questions.map(({ text, explanation, options, correct }) => ({
        text: text.trim(),
        explanation: explanation.trim(),
        options: options.map((option, index) => ({
          text: option.trim(),
          isCorrect: index === correct,
        })),
      })),
    };

    submitting.current = true;
    setPending(true);
    try {
      await axios.post(`${API_BASE_URL}/quiz`, quiz, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      form.reset();
      setQuestions([newQuestion()]);
      setSaved(title);
    } catch {
      setError('We couldn’t save your quiz. Your draft is still here. Please try again.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <main className="pie-add-course pie-quiz-builder">
      <div className="pie-add-course__layout">
        <Sidebar />
        <section className="pie-add-course__panel" aria-labelledby="quiz-builder-title">
          <h1 id="quiz-builder-title">Create a Quiz</h1>
          <form onSubmit={submit}>
            <fieldset className="pie-quiz-builder__draft" disabled={pending} aria-label="Quiz draft">
              <label>
                Quiz title
                <input name="title" required />
              </label>
              <label>
                Description (optional)
                <textarea name="description" rows={3} />
              </label>

              {questions.map((question, qIndex) => (
                <fieldset key={qIndex} className="pie-quiz-builder__question">
                  <legend>Question {qIndex + 1}</legend>
                  <label>
                    Question text
                    <input
                      value={question.text}
                      onChange={(event) => {
                        const { value } = event.target;
                        updateQuestion(qIndex, (current) => ({ ...current, text: value }));
                      }}
                      required
                    />
                  </label>

                  {question.options.map((option, oIndex) => (
                    <div className="pie-quiz-builder__option" key={oIndex}>
                      <label>
                        Answer {oIndex + 1}
                        <input
                          value={option}
                          onChange={(event) => {
                            const { value } = event.target;
                            updateQuestion(qIndex, (current) => ({
                              ...current,
                              options: current.options.map((item, index) => index === oIndex ? value : item),
                            }));
                          }}
                          required
                        />
                      </label>
                      <label className="pie-quiz-builder__correct">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          aria-label={`Mark answer ${oIndex + 1} as correct`}
                          checked={question.correct === oIndex}
                          onChange={() => updateQuestion(qIndex, (current) => ({ ...current, correct: oIndex }))}
                          required
                        />
                        Correct
                      </label>
                    </div>
                  ))}

                  <button type="button" className="pie-quiz-builder__secondary" onClick={() =>
                    updateQuestion(qIndex, (current) => ({ ...current, options: [...current.options, ''] }))
                  }>
                    Add Answer
                  </button>

                  <label>
                    Explanation (optional)
                    <textarea
                      rows={2}
                      value={question.explanation}
                      onChange={(event) => {
                        const { value } = event.target;
                        updateQuestion(qIndex, (current) => ({ ...current, explanation: value }));
                      }}
                    />
                  </label>
                </fieldset>
              ))}

              <div className="pie-add-course__actions">
                <button type="button" className="pie-quiz-builder__secondary" onClick={() =>
                  setQuestions((previous) => [...previous, newQuestion()])
                }>
                  Add Question
                </button>
                <button type="submit">{pending ? 'Saving…' : 'Save Quiz'}</button>
              </div>
            </fieldset>
            {error && <p className="pie-add-course__error" role="alert">{error}</p>}
            {saved && <p role="status">“{saved}” was saved. <Link to="/student/quiz">View Student Quizzes</Link></p>}
          </form>
        </section>
      </div>
    </main>
  );
}
