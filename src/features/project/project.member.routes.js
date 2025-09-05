const express = require('express');
const router = express.Router();

const projectController = require('./project.controller');
const utils = require('../../shared/helpers/utils');

router.put('/projects/:slug/settings', utils.authenticate, projectController.addProjectMembers);

router.delete('/projects/:slug/settings/:memberId', utils.authenticate, projectController.removeProjectMembers);

module.exports = router;