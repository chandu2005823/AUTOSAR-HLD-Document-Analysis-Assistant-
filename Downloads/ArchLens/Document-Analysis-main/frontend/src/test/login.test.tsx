import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { useAuthStore } from '../store/useAuthStore';

// Mock the auth store login
vi.mock('../store/useAuthStore', async () => {
  const actual = await vi.importActual<any>('../store/useAuthStore');
  return {
    ...actual,
    useAuthStore: vi.fn(),
  };
});

describe('LoginPage', () => {
  it('renders login form elements and default credentials tip', () => {
    (useAuthStore as any).mockReturnValue({
      login: vi.fn(),
      isLoading: false,
      error: null,
      clearError: vi.fn(),
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByText('AutoArch-AI')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in to platform/i })).toBeInTheDocument();
    expect(screen.getByText(/admin \/ adminpassword123/i)).toBeInTheDocument();
  });

  it('displays error alert when login fails', () => {
    (useAuthStore as any).mockReturnValue({
      login: vi.fn(),
      isLoading: false,
      error: 'Invalid credentials provided.',
      clearError: vi.fn(),
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Invalid credentials provided.')).toBeInTheDocument();
  });
});
