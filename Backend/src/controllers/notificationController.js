'use strict';

const { Notification, Utilisateur } = require('../models');
const { ok, created, paginated, notFound } = require('../utils/response.util');
const { AppError }    = require('../middlewares/errorHandler.middleware');

async function getMine(req, res, next) {
  try {
    const { page = 1, limit = 20, lu, type_notification } = req.query;
    const where = { id_user: req.user.id_user };
    if (lu !== undefined) where.lu = lu === 'true';
    if (type_notification) where.type_notification = type_notification;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order  : [['date_envoi', 'DESC']],
      limit  : parseInt(limit, 10),
      offset : (page - 1) * limit,
    });
    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
}

async function markAsRead(req, res, next) {
  try {
    const notif = await Notification.findByPk(req.params.id_notif);
    if (!notif) return notFound(res, 'Notification');
    if (notif.id_user !== req.user.id_user) {
      throw new AppError('Accès refusé.', 403, 'FORBIDDEN');
    }
    await notif.update({ lu: true });
    return ok(res, null, 'Notification marquée comme lue.');
  } catch (err) { next(err); }
}

async function markAllAsRead(req, res, next) {
  try {
    await Notification.update({ lu: true }, { where: { id_user: req.user.id_user, lu: false } });
    return ok(res, null, 'Toutes les notifications marquées comme lues.');
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const notif = await Notification.create(req.body);
    return created(res, notif, 'Notification créée.');
  } catch (err) { next(err); }
}

module.exports = { getMine, markAsRead, markAllAsRead, create };