// Supabase Edge Function - Send Welcome Email
// Triggered when a new premium account is created

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface WelcomeEmailRequest {
  email: string
  userName?: string
  isPremium: boolean
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Verify request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { email, userName, isPremium }: WelcomeEmailRequest = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📧 Sending welcome email to: ${email}`)

    // Email templates
    const emailSubject = isPremium 
      ? '🎉 Bienvenue dans MarkdownEnPDF Premium !'
      : '👋 Bienvenue sur MarkdownEnPDF !'

    const emailHtml = isPremium 
      ? generatePremiumWelcomeEmail(email, userName)
      : generateFreeWelcomeEmail(email, userName)

    // Send email using Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'MarkdownEnPDF <contact@stillinov.com>',
        to: [email],
        subject: emailSubject,
        html: emailHtml,
      }),
    })

    if (!resendResponse.ok) {
      const error = await resendResponse.text()
      console.error('❌ Resend API error:', error)
      throw new Error(`Failed to send email: ${error}`)
    }

    const resendData = await resendResponse.json()
    console.log('✅ Email sent successfully:', resendData.id)

    // Log email sent in database
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    await supabase.from('email_logs').insert({
      email,
      type: isPremium ? 'welcome_premium' : 'welcome_free',
      sent_at: new Date().toISOString(),
      resend_id: resendData.id,
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent',
        emailId: resendData.id 
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )

  } catch (error: any) {
    console.error('💥 Error sending welcome email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  }
})

// Premium Welcome Email Template
function generatePremiumWelcomeEmail(email: string, userName?: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue Premium - MarkdownEnPDF</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); overflow: hidden; border: 1px solid #e2e8f0;">
          
          <!-- Logo & Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 32px 40px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <img src="https://markdownenpdf.com/logo.png" alt="MarkdownEnPDF" style="width: 48px; height: 48px; margin-bottom: 16px; border-radius: 8px;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Bienvenue Premium !</h1>
                    <p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 500;">Merci d'avoir rejoint MarkdownEnPDF</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 32px;">
              <p style="margin: 0 0 8px; font-size: 15px; color: #64748b; font-weight: 500;">
                Bonjour${userName ? ' ' + userName : ''} 👋
              </p>
              
              <h2 style="margin: 0 0 16px; font-size: 20px; color: #0f172a; font-weight: 700; line-height: 1.4;">
                Votre compte Premium est maintenant actif
              </h2>
              
              <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.7;">
                Vous avez désormais accès à l'ensemble des fonctionnalités premium de <strong style="color: #0f172a;">MarkdownEnPDF</strong>. Profitez d'une expérience sans limites pour convertir tous vos documents Markdown en PDF professionnels.
              </p>
              
              <!-- Benefits Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%); border-radius: 10px; border: 1px solid #a7f3d0; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 16px; color: #065f46; font-size: 16px; font-weight: 700; display: flex; align-items: center;">
                      ✨ Vos avantages Premium
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #10b981; font-size: 18px; margin-right: 8px;">✓</span>
                          <span style="color: #065f46; font-size: 14px; font-weight: 600;">Conversions illimitées à vie</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #10b981; font-size: 18px; margin-right: 8px;">✓</span>
                          <span style="color: #065f46; font-size: 14px; font-weight: 600;">Aucun abonnement mensuel</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #10b981; font-size: 18px; margin-right: 8px;">✓</span>
                          <span style="color: #065f46; font-size: 14px; font-weight: 600;">Accès prioritaire aux nouvelles fonctionnalités</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #10b981; font-size: 18px; margin-right: 8px;">✓</span>
                          <span style="color: #065f46; font-size: 14px; font-weight: 600;">Support client prioritaire</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0 24px;">
                <tr>
                  <td align="center">
                    <a href="https://markdownenpdf.com" style="display: inline-block; background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(6, 182, 212, 0.3);">
                      Commencer à convertir →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Support Section -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #0f172a; font-weight: 600;">
                      Une question ? Nous sommes là pour vous aider
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                      Contactez notre équipe : <a href="mailto:contact@stillinov.com" style="color: #0891b2; text-decoration: none; font-weight: 500;">contact@stillinov.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 12px; font-size: 13px; color: #64748b;">
                <a href="https://markdownenpdf.com" style="color: #0891b2; text-decoration: none; margin: 0 12px; font-weight: 500;">Accueil</a>
                <span style="color: #cbd5e1;">•</span>
                <a href="https://markdownenpdf.com/about.html" style="color: #0891b2; text-decoration: none; margin: 0 12px; font-weight: 500;">À propos</a>
                <span style="color: #cbd5e1;">•</span>
                <a href="https://markdownenpdf.com/contact.html" style="color: #0891b2; text-decoration: none; margin: 0 12px; font-weight: 500;">Contact</a>
              </p>
              <p style="margin: 12px 0 0; font-size: 12px; color: #94a3b8;">
                © 2025 MarkdownEnPDF.com • Tous droits réservés
              </p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #cbd5e1;">
                Cet email a été envoyé à ${email}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// Free Account Welcome Email Template
function generateFreeWelcomeEmail(email: string, userName?: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur MarkdownEnPDF</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); overflow: hidden; border: 1px solid #e2e8f0;">
          
          <!-- Logo & Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <img src="https://markdownenpdf.com/logo.png" alt="MarkdownEnPDF" style="width: 48px; height: 48px; margin-bottom: 16px; border-radius: 8px;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Bienvenue sur MarkdownEnPDF</h1>
                    <p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 500;">Votre compte gratuit est créé</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 32px;">
              <p style="margin: 0 0 8px; font-size: 15px; color: #64748b; font-weight: 500;">
                Bonjour${userName ? ' ' + userName : ''} 👋
              </p>
              
              <h2 style="margin: 0 0 16px; font-size: 20px; color: #0f172a; font-weight: 700; line-height: 1.4;">
                Votre compte est maintenant actif
              </h2>
              
              <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.7;">
                Bienvenue sur <strong style="color: #0f172a;">MarkdownEnPDF</strong> ! Vous pouvez dès maintenant convertir vos fichiers Markdown en PDF professionnels en quelques clics.
              </p>
              
              <!-- Free Account Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 10px; border: 1px solid #93c5fd; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 12px; color: #1e40af; font-size: 16px; font-weight: 700;">
                      🎁 Votre compte gratuit
                    </h3>
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6; font-weight: 600;">
                      Vous disposez de <strong>2 conversions gratuites par jour</strong>. Parfait pour découvrir notre service !
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Premium Upgrade Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px; border: 1px solid #fbbf24; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 12px; color: #92400e; font-size: 16px; font-weight: 700;">
                      ⚡ Passez à Premium pour 2,99€
                    </h3>
                    <p style="margin: 0 0 16px; color: #78350f; font-size: 14px; line-height: 1.6; font-weight: 500;">
                      Débloquez les <strong>conversions illimitées à vie</strong> avec un paiement unique. Sans abonnement mensuel.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #f59e0b; font-size: 16px; margin-right: 8px;">✓</span>
                          <span style="color: #78350f; font-size: 13px; font-weight: 600;">Conversions illimitées à vie</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #f59e0b; font-size: 16px; margin-right: 8px;">✓</span>
                          <span style="color: #78350f; font-size: 13px; font-weight: 600;">Aucun abonnement mensuel</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #f59e0b; font-size: 16px; margin-right: 8px;">✓</span>
                          <span style="color: #78350f; font-size: 13px; font-weight: 600;">Paiement unique de 2,99€</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0 24px;">
                <tr>
                  <td align="center">
                    <a href="https://markdownenpdf.com" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);">
                      Commencer maintenant →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Support Section -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #0f172a; font-weight: 600;">
                      Une question ? Nous sommes là pour vous aider
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                      Contactez notre équipe : <a href="mailto:contact@stillinov.com" style="color: #6366f1; text-decoration: none; font-weight: 500;">contact@stillinov.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 12px; font-size: 13px; color: #64748b;">
                <a href="https://markdownenpdf.com" style="color: #6366f1; text-decoration: none; margin: 0 12px; font-weight: 500;">Accueil</a>
                <span style="color: #cbd5e1;">•</span>
                <a href="https://markdownenpdf.com/about.html" style="color: #6366f1; text-decoration: none; margin: 0 12px; font-weight: 500;">À propos</a>
                <span style="color: #cbd5e1;">•</span>
                <a href="https://markdownenpdf.com/contact.html" style="color: #6366f1; text-decoration: none; margin: 0 12px; font-weight: 500;">Contact</a>
              </p>
              <p style="margin: 12px 0 0; font-size: 12px; color: #94a3b8;">
                © 2025 MarkdownEnPDF.com • Tous droits réservés
              </p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #cbd5e1;">
                Cet email a été envoyé à ${email}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
