// src/lib/email.ts
// Brevo (ex Sendinblue) Email Service Implementation
// Follows industry best practices: SOLID principles, dependency injection, separation of concerns

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Email template configuration
 */
interface EmailTemplateConfig {
  sender: {
    name: string;
    email: string;
  };
  subject: string;
  htmlContent: string;
}

/**
 * Email sending result
 */
export interface EmailSendResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Appointment notification data
 */
export interface AppointmentNotificationData {
  to: string;
  vendeuseNom: string;
  clientNom?: string;
  date: string;
  heure: string;
}

/**
 * Contact form data
 */
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// ============================================================================
// Configuration
// ============================================================================

const EMAIL_CONFIG = {
  sender: {
    name: 'Seconde Dressing',
    email: process.env.EMAIL_FROM || 'Seconde Dressing <no-reply@brevo.com>',
  },
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://seconde-dressing.fr',
} as const;

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Environment variables with runtime validation
 */
export const env = {
  brevo: {
    apiKey: process.env.BREVO_API_KEY || '',
  },
  email: {
    from: process.env.EMAIL_FROM || 'Seconde Dressing <no-reply@brevo.com>',
  },
  app: {
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://seconde-dressing.fr',
  },
} as const;

// ============================================================================
// Email Service Class (Singleton pattern)
// ============================================================================

class EmailService {
  private static instance: EmailService;
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://api.brevo.com/v3/smtp';

