const e = require('express');
const ProjectService = require('./project.service');
const constraints = require('./project.validation');
const validate = require('validate.js');

exports.getProject = async (req, res, next) => {
    const userId = req.user._id;
    const { search, page = 1, limit = 10 } = req.query;
    try {
        const options = { page: Number(page), limit: Number(limit) };
        
        const tasks = await ProjectService.find(search || "", options, userId);
        res.json(tasks);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.createProject = async (req, res, next) => {
    const userId = req.user._id;
    const params = req.body;
    const issues = validate(params, constraints.create);
    if (issues) return res.status(422).json({ err: issues });

    try {
        const project = await ProjectService.create(params, userId);
        console.log(project);
        res.json(project);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.deleteProject = async (req, res, next) => {
    const userId = req.user._id;

    const { id: projectId } = req.params;
    const idIssues = validate({ projectId }, { presence: true });
    if (idIssues) return res.status(422).json({ err: idIssues });

    try {
        const project = await ProjectService.delete(userId, projectId);
        if (!project) return res.status(404).json({ error: "Project not found" });
        res.json(project);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.updateProject = async (req, res, next) => {
    const userId = req.user._id;
    const { id: projectId } = req.params;
    const idIssues = validate({ projectId }, { presence: true });

    const updates = req.body;
    const issues = validate(updates, constraints.update);

    if (idIssues) return res.status(422).json({ err: idIssues });
    if (issues) return res.status(422).json({ err: issues });

    try {
        const project = await ProjectService.updateProject(userId, projectId, updates);
        if (!project) return res.status(404).json({ error: "Project not found" });
        res.json(project);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.addProjectMembers = async (req, res, next) => {
    const userId = req.user._id;

    const { id: projectId } = req.params;
    const idIssues = validate({ projectId }, { presence: true });

    const { members } = req.body;
    if (!Array.isArray(members) || members.length === 0) {
        return res.status(422).json({ err: "Members must be a non-empty array" });
    }
    const issues = validate({ members }, constraints.addMembers);

    if (idIssues) return res.status(422).json({ err: idIssues });
    if (issues) return res.status(422).json({ err: issues });

    try {
        const project = await ProjectService.addMembers(userId, projectId, members);
        if (!project) return res.status(404).json({ error: "Failed to add new members" });
        res.json(project);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.removeProjectMembers = async (req, res, next) => {
    const userId = req.user._id;

    const { id: projectId, memberId } = req.params;
    const idIssues = validate({ projectId, memberId }, { projectId: { presence: true }, memberId: { presence: true } });
    if (idIssues) return res.status(422).json({ err: idIssues });

    try {
        const project = await ProjectService.removeMembers(userId, projectId, memberId);
        if (!project) return res.status(404).json({ error: "Failed to remove member" });
        res.json(project);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}