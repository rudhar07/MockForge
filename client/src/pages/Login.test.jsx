import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import toast from 'react-hot-toast';
import Login from './Login';
import API from '../api/axios';
import { AuthProvider } from '../context/AuthContext.jsx';
import { AuthContext } from '../context/AuthContext.js';

// Replace the real HTTP client and toasts with fakes we control and inspect.
vi.mock('../api/axios', () => ({ default: { post: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

// Stand-in home page that proves the login reached the shared auth state.
const Home = () => {
  const { user } = useContext(AuthContext);
  return <p>Home for {user?.name}</p>;
};

const renderLogin = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

const fillAndSubmit = async (email, password) => {
  const user = userEvent.setup();
  // Finding inputs by their visible label also proves the labels are wired
  // to the inputs, which screen readers depend on.
  await user.type(screen.getByLabelText('Email address'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: /sign in/i }));
};

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs in, saves the session and goes home', async () => {
    const account = { _id: '1', name: 'Ana', email: 'ana@test.dev', role: 'user', token: 't' };
    API.post.mockResolvedValue({ data: account });

    renderLogin();
    await fillAndSubmit('ana@test.dev', 'secret123');

    expect(API.post).toHaveBeenCalledWith('/auth/login', {
      email: 'ana@test.dev',
      password: 'secret123',
    });
    expect(await screen.findByText('Home for Ana')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('userInfo'))).toEqual(account);
  });

  it('shows the server error and stays on the login page', async () => {
    API.post.mockRejectedValue({
      response: { data: { message: 'Invalid email or password' } },
    });

    renderLogin();
    await fillAndSubmit('ana@test.dev', 'wrong');

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(localStorage.getItem('userInfo')).toBeNull();
  });

  it('falls back to a generic message when the server sends none', async () => {
    API.post.mockRejectedValue(new Error('Network Error'));

    renderLogin();
    await fillAndSubmit('ana@test.dev', 'secret123');

    expect(await screen.findByText('Login failed')).toBeInTheDocument();
  });

  it('shows a one-time toast after an expired session redirect', () => {
    sessionStorage.setItem('sessionExpired', '1');

    renderLogin();

    expect(toast.error).toHaveBeenCalledWith('Session expired — please sign in again');
    expect(sessionStorage.getItem('sessionExpired')).toBeNull();
  });
});