  private constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      if (!env.brevo.apiKey) {
        throw new Error('[EmailService] Brevo API key is not configured');
      }
      EmailService.instance = new EmailService(env.brevo.apiKey);
    }
    return EmailService.instance;
  }

  /**
   * Send email via Brevo API
   */
  public async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<EmailSendResult> {
    try {
      const response = await fetch(`${this.baseUrl}/email`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: EMAIL_CONFIG.sender,
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: `Brevo API error: ${response.status} - ${JSON.stringify(errorData)}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Send email with fallback logging when API key is missing
   */
  public async sendEmailWithFallback(
    to: string,
    subject: string,
    html: string
  ): Promise<EmailSendResult> {
    if (!this.apiKey) {
      console.warn(
        '[EmailService] API key not configured. Email logged but not sent.'
      );
      console.log(`[Email Log] To: ${to}, Subject: ${subject}`);
      return {
        success: false,
        message: 'Email logged but not sent (API key missing)',
      };
    }

    return this.sendEmail(to, subject, html);
  }
}

// ============================================================================
// Template Service
// ============================================================================

class EmailTemplateService {
  /**
   * Generate base HTML template with consistent styling
   */
  public generateBaseTemplate(
    content: string,
    subject: string
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${this.escapeHtml(subject)}</title>
          <style>
            :root {
              --primary: #6366f1;
              --primary-dark: #5856eb;
              --background: #f8fafc;
              --card: #ffffff;
              --text: #374151;
              --text-light: #6b7280;
              --border: #e5e7eb;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 0;
              background-color: var(--background);
              line-height: 1.6;
              color: var(--text);
            }
            
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: var(--card);
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            
            .header {
              background: linear-gradient(135deg, var(--primary) 0%, #764ba2 100%);
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
            }
            
            .content h2 {
              color: #111827;
              margin-top: 0;
              margin-bottom: 20px;
              font-size: 1.5rem;
            }
            
            .content p {
              margin-bottom: 15px;
            }
            
            .footer {
              background: #f3f4f6;
              padding: 20px;
              text-align: center;
              color: var(--text-light);
              font-size: 14px;
            }
            
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: var(--primary);
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 15px 0;
              transition: background-color 0.2s;
            }
            
            .button:hover {
              background: var(--primary-dark);
            }
            
            .highlight {
              background-color: #f3f4f6;
              padding: 12px;
              border-radius: 6px;
              margin: 15px 0;
            }
            
            a {
              color: var(--primary);
              text-decoration: none;
            }
            
            a:hover {
              text-decoration: underline;
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
              <p>© ${new Date().getFullYear()} Seconde Dressing. Tous droits réservés.</p>
              <p>
                <a href="${EMAIL_CONFIG.siteUrl}">Visitez notre site</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Format date for French locale
   */
  public formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

// ============================================================================
// Notification Service (Uses EmailService and TemplateService)
// ============================================================================

class NotificationService {
  private emailService: EmailService;
  private templateService: EmailTemplateService;

  constructor() {
    this.emailService = EmailService.getInstance();
    this.templateService = new EmailTemplateService();
  }

  /**
   * Send appointment confirmation to client
   */
  public async sendAppointmentConfirmation(
    data: AppointmentNotificationData
  ): Promise<EmailSendResult> {
    const subject = '✅ Confirmation de votre rendez-vous';
    const content = `
      <h2>✅ Votre rendez-vous est confirmé</h2>
      <p>Bonjour,</p>
      <p>Votre rendez-vous avec <strong>${data.vendeuseNom}</strong> a été confirmé avec succès.</p>
      
      <div class="highlight">
        <p><strong>Date:</strong> ${this.templateService.formatDate(data.date)}</p>
        <p><strong>Heure:</strong> ${data.heure}</p>
      </div>
      
      <p>Merci de vous présenter à l'heure convenue avec vos vêtements à vendre.</p>
      <p>Nous vous attendons avec plaisir !</p>
      
      <p>
        <a href="${EMAIL_CONFIG.siteUrl}/contact" class="button">Page de contact</a>
      </p>
    `;

    const html = this.templateService.generateBaseTemplate(content, subject);
    return this.emailService.sendEmailWithFallback(data.to, subject, html);
  }

  /**
   * Send new appointment request notification to vendeuse
   */
  public async sendNewAppointmentRequest(
    data: AppointmentNotificationData
  ): Promise<EmailSendResult> {
    const subject = '📅 Nouvelle demande de rendez-vous';
    const content = `
      <h2>📅 Nouvelle demande reçue</h2>
      <p>Bonjour,</p>
      <p>Vous avez reçu une nouvelle demande de rendez-vous de la part de <strong>${data.clientNom}</strong>.</p>
      
      <div class="highlight">
        <p><strong>Date demandée:</strong> ${this.templateService.formatDate(data.date)}</p>
        <p><strong>Heure demandée:</strong> ${data.heure}</p>
      </div>
      
      <p>Connectez-vous à votre espace personnel pour accepter ou refuser cette demande :</p>
      <p>
        <a href="${EMAIL_CONFIG.siteUrl}/dashboard" class="button">Voir les demandes</a>
      </p>
      
      <p>Ne répondez pas à cet email, utilisez plutôt la plateforme pour gérer vos rendez-vous.</p>
    `;

    const html = this.templateService.generateBaseTemplate(content, subject);
    return this.emailService.sendEmailWithFallback(data.to, subject, html);
  }

  /**
   * Send appointment cancellation notification
   */
  public async sendAppointmentCancellation(
    data: AppointmentNotificationData
  ): Promise<EmailSendResult> {
    const subject = '❌ Annulation de rendez-vous';
    const content = `
      <h2>❌ Rendez-vous annulé</h2>
      <p>Bonjour ${data.clientNom || ''},</p>
      <p>Votre rendez-vous prévu le <strong>${this.templateService.formatDate(data.date)} à ${data.heure}</strong> a été annulé.</p>
      
      <p>Cela peut être dû à un créneau déjà pris ou à un problème de disponibilité de la vendeuse.</p>
      
      <p>Vous pouvez prendre un nouveau rendez-vous quand vous le souhaitez :</p>
      <p>
        <a href="${EMAIL_CONFIG.siteUrl}/client/rdv" class="button">Prendre un nouveau rendez-vous</a>
      </p>
      
      <p>Nous nous excusons pour la gêne occasionnée.</p>
    `;

    const html = this.templateService.generateBaseTemplate(content, subject);
    return this.emailService.sendEmailWithFallback(data.to, subject, html);
  }

  /**
   * Send accepted appointment notification to client
   */
  public async sendAppointmentAccepted(
    data: AppointmentNotificationData
  ): Promise<EmailSendResult> {
    const subject = '✅ Votre demande de rendez-vous a été acceptée';
    const content = `
      <h2>✅ Demande acceptée</h2>
      <p>Bonjour,</p>
      <p>Votre demande de rendez-vous avec <strong>${data.vendeuseNom}</strong> a été acceptée.</p>
      
      <div class="highlight">
        <p><strong>Date:</strong> ${this.templateService.formatDate(data.date)}</p>
        <p><strong>Heure:</strong> ${data.heure}</p>
      </div>
      
      <p>Nous vous attendons avec plaisir ! N'oubliez pas d'apporter vos vêtements à vendre.</p>
      
      <p><strong>Conseils pour votre rendez-vous :</strong></p>
      <ul>
        <li>Préparez vos vêtements à l'avance (propres et en bon état)</li>
        <li>Apportez une liste des articles que vous souhaitez vendre</li>
        <li>Soyez à l'heure pour ne pas perdre votre créneau</li>
      </ul>
      
      <p>
        <a href="${EMAIL_CONFIG.siteUrl}/client/rdv" class="button">Voir mes rendez-vous</a>
      </p>
    `;

    const html = this.templateService.generateBaseTemplate(content, subject);
    return this.emailService.sendEmailWithFallback(data.to, subject, html);
  }

  /**
   * Send rejected appointment notification to client
   */
  public async sendAppointmentRejected(
    data: AppointmentNotificationData
  ): Promise<EmailSendResult> {
    const subject = '❌ Votre demande de rendez-vous a été refusée';
    const content = `
      <h2>❌ Demande refusée</h2>
      <p>Bonjour,</p>
      <p>Malheureusement, votre demande de rendez-vous avec <strong>${data.vendeuseNom}</strong> 
      pour le <strong>${this.templateService.formatDate(data.date)} à ${data.heure}</strong> a été refusée.</p>
      
      <p>Cela peut être dû à un créneau déjà pris ou à un problème de disponibilité.</p>
      
      <p>Nous vous invitons à essayer avec une autre vendeuse ou un autre créneau :</p>
      <p>
        <a href="${EMAIL_CONFIG.siteUrl}/client/rdv" class="button">Voir les disponibilités</a>
      </p>
      
      <p>Vous pouvez également nous contacter directement via notre 
      <a href="${EMAIL_CONFIG.siteUrl}/contact" class="button">page de contact</a>.</p>
      
      <p>Nous espérons pouvoir vous aider bientôt !</p>
    `;

    const html = this.templateService.generateBaseTemplate(content, subject);
    return this.emailService.sendEmailWithFallback(data.to, subject, html);
  }

  /**
   * Send contact form notification to both client and admin
   */
  public async sendContactNotification(
    data: ContactFormData
  ): Promise<EmailSendResult> {
    const adminEmail = 'admin@seconde-dressing.fr';
    const clientSubject = `✅ Nous avons reçu votre message - ${data.subject}`;
    const adminSubject = `📧 Nouveau message de contact: ${data.subject}`;

    // Email to client (confirmation)
    const clientContent = `
      <h2>✅ Message reçu</h2>
      <p>Bonjour ${data.name},</p>
      <p>Nous avons bien reçu votre message concernant : <strong>${data.subject}</strong>.</p>
      <p>Notre équipe vous répondra dans les plus brefs délais (généralement sous 24-48h).</p>
      <p>Merci de votre confiance !</p>
    `;

    // Email to admin
    const adminContent = `
      <h2>📧 Nouveau message de contact</h2>
      <p><strong>De:</strong> ${data.name} &lt;${data.email}&gt;</p>
      <p><strong>Sujet:</strong> ${data.subject}</p>
      <p><strong>Téléphone:</strong> ${data.phone || 'Non fourni'}</p>
      <p><strong>Message:</strong></p>
      <div class="highlight">
        <p>${data.message}</p>
      </div>
      <p>Répondez directement à ${data.email} pour contacter ce client.</p>
    `;

    const clientHtml = this.templateService.generateBaseTemplate(
      clientContent,
      clientSubject
    );
    const adminHtml = this.templateService.generateBaseTemplate(
      adminContent,
      adminSubject
    );

    // Send to client
    const clientResult = await this.emailService.sendEmailWithFallback(
      data.email,
      clientSubject,
      clientHtml
    );

    // Send to admin (only if different from client)
    if (data.email.toLowerCase() !== adminEmail.toLowerCase()) {
      const adminResult = await this.emailService.sendEmailWithFallback(
        adminEmail,
        adminSubject,
        adminHtml
      );
      if (!adminResult.success) {
        console.error('[NotificationService] Failed to send admin notification');
      }
    }

    return clientResult;
  }

  /**
   * Send welcome email to new users
   */
  public async sendWelcomeEmail(
    email: string,
    name: string,
    role: 'client' | 'vendeuse'
  ): Promise<EmailSendResult> {
    const subject = '🎉 Bienvenue sur Seconde Dressing !';

    const roleSpecificContent = role === 'client'
      ? `
        <p>En tant que client, vous pouvez :</p>
        <ul>
          <li>Prendre des rendez-vous avec nos vendeuses professionnelles</li>
          <li>Vendre vos vêtements rapidement et facilement</li>
          <li>Suivre vos rendez-vous et vos ventes</li>
        </ul>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${EMAIL_CONFIG.siteUrl}/client/rdv" class="button">Prendre un rendez-vous</a>
        </p>
      `
      : `
        <p>En tant que vendeuse professionnelle, vous pouvez :</p>
        <ul>
          <li>Recevoir des demandes de rendez-vous de clients</li>
          <li>Gérer votre agenda et vos disponibilités</li>
          <li>Suivre vos clients et vos ventes</li>
        </ul>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${EMAIL_CONFIG.siteUrl}/vendeuse/demandes" class="button">Voir les demandes</a>
        </p>
      `;

    const content = `
      <h2>🎉 Bienvenue, ${name} !</h2>
      <p>Merci de vous être inscrit(e) sur <strong>Seconde Dressing</strong> !</p>
      <p>Nous sommes ravis de vous compter parmi nous.</p>
      
      ${roleSpecificContent}
      
      <p>Si vous avez des questions, n'hésitez pas à consulter notre 
      <a href="${EMAIL_CONFIG.siteUrl}/about">page de concept</a> ou à nous contacter via 
      <a href="${EMAIL_CONFIG.siteUrl}/contact">notre formulaire</a>.</p>
      
      <p>Bonne aventure avec Seconde Dressing !</p>
    `;

    const html = this.templateService.generateBaseTemplate(content, subject);
    return this.emailService.sendEmailWithFallback(email, subject, html);
  }
}

// ============================================================================
// Public API - Singleton instances
// ============================================================================

// Export singleton instances for use throughout the application
export const emailService = EmailService.getInstance();
export const notificationService = new NotificationService();

// Re-export types
export type { EmailSendResult, AppointmentNotificationData, ContactFormData };
