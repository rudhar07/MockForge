import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthContext } from '../context/AuthContext';

// Mount the guard at /secret with stand-in pages for wherever it might
// redirect, then report which page the user actually ends up on.
const visitSecret = ({ user, allowedRoles }) =>
  render(
    <AuthContext.Provider value={{ user }}>
      <MemoryRouter initialEntries={['/secret']}>
        <Routes>
          <Route
            path="/secret"
            element={
              <ProtectedRoute allowedRoles={allowedRoles}>
                <p>Secret page</p>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<p>Login page</p>} />
          <Route path="/" element={<p>Home page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('ProtectedRoute', () => {
  it('sends a logged-out visitor to /login', () => {
    visitSecret({ user: null });

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Secret page')).not.toBeInTheDocument();
  });

  it('shows the page to a logged-in user when no role is required', () => {
    visitSecret({ user: { name: 'Ana', role: 'user' } });

    expect(screen.getByText('Secret page')).toBeInTheDocument();
  });

  it('sends a user without the required role home', () => {
    visitSecret({ user: { name: 'Ana', role: 'user' }, allowedRoles: ['admin'] });

    expect(screen.getByText('Home page')).toBeInTheDocument();
    expect(screen.queryByText('Secret page')).not.toBeInTheDocument();
  });

  it('shows the page to a user with the required role', () => {
    visitSecret({ user: { name: 'Root', role: 'admin' }, allowedRoles: ['admin'] });

    expect(screen.getByText('Secret page')).toBeInTheDocument();
  });
});
