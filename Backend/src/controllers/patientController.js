'use strict';

const { Patient, Utilisateur, RendezVous, Medecin, Disponibilite } = require('../models');
const { ok, paginated, notFound } = require('../utils/response.util');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { auditManual } = require('../middlewares/audit.middleware');

async function getAll(req, res, next) {
  try {
    if (req.user.type_user === 'secretaire' && !req.user.permissions?.includes('voir_utilisateurs')) {
      throw new AppError('Permission manquante: voir_utilisateurs.', 403, 'FORBIDDEN_PERMISSION');
    }
    const { page = 1, limit = 20, groupe_sanguin } = req.query;
    const where = {};
    if (groupe_sanguin) where.groupe_sanguin = groupe_sanguin;

    const { count, rows } = await Patient.findAndCountAll({
      where,
      include: [{ model: Utilisateur, as: 'utilisateur',
        attributes: ['id_user', 'nom', 'prenom', 'email', 'photo_path', 'statut', 'date_creation'] }],
      order : [[{ model: Utilisateur, as: 'utilisateur' }, 'nom', 'ASC']],
      limit : parseInt(limit, 10),
      offset: (page - 1) * limit,
    });
    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    if (req.user.type_user === 'secretaire' && !req.user.permissions?.includes('voir_utilisateurs')) {
      throw new AppError('Permission manquante: voir_utilisateurs.', 403, 'FORBIDDEN_PERMISSION');
    }
    const patient = await Patient.findByPk(req.params.id_user, {
      include: [{ model: Utilisateur, as: 'utilisateur',
        attributes: ['id_user', 'nom', 'prenom', 'email', 'photo_path', 'statut', 'date_creation'] }],
    });
    if (!patient) return notFound(res, 'Patient');
    return ok(res, patient);
  } catch (err) { next(err); }
}

async function getRendezVous(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { count, rows } = await RendezVous.findAndCountAll({
      where  : { id_patient: req.params.id_user },
      include: [
        { model: Medecin,      as: 'medecin',       include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }] },
        { model: Disponibilite,as: 'disponibilite', attributes: ['date_heure_debut', 'date_heure_fin'] },
      ],
      order  : [['date_heure_rdv', 'DESC']],
      limit  : parseInt(limit, 10),
      offset : (page - 1) * limit,
    });
    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const patient = await Patient.findByPk(req.params.id_user);
    if (!patient) return notFound(res, 'Patient');
    const { num_secu_sociale, groupe_sanguin } = req.body;
    await patient.update({ num_secu_sociale, groupe_sanguin });
    await auditManual(req, 'UPDATE_PATIENT', 'patients', { id_user: patient.id_user });
    return ok(res, patient, 'Profil patient mis à jour.');
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, getRendezVous, update };
