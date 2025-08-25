const express = require('express');
const router = express.Router();

const taskController = require('./task.controller');
const utils = require('../../shared/helpers/utils');;

router.get('/tasks', utils.authenticate, taskController.getTask);

router.get('/tasks/search', utils.authenticate, taskController.searchTask);

router.post('/tasks', utils.authenticate, taskController.createTask);

router.put('/tasks/:id', utils.authenticate, taskController.updateTask);

router.delete('/tasks/:id', utils.authenticate, taskController.deleteTask);

module.exports = router;