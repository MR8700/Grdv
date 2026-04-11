'use strict';

const { Op } = require('sequelize');
const { Disponibilite, Medecin, Service, Utilisateur } = require('../models');
const { ok, created, paginated, notFound } = require('../utils/response.util');
const { AppError }    = require('../middlewares/errorHandler.middleware');
const { auditManual } = require('../middlewares/audit.middleware');

async function getAll(req, res, next) {
  try {
    const { page = 1, limit = 50, id_medecin, id_service, libre_seulement, date_debut, date_fin } = req.query;
    const where = {};
    if (id_medecin)            where.id_medecin = id_medecin;
    if (id_service)            where.id_service  = id_service;
    if (libre_seulement === 'true') where.est_libre = true;
    if (date_debut || date_fin) {
      where.date_heure_debut = {};
      if (date_debut) where.date_heure_debut[Op.gte] = new Date(date_debut);
      if (date_fin)   where.date_heure_debut[Op.lte] = new Date(date_fin);
    }

    const { count, rows } = await Disponibilite.findAndCountAll({
      where,
      include: [
        { model: Medecin,  as: 'medecin',  include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }] },
        { model: Service,  as: 'service',  attributes: ['nom_service'] },
      ],
      order  : [['date_heure_debut', 'ASC']],
      limit  : parseInt(limit, 10),
      offset : (page - 1) * limit,
    });
    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const dispo = await Disponibilite.findByPk(req.params.id_dispo, {
      include: [
        { model: Medecin, as: 'medecin', include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }] },
        { model: Service, as: 'service', attributes: ['nom_service'] },
      ],
    });
    if (!dispo) return notFound(res, 'Disponibilité');
    return ok(res, dispo);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    // Vérifier chevauchement de créneaux pour le même médecin
    const { id_medecin, date_heure_debut, date_heure_fin, id_service, capacite_max } = req.body;
    const overlap = await Disponibilite.findOne({
      where: {
        id_medecin,
        [Op.or]: [
          { date_heure_debut: { [Op.between]: [date_heure_debut, date_heure_fin] } },
          { date_heure_fin:   { [Op.between]: [date_heure_debut, date_heure_fin] } },
        ],
      },
    });
    if (overlap) throw new AppError('Chevauchement avec un créneau existant.', 409, 'SLOT_OVERLAP');

    const dispo = await Disponibilite.create({ id_medecin, date_heure_debut, date_heure_fin, id_service, capacite_max });
    await auditManual(req, 'CREATE_DISPO', 'disponibilites', { id_dispo: dispo.id_dispo, id_medecin });
    return created(res, dispo, 'Créneau de disponibilité créé.');
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const dispo = await Disponibilite.findByPk(req.params.id_dispo);
    if (!dispo) return notFound(res, 'Disponibilité');

    // Seul le médecin propriétaire ou un admin peut modifier
    if (req.user.type_user !== 'administrateur' && req.user.id_user !== dispo.id_medecin) {
      throw new AppError('Accès refusé.', 403, 'FORBIDDEN');
    }
    const { date_heure_debut, date_heure_fin, capacite_max, id_service } = req.body;
    await dispo.update({ date_heure_debut, date_heure_fin, capacite_max, id_service });
    return ok(res, dispo, 'Créneau mis à jour.');
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const dispo = await Disponibilite.findByPk(req.params.id_dispo);
    if (!dispo) return notFound(res, 'Disponibilité');
    if (req.user.type_user !== 'administrateur' && req.user.id_user !== dispo.id_medecin) {
      throw new AppError('Accès refusé.', 403, 'FORBIDDEN');
    }
    await dispo.destroy();
    return ok(res, null, 'Créneau supprimé.');
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, remove };