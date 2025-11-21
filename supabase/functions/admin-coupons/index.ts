import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, X-Admin-Token',
};

interface AdminSession {
  admin_user_id: string;
  expires_at: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const adminToken = req.headers.get('X-Admin-Token');
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: 'Missing admin token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('admin_user_id, expires_at')
      .eq('token', adminToken)
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Invalid admin token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Admin token expired' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);
    const method = req.method;

    if (method === 'GET') {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase
        .from('coupons')
        .insert([body])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'PUT') {
      const body = await req.json();
      const { id, ...updates } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing coupon id' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data, error } = await supabase
        .from('coupons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'DELETE') {
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 1];

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing coupon id' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error && (error as any).details ? (error as any).details : null;
    const errorHint = error instanceof Error && (error as any).hint ? (error as any).hint : null;

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
        hint: errorHint,
        fullError: String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});