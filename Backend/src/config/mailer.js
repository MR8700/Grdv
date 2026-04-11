'use strict';

const nodemailer         = require('nodemailer');
const { MailtrapTransport } = require('mailtrap');
const { mail, NODE_ENV } = require('./env');

// -----------------------------------------------------------------------------
// Transport Mailtrap SDK
// Lié à la table notifications (canal = 'email') et system_jobs
// (type_job = 'envoyer_rappel').
// -----------------------------------------------------------------------------

const transporter = nodemailer.createTransport(
  MailtrapTransport({ token: mail.token })
);

const sender = {
  address: mail.fromAddress,
  name   : mail.fromName,
};

// -- Vérification au démarrage ------------------------------------------------

async function verifyMailer() {
  if (NODE_ENV === 'test') return;
  try {
    await transporter.verify();
    console.log(`[MAIL] Mailtrap connecté (token: ...${mail.token.slice(-6)})`);
  } catch (err) {
    console.warn(`[MAIL] Mailtrap indisponible : ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// Templates — calqués sur l'ENUM type_notification du schéma SQL :
//   'rappel'      → rappelRdv()
//   'urgence'     → urgence()
//   'information' → information()
// -----------------------------------------------------------------------------

const templates = {

  rappelRdv: ({ nomPatient, nomMedecin, dateRdv, heureRdv, nomService }) => ({
    subject : `Rappel de votre rendez-vous — ${dateRdv} à ${heureRdv}`,
    html    : `
      <h2>Rappel de rendez-vous</h2>
      <p>Bonjour <strong>${nomPatient}</strong>,</p>
      <p>Votre rendez-vous avec <strong>Dr ${nomMedecin}</strong>
         (${nomService}) est prévu le <strong>${dateRdv}</strong>
         à <strong>${heureRdv}</strong>.</p>
      <p>En cas d'empêchement, merci d'annuler au moins 24h à l'avance.</p>
      <hr/><small>Message automatique — ne pas répondre.</small>
    `,
    category: 'rappel',
  }),

  urgence: ({ nomDestinataire, message }) => ({
    subject : '⚠️ Alerte urgente — Clinique',
    html    : `
      <h2 style="color:#c0392b;">Alerte urgente</h2>
      <p>Bonjour <strong>${nomDestinataire}</strong>,</p>
      <p>${message}</p>
      <hr/><small>Message automatique — ne pas répondre.</small>
    `,
    category: 'urgence',
  }),

  information: ({ nomDestinataire, titre, message }) => ({
    subject : `Information : ${titre}`,
    html    : `
      <h2>${titre}</h2>
      <p>Bonjour <strong>${nomDestinataire}</strong>,</p>
      <p>${message}</p>
      <hr/><small>Message automatique — ne pas répondre.</small>
    `,
    category: 'information',
  }),
};

// -----------------------------------------------------------------------------
// Fonction d'envoi principale
// Appelée par email.service.js qui gère la persistance en base
// -----------------------------------------------------------------------------

/**
 * @param {string} to          - Email du destinataire
 * @param {string} templateKey - 'rappelRdv' | 'urgence' | 'information'
 * @param {object} data        - Variables du template
 */
async function sendMail(to, templateKey, data = {}) {
  const template = templates[templateKey];
  if (!template) {
    throw new Error(
      `[MAIL] Template inconnu : "${templateKey}". ` +
      `Disponibles : ${Object.keys(templates).join(', ')}`
    );
  }

  const { subject, html, category } = template(data);

  const info = await transporter.sendMail({
    from    : sender,
    to,
    subject,
    html,
    category,
  });

  if (NODE_ENV === 'development') {
    console.log(`[MAIL] Envoyé à ${to} | "${subject}" | ID: ${info.messageId}`);
  }

  return info;
}

module.exports = { transporter, sender, verifyMailer, sendMail, templates };