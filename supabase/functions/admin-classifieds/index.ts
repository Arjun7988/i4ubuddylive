import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Admin-Token",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const adminToken = req.headers.get("X-Admin-Token");
    
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: "Admin token required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin token
    const { data: session, error: sessionError } = await supabase
      .from("admin_sessions")
      .select("*")
      .eq("token", adminToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired admin token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.split("/admin-classifieds")[1] || "";

    // GET /admin-classifieds - List all classifieds
    if (req.method === "GET" && path === "/") {
      const { data, error } = await supabase
        .from("classifieds")
        .select("*, category:classified_categories(id, name, slug)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT /admin-classifieds/:id/status - Update classified status
    if (req.method === "PUT" && path.includes("/status")) {
      const classifiedId = path.split("/")[1];
      const { status } = await req.json();

      const { error } = await supabase
        .from("classifieds")
        .update({ status })
        .eq("id", classifiedId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: "Status updated" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // DELETE /admin-classifieds/:id - Delete classified
    if (req.method === "DELETE") {
      const classifiedId = path.split("/")[1];

      const { error } = await supabase
        .from("classifieds")
        .delete()
        .eq("id", classifiedId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: "Classified deleted" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Route not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
