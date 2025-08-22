const express = require('express');
const router = express.Router();

const userController = require('./user.controller');
const utils = require('../../shared/helpers/utils');

router.post('/users/register', userController.register);

router.post('/users/login', userController.login);

router.get('/users', utils.authorize, userController.getUsers);

router.put('/users/:id', utils.authenticate, userController.updateUser);

router.delete('/users/:id', utils.authenticate, userController.deleteUser);

module.exports = router;