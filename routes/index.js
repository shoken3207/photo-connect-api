const router = require('express').Router();

const userRouter = require('./userRoutes.js');
const planRouter = require('./planRoutes.js');
const chatRouter = require('./chatRoutes.js');
const notificationRouter = require('./notificationRoutes.js');

router.use('/user', userRouter);
router.use('/plan', planRouter);
router.use('/chat', chatRouter);
router.use('/notification', notificationRouter);

module.exports = router;
