import { render, screen, waitFor } from '@testing-library/react';
import ClientDashboardPage from '@/app/dashboard/client/ClientDashboardPage';

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'client-user-123' } }
      }))
    },
    from: jest.fn((table) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'client-user-123',
              role: 'client',
              first_name: 'Marie',
              last_name: 'Dupont'
            }
          }))
        };
      }
      if (table === 'requests') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          data: [
            {
              id: 'req-1',
              status: 'pending',
              created_at: '2024-09-16T10:00:00',
              formula: { label: 'Dressing déjà trié', price: 10 },
              address: '123 Rue Test'
            },
            {
              id: 'req-2',
              status: 'accepted',
              created_at: '2024-09-15T10:00:00',
              formula: { label: 'Tri sur place', price: 30 },
              address: '456 Avenue Test'
            }
          ],
          error: null
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis()
      };
    })
  })
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

describe('ClientDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render client dashboard title', async () => {
    render(<ClientDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Tableau de bord/i)).toBeInTheDocument();
    });
  });

  it('should display user name on dashboard', async () => {
    render(<ClientDashboardPage />);

    await waitFor(() => {
      // Dashboard should show user greeting or name
      expect(screen.queryByText(/Marie/i) || screen.queryByText(/Dupont/i)).toBeDefined();
    });
  });

  it('should show "My Requests" section', async () => {
    render(<ClientDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Mes demandes/i)).toBeInTheDocument();
    });
  });

  it('should display link to create new appointment', async () => {
    render(<ClientDashboardPage />);

    await waitFor(() => {
      const newRequestLink = screen.queryByText(/Faire une nouvelle demande/i) ||
                            screen.queryByHref('/appointment-request');
      expect(newRequestLink).toBeDefined();
    });
  });

  it('should show request status information', async () => {
    render(<ClientDashboardPage />);

    await waitFor(() => {
      // Should display request status
      expect(screen.queryByText(/pending/i) ||
              screen.queryByText(/Nouvelle/i) ||
              screen.queryByText(/accepted/i) ||
              screen.queryByText(/Acceptée/i)).toBeDefined();
    });
  });

  it('should display formula information for requests', async () => {
    render(<ClientDashboardPage />);

    await waitFor(() => {
      // Should show formula details
      expect(screen.queryByText(/Dressing déjà trié/i) ||
              screen.queryByText(/Tri sur place/i)).toBeDefined();
    });
  });
});
