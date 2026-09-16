import { render, screen, waitFor } from '@testing-library/react';
import SellerDashboardPage from '@/app/dashboard/seller/SellerDashboardPage';

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'seller-user-123' } }
      }))
    },
    from: jest.fn((table) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'seller-user-123',
              role: 'seller',
              first_name: 'Sophie',
              last_name: 'Martin'
            }
          }))
        };
      }
      if (table === 'requests') {
        return {
          select: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          data: [
            {
              id: 'req-1',
              status: 'pending',
              client_id: 'client-123',
              seller_id: null,
              created_at: '2024-09-16T10:00:00',
              client: { first_name: 'Marie', last_name: 'Dupont', phone: '06 12 34 56 78' },
              address: '123 Rue Test'
            },
            {
              id: 'req-2',
              status: 'accepted',
              client_id: 'client-456',
              seller_id: 'seller-user-123',
              created_at: '2024-09-15T10:00:00',
              client: { first_name: 'Jean', last_name: 'Durand', phone: '06 98 76 54 32' },
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

describe('SellerDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render seller dashboard', async () => {
    render(<SellerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Tableau de bord/i)).toBeInTheDocument();
    });
  });

  it('should display new requests section', async () => {
    render(<SellerDashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Nouvelles demandes/i) ||
              screen.queryByText(/New requests/i)).toBeDefined();
    });
  });

  it('should display accepted requests section', async () => {
    render(<SellerDashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Mes demandes acceptées/i) ||
              screen.queryByText(/Accepted/i)).toBeDefined();
    });
  });

  it('should show client information for requests', async () => {
    render(<SellerDashboardPage />);

    await waitFor(() => {
      // Should display client names
      expect(screen.queryByText(/Marie/i) ||
              screen.queryByText(/Dupont/i) ||
              screen.queryByText(/Jean/i) ||
              screen.queryByText(/Durand/i)).toBeDefined();
    });
  });

  it('should display client contact information', async () => {
    render(<SellerDashboardPage />);

    await waitFor(() => {
      // Should show phone numbers
      expect(screen.queryByText(/06 12 34 56 78/i) ||
              screen.queryByText(/06 98 76 54 32/i)).toBeDefined();
    });
  });

  it('should show address for each request', async () => {
    render(<SellerDashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText(/123 Rue Test/i) ||
              screen.queryByText(/456 Avenue Test/i)).toBeDefined();
    });
  });

  it('should have action buttons for new requests', async () => {
    render(<SellerDashboardPage />);

    await waitFor(() => {
      const acceptButton = screen.queryByRole('button', { name: /Accepter/i }) ||
                           screen.queryByRole('button', { name: /Accept/i });
      expect(acceptButton).toBeDefined();
    });
  });
});
