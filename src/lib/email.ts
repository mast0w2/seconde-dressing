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
  sellerName: string;
  clientName?: string;
  date: string;
  time: string;
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

/**
 * Estimation form data
 */
export interface EstimationFormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  nombreVetements: number;
  valeurMoyenne: number;
  marques: string;
  description?: string;
  estimation: number;
  formule?: string;
  adresse?: string;
}

const FORMULA_LABELS: Record<string, string> = {
  'deja-trie': 'Déjà trié',
  'tri-sur-place': 'Tri sur place',
  'tri-et-conseil': 'Tri & conseil',
};

const FORMULA_CLIENT_ACTIONS: Record<string, string[]> = {
  'deja-trie': [
    'Vos vêtements sont déjà triés et placés dans des sacs.',
    'Connectez-vous sur le site et remplissez l’inventaire de vos pièces avant le rendez-vous.',
    'Lorsque la vendeuse arrive, transmettez-lui les sacs : c’est tout, on s’occupe du reste.',
  ],
  'tri-sur-place': [
    'Mettez de côté ce dont vous ne voulez plus.',
    'Pas besoin de trier vous-même : on passe 30 min à 1 h chez vous pour repérer les pièces qui se revendront.',
    'Préparez un espace dégagé pour le tri.',
  ],
  'tri-et-conseil': [
    'Mettez de côté les vêtements que vous voulez vendre.',
    'Prévoyez 1 h à 1 h 30 : on trie avec vous et on vous conseille.',
    'Pensez aussi aux pièces dont vous hésitez : on vous dira ce qui vaut le coup d’être vendu.',
  ],
};

// ============================================================================
// Configuration
// ============================================================================

function parseSenderEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return match ? match[1].trim() : raw.trim();
}

const EMAIL_FROM = parseSenderEmail(process.env.EMAIL_FROM || 'support@seconde-dressing.com');

console.warn('[EmailService] sender email resolved to:', EMAIL_FROM, '(raw EMAIL_FROM:', process.env.EMAIL_FROM || '<unset, using fallback>', ')');

