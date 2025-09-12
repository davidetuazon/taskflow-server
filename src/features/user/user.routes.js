const express = require('express');
const router = express.Router();

const userController = require('./user.controller');
const utils = require('../../shared/helpers/utils');

router.post('/users/register', userController.register);

router.post('/users/login', userController.login);

router.get('/users', utils.authorize, userController.getUsers);

router.patch('/:username/account/profile', utils.authenticate, userController.updateUser);

router.delete('/:username/account/settings', utils.authenticate, userController.deleteUser);

router.get('/me' , utils.authenticate, async (req, res, next) => {
    try {
        res.send(req.user);
    } catch (e) {
        console.log('/me err', e.message);
        res.status(500).send({ error: e.message });
    }
});



module.exports = router;