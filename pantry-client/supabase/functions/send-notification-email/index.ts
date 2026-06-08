// Supabase Edge Function — triggered via webhook or manual invoke
// Sends a transactional email via Resend when a notification is created

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const FROM_EMAIL = 'Pantry <noreply@pantryapp.email>'

interface Notification {
  id: string
  user_id: string
  type: string
  payload: Record<string, string>
  created_at: string
}

function buildEmailContent(n: Notification): { subject: string; html: string } | null {
  const p = n.payload
  switch (n.type) {
    case 'shared_pantry_request':
      return {
        subject: `${p.from_name} wants to connect on Pantry`,
        html: `
          <h2>New connection request</h2>
          <p><strong>${p.from_name}</strong> wants to share a Pantry with you.</p>
          <p><a href="https://pantry.app/people">View request →</a></p>
        `,
      }
    case 'shared_pantry_accepted':
      return {
        subject: `${p.from_name} accepted your Pantry connection`,
        html: `
          <h2>Connection accepted!</h2>
          <p><strong>${p.from_name}</strong> accepted your Shared Pantry request.</p>
          <p><a href="https://pantry.app/people">View your connections →</a></p>
        `,
      }
    case 'calendar_invite':
      return {
        subject: `${p.from_name} invited you to "${p.calendar_name}"`,
        html: `
          <h2>You've been invited to a shared calendar</h2>
          <p><strong>${p.from_name}</strong> invited you to plan meals together in "<strong>${p.calendar_name}</strong>".</p>
          <p><a href="https://pantry.app/shared/${p.plan_id}">Open calendar →</a></p>
        `,
      }
    case 'recipe_added_to_calendar':
      return {
        subject: `${p.from_name} added a recipe to ${p.calendar_name}`,
        html: `
          <h2>New recipe added</h2>
          <p><strong>${p.from_name}</strong> added <strong>${p.recipe_title}</strong> to <em>${p.calendar_name}</em>.</p>
          <p><a href="https://pantry.app/shared/${p.plan_id}">View calendar →</a></p>
        `,
      }
    default:
      return null
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let notification: Notification
  try {
    const body = await req.json()
    notification = body.record ?? body
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Get user email
  const { data: { user }, error } = await supabase.auth.admin.getUserById(notification.user_id)
  if (error || !user?.email) {
    return new Response('User not found', { status: 404 })
  }

  const content = buildEmailContent(notification)
  if (!content) {
    return new Response('Unknown notification type', { status: 200 })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: user.email,
      subject: content.subject,
      html: `
        <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; color: #1C1C1A;">
          <div style="padding: 24px 0; border-bottom: 1px solid #E8E2D9;">
            <span style="font-size: 20px; font-weight: bold; color: #2D5016;">🌿 Pantry</span>
          </div>
          <div style="padding: 24px 0;">
            ${content.html}
          </div>
          <div style="padding: 16px 0; border-top: 1px solid #E8E2D9; font-size: 12px; color: #8C8478;">
            You can manage your email preferences in <a href="https://pantry.app/settings" style="color: #2D5016;">Settings</a>.
          </div>
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
    return new Response('Email send failed', { status: 500 })
  }

  return new Response(JSON.stringify({ sent: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
