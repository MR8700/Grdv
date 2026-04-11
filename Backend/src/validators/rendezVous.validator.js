'use strict';

const Joi = require('joi');
const { STATUT_RDV } = require('../utils/constants.util');

const idParam = Joi.object({
  id_rdv: Joi.number().integer().positive().required(),
});

const create = Joi.object({
  id_dispo      : Joi.number().integer().positive().required(),
  id_medecin    : Joi.number().integer().positive().required(),
  date_heure_rdv: Joi.date().iso().greater('now').required().messages({
    'date.greater': 'La date du rendez-vous doit être dans le futur.',
  }),
  motif: Joi.string().max(1000).optional(),
});

const updateStatut = Joi.object({
  statut_rdv: Joi.string()
    .valid(...Object.values(STATUT_RDV))
    .required()
    .messages({ 'any.only': `Statut invalide. Valeurs : ${Object.values(STATUT_RDV).join(', ')}` }),
  motif_refus: Joi.when('statut_rdv', {
    is   : STATUT_RDV.REFUSE,
    then : Joi.string().max(500).required().messages({ 'any.required': 'Un motif de refus est requis.' }),
    otherwise: Joi.optional(),
  }),
});

const query = Joi.object({
  page      : Joi.number().integer().min(1).default(1),
  limit     : Joi.number().integer().min(1).max(100).default(20),
  statut_rdv: Joi.string().valid(...Object.values(STATUT_RDV)).optional(),
  id_medecin: Joi.number().integer().positive().optional(),
  id_patient: Joi.number().integer().positive().optional(),
  date_debut: Joi.date().iso().optional(),
  date_fin  : Joi.date().iso().min(Joi.ref('date_debut')).optional(),
});

module.exports = { idParam, create, updateStatut, query };