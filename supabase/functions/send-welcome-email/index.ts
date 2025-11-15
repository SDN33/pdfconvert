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
  <title>Bienvenue Premium</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f9ff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">🎉 Bienvenue Premium !</h1>
              <p style="margin: 10px 0 0; color: #e0f2fe; font-size: 16px;">Votre compte est maintenant actif</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #1e293b; line-height: 1.6;">
                Bonjour${userName ? ' ' + userName : ''} 👋
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; color: #1e293b; line-height: 1.6;">
                Merci d'avoir rejoint <strong>MarkdownEnPDF Premium</strong> ! Votre compte est maintenant activé et vous avez accès à toutes les fonctionnalités premium.
              </p>
              
              <div style="background: #f0fdfa; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 15px; color: #047857; font-size: 18px;">✨ Vos avantages Premium :</h3>
                <ul style="margin: 0; padding-left: 20px; color: #065f46; font-weight: 500;">
                  <li style="margin-bottom: 10px;"><strong>Conversions illimitées</strong> à vie 🚀</li>
                  <li style="margin-bottom: 10px;"><strong>Pas d'abonnement mensuel</strong> - Paiement unique ✅</li>
                  <li style="margin-bottom: 10px;"><strong>Accès prioritaire</strong> aux nouvelles fonctionnalités 🎯</li>
                  <li style="margin-bottom: 10px;"><strong>Support client prioritaire</strong> 💬</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://markdownenpdf.com" style="display: inline-block; background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  Commencer à convertir 🎉
                </a>
              </div>
              
              <p style="margin: 20px 0; font-size: 16px; color: #1e293b; line-height: 1.6;">
                <strong>Besoin d'aide ?</strong><br>
                Notre équipe est là pour vous : <a href="mailto:contact@stillinov.com" style="color: #0891b2; text-decoration: none;">contact@stillinov.com</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #64748b;">
                <a href="https://markdownenpdf.com" style="color: #0891b2; text-decoration: none; margin: 0 10px;">Accueil</a> |
                <a href="https://markdownenpdf.com/about.html" style="color: #0891b2; text-decoration: none; margin: 0 10px;">À propos</a> |
                <a href="https://markdownenpdf.com/contact.html" style="color: #0891b2; text-decoration: none; margin: 0 10px;">Contact</a>
              </p>
              <p style="margin: 10px 0 0; font-size: 12px; color: #94a3b8;">
                © 2025 MarkdownEnPDF.com - Tous droits réservés
              </p>
              <p style="margin: 10px 0 0; font-size: 11px; color: #cbd5e1;">
                Email envoyé à ${email}
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
  <title>Bienvenue</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f9ff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">👋 Bienvenue !</h1>
              <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 16px;">Votre compte est créé</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #1e293b; line-height: 1.6;">
                Bonjour${userName ? ' ' + userName : ''} 👋
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; color: #1e293b; line-height: 1.6;">
                Bienvenue sur <strong>MarkdownEnPDF</strong> ! Vous pouvez maintenant convertir vos fichiers Markdown en PDF professionnels en quelques clics.
              </p>
              
              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 15px; color: #1e40af; font-size: 18px;">🎁 Compte gratuit créé !</h3>
                <p style="margin: 0 0 12px; color: #1e40af; font-size: 15px; line-height: 1.6; font-weight: 500;">
                  Vous disposez de <strong>2 conversions gratuites par jour</strong>. Profitez-en dès maintenant !
                </p>
              </div>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 15px; color: #92400e; font-size: 18px;">🚀 Passez à Premium pour 2,99€</h3>
                <p style="margin: 0 0 12px; color: #78350f; font-size: 15px; line-height: 1.6; font-weight: 500;">
                  Débloquez les <strong>conversions illimitées à vie</strong> avec un paiement unique de 2,99€ (sans abonnement).
                </p>
                <ul style="margin: 10px 0 0; padding-left: 20px; color: #78350f; font-weight: 500;">
                  <li style="margin-bottom: 8px;">✅ Conversions illimitées à vie</li>
                  <li style="margin-bottom: 8px;">✅ Aucun abonnement mensuel</li>
                  <li style="margin-bottom: 8px;">✅ Paiement unique de 2,99€</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://markdownenpdf.com" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  Commencer maintenant 🎉
                </a>
              </div>
              
              <p style="margin: 20px 0; font-size: 16px; color: #1e293b; line-height: 1.6;">
                <strong>Besoin d'aide ?</strong><br>
                Contactez-nous : <a href="mailto:contact@stillinov.com" style="color: #6366f1; text-decoration: none;">contact@stillinov.com</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #64748b;">
                <a href="https://markdownenpdf.com" style="color: #6366f1; text-decoration: none; margin: 0 10px;">Accueil</a> |
                <a href="https://markdownenpdf.com/about.html" style="color: #6366f1; text-decoration: none; margin: 0 10px;">À propos</a> |
                <a href="https://markdownenpdf.com/contact.html" style="color: #6366f1; text-decoration: none; margin: 0 10px;">Contact</a>
              </p>
              <p style="margin: 10px 0 0; font-size: 12px; color: #94a3b8;">
                © 2025 MarkdownEnPDF.com - Tous droits réservés
              </p>
              <p style="margin: 10px 0 0; font-size: 11px; color: #cbd5e1;">
                Email envoyé à ${email}
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
