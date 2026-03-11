import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DynamicProduct from "./DynamicProduct";

const { maybeSingleMock, removeChannelMock, subscribeMock, onMock, channelMock, fromMock } = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const removeChannel = vi.fn();
  const subscribe = vi.fn(() => ({ unsubscribe: vi.fn() }));
  const on = vi.fn(() => ({ subscribe }));
  const channel = vi.fn(() => ({ on }));
  const from = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle })),
    })),
  }));

  return {
    maybeSingleMock: maybeSingle,
    removeChannelMock: removeChannel,
    subscribeMock: subscribe,
    onMock: on,
    channelMock: channel,
    fromMock: from,
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: fromMock,
    channel: channelMock,
    removeChannel: removeChannelMock,
  },
}));

vi.mock("@/components/Header", () => ({ Header: () => <div data-testid="header" /> }));
vi.mock("@/components/Breadcrumb", () => ({ Breadcrumb: () => <div data-testid="breadcrumb" /> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <div data-testid="footer" /> }));
vi.mock("@/components/RelatedProducts", () => ({ RelatedProducts: () => <div data-testid="related-products" /> }));
vi.mock("@/components/DynamicProductCarousel", () => ({ DynamicProductCarousel: () => <div data-testid="carousel" /> }));
vi.mock("@/components/DynamicProductInfo", () => ({ DynamicProductInfo: ({ name }: { name: string }) => <div>{name}</div> }));
vi.mock("@/components/DynamicProductDescription", () => ({ DynamicProductDescription: ({ description }: { description: string }) => <div>{description}</div> }));
vi.mock("@/components/GroupBuyPriceBlock", () => ({ GroupBuyPriceBlock: () => <div data-testid="price-block" /> }));
vi.mock("@/components/ui/spinner", () => ({ Spinner: () => <div data-testid="spinner" /> }));
vi.mock("@/hooks/useScrollHeader", () => ({ useScrollHeader: () => true }));

describe("DynamicProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders not found when the product query returns no visible product", async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });

    render(
      <MemoryRouter initialEntries={["/producto/qa-timer-probe-100"]}>
        <Routes>
          <Route path="/producto/:slug" element={<DynamicProduct />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Producto no encontrado")).toBeInTheDocument();
  });

  it("renders the product when Supabase returns an accessible row", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: "qa-product-id",
        name: "QA Creatina Timer Probe",
        weight: "100g",
        category: "creatinas",
        description: "Producto interno para reproducir flujos de QA y errores de temporizador.",
        images: ["https://example.com/qa.png"],
        prices: [{ people: 1, price: 11111 }],
        flavors: [],
        variants: ["Uso interno de admins"],
        waiting_for_discount_count: 0,
        virtual_orders_count: 0,
        total_orders_count: 0,
      },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={["/producto/qa-timer-probe-100"]}>
        <Routes>
          <Route path="/producto/:slug" element={<DynamicProduct />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("QA Creatina Timer Probe")).toBeInTheDocument();
    expect(screen.getByText("Producto interno para reproducir flujos de QA y errores de temporizador.")).toBeInTheDocument();
  });
});
