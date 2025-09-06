const e = require('express');
const ProjectService = require('./project.service');
const constraints = require('./project.validation');
const validate = require('validate.js');

const slugify = (title) => {
    return title
        .trim()                              // remove leading/trailing spaces
        .toLowerCase()                       // lowercase
        .replace(/\s+/g, '-')                // spaces → dashes
        .normalize('NFD')                     // separate accents from letters
        .replace(/[\u0300-\u036f]/g, '')     // remove accent marks
        .replace(/[^a-z0-9\-]/g, '');        // remove invalid chars except dash
}

// -------- CONTROLLERS -------- //

exports.listProject = async (req, res, next) => {
    const userId = req.user._id;
    const { search, page = 1, limit = 10 } = req.query;
    const { username } = req.params;
    const issues = validate({ username }, { presence: true });
    if (issues) return res.status(422).json({ err: issues });

    try {
        const options = { page: Number(page), limit: Number(limit) };
        
        const projects = await ProjectService.findAll(search || "", options, userId, username);
        res.json(projects);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getProject = async (req, res, next) => {
    const userId = req.user._id;
    const { username, slug } = req.params;

    const userIssue = validate({ username }, { presence: true });
    const issues = validate({ slug }, { presence: true });

    if(userIssue) return res.status(422).json({ err: userIssue });
    if(issues) return res.status(422).json({ err: issues });
    try {
        const project = await ProjectService.find(userId, slug, username);
        if (!project) return res.status(404).json({ error: "Missing project" });

        const members = await ProjectService.findValidMembers(project.members);
        project.members = members;

        res.json(project);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.createProject = async (req, res, next) => {
    const { username } = req.params;
    const userId = req.user._id;
    const params = req.body;
    
    const userIssue = validate({ username }, { presence: true });
    const issues = validate(params, constraints.create);

    if (userIssue) return res.status(422).json({ err: userIssue });
    if (issues) return res.status(422).json({ err: issues });

    let { title } = params;
    params.slug = slugify(title);

    try {
        const project = await ProjectService.create(userId, username, params);
        // console.log(project);
        res.json(project);
    } catch (e) {
        if (e.code === 11000 && e.keyPattern?.slug ) {
            return res.status(400).json({ error: `Project name "${title}" already exists on this account` });
        }
        res.status(500).json({ error: e.message });
    }
};


exports.deleteProject = async (req, res, next) => {
    const userId = req.user._id;

    const {username, slug} = req.params;
    const issues = validate({ username, slug }, { username: {presence: true }, slug: { presence: true } });
    if (issues) return res.status(422).json({ err: issues });

    try {
        const project = await ProjectService.delete(userId, slug, username);
        if (!project) return res.status(404).json({ error: "Project not found" });
        res.json(project);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.updateProject = async (req, res, next) => {
    const userId = req.user._id;
    const {username, slug} = req.params;
    const paramsIssues = validate({ username, slug }, { username: {presence: true }, slug: { presence: true } });

    const allowedUpdates = ['title', 'description'];
    const updates = {};
    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const { title } = updates;
    if (title) {
        updates.slug = slugify(title);
    }
    const issues = validate(updates, constraints.update);

    if (paramsIssues) return res.status(422).json({ err: paramsIssues });
    if (issues) return res.status(422).json({ err: issues });

    try {
        const project = await ProjectService.updateProject(userId, slug, username, updates);
        if (!project) return res.status(404).json({ error: "Project not found" });
        res.json(project);
    } catch (e) {
        if (e.code === 11000 && e.keyPattern?.slug) {
            return res.status(400).json({ error: `Project name "${title}" already exists on this account` });
        }
        res.status(500).json({ error: e.message });
    }
};

// exports.getProjectMembers = async (req, res, next) => {
//     const { id: projectId } = req.params;
//     if (!projectId) return res.status(404).json({ error: "Project not found" });

//     const members = req.body;
//     console.log({members: members});
//     try {
//         const mem = await ProjectService.findMembers(members);
//         if (!mem) return res.status(404).json({ error: "No members found" });
//         res.json(mem);
//     } catch (e) {
//         res.status(500).json({ error: e.message });
//     }
// }

exports.addProjectMembers = async (req, res, next) => {
    const userId = req.user._id;

    const slug = req.params.slug;
    const slugIssues = validate({ slug }, { presence: true });

    const { members } = req.body;
    if (!Array.isArray(members) || members.length === 0) {
        return res.status(422).json({ err: "Members must be a non-empty array" });
    }
    const issues = validate({ members }, constraints.addMembers);

    if (slugIssues) return res.status(422).json({ err: slugIssues });
    if (issues) return res.status(422).json({ err: issues });

    try {
        const project = await ProjectService.addMembers(userId, slug, members);
        if (!project) return res.status(404).json({ error: "Failed to add new members" });
        res.json(project);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.removeProjectMembers = async (req, res, next) => {
    const userId = req.user._id;

    const { slug: slug, memberId } = req.params;
    console.log(slug)
    const issues = validate({ slug, memberId }, { slug: { presence: true }, memberId: { presence: true } });
    if (issues) return res.status(422).json({ err: issues });

    try {
        const project = await ProjectService.removeMembers(userId, slug, memberId);
        if (!project) return res.status(404).json({ error: "Failed to remove member" });
        res.json(project);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}