'use strict';

const { sendMail, isEmailEnabled } = require('../config/mailer');
const { Notification } = require('../models');
const { TYPE_NOTIFICATION } = require('../utils/constants.util');

async function persistNotification({ id_user, id_rdv = null, type_notification, message }) {
  return Notification.create({
    id_user,
    id_rdv,
    type_notification,
    message,
    lu: false,
  });
}

async function trySendMail(emailDestinataire, templateKey, data) {
  try {
    return await sendMail(emailDestinataire, templateKey, data);
  } catch (error) {
    console.warn(`[MAIL] Envoi ignore pour ${templateKey}: ${error.message}`);
    return { skipped: true, reason: 'send_failed' };
  }
}

async function envoyerRappelRdv({ id_user, id_rdv, emailDestinataire, data }) {
  const notification = await persistNotification({
    id_user,
    id_rdv,
    type_notification: TYPE_NOTIFICATION.RAPPEL,
    message: `Rappel RDV du ${data.dateRdv} a ${data.heureRdv} avec Dr ${data.nomMedecin}.`,
  });

  const delivery = await trySendMail(emailDestinataire, 'rappelRdv', data);
  return { notification, delivery, emailEnabled: isEmailEnabled() };
}

async function envoyerUrgence({ id_user, emailDestinataire, data }) {
  const notification = await persistNotification({
    id_user,
    type_notification: TYPE_NOTIFICATION.URGENCE,
    message: data.message,
  });

  const delivery = await trySendMail(emailDestinataire, 'urgence', data);
  return { notification, delivery, emailEnabled: isEmailEnabled() };
}

async function envoyerInformation({ id_user, id_rdv = null, emailDestinataire, data }) {
  const notification = await persistNotification({
    id_user,
    id_rdv,
    type_notification: TYPE_NOTIFICATION.INFORMATION,
    message: data.message,
  });

  const delivery = await trySendMail(emailDestinataire, 'information', data);
  return { notification, delivery, emailEnabled: isEmailEnabled() };
}

module.exports = { envoyerRappelRdv, envoyerUrgence, envoyerInformation };
