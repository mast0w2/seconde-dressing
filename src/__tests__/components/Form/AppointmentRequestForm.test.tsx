import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppointmentRequestPage from '@/app/appointment-request/AppointmentRequestPage';

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: () => {
    const mockFormulas = [
      { id: '1', label: 'Dressing déjà trié', slug: 'pre-sorted', price: 10 },
      { id: '2', label: 'Tri sur place', slug: 'on-site', price: 20 },
      { id: '3', label: 'Tri & conseil', slug: 'sorting-advice', price: 30 }
    ];

    return {
      auth: {
        getUser: jest.fn(() => Promise.resolve({
          data: { user: { id: 'test-user-123' } }
        }))
      },
      from: jest.fn((table) => {
        if (table === 'profiles') {
          return {
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
            }))
          };
        }
        if (table === 'requests') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            limit: jest.fn(() => Promise.resolve({
              data: [],
              error: null
            })),
            insert: jest.fn(() => Promise.resolve({ data: null, error: null }))
          };
        }
        if (table === 'formulas') {
          return {
            select: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: mockFormulas,
                error: null
              }))
            }))
          };
        }
        return {};
      })
    };
  }
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

  it('should display form title', async () => {
    render(<AppointmentRequestPage />);

    await waitFor(() => {
      // Check if form title is visible
      expect(screen.getByText('Votre demande')).toBeInTheDocument();
    });
  });

  it('should display address input field', async () => {
    render(<AppointmentRequestPage />);

    await waitFor(() => {
      // Check if address input is visible
      const addressInput = screen.getByPlaceholderText(/12 rue du Commerce/i);
      expect(addressInput).toBeInTheDocument();
    });
  });
});
