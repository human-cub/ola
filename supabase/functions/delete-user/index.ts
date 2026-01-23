import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fallback admin check by email (keeps admin UI + backend function consistent)
const ADMIN_EMAILS = new Set(["chelovechesky@gmail.com"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("delete-user invoked", { method: req.method });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get user_id from request
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerEmail = (callerUser.email || "").toLowerCase();
    const isEmailAdmin = ADMIN_EMAILS.has(callerEmail);

    // Check if caller is admin (role OR allowlisted email)
    let isRoleAdmin = false;
    if (!isEmailAdmin) {
      const { data: roleData, error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", callerUser.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleErr) {
        console.error("Error checking admin role:", roleErr);
      }
      isRoleAdmin = !!roleData;
    }

    if (!isEmailAdmin && !isRoleAdmin) {
      return new Response(
        JSON.stringify({ error: "Only admins can delete users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete from profiles first (cascade might not be set up)
    const { error: profilesErr } = await supabaseAdmin.from("profiles").delete().eq("user_id", user_id);
    if (profilesErr) {
      console.error("Error deleting from profiles:", profilesErr);
      return new Response(
        JSON.stringify({ error: profilesErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Delete from login_history
    const { error: loginErr } = await supabaseAdmin.from("login_history").delete().eq("user_id", user_id);
    if (loginErr) {
      console.error("Error deleting from login_history:", loginErr);
      return new Response(
        JSON.stringify({ error: loginErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Delete from user_roles
    const { error: rolesErr } = await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
    if (rolesErr) {
      console.error("Error deleting from user_roles:", rolesErr);
      return new Response(
        JSON.stringify({ error: rolesErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error("Error deleting user from auth:", deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "User completely deleted" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in delete-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
