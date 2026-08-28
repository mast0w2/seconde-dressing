import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: `"Seconde Dressing" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  message: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0284c7; color: white; padding: 20px; text-align: center;">
        <h1>Seconde Dressing</h1>
      </div>
      <div style="padding: 20px; background-color: #f8fafc;">
        <h2 style="color: #0c4a6e;">${subject}</h2>
        <p style="color: #1e293b; line-height: 1.6;">${message}</p>
      </div>
      <div style="background-color: #e2e8f0; padding: 10px; text-align: center; color: #64748b;">
        <p>© 2026 Seconde Dressing. Tous droits réservés.</p>
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
}

export async function sendRendezVousConfirmation(
  clientEmail: string,
  vendeuseNom: string,
  date: string,
  heure: string
) {
  const subject = "Confirmation de votre rendez-vous";
  const message = `
    <p>Bonjour,</p>
    <p>Votre rendez-vous avec <strong>${vendeuseNom}</strong> a été confirmé.</p>
    <p><strong>Date:</strong> ${new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p><strong>Heure:</strong> ${heure}</p>
    <p>Merci de vous présenter à l'heure convenue.</p>
  `;

  return sendNotificationEmail(clientEmail, subject, message);
}

export async function sendNouvelleDemandeNotification(
  vendeuseEmail: string,
  clientNom: string,
  date: string,
  heure: string
) {
  const subject = "Nouvelle demande de rendez-vous";
  const message = `
    <p>Bonjour,</p>
    <p>Vous avez reçu une nouvelle demande de rendez-vous de <strong>${clientNom}</strong>.</p>
    <p><strong>Date:</strong> ${new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p><strong>Heure:</strong> ${heure}</p>
    <p>Connectez-vous à votre espace pour accepter ou refuser cette demande.</p>
  `;

  return sendNotificationEmail(vendeuseEmail, subject, message);
}

export async function sendRendezVousAnnulation(
  email: string,
  nom: string,
  date: string,
  heure: string
) {
  const subject = "Annulation de rendez-vous";
  const message = `
    <p>Bonjour ${nom},</p>
    <p>Votre rendez-vous prévu le <strong>${new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à ${heure}</strong> a été annulé.</p>
    <p>Vous pouvez prendre un nouveau rendez-vous quand vous le souhaitez.</p>
  `;

  return sendNotificationEmail(email, subject, message);
}

export async function sendDemandeAccepteeNotification(
  clientEmail: string,
  vendeuseNom: string,
  date: string,
  heure: string
) {
  const subject = "Votre demande de rendez-vous a été acceptée";
  const message = `
    <p>Bonjour,</p>
    <p>Votre demande de rendez-vous avec <strong>${vendeuseNom}</strong> a été acceptée.</p>
    <p><strong>Date:</strong> ${new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p><strong>Heure:</strong> ${heure}</p>
    <p>Nous vous attendons avec plaisir !</p>
  `;

  return sendNotificationEmail(clientEmail, subject, message);
}

export async function sendDemandeRefuseeNotification(
  clientEmail: string,
  vendeuseNom: string,
  date: string,
  heure: string
) {
  const subject = "Votre demande de rendez-vous a été refusée";
  const message = `
    <p>Bonjour,</p>
    <p>Malheureusement, votre demande de rendez-vous avec <strong>${vendeuseNom}</strong> pour le <strong>${new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à ${heure}</strong> a été refusée.</p>
    <p>Nous vous invitons à essayer avec une autre vendeuse ou un autre créneau.</p>
  `;

  return sendNotificationEmail(clientEmail, subject, message);
}
