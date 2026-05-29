import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AddressForm } from "@/components/AddressForm";
import { isCABAProvince } from "@/data/argentinaLocations";
import { parseAddressOrEmpty } from "@/lib/address";


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

interface ProfileEditFormProps {
  profile: any;
  email: string;
}

export const ProfileEditForm = ({ profile, email }: ProfileEditFormProps) => {
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
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
    },
  });

  const [street, streetNumber, floor, postalCode, city, province, references] =
    form.watch(["street", "streetNumber", "floor", "postalCode", "city", "province", "references"]);

  useEffect(() => {
    if (!profile) return;
    const addr = profile.address ? parseAddressOrEmpty(profile.address) : null;

    form.reset({
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
  }, [profile, form]);

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => saveProfileMutation.mutate(data))}>
        <Card>
          <CardHeader>
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              setStreet={(v) => form.setValue("street", v)}
              streetNumber={streetNumber}
              setStreetNumber={(v) => form.setValue("streetNumber", v)}
              floor={floor}
              setFloor={(v) => form.setValue("floor", v)}
              postalCode={postalCode}
              setPostalCode={(v) => form.setValue("postalCode", v)}
              city={city}
              setCity={(v) => form.setValue("city", v)}
              province={province}
              setProvince={(v) => form.setValue("province", v)}
              references={references}
              setReferences={(v) => form.setValue("references", v)}
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
  );
};
