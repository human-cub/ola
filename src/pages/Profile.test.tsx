import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Profile from "./Profile";

const { mockNavigate, mockToast, mockSupabase } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn() },
  mockSupabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("sonner", () => ({ toast: mockToast }));

vi.mock("@/components/FloatingWhatsApp", () => ({
  FloatingWhatsApp: () => <div data-testid="floating-whatsapp" />,
}));

vi.mock("@/components/profile/OrdersTab", () => ({
  default: () => <div data-testid="orders-tab">Orders content</div>,
}));

vi.mock("@/components/AddressForm", () => ({
  AddressForm: (props: Record<string, unknown>) => (
    <div data-testid="address-form" data-title={props.title} />
  ),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

function buildProfileChain(profileData: Record<string, unknown> | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: profileData }),
      }),
    }),
  };
}

function buildUpdateChain(error: Error | null = null) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error }),
    }),
  };
}

function setupAuthenticatedSession(
  email = "user@example.com",
  userId = "user-123"
) {
  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: { user: { email, id: userId } } },
  });
}

function setupProfileData(
  profileData: Record<string, unknown> | null = null
) {
  const chain = buildProfileChain(profileData);
  mockSupabase.from.mockReturnValue(chain);
  return chain;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderProfile() {
  const user = userEvent.setup();
  const queryClient = createTestQueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { user };
}

async function switchToProfileTab(user: ReturnType<typeof userEvent.setup>) {
  const tab = await screen.findByRole("tab", { name: /perfil/i });
  await user.click(tab);
  await waitFor(() => {
    expect(screen.getByText("Información personal")).toBeInTheDocument();
  });
}

async function switchToSecurityTab(user: ReturnType<typeof userEvent.setup>) {
  const tab = await screen.findByRole("tab", { name: /seguridad|clave/i });
  await user.click(tab);
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: /cambiar contraseña/i })
    ).toBeInTheDocument();
  });
}

