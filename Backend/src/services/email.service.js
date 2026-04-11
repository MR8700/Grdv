'use strict';

const { sendMail }   = require('../config/mailer');
const { Notification } = require('../models');
const { TYPE_NOTIFICATION } = require('../utils/constants.util');

// ─────────────────────────────────────────────────────────────────────────────
// Service email — orchestre l'envoi Mailtrap ET la persistance en base
// Chaque envoi crée une ligne dans la table notifications (canal email)
// ─────────────────────────────────────────────────────────────────────────────

async function envoyerRappelRdv({ id_user, id_rdv, emailDestinataire, data }) {
  // 1. Envoi email via Mailtrap SDK
  await sendMail(emailDestinataire, 'rappelRdv', data);

  // 2. Persistance dans notifications
  return Notification.create({
    id_user,
    id_rdv,
    type_notification : TYPE_NOTIFICATION.RAPPEL,
    message           : `Rappel RDV du ${data.dateRdv} à ${data.heureRdv} avec Dr ${data.nomMedecin}.`,
    lu                : false,
  });
}

async function envoyerUrgence({ id_user, emailDestinataire, data }) {
  await sendMail(emailDestinataire, 'urgence', data);

  return Notification.create({
    id_user,
    type_notification : TYPE_NOTIFICATION.URGENCE,
    message           : data.message,
    lu                : false,
  });
}

async function envoyerInformation({ id_user, id_rdv = null, emailDestinataire, data }) {
  await sendMail(emailDestinataire, 'information', data);

  return Notification.create({
    id_user,
    id_rdv,
    type_notification : TYPE_NOTIFICATION.INFORMATION,
    message           : data.message,
    lu                : false,
  });
}

module.exports = { envoyerRappelRdv, envoyerUrgence, envoyerInformation };