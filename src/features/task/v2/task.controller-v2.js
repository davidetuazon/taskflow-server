const TaskServiceV2 = require('./task.service-v2');
const constraints = require('../task.validation');
const validate = require('validate.js');

// ------ helper functions ------ //
const validateIds = (ids) => {
    const issues = validate(ids, Object.fromEntries(
        Object.keys(ids).map(i => [i, { presence: true }])
    ));
    return issues;
};

const parsePagination = ({ page = 1, limit = 10}) => ({
    page: Math.max(1, parseInt(page) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit) || 10))
});

// ------ contorllers ------ //

exports.taskOverview = async (req, res, next) => {
    const userId = req.user._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    try {
        const overview = await TaskServiceV2.overview(userId);
        res.json(overview);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.getFeed = async (req, res, next) => {
    const userId = req.user._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { username } = req.params;
    const issues = validate({ username }, { presence: true });
    if (issues) return res.status(422).json({ error: issues });

    const { filter, limit = 3 } = req.query;
    try {
        const feed = await TaskServiceV2.getFeed({ filter, limit }, userId, username);
        if (!feed) return res.status(404).json({ error: "Task not found"});
        res.json(feed);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.listTask = async (req, res, next) => {
    const userId = req.user._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { username, slug }= req.params;
    const issues = validate({ username, slug }, { username: { presence: true }, slug: { presence: true } });
    if (issues) return res.status(422).json({ err: issues });

    try {
        const { filter, sort } = req.query;
        const options = parsePagination(req.query);

        const task = await TaskServiceV2.findAll({ filter, sort, ...options }, userId, username, slug);
        if (!task) return res.status(404).json({ error: "Task not found" });
        res.json(task);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.getTask = async (req, res, next) => {
    const userId = req.user._id;
    const idIssues = validateIds({ userId });

    const { username, slug, taskId } = req.params;
    const paramIssues = validate({
            username,
            slug,
            taskId
        }, {
            username: {
                presence: true 
            },
            slug: {
                presence: true
            },
            taskId: {
                presence: true
            }
        });

    if (idIssues) return res.status(401).json({ err: idIssues });
    if (paramIssues) return res.status(422).json({ err: paramIssues });

    try {
        const task = await TaskServiceV2.find(userId, username, slug, taskId);
        if (!task) return res.status(404).json({ error: "Task not found" });
        res.json(task);  
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}

exports.createTask = async (req, res, next) => {
    const userId = req.user._id;
    const idIssues = validateIds({ userId });

    const { username, slug } = req.params;
    const paramIssues = validate({ username, slug }, { username: { presence: true }, slug: { presence: true } });

    const params = req.body;
    const issues = validate(params, constraints.create);

    if (idIssues) return res.status(401).json({ err: idIssues });
    if (paramIssues) return res.status(422).json({ err: paramIssues });
    if (issues) return res.status(422).json({ err: issues });

    try {
        const task = await TaskServiceV2.create(params, userId, username, slug);
        // console.log(task);
        res.json(task);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.updateTask = async (req, res, next) => {
    const userId = req.user._id;
    const idIssues = validateIds({ userId });

    const { username, slug, taskId } = req.params;
    const paramIssues = validate({
            username,
            slug,
            taskId
        }, {
            username: {
                presence: true 
            },
            slug: {
                presence: true
            },
            taskId: {
                presence: true
            }
        });

    const updates = req.body;
    const issues = validate(updates, constraints.update);

    if (idIssues) return res.status(422).json({ err: idIssues });
    if (paramIssues) return res.status(422).json({ err: paramIssues });
    if (issues) return res.status(422).json({ err: issues });

    try {
        const task = await TaskServiceV2.update(userId, username, slug, taskId, updates);
        if (!task) return res.status(404).json({ error: "Task not found" });

        res.json(task);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.deleteTask = async (req, res, next) => {
    const userId = req.user._id;
    const idIssues = validateIds({ userId });

    const { username, slug, taskId } = req.params;
    const paramIssues = validate({
            username,
            slug,
            taskId
        }, {
            username: {
                presence: true 
            },
            slug: {
                presence: true
            },
            taskId: {
                presence: true
            }
        });

    if (idIssues) return res.status(401).json({ err: idIssues });
    if (paramIssues) return res.status(422).json({ err: paramIssues });

    try {
        const deletedTask = await TaskServiceV2.delete(userId, username, slug, taskId);
        if (!deletedTask) return res.status(404).json({ error: "Task not found" });

        res.send(200);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}