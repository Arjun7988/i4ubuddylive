import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, x-admin-token',
};

interface AdPayload {
  client_id?: string | null;
  client_name?: string | null;
  title: string;
  image_url: string | null;
  redirect_url: string | null;
  action_type: 'redirect' | 'popup';
  popup_image_url: string | null;
  popup_description: string | null;
  pages: string[];
  placement: string;
  position?: number;
  target_state: string | null;
  target_city: string | null;
  target_pincode: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  created_by: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const path = url.pathname.replace('/admin-ads', '');

    // Verify admin token from request header
    const adminToken = req.headers.get('x-admin-token');
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - no token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin session
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('admin_user_id')
      .eq('token', adminToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET / - List all ads
    if (req.method === 'GET' && (path === '' || path === '/')) {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST / - Create new ad
    if (req.method === 'POST' && (path === '' || path === '/')) {
      const payload: AdPayload = await req.json();

      // Handle client creation/lookup if client_name is provided
      let clientId = payload.client_id || null;
      if (payload.client_name && payload.client_name.trim()) {
        // Check if client already exists
        const { data: existingClient } = await supabase
          .from('ad_clients')
          .select('id')
          .eq('name', payload.client_name.trim())
          .maybeSingle();

        if (existingClient) {
          clientId = existingClient.id;
        } else {
          // Create new client
          const { data: newClient, error: clientError } = await supabase
            .from('ad_clients')
            .insert({ name: payload.client_name.trim() })
            .select('id')
            .single();

          if (clientError) throw clientError;
          clientId = newClient.id;
        }
      }

      // Prepare ad data without client_name
      const { client_name, ...adData } = payload;
      const adPayload = {
        ...adData,
        client_id: clientId,
      };

      const { data, error } = await supabase
        .from('ads')
        .insert(adPayload)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify(data),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT /:id - Update ad
    if (req.method === 'PUT' && path.startsWith('/')) {
      const id = path.substring(1);
      const payload: AdPayload = await req.json();

      // Handle client creation/lookup if client_name is provided
      let clientId = payload.client_id || null;
      if (payload.client_name && payload.client_name.trim()) {
        // Check if client already exists
        const { data: existingClient } = await supabase
          .from('ad_clients')
          .select('id')
          .eq('name', payload.client_name.trim())
          .maybeSingle();

        if (existingClient) {
          clientId = existingClient.id;
        } else {
          // Create new client
          const { data: newClient, error: clientError } = await supabase
            .from('ad_clients')
            .insert({ name: payload.client_name.trim() })
            .select('id')
            .single();

          if (clientError) throw clientError;
          clientId = newClient.id;
        }
      }

      // Prepare ad data without client_name
      const { client_name, ...adData } = payload;
      const adPayload = {
        ...adData,
        client_id: clientId,
      };

      const { data, error } = await supabase
        .from('ads')
        .update(adPayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /:id - Delete ad
    if (req.method === 'DELETE' && path.startsWith('/')) {
      const id = path.substring(1);

      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});