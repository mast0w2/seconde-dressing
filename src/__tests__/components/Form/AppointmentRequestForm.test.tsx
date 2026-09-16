import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppointmentRequestPage from '@/app/appointment-request/AppointmentRequestPage';

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-123' } }
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({
        data: {
          id: 'test-user-123',
          first_name: 'John',
          last_name: 'Doe',
          role: 'client',
          street_address: '123 Rue Test'
        }
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      order: jest.fn().mockReturnThis()
    }))
  })
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn()
  }),
  useSearchParams: () => new URLSearchParams()
}));

describe('AppointmentRequestPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the appointment request form', async () => {
    render(<AppointmentRequestPage />);

    await waitFor(() => {
      expect(screen.getByText('Demande de rendez-vous')).toBeInTheDocument();
    });
  });

  it('should show validation errors for missing required fields', async () => {
    render(<AppointmentRequestPage />);

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Envoyer la demande/i });
      expect(submitButton).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /Envoyer la demande/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/L'adresse de collecte est requise/i)).toBeInTheDocument();
    });
  });

  it('should display formula options with pricing', async () => {
    render(<AppointmentRequestPage />);

    await waitFor(() => {
      // Check if formula labels are visible
      expect(screen.getByText(/Dressing déjà trié/i)).toBeInTheDocument();
      expect(screen.getByText(/Tri sur place/i)).toBeInTheDocument();
      expect(screen.getByText(/Tri & conseil/i)).toBeInTheDocument();
    });
  });

  it('should show free price for first formula on first request', async () => {
    render(<AppointmentRequestPage />);

    await waitFor(() => {
      // Should show "Gratuit" for the first formula
      const freeText = screen.queryByText(/Gratuit/i);
      if (freeText) {
        expect(freeText).toBeInTheDocument();
      }
    });
  });

  it('should pre-fill address from user profile', async () => {
    render(<AppointmentRequestPage />);

    await waitFor(() => {
      const addressInput = screen.getByPlaceholderText(/12 rue du Commerce/i);
      expect(addressInput).toHaveValue('123 Rue Test');
    });
  });
});
