import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UseFormReturn } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { parseAddress } from "@/lib/address";

export function useCheckoutProfile(
  form: UseFormReturn<any>,
  isCollective: boolean,
) {
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Immediate checkout allows guests (account created at finalize); collective stays members-only.
        if (isCollective) navigate("/ingresar?redirect=/finalizar-compra-grupal");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile) {
        form.reset({
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          phone: profile.phone || "",
          street: "",
          streetNumber: "",
          floor: "",
          postalCode: "",
          city: "Capital Federal (CABA)",
          province: "Buenos Aires",
          references: "",
          paymentMethod: "",
        });

        if (profile.address) {
          const addr = parseAddress(profile.address);
          if (addr) {
            form.setValue("street", addr.street);
            form.setValue("streetNumber", addr.number);
            form.setValue("floor", addr.floor);
            form.setValue("postalCode", addr.postalCode);
            form.setValue("city", addr.city || "Capital Federal (CABA)");
            form.setValue("province", addr.province || "Buenos Aires");
            form.setValue("references", addr.references);
          } else {
            form.setValue("street", profile.address);
          }
        }
      }
    };

    loadProfile();
  }, [navigate, isCollective, form]);
}
