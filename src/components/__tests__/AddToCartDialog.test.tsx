import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddToCartDialog } from '../AddToCartDialog';
import { useCart } from '@/contexts/CartContext';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// 1. Mock the CartContext hook
vi.mock('@/contexts/CartContext', () => ({
    useCart: vi.fn(),
}));

// 2. Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
        },
    },
}));

// Helper function to render the component with required providers
const renderAddToCartDialog = (props = {}) => {
    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        productId: 'test-product-123',
        productName: 'Test Pre Workout',
        productImage: 'https://example.com/image.jpg',
        flavors: [],
        prices: [{ people: 1, price: 1000 }],
        isWaitingList: false,
        ...props,
    };

    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AddToCartDialog {...defaultProps} />
            </BrowserRouter>
        </QueryClientProvider>
    );
};

describe('AddToCartDialog Component', () => {
    const mockAddToCart = vi.fn();

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();

        // Setup default mock returns
        (useCart as any).mockReturnValue({
            addToCart: mockAddToCart,
            addToWaitingList: vi.fn(),
            cartItems: [],
            waitingListItems: [],
        });

        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { user: { id: 'test-user-id' } } },
        });
    });

    it('renders correctly', () => {
        renderAddToCartDialog();

        // The dialog should be visible
        expect(screen.getByText('Agregar al Carrito')).toBeInTheDocument();

        // The product name should be visible
        expect(screen.getByText('Test Pre Workout')).toBeInTheDocument();
    });

    it('allows changing quantity and adding to cart successfully', async () => {
        // Pretend the backend request succeeds
        mockAddToCart.mockResolvedValue(true);

        // We wrap render in it's own DOM element if needed, but since we are in a new `it` block, the DOM is clean
        const { container } = renderAddToCartDialog();

        // Check initial state
        const qtyElement = screen.getByText('1');
        expect(qtyElement).toBeInTheDocument();

        // Check that initial total price is 1 * 1000 = $ 1.000 (depending on formatting)
        // formatPrice formats as '$ 1.000,00' or similar. We can just check for '1' being incremented properly.

        // Find buttons:
        // The dialog has the following buttons (in order): -, +, Cancelar, Agregar (since flavors aren't present).
        const buttons = screen.getAllByRole('button');
        // Let's find the '+' button. It's the one that is NOT disabled.
        // Actually, we can find it by looking for the one right after the Minus button.
        // The first button in the dialog body is Minus, second is Plus (barring the Dialog close X button which is also a button).

        // A much more robust way is to just find the '+' icon using querySelector
        // SVG has lucide-plus class usually, or we can look for the button containing the Plus icon
        const minusBtn = buttons.find(b => b.innerHTML.includes('lucide-minus'));
        const plusBtn = buttons.find(b => b.innerHTML.includes('lucide-plus'));

        const agregarBtn = screen.getByRole('button', { name: /Agregar/i });

        // Increment quantity to 3 by clicking twice
        if (plusBtn) {
            fireEvent.click(plusBtn);
            fireEvent.click(plusBtn);
        }

        // Now quantity text should be 3
        expect(screen.getByText('3')).toBeInTheDocument();

        // Click on the Agregar button
        fireEvent.click(agregarBtn);

        // Because handle submit does async work (await supabase.auth.getSession(), await addToCart()),
        // we use waitFor to wait until our mock function was called
        await waitFor(() => {
            expect(mockAddToCart).toHaveBeenCalledWith({
                product_id: 'test-product-123',
                product_name: 'Test Pre Workout',
                flavor: null,
                quantity: 3,
                price_per_unit: 1000,
                product_image: 'https://example.com/image.jpg',
                product_link: null,
            });
        });

        // Test pessimistic update: The success screen ("¡Producto agregado!") should appear AFTER the network requests succeed
        expect(await screen.findByText('¡Producto agregado!')).toBeInTheDocument();
    });
});
