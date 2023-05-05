const router = require('express').Router();

const userRouter = require('./userRoutes.js');
const planRouter = require('./planRoutes.js');
const chatRouter = require('./chatRoutes.js');

router.use('/user', userRouter);
router.use('/plan', planRouter);
router.use('/chat', chatRouter);

module.exports = router;
