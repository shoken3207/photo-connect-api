const express = require('express');
const router = express.Router();
const {
  register,
  addFriend,
  updateUser,
  deleteUser,
  fetchAllFriend,
  fetchUsersByName,
  fetchUserByEmail,
  fetchUserById,
} = require('../controllers/userController');

router.post('/register', register);
router.post('/addFriend', addFriend);
router.post('/update', updateUser);
router.delete('/delete', deleteUser);
router.get('/:user_id/friends', fetchAllFriend);
router.get('/:name/name', fetchUsersByName);
router.get('/:email/email', fetchUserByEmail);
router.get('/:user_id/id', fetchUserById);

module.exports = router;
