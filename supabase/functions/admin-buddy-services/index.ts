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

function generateSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
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
    console.log('Request received:', req.method, 'Admin token:', adminToken ? 'Present' : 'Missing');

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

    console.log('Session lookup:', session ? 'Found' : 'Not found', sessionError ? `Error: ${sessionError.message}` : '');

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
    const action = url.searchParams.get('action');

    if (method === 'GET') {
      if (action === 'reviews') {
        console.log('Fetching buddy service reviews...');
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('buddy_service_reviews')
          .select('*')
          .order('created_at', { ascending: false });

        console.log('Reviews query result:', reviewsData ? `${reviewsData.length} reviews` : 'No data', reviewsError ? `Error: ${reviewsError.message}` : '');

        if (reviewsError) {
          console.error('Database error:', reviewsError);
          throw reviewsError;
        }

        const formattedData = [];
        for (const review of reviewsData || []) {
          const { data: listing } = await supabase
            .from('buddy_service_listings')
            .select(`
              id,
              business_name,
              slug,
              category_id
            `)
            .eq('id', review.listing_id)
            .maybeSingle();

          if (listing) {
            const { data: category } = await supabase
              .from('buddy_service_categories')
              .select('slug')
              .eq('id', listing.category_id)
              .maybeSingle();

            formattedData.push({
              ...review,
              listing: {
                id: listing.id,
                business_name: listing.business_name,
                slug: listing.slug,
              },
              category: category ? { slug: category.slug } : { slug: 'unknown' },
            });
          }
        }

        console.log('Formatted data:', formattedData.length, 'reviews');

        return new Response(JSON.stringify({ data: formattedData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Fetching buddy service requests...');
      const { data, error } = await supabase
        .from('buddy_service_requests')
        .select(`
          *,
          category:buddy_service_categories(name),
          subcategory:buddy_service_subcategories(name)
        `)
        .order('created_at', { ascending: false });

      console.log('Query result:', data ? `${data.length} records` : 'No data', error ? `Error: ${error.message}` : '');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'PATCH') {
      const body = await req.json();

      if (action === 'approve-review') {
        const { reviewId } = body;
        console.log('PATCH approve-review:', { reviewId });

        if (!reviewId) {
          return new Response(
            JSON.stringify({ error: 'Missing reviewId' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { error: updateError } = await supabase
          .from('buddy_service_reviews')
          .update({ is_approved: true })
          .eq('id', reviewId);

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { requestId, status } = body;
      console.log('PATCH request:', { requestId, status });

      if (!requestId || !status) {
        return new Response(
          JSON.stringify({ error: 'Missing requestId or status' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error: updateError } = await supabase
        .from('buddy_service_requests')
        .update({
          status,
          reviewed_by: session.admin_user_id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      if (status === 'approved') {
        console.log('Approving request and creating listing...');
        const { data: request, error: fetchError } = await supabase
          .from('buddy_service_requests')
          .select('*')
          .eq('id', requestId)
          .single();

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          throw fetchError;
        }
        if (!request) throw new Error('Request not found');

        const baseSlug = generateSlug(request.business_name);
        let slug = baseSlug;
        let counter = 1;

        while (true) {
          const { data: existing } = await supabase
            .from('buddy_service_listings')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();

          if (!existing) break;
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        console.log('Generated slug:', slug);

        let streetAddress = request.street_address;
        if (typeof streetAddress === 'string' && streetAddress.startsWith('{')) {
          try {
            const parsed = JSON.parse(streetAddress);
            streetAddress = parsed.address || streetAddress;
          } catch (e) {
            console.log('street_address is not valid JSON, using as-is');
          }
        }

        const listingData = {
          user_id: request.user_id,
          request_id: request.id,
          category_id: request.category_id,
          subcategory_id: request.subcategory_id,
          business_name: request.business_name,
          tagline: request.tagline,
          about_business: request.about_business,
          slug: slug,
          street_address: streetAddress,
          city: request.city,
          state: request.state,
          zip_code: request.zip_code,
          display_city: request.display_city || 'Dallas',
          phone: request.phone,
          email: request.email,
          website: request.website,
          whatsapp: request.whatsapp,
          social_link: request.social_link,
          business_hours: request.business_hours || {},
          listing_type: request.listing_type,
          images: request.images || [],
          is_active: true,
        };

        console.log('Inserting listing with data:', JSON.stringify(listingData, null, 2));

        const { error: insertError } = await supabase
          .from('buddy_service_listings')
          .insert(listingData);

        if (insertError) {
          console.error('Insert error details:', {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
          });
          throw new Error(`Failed to create listing: ${insertError.message} - ${insertError.details || ''}`);
        }

        console.log('Listing created successfully');
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'DELETE') {
      if (action === 'delete-review') {
        const body = await req.json();
        const { reviewId } = body;
        console.log('DELETE review:', reviewId);

        if (!reviewId) {
          return new Response(
            JSON.stringify({ error: 'Missing reviewId' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { error } = await supabase
          .from('buddy_service_reviews')
          .delete()
          .eq('id', reviewId);

        if (error) {
          console.error('Delete error:', error);
          throw error;
        }

        console.log('Review deleted successfully');
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const pathParts = url.pathname.split('/');
      const requestId = pathParts[pathParts.length - 1];
      console.log('DELETE request for:', requestId);

      if (!requestId || requestId === 'admin-buddy-services') {
        return new Response(
          JSON.stringify({ error: 'Missing request id' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error } = await supabase
        .from('buddy_service_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      console.log('Request deleted successfully');
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
    console.error('Unhandled error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);

    let errorMessage = 'Unknown error occurred';
    let errorDetails = null;
    let errorCode = null;
    let errorHint = null;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = (error as any).details || null;
      errorCode = (error as any).code || null;
      errorHint = (error as any).hint || null;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = (error as any).message || JSON.stringify(error);
      errorDetails = (error as any).details || null;
      errorCode = (error as any).code || null;
      errorHint = (error as any).hint || null;
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
        code: errorCode,
        hint: errorHint,
        fullError: String(error),
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
