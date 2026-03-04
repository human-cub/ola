import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

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

interface SecurityFormProps {
  email: string;
}

export const SecurityForm = ({ email }: SecurityFormProps) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
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
      form.reset();
    },
    onError: (err) => {
      if (err.message === "WRONG_PASSWORD") {
        form.setError("currentPassword", {
          message: "Contraseña actual incorrecta",
        });
      } else {
        toast.error("Error al cambiar la contraseña");
      }
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => changePasswordMutation.mutate(data))}>
        <Card>
          <CardHeader>
            <CardTitle>Cambiar contraseña</CardTitle>
            <CardDescription>
              Actualizá tu contraseña de acceso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
  );
};
