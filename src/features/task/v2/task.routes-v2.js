const express = require('express');
const router = express.Router();

const taskControllerV2 = require('./task.controller-v2');
const utils = require('../../../shared/helpers/utils');

router.get('/:username/feed', utils.authenticate, taskControllerV2.getFeed);

router.get('/analytics/overview', utils.authenticate, taskControllerV2.taskOverview);

router.get('/:username/:slug/tasks', utils.authenticate, taskControllerV2.listTask);

router.post('/:username/:slug/tasks', utils.authenticate, taskControllerV2.createTask);

router.put('/:username/:slug/:taskId', utils.authenticate, taskControllerV2.updateTask);

router.delete('/:username/:slug/:taskId', utils.authenticate, taskControllerV2.deleteTask);

module.exports = router;