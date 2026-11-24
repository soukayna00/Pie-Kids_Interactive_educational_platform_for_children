import { API_BASE_URL } from '../../../apiBase.js';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './quiz.css';

function QuizAttempt({ quiz }) {
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);

  function grade(event) {
    event.preventDefault();
    setScore(quiz.questions.filter((question, index) =>
      question.options[answers[index]]?.isCorrect
    ).length);
  }

  return (
    <form className="pie-quiz__form" onSubmit={grade}>
      {quiz.questions.map((question, index) => (
        <fieldset key={question._id} className="pie-quiz__question" disabled={score !== null}>
          <legend>{index + 1}. {question.text}</legend>
          {question.options.map((option, optionIndex) => (
            <label key={option._id} className="pie-quiz__option">
              <input
                type="radio"
                name={`question-${index}`}
                checked={answers[index] === optionIndex}
                onChange={() => setAnswers((previous) => ({ ...previous, [index]: optionIndex }))}
                required
              />
              {option.text}
            </label>
          ))}
          {score !== null && (
            <p>
              {question.options[answers[index]]?.isCorrect
                ? 'Correct!'
                : `Correct answer: ${question.options.filter((option) => option.isCorrect).map((option) => option.text).join(', ')}.`}
              {question.explanation && ` ${question.explanation}`}
            </p>
          )}
        </fieldset>
      ))}
      {score === null ? (
        <button type="submit">Check Answers</button>
      ) : (
        <>
          <p role="status">You got {score} out of {quiz.questions.length} correct.</p>
          <button type="button" onClick={() => { setAnswers({}); setScore(null); }}>
            Try Again
          </button>
        </>
      )}
    </form>
  );
}

export default function Quiz() {
  const [quizzes, setQuizzes] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(`${API_BASE_URL}/quiz`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Quiz list unavailable');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Invalid quiz list');

        if (!controller.signal.aborted) {
          setQuizzes(data.filter((quiz) =>
            quiz?.questions?.length > 0 && quiz.questions.every((question) =>
              question?.options?.some((option) => option?.isCorrect)
            )
          ));
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const quiz = quizzes?.find((item) => item._id === selectedId);

  return (
    <main className="pie-quiz">
      <div className="pie-quiz__inner">
        <Link to="/student">← Back to Dashboard</Link>
        <h1>Quizzes</h1>
        {failed ? (
          <p role="alert">We couldn’t load the quizzes. Refresh the page to try again.</p>
        ) : quizzes === null ? (
          <p role="status">Loading quizzes…</p>
        ) : quizzes.length === 0 ? (
          <p>No quizzes are available yet. <Link to="/courses">Explore lessons</Link> while you wait.</p>
        ) : (
          <>
            <label className="pie-quiz__picker">
              Choose a quiz
              <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                <option value="">Select a quiz</option>
                {quizzes.map((item) => (
                  <option key={item._id} value={item._id}>{item.title}</option>
                ))}
              </select>
            </label>
            {quiz && <QuizAttempt key={quiz._id} quiz={quiz} />}
          </>
        )}
      </div>
    </main>
  );
}
