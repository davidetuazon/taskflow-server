const express = require('express');
const router = express.Router();

const taskControllerV2 = require('./task.controller-v2');
const utils = require('../../../shared/helpers/utils');

router.get('/projects/:id/tasks', utils.authenticate, taskControllerV2.getTask);

router.post('/projects/:id/tasks', utils.authenticate, taskControllerV2.createTask);

router.put('/projects/:id/tasks/:taskId', utils.authenticate, taskControllerV2.updateTask);

router.delete('/projects/:id/tasks/:taskId', utils.authenticate, taskControllerV2.deleteTask);

module.exports = router;