const EMAIL_CONFIG = {
  sender: {
    name: 'Seconde',
    email: EMAIL_FROM,
  },
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://seconde.fr',
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
    from: EMAIL_FROM,
    admin: process.env.CONTACT_ADMIN_EMAILS ? process.env.CONTACT_ADMIN_EMAILS.split(',').map(e => e.trim()).filter(e => e) : [],
  },
  app: {
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://seconde.fr',
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
        // Return a mock instance when API key is not configured
        return new EmailService('');
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
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
        const detail = `Brevo API error: ${response.status} - ${JSON.stringify(errorData)}`;
        console.error('[EmailService] sendEmail failed:', detail);
        return {
          success: false,
          error: detail,
        };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[EmailService] sendEmail threw:', message);
      return {
        success: false,
        error: message,
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
              <h1>Seconde</h1>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Seconde. Tous droits réservés.</p>
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
    const subject = '\u2705 Confirmation de votre rendez-vous';
    const content = `
      <h2>\u2705 Votre rendez-vous est confirmé</h2>
      <p>Bonjour,</p>
      <p>Votre rendez-vous avec <strong>${data.sellerName}</strong> a été confirmé avec succès.</p>
      
      <div class="highlight">
        <p><strong>Date:</strong> ${this.templateService.formatDate(data.date)}</p>
        <p><strong>Heure:</strong> ${data.time}</p>
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
    const subject = '\ud83d\udcc5 Nouvelle demande de rendez-vous';
    const content = `
      <h2>\ud83d\udcc5 Nouvelle demande reçue</h2>
      <p>Bonjour,</p>
      <p>Vous avez reçu une nouvelle demande de rendez-vous de la part de <strong>${data.clientName}</strong>.</p>
      
      <div class="highlight">
        <p><strong>Date demandée:</strong> ${this.templateService.formatDate(data.date)}</p>
        <p><strong>Heure demandée:</strong> ${data.time}</p>
      </div>
      
      <p>Connectez-vous à votre espace personnel pour accepter ou refuser cette demande :</p>
      <p>
        <a href="${EMAIL_CONFIG.siteUrl}/dashboard/vendeur" class="button">Voir les demandes</a>
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
    const subject = '\u274c Annulation de rendez-vous';
    const content = `
      <h2>\u274c Rendez-vous annulé</h2>
      <p>Bonjour ${data.clientName || ''},</p>
      <p>Votre rendez-vous prévu le <strong>${this.templateService.formatDate(data.date)} à ${data.time}</strong> a été annulé.</p>
      
      <p>Cela peut être dû à un créneau déjà pris ou à un problème de disponibilité de la vendeuse.</p>
      
      <p>Vous pouvez prendre un nouveau rendez-vous quand vous le souhaitez :</p>
      <p>
        <a href="${EMAIL_CONFIG.siteUrl}/demande-rdv" class="button">Prendre un nouveau rendez-vous</a>
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
    const subject = '\u2705 Votre demande de rendez-vous a été acceptée';
    const content = `
      <h2>\u2705 Demande acceptée</h2>
      <p>Bonjour,</p>
      <p>Votre demande de rendez-vous avec <strong>${data.sellerName}</strong> a été acceptée.</p>
      
      <div class="highlight">
        <p><strong>Date:</strong> ${this.templateService.formatDate(data.date)}</p>
        <p><strong>Heure:</strong> ${data.time}</p>
      </div>
      
      <p>Nous vous attendons avec plaisir ! N'oubliez pas d'apporter vos vêtements à vendre.</p>
      
      <p><strong>Conseils pour votre rendez-vous :</strong></p>
      <ul>
        <li>Préparez vos vêtements à l'avance (propres et en bon état)</li>
        <li>Apportez une liste des articles que vous souhaitez vendre</li>
        <li>Soyez à l'heure pour ne pas perdre votre créneau</li>
      </ul>
      
      <p>
        <a href="${EMAIL_CONFIG.siteUrl}/dashboard/client" class="button">Voir mes rendez-vous</a>
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
    const subject = '\u274c Votre demande de rendez-vous a été refusée';
    const content = `
      <h2>\u274c Demande refusée</h2>
      <p>Bonjour,</p>
      <p>Malheureusement, votre demande de rendez-vous avec <strong>${data.sellerName}</strong> 
      pour le <strong>${this.templateService.formatDate(data.date)} à ${data.time}</strong> a été refusée.</p>
      
      <p>Cela peut être dû à un créneau déjà pris ou à un problème de disponibilité.</p>
      
      <p>Nous vous invitons à essayer avec une autre vendeuse ou un autre créneau :</p>
      <p>
        <a href="${EMAIL_CONFIG.siteUrl}/demande-rdv" class="button">Voir les disponibilités</a>
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
    const adminEmails = env.email.admin;
    const clientSubject = `\u2705 Nous avons reçu votre message - ${data.subject}`;
    const adminSubject = `\ud83d\udce7 Nouveau message de contact: ${data.subject}`;

    // Email to client (confirmation)
    const clientContent = `
      <h2>\u2705 Message reçu</h2>
      <p>Bonjour ${data.name},</p>
      <p>Nous avons bien reçu votre message concernant : <strong>${data.subject}</strong>.</p>
      <p>Notre équipe vous répondra dans les plus brefs délais (généralement sous 24-48h).</p>
      <p>Merci de votre confiance !</p>
    `;

    // Email to admin
    const adminContent = `
      <h2>\ud83d\udce7 Nouveau message de contact</h2>
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

    // Send to all admin emails (only if configured and different from client)
    for (const adminEmail of adminEmails) {
      if (adminEmail && data.email.toLowerCase() !== adminEmail.toLowerCase()) {
        const adminResult = await this.emailService.sendEmailWithFallback(
          adminEmail,
          adminSubject,
          adminHtml
        );
        if (!adminResult.success) {
          console.error('[NotificationService] Failed to send admin notification to:', adminEmail);
        }
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
    role: 'client' | 'seller'
  ): Promise<EmailSendResult> {
    const subject = '\ud83c\udf89 Bienvenue sur Seconde !';

    const roleSpecificContent = role === 'client'
      ? `
        <p>En tant que client, vous pouvez :</p>
        <ul>
          <li>Prendre des rendez-vous avec nos vendeuses professionnelles</li>
          <li>Vendre vos vêtements rapidement et facilement</li>
          <li>Suivre vos rendez-vous et vos ventes</li>
        </ul>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${EMAIL_CONFIG.siteUrl}/demande-rdv" class="button">Prendre un rendez-vous</a>
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
          <a href="${EMAIL_CONFIG.siteUrl}/dashboard/vendeur" class="button">Voir les demandes</a>
        </p>
      `;

    const content = `
      <h2>\ud83c\udf89 Bienvenue, ${name} !</h2>
      <p>Merci de vous être inscrit(e) sur <strong>Seconde</strong> !</p>
      <p>Nous sommes ravis de vous compter parmi nous.</p>
      
      ${roleSpecificContent}
      
      <p>Si vous avez des questions, n'hésitez pas à consulter notre 
      <a href="${EMAIL_CONFIG.siteUrl}/concept">page de concept</a> ou à nous contacter via 
      <a href="${EMAIL_CONFIG.siteUrl}/contact">notre formulaire</a>.</p>
      
      <p>Bonne aventure avec Seconde !</p>
    `;

    const html = this.templateService.generateBaseTemplate(content, subject);
    return this.emailService.sendEmailWithFallback(email, subject, html);
  }

  /**
   * Send estimation form notification to admin with all details
   */
  public async sendEstimationNotification(
    data: EstimationFormData
  ): Promise<EmailSendResult> {
    const adminEmails = env.email.admin;
    const clientSubject = '\u2705 Demande d\'estimation reçue';
    const adminSubject = `\ud83d\udce7 Nouvelle demande d\'estimation - ${data.prenom} ${data.nom}`;

    const formulaSlug = data.formule || '';
    const formulaLabel = FORMULA_LABELS[formulaSlug] || 'Non renseignée';
    const clientActions = FORMULA_CLIENT_ACTIONS[formulaSlug] || [];
    const actionsHtml = clientActions.length
      ? `<p><strong>Formule choisie :</strong> ${formulaLabel}</p>
         <p><strong>À faire de votre côté avant le rendez-vous :</strong></p>
         <ul>${clientActions.map((action) => `<li>${action}</li>`).join('')}</ul>`
      : '';

    // Email to client (confirmation)
    const clientContent = `
      <h2>\u2705 Demande reçue</h2>
      <p>Bonjour ${data.prenom} ${data.nom},</p>
      <p>Nous avons bien reçu votre demande d'estimation.</p>
      <p>Notre équipe vous recontactera sous 24h pour définir votre rendez-vous.</p>
      
      ${actionsHtml}
      
      <p>Merci de votre confiance !</p>
    `;

    // Email to admin with ALL details
    const adminContent = `
      <h2>\ud83d\udce7 Nouvelle demande d'estimation</h2>
      
      <h3>Informations du client:</h3>
      <p><strong>Nom:</strong> ${data.nom}</p>
      <p><strong>Prénom:</strong> ${data.prenom}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Téléphone:</strong> ${data.telephone}</p>
      <p><strong>Adresse:</strong> ${data.adresse || 'Non renseignée'}</p>
      <p><strong>Formule choisie:</strong> ${formulaLabel}</p>
      
      <h3>Détails de l'estimation:</h3>
      <p><strong>Nombre de vêtements:</strong> ${data.nombreVetements}</p>
      <p><strong>Valeur moyenne par vêtement:</strong> ${data.valeurMoyenne}€</p>
      <p><strong>Marques:</strong> ${data.marques}</p>
      <p><strong>Part cliente estimée (40% du prix de vente):</strong> ${data.estimation.toFixed(0)}€</p>
      
      <h3>Description supplémentaire:</h3>
      <div class="highlight">
        <p>${data.description || 'Aucune description supplémentaire'}</p>
      </div>
      
      <p><strong>Date de la demande:</strong> ${new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>
      
      <p>Contactez rapidement ce client pour organiser un rendez-vous.</p>
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

    // Send to all admin emails (only if configured and different from client)
    for (const adminEmail of adminEmails) {
      if (adminEmail && data.email.toLowerCase() !== adminEmail.toLowerCase()) {
        const adminResult = await this.emailService.sendEmailWithFallback(
          adminEmail,
          adminSubject,
          adminHtml
        );
        if (!adminResult.success) {
          console.error('[NotificationService] Failed to send admin estimation notification to:', adminEmail);
        }
      }
    }

    return clientResult;
  }
}

// ============================================================================
// Public API - Singleton instances
// ============================================================================

// Export singleton instances for use throughout the application
export const emailService = EmailService.getInstance();
export const notificationService = new NotificationService();
