// Email service stub - nodemailer is not compatible with Next.js client-side
// In production, you would need to:
// 1. Move this to a separate server/service
// 2. Use Next.js API routes with proper server-side configuration
// 3. Configure nodemailer in a Node.js environment

// For now, we'll use empty stubs to allow the build to pass

export async function sendEmail(to: string, subject: string, html: string) {
  console.log(`[Email Stub] To: ${to}, Subject: ${subject}`);
  return true;
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  message: string
) {
  console.log(`[Notification Stub] To: ${to}, Subject: ${subject}, Message: ${message.substring(0, 50)}...`);
  return true;
}

export async function sendRendezVousConfirmation(
  clientEmail: string,
  vendeuseNom: string,
  date: string,
  heure: string
) {
  console.log(`[RendezVous Confirmation Stub] Client: ${clientEmail}, Vendeuse: ${vendeuseNom}, Date: ${date}, Heure: ${heure}`);
  return true;
}

export async function sendNouvelleDemandeNotification(
  vendeuseEmail: string,
  clientNom: string,
  date: string,
  heure: string
) {
  console.log(`[Nouvelle Demande Stub] Vendeuse: ${vendeuseEmail}, Client: ${clientNom}, Date: ${date}, Heure: ${heure}`);
  return true;
}

export async function sendRendezVousAnnulation(
  email: string,
  nom: string,
  date: string,
  heure: string
) {
  console.log(`[RendezVous Annulation Stub] Email: ${email}, Nom: ${nom}, Date: ${date}, Heure: ${heure}`);
  return true;
}

export async function sendDemandeAccepteeNotification(
  clientEmail: string,
  vendeuseNom: string,
  date: string,
  heure: string
) {
  console.log(`[Demande Acceptee Stub] Client: ${clientEmail}, Vendeuse: ${vendeuseNom}, Date: ${date}, Heure: ${heure}`);
  return true;
}

export async function sendDemandeRefuseeNotification(
  clientEmail: string,
  vendeuseNom: string,
  date: string,
  heure: string
) {
  console.log(`[Demande Refusee Stub] Client: ${clientEmail}, Vendeuse: ${vendeuseNom}, Date: ${date}, Heure: ${heure}`);
  return true;
}
