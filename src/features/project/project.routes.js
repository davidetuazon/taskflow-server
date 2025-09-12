const express = require('express');
const router = express.Router();

const projectController = require('./project.controller');
const utils = require('../../shared/helpers/utils');

router.get('/projects/search', utils.authenticate, projectController.searchProject);

router.get('/:username', utils.authenticate, projectController.listProject);

router.post('/:username/new', utils.authenticate, projectController.createProject);

router.get('/:username/:slug', utils.authenticate, projectController.getProject);

router.put('/:username/:slug', utils.authenticate, projectController.updateProject);

router.delete('/:username/:slug', utils.authenticate, projectController.deleteProject);

module.exports = router;