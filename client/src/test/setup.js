import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
// Adds DOM matchers like toBeInTheDocument() and toHaveValue() to expect().
import '@testing-library/jest-dom/vitest';

// Unmount whatever the test rendered and wipe browser storage, so every test
// starts from a blank page and no logged-in user leaks into the next one.
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
