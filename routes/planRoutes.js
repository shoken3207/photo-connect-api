const express = require('express');
const router = express.Router();

const {
  createPlan,
  participationPlan,
  leavePlan,
  exceptPlan,
  updatePlan,
  deletePlan,
  likePlan,
  fetchPlan,
  fetchPlansByPrefecture,
  fetchPlansByTag,
  fetchLikedPlans,
  fetchParticipatedPlans,
  fetchCreatedPlans,
  fetchHomePlans,
  closePlan,
  resumePlan,
  acceptPlan,
  invitationPlan,
  cancelInvitationPlan,
} = require('../controllers/planController');

router.post('/create', createPlan);
router.post('/close', closePlan);
router.post('/resume', resumePlan);
router.post('/update', updatePlan);
router.post('/participation', participationPlan);
router.post('/leave', leavePlan);
router.post('/except', exceptPlan);
router.post('/accept', acceptPlan);
router.post('/like', likePlan);
router.post('/invitation', invitationPlan);
router.post('/cancelInvitation', cancelInvitationPlan);
router.delete('/delete/:plan_id/:user_id', deletePlan);
router.get('/:plan_id/id', fetchPlan);
router.get('/prefecture/:prefecture/:start/:limit', fetchPlansByPrefecture);
router.get('/tag/:tag/:start/:limit', fetchPlansByTag);
router.get('/liked/:liker_id/:start/:limit', fetchLikedPlans);
router.get(
  '/participated/:participants_id/:start/:limit',
  fetchParticipatedPlans
);
router.get('/created/:user_id/:start/:limit', fetchCreatedPlans);
router.get('/home/:user_id/:start/:limit', fetchHomePlans);

module.exports = router;
