const express = require('express');
const router = express.Router();

const projectController = require('./project.controller');
const utils = require('../../shared/helpers/utils');

router.get('/projects', utils.authenticate, projectController.getProject);

router.post('/projects', utils.authenticate, projectController.createProject);

router.put('/projects/:id/details', utils.authenticate, projectController.updateProject);

router.delete('/projects/:id/details', utils.authenticate, projectController.deleteProject);

router.put('/projects/:id/members', utils.authenticate, projectController.addProjectMembers);

router.delete('/projects/:id/members/:memberId', utils.authenticate, projectController.removeProjectMembers);

module.exports = router;