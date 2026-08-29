// src/lib/email.ts
// Brevo (ex Sendinblue) Email Service Implementation
// API Documentation: https://developers.brevo.com/docs

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Seconde Dressing <no-reply@brevo.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://seconde-dressing.fr";

// Main function to send email via Brevo API
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.error("[Brevo] API key is missing. Email not sent.");
    console.log(`[Email Log] To: ${to}, Subject: ${subject}`);
    return false;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: "Seconde Dressing",
          email: EMAIL_FROM,
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Brevo Error]:", errorData);
      return false;
    }

    const data = await response.json();
    console.log("[Brevo Success]:", data);
    return true;
  } catch (error) {
    console.error("[Brevo] Error sending email:", error);
    return false;
  }
}

// Base email template with styling
function getBaseTemplate(content: string, subject: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${subject}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc; 
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: 600; 
          }
          .content { 
            padding: 30px 20px; 
            color: #374151; 
            line-height: 1.6; 
          }
          .content h2 { 
            color: #111827; 
            margin-top: 0; 
            margin-bottom: 20px; 
          }
          .content p { 
            margin-bottom: 15px; 
          }
          .footer { 
            background: #f3f4f6; 
            padding: 20px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px; 
          }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #6366f1; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 500; 
            margin: 15px 0; 
          }
          .button:hover { 
            background: #5856eb; 
          }
          .highlight { 
            background-color: #f3f4f6; 
            padding: 12px; 
            border-radius: 6px; 
            margin: 15px 0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Seconde Dressing</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>© 2026 Seconde Dressing. Tous droits réservés.</p>
            <p>
              <a href="${SITE_URL}" style="color: #6366f1; text-decoration: none;">Visitez notre site</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Generic notification email
export async function sendNotificationEmail(
  to: string,
  subject: string,
  message: string
): Promise<boolean> {
  const html = getBaseTemplate(`
    <h2>${subject}</h2>
    ${message}
  `, subject);
  return sendEmail(to, subject, html);
}

// Rendez-vous confirmation for client
export async function sendRendezVousConfirmation(
  clientEmail: string,
  vendeuseNom: string,
  date: string,
  heure: string
): Promise<boolean> {
  const subject = "✅ Confirmation de votre rendez-vous";
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const content = `
    <h2>✅ Votre rendez-vous est confirmé</h2>
    <p>Bonjour,</p>
    <p>Votre rendez-vous avec <strong>${vendeuseNom}</strong> a été confirmé avec succès.</p>
    
    <div class="highlight">
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Heure:</strong> ${heure}</p>
    </div>
    
    <p>Merci de vous présenter à l'heure convenue avec vos vêtements à vendre.</p>
    <p>Nous vous attendons avec plaisir !</p>
    
    <p>Si vous avez des questions, n'hésitez pas à nous contacter via notre 
    <a href="${SITE_URL}/contact" class="button">page de contact</a>.</p>
  `;

  const html = getBaseTemplate(content, subject);
  return sendEmail(clientEmail, subject, html);
}

// New appointment request notification for vendeuse
export async function sendNouvelleDemandeNotification(
  vendeuseEmail: string,
  clientNom: string,
  date: string,
  heure: string
): Promise<boolean> {
  const subject = "📅 Nouvelle demande de rendez-vous";
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const content = `
    <h2>📅 Nouvelle demande reçue</h2>
    <p>Bonjour,</p>
    <p>Vous avez reçu une nouvelle demande de rendez-vous de la part de <strong>${clientNom}</strong>.</p>
    
    <div class="highlight">
      <p><strong>Date demandée:</strong> ${formattedDate}</p>
      <p><strong>Heure demandée:</strong> ${heure}</p>
    </div>
    
    <p>Connectez-vous à votre espace personnel pour accepter ou refuser cette demande :</p>
    <p><a href="${SITE_URL}/dashboard" class="button">Voir les demandes</a></p>
    
    <p>Ne répondez pas à cet email, utilisez plutôt la plateforme pour gérer vos rendez-vous.</p>
  `;

  const html = getBaseTemplate(content, subject);
  return sendEmail(vendeuseEmail, subject, html);
}

// Appointment cancellation notification
export async function sendRendezVousAnnulation(
  email: string,
  nom: string,
  date: string,
  heure: string
): Promise<boolean> {
  const subject = "❌ Annulation de rendez-vous";
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const content = `
    <h2>❌ Rendez-vous annulé</h2>
    <p>Bonjour ${nom},</p>
    <p>Votre rendez-vous prévu le <strong>${formattedDate} à ${heure}</strong> a été annulé.</p>
    
    <p>Cela peut être dû à un créneau déjà pris ou à un problème de disponibilité de la vendeuse.</p>
    
    <p>Vous pouvez prendre un nouveau rendez-vous quand vous le souhaitez :</p>
    <p><a href="${SITE_URL}/client/rdv" class="button">Prendre un nouveau rendez-vous</a></p>
    
    <p>Nous nous excusons pour la gêne occasionnée.</p>
  `;

  const html = getBaseTemplate(content, subject);
  return sendEmail(email, subject, html);
}

// Request accepted notification for client
export async function sendDemandeAccepteeNotification(
  clientEmail: string,
  vendeuseNom: string,
  date: string,
  heure: string
): Promise<boolean> {
  const subject = "✅ Votre demande de rendez-vous a été acceptée";
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const content = `
    <h2>✅ Demande acceptée</h2>
    <p>Bonjour,</p>
    <p>Votre demande de rendez-vous avec <strong>${vendeuseNom}</strong> a été acceptée.</p>
    
    <div class="highlight">
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Heure:</strong> ${heure}</p>
    </div>
    
    <p>Nous vous attendons avec plaisir ! N'oubliez pas d'apporter vos vêtements à vendre.</p>
    
    <p>Pour rappel, voici quelques conseils pour votre rendez-vous :</p>
    <ul>
      <li>Préparez vos vêtements à l'avance (propres et en bon état)</li>
      <li>Apportez une liste des articles que vous souhaitez vendre</li>
      <li>Soyez à l'heure pour ne pas perdre votre créneau</li>
    </ul>
    
    <p><a href="${SITE_URL}/client/rdv" class="button">Voir mes rendez-vous</a></p>
  `;

  const html = getBaseTemplate(content, subject);
  return sendEmail(clientEmail, subject, html);
}

// Request rejected notification for client
export async function sendDemandeRefuseeNotification(
  clientEmail: string,
  vendeuseNom: string,
  date: string,
  heure: string
): Promise<boolean> {
  const subject = "❌ Votre demande de rendez-vous a été refusée";
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const content = `
    <h2>❌ Demande refusée</h2>
    <p>Bonjour,</p>
    <p>Malheureusement, votre demande de rendez-vous avec <strong>${vendeuseNom}</strong> 
    pour le <strong>${formattedDate} à ${heure}</strong> a été refusée.</p>
    
    <p>Cela peut être dû à un créneau déjà pris ou à un problème de disponibilité.</p>
    
    <p>Nous vous invitons à essayer avec une autre vendeuse ou un autre créneau :</p>
    <p><a href="${SITE_URL}/client/rdv" class="button">Voir les disponibilités</a></p>
    
    <p>Vous pouvez également nous contacter directement via notre 
    <a href="${SITE_URL}/contact" class="button">page de contact</a>.</p>
    
    <p>Nous espérons pouvoir vous aider bientôt !</p>
  `;

  const html = getBaseTemplate(content, subject);
  return sendEmail(clientEmail, subject, html);
}

// Contact form submission notification
export async function sendContactNotification(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<boolean> {
  const adminEmail = "admin@seconde-dressing.fr"; // Remplacez par votre email admin
  const clientSubject = `✅ Nous avons reçu votre message - ${subject}`;
  const adminSubject = `📧 Nouveau message de contact: ${subject}`;
  
  // Email to client (confirmation)
  const clientContent = `
    <h2>✅ Message reçu</h2>
    <p>Bonjour ${name},</p>
    <p>Nous avons bien reçu votre message concernant : <strong>${subject}</strong>.</p>
    <p>Notre équipe vous répondra dans les plus brefs délais (généralement sous 24-48h).</p>
    <p>Merci de votre confiance !</p>
  `;
  
  // Email to admin
  const adminContent = `
    <h2>📧 Nouveau message de contact</h2>
    <p><strong>De:</strong> ${name} &lt;${email}&gt;</p>
    <p><strong>Sujet:</strong> ${subject}</p>
    <p><strong>Message:</strong></p>
    <div class="highlight">
      <p>${message}</p>
    </div>
    <p>Répondez directement à ${email} pour contacter ce client.</p>
  `;

  const clientHtml = getBaseTemplate(clientContent, clientSubject);
  const adminHtml = getBaseTemplate(adminContent, adminSubject);
  
  // Send to client
  const clientSent = await sendEmail(email, clientSubject, clientHtml);
  
  // Send to admin (only if different from client)
  const adminSent = email.toLowerCase() !== adminEmail.toLowerCase() 
    ? await sendEmail(adminEmail, adminSubject, adminHtml) 
    : true;
  
  return clientSent && adminSent;
}

// Welcome email for new users
export async function sendWelcomeEmail(
  email: string,
  name: string,
  role: "client" | "vendeuse"
): Promise<boolean> {
  const subject = "🎉 Bienvenue sur Seconde Dressing !";
  
  const roleSpecificContent = role === "client" 
    ? `
      <p>En tant que client, vous pouvez :</p>
      <ul>
        <li>Prendre des rendez-vous avec nos vendeuses professionnelles</li>
        <li>Vendre vos vêtements rapidement et facilement</li>
        <li>Suivre vos rendez-vous et vos ventes</li>
      </ul>
      <p><a href="${SITE_URL}/client/rdv" class="button">Prendre un rendez-vous</a></p>
    `
    : `
      <p>En tant que vendeuse professionnelle, vous pouvez :</p>
      <ul>
        <li>Recevoir des demandes de rendez-vous de clients</li>
        <li>Gérer votre agenda et vos disponibilités</li>
        <li>Suivre vos clients et vos ventes</li>
      </ul>
      <p><a href="${SITE_URL}/vendeuse/demandes" class="button">Voir les demandes</a></p>
    `;

  const content = `
    <h2>🎉 Bienvenue, ${name} !</h2>
    <p>Merci de vous être inscrit(e) sur <strong>Seconde Dressing</strong> !</p>
    
    <p>Nous sommes ravis de vous compter parmi nous.</p>
    
    ${roleSpecificContent}
    
    <p>Si vous avez des questions, n'hésitez pas à consulter notre 
    <a href="${SITE_URL}/about">page de concept</a> ou à nous contacter via 
    <a href="${SITE_URL}/contact">notre formulaire</a>.</p>
    
    <p>Bonne aventure avec Seconde Dressing !</p>
  `;

  const html = getBaseTemplate(content, subject);
  return sendEmail(email, subject, html);
}
