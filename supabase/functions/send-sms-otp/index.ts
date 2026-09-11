import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured')

    const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY')
    if (!TWILIO_API_KEY) throw new Error('TWILIO_API_KEY is not configured')

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json().catch(() => ({}))
    const { action, phone, code, email } = body as {
      action?: string
      phone?: string
      code?: string
      email?: string
    }

    // Resolve the target user: either from a session token, or from the email
    // of a freshly registered (not yet confirmed) account.
    let userId: string | null = null
    let confirmEmailOnSuccess = false

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null

    if (token) {
      const anonClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!
      )
      const { data: claimsData } = await anonClient.auth.getClaims(token)
      const sub = claimsData?.claims?.sub as string | undefined
      if (sub) userId = sub
    }

    if (!userId && email) {
      const normalized = email.trim().toLowerCase()
      // Find the user by email (service role)
      const { data: list } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 200 })
      const match = list?.users?.find((u) => u.email?.toLowerCase() === normalized)
      if (match) {
        userId = match.id
        confirmEmailOnSuccess = !match.email_confirmed_at
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'send') {
      if (!phone) {
        return new Response(JSON.stringify({ error: 'Phone number required' }), { status: 400, headers: corsHeaders })
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

      await serviceClient
        .from('phone_verifications')
        .delete()
        .eq('user_id', userId)
        .eq('phone', phone)

      const { error: insertError } = await serviceClient
        .from('phone_verifications')
        .insert({ user_id: userId, phone, code: otpCode, expires_at: expiresAt })

      if (insertError) {
        console.error('Insert error:', insertError)
        return new Response(JSON.stringify({ error: 'Failed to save verification code' }), { status: 500, headers: corsHeaders })
      }

      const numbersRes = await fetch(`${GATEWAY_URL}/IncomingPhoneNumbers.json?PageSize=1`, {
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TWILIO_API_KEY,
        },
      })
      const numbersData = await numbersRes.json()
      const fromNumber = numbersData?.incoming_phone_numbers?.[0]?.phone_number

      if (!fromNumber) {
        return new Response(JSON.stringify({ error: 'No Twilio phone number configured' }), { status: 500, headers: corsHeaders })
      }

      const smsRes = await fetch(`${GATEWAY_URL}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TWILIO_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phone,
          From: fromNumber,
          Body: `Your ChefCook verification code: ${otpCode}. Valid for 5 minutes.`,
        }),
      })

      const smsData = await smsRes.json()
      if (!smsRes.ok) {
        console.error('Twilio error:', smsData)
        return new Response(JSON.stringify({ error: 'Failed to send SMS' }), { status: 500, headers: corsHeaders })
      }

      return new Response(JSON.stringify({ success: true, message: 'Code sent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'verify') {
      if (!phone || !code) {
        return new Response(JSON.stringify({ error: 'Phone and code required' }), { status: 400, headers: corsHeaders })
      }

      const { data: verification, error: verifyError } = await serviceClient
        .from('phone_verifications')
        .select('*')
        .eq('user_id', userId)
        .eq('phone', phone)
        .eq('code', code)
        .eq('verified', false)
        .maybeSingle()

      if (verifyError || !verification) {
        return new Response(JSON.stringify({ error: 'Invalid code' }), { status: 400, headers: corsHeaders })
      }

      if (new Date(verification.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Code expired' }), { status: 400, headers: corsHeaders })
      }

      await serviceClient
        .from('phone_verifications')
        .update({ verified: true })
        .eq('id', verification.id)

      // When the user chose SMS verification instead of email, confirm the
      // account so they can sign in right away.
      if (confirmEmailOnSuccess) {
        await serviceClient.auth.admin.updateUserById(userId, { email_confirm: true })
      }

      return new Response(JSON.stringify({ success: true, verified: true, accountActivated: confirmEmailOnSuccess }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders })
  } catch (error) {
    console.error('Error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders })
  }
})
