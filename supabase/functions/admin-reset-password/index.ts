import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const callerId = claimsData.claims.sub

    // Use service role to check admin status
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: isAdmin } = await adminClient.rpc('has_role', { _user_id: callerId, _role: 'admin' })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), { status: 403, headers: corsHeaders })
    }

    const { userId, tempPassword } = await req.json()
    if (!userId || !tempPassword || tempPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'userId and tempPassword (min 6 chars) required' }), { status: 400, headers: corsHeaders })
    }

    // Update password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, { password: tempPassword })
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: corsHeaders })
    }

    // Set force_password_change flag
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ force_password_change: true })
      .eq('user_id', userId)
    if (profileError) {
      console.error('Failed to set force_password_change:', profileError)
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})
