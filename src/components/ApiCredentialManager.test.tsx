import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiCredentialManager } from './ApiCredentialManager';
import { useAppStore } from '../store';

describe('ApiCredentialManager', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.setState({
      apiCredentials: { premiumTier: false },
    });
  });

  it('should render the credential manager', () => {
    render(<ApiCredentialManager />);
    expect(screen.getByText('API Credentials')).toBeInTheDocument();
  });

  it('should display current tier status', () => {
    render(<ApiCredentialManager />);
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('should show premium status when credentials are set', () => {
    useAppStore.setState({
      apiCredentials: {
        fastf1ApiKey: 'test-key-12345678901234567890',
        premiumTier: true,
      },
    });

    render(<ApiCredentialManager />);
    expect(screen.getByText('⭐ Premium')).toBeInTheDocument();
  });

  it('should allow entering API keys', () => {
    render(<ApiCredentialManager />);

    const fastf1Input = screen.getByPlaceholderText('Enter your FastF1 API key');
    fireEvent.change(fastf1Input, { target: { value: 'test-key-12345678901234567890' } });

    expect(fastf1Input).toHaveValue('test-key-12345678901234567890');
  });

  it('should toggle key visibility', () => {
    render(<ApiCredentialManager />);

    const fastf1Input = screen.getByPlaceholderText('Enter your FastF1 API key');
    const toggleButton = screen.getAllByLabelText(/Show key|Hide key/)[0];

    // Initially should be password type
    expect(fastf1Input).toHaveAttribute('type', 'password');

    // Click to show
    fireEvent.click(toggleButton);
    expect(fastf1Input).toHaveAttribute('type', 'text');

    // Click to hide
    fireEvent.click(toggleButton);
    expect(fastf1Input).toHaveAttribute('type', 'password');
  });

  it('should save credentials to store', async () => {
    render(<ApiCredentialManager />);

    const fastf1Input = screen.getByPlaceholderText('Enter your FastF1 API key');
    const saveButton = screen.getByText('Save');

    // Use a valid key format (20+ alphanumeric characters)
    const validKey = 'abcdefghij1234567890';
    fireEvent.change(fastf1Input, { target: { value: validKey } });
    fireEvent.click(saveButton);

    // Wait for validation and save (validation takes 1 second)
    await waitFor(
      () => {
        const credentials = useAppStore.getState().apiCredentials;
        expect(credentials.fastf1ApiKey).toBe(validKey);
        expect(credentials.premiumTier).toBe(true);
      },
      { timeout: 2000 }
    );
  });

  it('should clear all credentials', async () => {
    useAppStore.setState({
      apiCredentials: {
        fastf1ApiKey: 'test-key',
        openf1ApiKey: 'test-key-2',
        premiumTier: true,
      },
    });

    render(<ApiCredentialManager />);

    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    await waitFor(() => {
      const credentials = useAppStore.getState().apiCredentials;
      expect(credentials.premiumTier).toBe(false);
      expect(credentials.fastf1ApiKey).toBeUndefined();
      expect(credentials.openf1ApiKey).toBeUndefined();
    });
  });
});
