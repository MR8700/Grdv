'use strict';

const { Op } = require('sequelize');
const { RendezVous, Disponibilite, Patient, Medecin, Utilisateur, SystemJob, Secretaire, Service } = require('../models');
const { ok, created, paginated, notFound } = require('../utils/response.util');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { auditManual } = require('../middlewares/audit.middleware');
const notificationService = require('../services/notification.service');
const { STATUT_RDV, STATUT_JOB, TYPE_TACHE } = require('../utils/constants.util');

async function getSecretaryServiceIds(userId) {
  const secretary = await Secretaire.findByPk(userId, {
    include: [
      { model: Service, as: 'services_affectes', attributes: ['id_service'], through: { attributes: [] } },
    ],
  });

  if (!secretary) return [];

  const serviceIds = secretary.services_affectes?.map((service) => service.id_service) || [];
  if (serviceIds.length > 0) return serviceIds;
  if (secretary.id_service_affecte) return [secretary.id_service_affecte];
  return [];
}

async function assertSecretaryCanAccessRdv(req, rdv) {
  if (req.user.type_user !== 'secretaire') return;

  const serviceIds = await getSecretaryServiceIds(req.user.id_user);
  if (serviceIds.length === 0) {
    throw new AppError('Aucun service affecte a ce secretaire.', 403, 'NO_SECRETARY_SERVICE');
  }

  const dispo = rdv.disponibilite || await Disponibilite.findByPk(rdv.id_dispo, { attributes: ['id_dispo', 'id_service'] });
  if (!dispo || !serviceIds.includes(dispo.id_service)) {
    throw new AppError('Ce rendez-vous est hors de votre perimetre de service.', 403, 'SECRETARY_OUT_OF_SCOPE');
  }
}

async function getAll(req, res, next) {
  try {
    const { page = 1, limit = 20, statut_rdv, id_medecin, id_patient, date_debut, date_fin } = req.query;
    const where = {};

    if (req.user.type_user === 'patient') {
      where.id_patient = req.user.id_user;
    } else if (req.user.type_user === 'secretaire' && !req.user.permissions?.includes('voir_rdv')) {
      throw new AppError('Permission manquante: voir_rdv.', 403, 'FORBIDDEN_PERMISSION');
    } else {
      if (id_patient) where.id_patient = id_patient;
      if (id_medecin) where.id_medecin = id_medecin;
    }

    if (statut_rdv) where.statut_rdv = statut_rdv;
    if (date_debut || date_fin) {
      where.date_heure_rdv = {};
      if (date_debut) where.date_heure_rdv[Op.gte] = new Date(date_debut);
      if (date_fin) where.date_heure_rdv[Op.lte] = new Date(date_fin);
    }

    if (req.user.type_user === 'secretaire') {
      const serviceIds = await getSecretaryServiceIds(req.user.id_user);
      if (serviceIds.length === 0) {
        return paginated(res, [], 0, page, limit);
      }

      const disponibilites = await Disponibilite.findAll({
        attributes: ['id_dispo'],
        where: { id_service: { [Op.in]: serviceIds } },
      });

      const dispoIds = disponibilites.map((dispo) => dispo.id_dispo);
      if (dispoIds.length === 0) {
        return paginated(res, [], 0, page, limit);
      }

      where.id_dispo = { [Op.in]: dispoIds };
    }

    const { count, rows } = await RendezVous.findAndCountAll({
      where,
      include: [
        { model: Patient, as: 'patient', include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom', 'email'] }] },
        { model: Medecin, as: 'medecin', include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }] },
        { model: Disponibilite, as: 'disponibilite', attributes: ['date_heure_debut', 'date_heure_fin', 'id_service'] },
      ],
      order: [['date_heure_rdv', 'DESC']],
      limit: parseInt(limit, 10),
      offset: (page - 1) * limit,
    });
    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const rdv = await RendezVous.findByPk(req.params.id_rdv, {
      include: [
        { model: Patient, as: 'patient', include: [{ model: Utilisateur, as: 'utilisateur' }] },
        { model: Medecin, as: 'medecin', include: [{ model: Utilisateur, as: 'utilisateur' }] },
        { model: Disponibilite, as: 'disponibilite' },
      ],
    });
    if (!rdv) return notFound(res, 'Rendez-vous');
    await assertSecretaryCanAccessRdv(req, rdv);
    return ok(res, rdv);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { id_dispo, id_medecin, date_heure_rdv, motif } = req.body;

    const dispo = await Disponibilite.findByPk(id_dispo);
    if (!dispo) throw new AppError('Creneau introuvable.', 404, 'DISPO_NOT_FOUND');
    if (!dispo.est_libre) throw new AppError('Ce creneau n\'est plus disponible.', 409, 'SLOT_UNAVAILABLE');

    const rdv = await RendezVous.create({
      id_dispo,
      id_medecin,
      id_patient: req.user.id_user,
      date_heure_rdv,
      motif,
      statut_rdv: STATUT_RDV.EN_ATTENTE,
    });

    const dateRappel = new Date(date_heure_rdv);
    dateRappel.setHours(dateRappel.getHours() - 24);
    await SystemJob.create({
      type_tache: TYPE_TACHE.ENVOYER_RAPPEL,
      parametres: { id_rdv: rdv.id_rdv },
      statut: STATUT_JOB.ATTENTE,
      date_execution_prevue: dateRappel,
    });

    await notificationService.logRdvCreation(req, rdv.id_rdv, {
      id: rdv.id_patient,
      nom: req.user.nom,
      prenom: req.user.prenom,
      email: req.user.email,
    }, {
      id: id_medecin,
    });

    await auditManual(req, 'CREATE_RDV', 'rendez_vous', { id_rdv: rdv.id_rdv, id_dispo });
    return created(res, { id_rdv: rdv.id_rdv }, 'Rendez-vous cree. En attente de confirmation.');
  } catch (err) { next(err); }
}

