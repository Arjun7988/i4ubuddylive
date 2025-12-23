import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
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
    console.log('Admin token received:', adminToken ? 'Yes' : 'No');

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

    console.log('Session lookup:', session ? 'Found' : 'Not found', sessionError);

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Invalid admin token', details: sessionError?.message }),
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

    if (method === 'PATCH') {
      const body = await req.json();
      const { userId, action } = body;
      console.log('PATCH request:', { userId, action });

      if (!action) {
        return new Response(
          JSON.stringify({ error: 'Missing action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (action === 'change_password') {
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
          return new Response(
            JSON.stringify({ error: 'Missing password fields' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { data: admin, error: fetchError } = await supabase
          .from('admin_users')
          .select('id, password_hash')
          .eq('id', session.admin_user_id)
          .maybeSingle();

        if (fetchError || !admin) {
          return new Response(
            JSON.stringify({ error: 'Admin user not found' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Use database function to change password
        const { data: result, error: rpcError } = await supabase
          .rpc('change_admin_password', {
            p_admin_id: admin.id,
            p_current_password: currentPassword,
            p_new_password: newPassword,
          });

        console.log('Password change result:', result);

        if (rpcError) {
          console.error('RPC error:', rpcError);
          return new Response(
            JSON.stringify({ error: 'Error changing password', details: rpcError.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        if (!result.success) {
          return new Response(
            JSON.stringify({ error: result.error || 'Failed to change password' }),
            {
              status: result.error === 'Current password is incorrect' ? 401 : 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'toggle_active') {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing userId' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('id', userId)
          .maybeSingle();

        console.log('Profile fetch:', profile, fetchError);

        if (fetchError) {
          return new Response(
            JSON.stringify({ error: 'Error fetching user', details: fetchError.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        if (!profile) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const newStatus = !profile.is_active;
        console.log('Toggling is_active from', profile.is_active, 'to', newStatus);

        const { data, error } = await supabase
          .from('profiles')
          .update({ is_active: newStatus, updated_at: new Date().toISOString() })
          .eq('id', userId)
          .select()
          .single();

        console.log('Update result:', data, error);

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Error updating user status', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (method === 'DELETE') {
      const pathParts = url.pathname.split('/');
      const userId = pathParts[pathParts.length - 1];
      console.log('DELETE request for user:', userId);

      if (!userId || userId === 'admin-users') {
        return new Response(
          JSON.stringify({ error: 'Missing user id' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      try {
        console.log('Step 1: Deleting related data...');

        await supabase.from('transactions').delete().eq('user_id', userId);
        await supabase.from('budgets').delete().eq('user_id', userId);
        await supabase.from('accounts').delete().eq('user_id', userId);
        await supabase.from('recurring_rules').delete().eq('user_id', userId);
        await supabase.from('split_bills').delete().eq('user_id', userId);
        await supabase.from('split_expenses').delete().eq('created_by', userId);
        await supabase.from('split_expense_participants').delete().eq('user_id', userId);
        await supabase.from('rsvp_events').delete().eq('created_by', userId);
        await supabase.from('rsvp_responses').delete().eq('user_id', userId);
        await supabase.from('travel_posts').delete().eq('user_id', userId);
        await supabase.from('travel_post_reactions').delete().eq('user_id', userId);
        await supabase.from('chat_messages').delete().eq('user_id', userId);
        await supabase.from('classifieds').delete().eq('user_id', userId);

        console.log('Step 2: Deleting auth user...');
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);

        if (authError) {
          console.error('Error deleting auth user:', authError);
        }

        console.log('Step 3: Deleting profile...');
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        console.log('Profile delete result:', profileError);

        if (profileError) {
          return new Response(
            JSON.stringify({ error: 'Error deleting user profile', details: profileError.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        console.log('User deletion completed successfully');
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (deleteError) {
        console.error('Error during deletion process:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Error during deletion', details: String(deleteError) }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
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
