import { render, screen, within } from '@testing-library/react';
import { AuthProvider } from './context/AuthContext';
import App from './App';

test('renders the PIE KIDZ homepage', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );

  expect(screen.getByRole('heading', { name: /our objective|your money mission/i })).toBeVisible();
  expect(within(screen.getAllByRole('navigation')[0]).getByRole('link', { name: 'Explore', exact: true })).toHaveAttribute('href', '/courses');
});