async function updateStatut(req, res, next) {
  try {
    if (req.user.type_user === 'secretaire' && !req.user.permissions?.includes('confirmer_rdv')) {
      throw new AppError('Permission manquante: confirmer_rdv.', 403, 'FORBIDDEN_PERMISSION');
    }
    const rdv = await RendezVous.findByPk(req.params.id_rdv, {
      include: [{ model: Disponibilite, as: 'disponibilite', attributes: ['id_dispo', 'id_service'] }],
    });
    if (!rdv) return notFound(res, 'Rendez-vous');
    await assertSecretaryCanAccessRdv(req, rdv);

    const { statut_rdv, motif_refus } = req.body;
    const ancienStatut = rdv.statut_rdv;

    const transitions = {
      [STATUT_RDV.EN_ATTENTE]: [STATUT_RDV.CONFIRME, STATUT_RDV.REFUSE, STATUT_RDV.ANNULE],
      [STATUT_RDV.CONFIRME]: [STATUT_RDV.ANNULE, STATUT_RDV.ARCHIVE],
    };
    if (!transitions[ancienStatut]?.includes(statut_rdv)) {
      throw new AppError(`Transition invalide : ${ancienStatut} -> ${statut_rdv}.`, 409, 'INVALID_TRANSITION');
    }

    const updateData = { statut_rdv };
    if (motif_refus) updateData.motif = motif_refus;
    await rdv.update(updateData);

    if (statut_rdv === STATUT_RDV.CONFIRME) {
      await notificationService.logRdvConfirmation(req, rdv.id_rdv, { id: rdv.id_patient }, { id: rdv.id_medecin });
    } else if (statut_rdv === STATUT_RDV.ANNULE) {
      await notificationService.logRdvCancellation(req, rdv.id_rdv, req.user.type_user, motif_refus);
    }

    await auditManual(req, 'UPDATE_STATUT_RDV', 'rendez_vous', {
      id_rdv: rdv.id_rdv, ancienStatut, nouveauStatut: statut_rdv,
    });

    return ok(res, { id_rdv: rdv.id_rdv, statut_rdv }, `Rendez-vous ${statut_rdv}.`);
  } catch (err) { next(err); }
}

async function cancel(req, res, next) {
  try {
    const rdv = await RendezVous.findByPk(req.params.id_rdv);
    if (!rdv) return notFound(res, 'Rendez-vous');

    if (rdv.id_patient !== req.user.id_user && req.user.type_user !== 'administrateur') {
      throw new AppError('Vous ne pouvez annuler que vos propres rendez-vous.', 403, 'FORBIDDEN');
    }
    if ([STATUT_RDV.ARCHIVE, STATUT_RDV.ANNULE].includes(rdv.statut_rdv)) {
      throw new AppError('Ce rendez-vous ne peut plus etre annule.', 409, 'CANNOT_CANCEL');
    }

    await rdv.update({ statut_rdv: STATUT_RDV.ANNULE });
    await notificationService.logRdvCancellation(req, rdv.id_rdv, req.user.type_user, 'Annulation par le patient');
    await auditManual(req, 'CANCEL_RDV', 'rendez_vous', { id_rdv: rdv.id_rdv });
    return ok(res, null, 'Rendez-vous annule.');
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, updateStatut, cancel };
