import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import axios from 'axios';
import { AuthContext } from './context/AuthContext';
import AllCourses from './Components/AllCourses/AllCourses';
import Login from './Components/Login/login';
import StudentCourses from './Components/StudentDashboard/Courses/courses';
import Enroll from './Components/StudentDashboard/EnRoll/EnRoll';
import StudentQuiz from './Components/StudentDashboard/Quiz/quiz';
import AddCourses from './Components/TeacherDashboard/Courses/AddCourses';
import TeacherCourses from './Components/TeacherDashboard/Courses/courses';

const api = 'http://localhost:4000';
const token = 'test-session-token';
const lesson = { _id: 'lesson-1', titre: 'Save for a Goal', description: 'Plan your savings.' };
const student = { id: 'student-1', name: 'Sam', role: 'Etudiant', isAuthenticated: true };

function json(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

function renderPage(component, { path = '/', authState = {}, setAuthState = vi.fn() } = {}) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthContext.Provider value={{ authState, setAuthState }}>
        {component}
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('course catalog', () => {
  test('shows the course title, skill and enrollment link', async () => {
    fetch.mockResolvedValue(json([{ ...lesson, Competences: [{ _id: 'saving', Titre: 'Saving' }] }]));
    renderPage(<AllCourses />);

    expect(await screen.findByRole('heading', { name: lesson.titre })).toBeVisible();
    expect(screen.getByText('Saving')).toBeVisible();
    expect(screen.getByRole('link', { name: /view lesson/i })).toHaveAttribute('href', '/enroll/lesson-1');
  });

  test('retries a failed request and shows the empty state', async () => {
    fetch.mockResolvedValueOnce(json({}, 500)).mockResolvedValueOnce(json([]));
    renderPage(<AllCourses />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn’t load/i);
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(await screen.findByText(/no lessons are available/i)).toBeVisible();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('sign in', () => {
  test.each([
    ['Etudiant', '/student', 'Student destination'],
    ['Enseignant', '/home', 'Teacher destination'],
  ])('stores the session and redirects the %s role', async (role, route, heading) => {
    const setAuthState = vi.fn();
    fetch.mockResolvedValue(json({ token, id: 'account-1', name: 'Sam', role }));
    renderPage(
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path={route} element={<h1>{heading}</h1>} />
      </Routes>,
      { path: '/login', setAuthState },
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'sam@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'example-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByRole('heading', { name: heading })).toBeVisible();
    expect(localStorage.getItem('token')).toBe(token);
    expect(setAuthState).toHaveBeenCalledWith({ isAuthenticated: true, id: 'account-1', name: 'Sam', role });
  });
});

describe('student courses', () => {
  test('loads My Courses with the session token', async () => {
    localStorage.setItem('token', token);
    fetch.mockResolvedValue(json([lesson]));
    renderPage(<StudentCourses />, { authState: student });

    expect(await screen.findByRole('heading', { name: lesson.titre })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Open Course' })).toHaveAttribute('href', '/courses/lesson-1/dashboard');
    expect(fetch).toHaveBeenCalledWith(`${api}/cours/mine`, expect.objectContaining({
      headers: { Authorization: `Bearer ${token}` },
    }));
  });

  test('offers sign-in to guests without requesting private courses', () => {
    renderPage(<StudentCourses />);
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(fetch).not.toHaveBeenCalled();
  });

  test('enrolls using the session token and opens the course', async () => {
    localStorage.setItem('token', token);
    fetch.mockImplementation(async (url, options) => {
      if (url === `${api}/cours/lesson-1`) return json(lesson);
      if (url === `${api}/cours/mine`) return json([]);
      if (url === `${api}/cours/enroller/lesson-1` && options.method === 'POST') {
        return json({ enrolled: true });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    renderPage(
      <Routes>
        <Route path="/enroll/:id" element={<Enroll />} />
        <Route path="/courses/:id/dashboard" element={<h1>Course dashboard</h1>} />
      </Routes>,
      { path: '/enroll/lesson-1', authState: student },
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Enroll in Course' }));
    expect(await screen.findByRole('heading', { name: 'Course dashboard' })).toBeVisible();
    expect(fetch).toHaveBeenCalledWith(`${api}/cours/enroller/lesson-1`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  });
});

test('grades a student quiz and lets the student try again', async () => {
  fetch.mockResolvedValue(json([{
    _id: 'quiz-1',
    title: 'Saving Quiz',
    questions: [{
      _id: 'question-1',
      text: 'What helps you save for a goal?',
      options: [
        { _id: 'answer-1', text: 'Make a savings plan', isCorrect: true },
        { _id: 'answer-2', text: 'Spend everything', isCorrect: false },
      ],
    }],
  }]));
  renderPage(<StudentQuiz />);

  fireEvent.change(await screen.findByRole('combobox', { name: /choose a quiz/i }), { target: { value: 'quiz-1' } });
  fireEvent.click(screen.getByRole('radio', { name: 'Make a savings plan' }));
  fireEvent.click(screen.getByRole('button', { name: 'Check Answers' }));
  expect(screen.getByRole('status')).toHaveTextContent('You got 1 out of 1 correct.');

  fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
  expect(screen.getByRole('radio', { name: 'Make a savings plan' })).not.toBeChecked();
});

describe('teacher courses', () => {
  test('submits selected skills and omits blank optional fields', async () => {
    localStorage.setItem('token', token);
    vi.spyOn(axios, 'get')
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [{ _id: 'saving', Titre: 'Saving' }] });
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: lesson });
    renderPage(<AddCourses />);

    fireEvent.change(screen.getByLabelText('Course title'), { target: { value: lesson.titre } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: lesson.description } });
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Saving' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Course' }));

    expect(await screen.findByRole('link', { name: 'Open Course' })).toHaveAttribute('href', '/cours/detailCourse/lesson-1');
    expect(post).toHaveBeenCalledTimes(1);
    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe(`${api}/cours`);
    expect(Object.fromEntries(body)).toEqual({
      titre: lesson.titre,
      description: lesson.description,
      Competences: '["saving"]',
    });
    expect(config.headers.Authorization).toBe(`Bearer ${token}`);
  });

  test('lists the teacher’s courses and deletes only after confirmation', async () => {
    localStorage.setItem('token', token);
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: [lesson] });
    const remove = vi.spyOn(axios, 'delete').mockResolvedValue({});
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    renderPage(<TeacherCourses />, { path: '/cours' });

    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText(/no courses yet/i)).toBeVisible();
    expect(get).toHaveBeenCalledWith(`${api}/cours/teaching`, expect.objectContaining({
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith(`${api}/cours/deleteCourse/lesson-1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });
});
