import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('./contexts/FirebaseContext', () => ({
  FirebaseProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('./router', () => ({
  AppRouter: () => <div>Mocked App Router</div>,
}));

import App from './App';

test('renders the app router', () => {
  render(<App />);
  expect(screen.getByText('Mocked App Router')).toBeInTheDocument();
});