describe("Profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication & loading", () => {
    it("shows a loading spinner while fetching session", () => {
      mockSupabase.auth.getSession.mockReturnValue(new Promise(() => {}));
      renderProfile();
      expect(document.querySelector(".animate-spin")).toBeTruthy();
    });

    it("redirects to /ingresar when there is no session", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });
      renderProfile();
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/ingresar");
      });
    });

    it("renders the page heading when authenticated", async () => {
      setupAuthenticatedSession();
      setupProfileData({
        first_name: "Juan",
        last_name: "Pérez",
        phone: "1155551234",
        address: null,
      });

      renderProfile();

      await waitFor(() => {
        expect(screen.getByText("Mi cuenta")).toBeInTheDocument();
      });
    });
  });

  describe("profile data loading", () => {
    it("populates form fields from existing profile data", async () => {
      setupAuthenticatedSession("juan@test.com");
      setupProfileData({
        first_name: "Juan",
        last_name: "Pérez",
        phone: "1155551234",
        address: null,
      });

      const { user } = renderProfile();
      await switchToProfileTab(user);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toHaveValue("juan@test.com");
      });
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/^nombre/i)).toHaveValue("Juan");
      expect(screen.getByLabelText(/apellido/i)).toHaveValue("Pérez");
      expect(screen.getByLabelText(/teléfono/i)).toHaveValue("1155551234");
    });

    it("handles missing profile gracefully (empty fields)", async () => {
      setupAuthenticatedSession();
      setupProfileData(null);

      const { user } = renderProfile();
      await switchToProfileTab(user);

      await waitFor(() => {
        expect(screen.getByLabelText(/^nombre/i)).toHaveValue("");
      });
      expect(screen.getByLabelText(/apellido/i)).toHaveValue("");
      expect(screen.getByLabelText(/teléfono/i)).toHaveValue("");
    });

    it("renders address form with stored address data", async () => {
      const storedAddress = JSON.stringify({
        street: "Av. Corrientes",
        number: "1234",
        floor: "3B",
        postalCode: "1043",
        city: "Palermo",
        province: "Capital Federal (CABA)",
        references: "Timbre 5",
      });

      setupAuthenticatedSession();
      setupProfileData({
        first_name: "Ana",
        last_name: "",
        phone: "1199990000",
        address: storedAddress,
      });

      const { user } = renderProfile();
      await switchToProfileTab(user);

      await waitFor(() => {
        expect(screen.getByTestId("address-form")).toBeInTheDocument();
      });
    });
  });

  describe("tab navigation", () => {
    beforeEach(() => {
      setupAuthenticatedSession();
      setupProfileData({
        first_name: "Juan",
        last_name: "",
        phone: "11555",
        address: null,
      });
    });

    it("renders three tabs: orders, profile, and security", async () => {
      renderProfile();

      await waitFor(() => {
        expect(
          screen.getByRole("tab", { name: /pedidos/i })
        ).toBeInTheDocument();
      });
      expect(screen.getByRole("tab", { name: /perfil/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /seguridad|clave/i })
      ).toBeInTheDocument();
    });

    it("shows orders tab by default", async () => {
      renderProfile();

      await waitFor(() => {
        expect(screen.getByTestId("orders-tab")).toBeInTheDocument();
      });
    });

    it("switches to profile tab when clicked", async () => {
      const { user } = renderProfile();
      await switchToProfileTab(user);
      expect(screen.getByText("Información personal")).toBeInTheDocument();
    });

    it("switches to security tab when clicked", async () => {
      const { user } = renderProfile();
      await switchToSecurityTab(user);
      expect(
        screen.getByRole("heading", { name: /cambiar contraseña/i })
      ).toBeInTheDocument();
    });
  });

  describe("profile tab – saving", () => {
    beforeEach(() => {
      setupAuthenticatedSession("user@example.com", "user-123");
    });

    it("shows validation error when name is empty", async () => {
      setupProfileData({
        first_name: "",
        last_name: "",
        phone: "",
        address: null,
      });

      const { user } = renderProfile();
      await switchToProfileTab(user);

      const saveButton = screen.getByRole("button", {
        name: /guardar cambios/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("El nombre es requerido")
        ).toBeInTheDocument();
      });
    });

    it("shows validation error when phone is too short", async () => {
      setupProfileData({
        first_name: "",
        last_name: "",
        phone: "",
        address: null,
      });

      const { user } = renderProfile();
      await switchToProfileTab(user);

      await user.type(screen.getByLabelText(/^nombre/i), "Juan");

      const saveButton = screen.getByRole("button", {
        name: /guardar cambios/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("El teléfono es requerido")
        ).toBeInTheDocument();
      });
    });

    it("saves profile successfully and shows success toast", async () => {
      const profileData = {
        first_name: "Juan",
        last_name: "",
        phone: "11555555",
        address: null,
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return buildUpdateChain(null);
        }
        return buildProfileChain(profileData);
      });

      const { user } = renderProfile();
      await switchToProfileTab(user);

      await waitFor(() => {
        expect(screen.getByLabelText(/^nombre/i)).toHaveValue("Juan");
      });

      const saveButton = screen.getByRole("button", {
        name: /guardar cambios/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith("Perfil actualizado");
      });
    });

    it("shows error toast when save fails", async () => {
      const profileData = {
        first_name: "Juan",
        last_name: "",
        phone: "11555555",
        address: null,
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return buildUpdateChain(new Error("DB error"));
        }
        return buildProfileChain(profileData);
      });

      const { user } = renderProfile();
      await switchToProfileTab(user);

      await waitFor(() => {
        expect(screen.getByLabelText(/^nombre/i)).toHaveValue("Juan");
      });

      const saveButton = screen.getByRole("button", {
        name: /guardar cambios/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Error al guardar");
      });
    });
  });

  describe("security tab – password change", () => {
    beforeEach(() => {
      setupAuthenticatedSession("user@example.com");
      setupProfileData({
        first_name: "Juan",
        last_name: "",
        phone: "11555555",
        address: null,
      });
    });

    it("validates that current password is required", async () => {
      const { user } = renderProfile();
      await switchToSecurityTab(user);

      const changeBtn = screen.getByRole("button", {
        name: /cambiar contraseña/i,
      });
      await user.click(changeBtn);

      await waitFor(() => {
        expect(
          screen.getByText("Ingresá tu contraseña actual")
        ).toBeInTheDocument();
      });
    });

    it("validates new password minimum length", async () => {
      const { user } = renderProfile();
      await switchToSecurityTab(user);

      await user.type(
        screen.getByLabelText(/contraseña actual/i),
        "oldpass123"
      );
      await user.type(screen.getByLabelText("Nueva contraseña"), "ab1");

      const changeBtn = screen.getByRole("button", {
        name: /cambiar contraseña/i,
      });
      await user.click(changeBtn);

      await waitFor(() => {
        expect(screen.getByText("Mínimo 8 caracteres")).toBeInTheDocument();
      });
    });

    it("validates new password must contain letters", async () => {
      const { user } = renderProfile();
      await switchToSecurityTab(user);

      await user.type(
        screen.getByLabelText(/contraseña actual/i),
        "oldpass123"
      );
      await user.type(screen.getByLabelText("Nueva contraseña"), "12345678");

      const changeBtn = screen.getByRole("button", {
        name: /cambiar contraseña/i,
      });
      await user.click(changeBtn);

      await waitFor(() => {
        expect(screen.getByText("Debe contener letras")).toBeInTheDocument();
      });
    });

    it("validates new password must contain numbers", async () => {
      const { user } = renderProfile();
      await switchToSecurityTab(user);

      await user.type(
        screen.getByLabelText(/contraseña actual/i),
        "oldpass123"
      );
      await user.type(screen.getByLabelText("Nueva contraseña"), "abcdefgh");

      const changeBtn = screen.getByRole("button", {
        name: /cambiar contraseña/i,
      });
      await user.click(changeBtn);

      await waitFor(() => {
        expect(screen.getByText("Debe contener números")).toBeInTheDocument();
      });
    });

    it("validates passwords must match", async () => {
      const { user } = renderProfile();
      await switchToSecurityTab(user);

      await user.type(
        screen.getByLabelText(/contraseña actual/i),
        "oldpass123"
      );
      await user.type(screen.getByLabelText("Nueva contraseña"), "newpass123");
      await user.type(screen.getByLabelText(/confirmar/i), "different1");

      const changeBtn = screen.getByRole("button", {
        name: /cambiar contraseña/i,
      });
      await user.click(changeBtn);

      await waitFor(() => {
        expect(
          screen.getByText("Las contraseñas no coinciden")
        ).toBeInTheDocument();
      });
    });

    it("shows error when current password is incorrect", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        error: new Error("Invalid credentials"),
      });

      const { user } = renderProfile();
      await switchToSecurityTab(user);

      await user.type(
        screen.getByLabelText(/contraseña actual/i),
        "wrongpass1"
      );
      await user.type(screen.getByLabelText("Nueva contraseña"), "newpass123");
      await user.type(screen.getByLabelText(/confirmar/i), "newpass123");

      const changeBtn = screen.getByRole("button", {
        name: /cambiar contraseña/i,
      });
      await user.click(changeBtn);

      await waitFor(() => {
        expect(
          screen.getByText("Contraseña actual incorrecta")
        ).toBeInTheDocument();
      });
    });

    it("changes password successfully and clears fields", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

      const { user } = renderProfile();
      await switchToSecurityTab(user);

      await user.type(
        screen.getByLabelText(/contraseña actual/i),
        "oldpass123"
      );
      await user.type(screen.getByLabelText("Nueva contraseña"), "newpass123");
      await user.type(screen.getByLabelText(/confirmar/i), "newpass123");

      const changeBtn = screen.getByRole("button", {
        name: /cambiar contraseña/i,
      });
      await user.click(changeBtn);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          "Contraseña actualizada"
        );
      });

      expect(screen.getByLabelText(/contraseña actual/i)).toHaveValue("");
      expect(screen.getByLabelText("Nueva contraseña")).toHaveValue("");
      expect(screen.getByLabelText(/confirmar/i)).toHaveValue("");
    });

    it("shows error toast when updateUser fails", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });
      mockSupabase.auth.updateUser.mockResolvedValue({
        error: new Error("update failed"),
      });

      const { user } = renderProfile();
      await switchToSecurityTab(user);

      await user.type(
        screen.getByLabelText(/contraseña actual/i),
        "oldpass123"
      );
      await user.type(screen.getByLabelText("Nueva contraseña"), "newpass123");
      await user.type(screen.getByLabelText(/confirmar/i), "newpass123");

      const changeBtn = screen.getByRole("button", {
        name: /cambiar contraseña/i,
      });
      await user.click(changeBtn);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Error al cambiar la contraseña"
        );
      });
    });

    it("toggles current password visibility", async () => {
      const { user } = renderProfile();
      await switchToSecurityTab(user);

      const currentPwdInput = screen.getByLabelText(/contraseña actual/i);
      expect(currentPwdInput).toHaveAttribute("type", "password");

      const container = currentPwdInput.closest(".relative")!;
      const toggleBtn = container.querySelector("button")!;
      await user.click(toggleBtn);
      expect(currentPwdInput).toHaveAttribute("type", "text");

      await user.click(toggleBtn);
      expect(currentPwdInput).toHaveAttribute("type", "password");
    });

    it("toggles new password visibility", async () => {
      const { user } = renderProfile();
      await switchToSecurityTab(user);

      const newPwdInput = screen.getByLabelText("Nueva contraseña");
      expect(newPwdInput).toHaveAttribute("type", "password");

      const container = newPwdInput.closest(".relative")!;
      const toggleBtn = container.querySelector("button")!;
      await user.click(toggleBtn);
      expect(newPwdInput).toHaveAttribute("type", "text");

      await user.click(toggleBtn);
      expect(newPwdInput).toHaveAttribute("type", "password");
    });
  });

  describe("logout", () => {
    it("signs out and navigates to home", async () => {
      setupAuthenticatedSession();
      setupProfileData({
        first_name: "Juan",
        last_name: "",
        phone: "11555",
        address: null,
      });
      mockSupabase.auth.signOut.mockResolvedValue({});

      const { user } = renderProfile();

      const logoutButton = await screen.findByRole("button", {
        name: /cerrar sesión/i,
      });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      });
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("navigation link", () => {
    it("renders a link back to home", async () => {
      setupAuthenticatedSession();
      setupProfileData({
        first_name: "Juan",
        last_name: "",
        phone: "11555",
        address: null,
      });

      renderProfile();

      const backLink = await screen.findByRole("link", {
        name: /volver al inicio/i,
      });
      expect(backLink).toHaveAttribute("href", "/");
    });
  });
});
