import { describe, it, expect } from 'vitest';
import { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from './AuthContext.jsx';
import { AuthContext } from './AuthContext.js';

// A tiny consumer that shows what the provider exposes.
const Probe = () => {
  const { user, logout } = useContext(AuthContext);
  return (
    <div>
      <p>{user ? `Hello ${user.name}` : 'Guest'}</p>
      <button onClick={logout}>Log out</button>
    </div>
  );
};

const renderWithProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

describe('AuthProvider', () => {
  it('starts logged out when nothing is saved', () => {
    renderWithProvider();

    expect(screen.getByText('Guest')).toBeInTheDocument();
  });

  it('restores a saved session from localStorage on first render', () => {
    localStorage.setItem('userInfo', JSON.stringify({ name: 'Ana', token: 't' }));

    renderWithProvider();

    expect(screen.getByText('Hello Ana')).toBeInTheDocument();
  });

  it('logout clears both the state and localStorage', async () => {
    localStorage.setItem('userInfo', JSON.stringify({ name: 'Ana', token: 't' }));
    renderWithProvider();

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(screen.getByText('Guest')).toBeInTheDocument();
    expect(localStorage.getItem('userInfo')).toBeNull();
  });
});
