import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, ArrowLeft, User, Shield, LogOut, Eye, EyeOff, Package } from "lucide-react";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import OrdersTab from "@/components/profile/OrdersTab";
import { AddressForm } from "@/components/AddressForm";
import { isCABAProvince } from "@/data/argentinaLocations";

const profileSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido").max(50),
  lastName: z.string().max(50),
  phone: z.string().min(8, "El teléfono es requerido").max(20),
  street: z.string(),
  streetNumber: z.string(),
  floor: z.string(),
  postalCode: z.string(),
  city: z.string(),
  province: z.string(),
  references: z.string(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Ingresá tu contraseña actual"),
  newPassword: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[a-zA-Z]/, "Debe contener letras")
    .regex(/[0-9]/, "Debe contener números"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface AddressData {
  street: string;
  number: string;
  floor: string;
  postalCode: string;
  city: string;
  province: string;
  references: string;
}

const fetchProfile = async () => {
  const { data: {session} } = await supabase.auth.getSession();
  if (!session) {
    // todo
    // navigate("/ingresar");
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  return { session, profile };
}


// Format address for display - remove labels and brackets
// const formatAddressForDisplay = (address: string): string => {
//   if (!address) return "";
  
//   try {
//     const addr = JSON.parse(address) as AddressData;
//     const parts = [
//       addr.street,
//       addr.number,
//       addr.floor,
//       addr.postalCode,
//       addr.city,
//       addr.province,
//       addr.references,
//     ].filter(Boolean);
//     return parts.join(", ");
//   } catch {
//     return address;
//   }
// };

// Parse stored address JSON to individual fields
const parseStoredAddress = (address: string): AddressData => {
  try {
    const addr = JSON.parse(address);
    return {
      street: addr.street || "",
      number: addr.number || "",
      floor: addr.floor || "",
      postalCode: addr.postalCode || "",
      city: addr.city || "",
      province: addr.province || "",
      references: addr.references || "",
    };
  } catch {
    return {
      street: "",
      number: "",
      floor: "",
      postalCode: "",
      city: "",
      province: "",
      references: "",
    };
  }
};

const profileDefaults: ProfileFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  street: "",
  streetNumber: "",
  floor: "",
  postalCode: "",
  city: "",
  province: "",
  references: "",
};

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileDefaults,
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile
  })

  const email = data?.session?.user?.email || "";

  const [street, streetNumber, floor, postalCode, city, province, references] =
    profileForm.watch(["street", "streetNumber", "floor", "postalCode", "city", "province", "references"]);

  useEffect(() => {
    if (!isLoading && !data) navigate("/ingresar");
  }, [isLoading, data, navigate]);

  useEffect(() => {
    if (!data?.profile) return;
    const profile = data.profile;
    const addr = profile.address ? parseStoredAddress(profile.address) : null;

    profileForm.reset({
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      phone: profile.phone || "",
      street: addr?.street || "",
      streetNumber: addr?.number || "",
      floor: addr?.floor || "",
      postalCode: addr?.postalCode || "",
      city: addr?.city || "",
      province: addr?.province || "",
      references: addr?.references || "",
    });
  }, [data, profileForm]);

  const tempName = data?.profile
    ? [data.profile.first_name, data.profile.last_name].filter(Boolean).join(" ")
    : "";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const saveProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const addressJson = data.street ? JSON.stringify({
        street: data.street,
        number: data.streetNumber,
        floor: data.floor,
        postalCode: data.postalCode,
        city: isCABAProvince(data.province) ? data.province : data.city,
        province: data.province,
        references: data.references,
      }) : null;

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: data.firstName.trim(),
          last_name: data.lastName.trim(),
          phone: data.phone.trim(),
          address: addressJson,
          profile_completed: true,
        })
        .eq("user_id", session.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil actualizado");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => {
      toast.error("Error al guardar");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (formData: PasswordFormValues) => {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: formData.currentPassword,
      });

      if (signInError) throw new Error("WRONG_PASSWORD");

      const { error } = await supabase.auth.updateUser({ password: formData.newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contraseña actualizada");
      passwordForm.reset();
    },
    onError: (err) => {
      if (err.message === "WRONG_PASSWORD") {
        passwordForm.setError("currentPassword", {
          message: "Contraseña actual incorrecta",
        });
      } else {
        toast.error("Error al cambiar la contraseña");
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }




  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="container mx-auto max-w-2xl">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Mi cuenta</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Mis Pedidos</span>
              <span className="sm:hidden">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Mi Perfil</span>
              <span className="sm:hidden">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Seguridad</span>
              <span className="sm:hidden">Clave</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>

          <TabsContent value="profile">
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit((data) => saveProfileMutation.mutate(data))}>
                <Card>
                  <CardHeader>
                    <h2>Hola {tempName}!</h2>
                    <CardTitle>Información personal</CardTitle>
                    <CardDescription>
                      Actualizá tus datos de contacto
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        El email no se puede cambiar
                      </p>
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellido</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="my-4" />

                    <AddressForm
                      street={street}
                      setStreet={(v) => profileForm.setValue("street", v)}
                      streetNumber={streetNumber}
                      setStreetNumber={(v) => profileForm.setValue("streetNumber", v)}
                      floor={floor}
                      setFloor={(v) => profileForm.setValue("floor", v)}
                      postalCode={postalCode}
                      setPostalCode={(v) => profileForm.setValue("postalCode", v)}
                      city={city}
                      setCity={(v) => profileForm.setValue("city", v)}
                      province={province}
                      setProvince={(v) => profileForm.setValue("province", v)}
                      references={references}
                      setReferences={(v) => profileForm.setValue("references", v)}
                      errors={{}}
                      hideReferences={true}
                      title="Dirección"
                    />

                    <Button type="submit" disabled={saveProfileMutation.isPending}>
                      {saveProfileMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar cambios"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="security">
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))}>
                <Card>
                  <CardHeader>
                    <CardTitle>Cambiar contraseña</CardTitle>
                    <CardDescription>
                      Actualizá tu contraseña de acceso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña actual</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type={showCurrentPassword ? "text" : "password"}
                                className="pr-10"
                                {...field}
                              />
                            </FormControl>
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nueva contraseña</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type={showNewPassword ? "text" : "password"}
                                className="pr-10"
                                {...field}
                              />
                            </FormControl>
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Mínimo 8 caracteres, con letras y números
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar nueva contraseña</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={changePasswordMutation.isPending}>
                      {changePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Cambiando...
                        </>
                      ) : (
                        "Cambiar contraseña"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </div>

      <FloatingWhatsApp />
    </div>
  );
};

export default Profile;
