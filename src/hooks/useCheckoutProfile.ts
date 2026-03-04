import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UseFormReturn } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { parseAddress } from "@/lib/address";

interface CheckoutFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  streetNumber: string;
  floor: string;
  postalCode: string;
  city: string;
  province: string;
  references: string;
  paymentMethod: string;
}

export function useCheckoutProfile(
  form: UseFormReturn<CheckoutFormValues>,
  isCollective: boolean,
) {
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/ingresar?redirect=" + (isCollective ? "/checkout-colectivo" : "/checkout"));
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
          city: "Ciudad Autónoma de Buenos Aires",
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
            form.setValue("city", addr.city || "Ciudad Autónoma de Buenos Aires");
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
