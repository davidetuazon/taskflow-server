const express = require('express');
const router = express.Router();

const projectController = require('./project.controller');
const utils = require('../../shared/helpers/utils');

router.get('/projects', utils.authenticate, projectController.listProject);

router.post('/projects', utils.authenticate, projectController.createProject);

router.get('/projects/:slug', utils.authenticate, projectController.getProject);

router.put('/projects/:slug', utils.authenticate, projectController.updateProject);

router.delete('/projects/:slug', utils.authenticate, projectController.deleteProject);

module.exports = router;