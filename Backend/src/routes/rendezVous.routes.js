'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/rendezVousController');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkRole }    = require('../middlewares/rbac.middleware');
const { validate, validateMany } = require('../middlewares/validate.middleware');
const { auditAfter }   = require('../middlewares/audit.middleware');
const v = require('../validators/rendezVous.validator');

router.use(authenticate);

// GET    /api/v1/rendez-vous
router.get('/',       validate(v.query, 'query'), ctrl.getAll);

// POST   /api/v1/rendez-vous
router.post('/',      validate(v.create), auditAfter('rendez_vous'), ctrl.create);

// GET    /api/v1/rendez-vous/:id_rdv
router.get('/:id_rdv', validate(v.idParam, 'params'), ctrl.getOne);

// PATCH  /api/v1/rendez-vous/:id_rdv/statut  (confirmation, refus, annulation)
router.patch('/:id_rdv/statut',
  checkRole('medecin', 'secretaire', 'administrateur'),
  validateMany({ params: v.idParam, body: v.updateStatut }),
  auditAfter('rendez_vous'),
  ctrl.updateStatut
);

// DELETE /api/v1/rendez-vous/:id_rdv  (annulation par le patient)
router.delete('/:id_rdv',
  validate(v.idParam, 'params'),
  auditAfter('rendez_vous'),
  ctrl.cancel
);

module.exports = router;