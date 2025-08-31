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

exports.getTask = async (req, res, next) => {
    const userId = req.user._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id: projectId } = req.params;
    const issues = validate({ projectId }, { presence: true });
    if (issues) return res.status(422).json({ err: issues });

    try {
        const { search } = req.query;
        const options = parsePagination(req.query);

        const task = await TaskServiceV2.find(search || "", options, userId, projectId);
        res.json(task);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.createTask = async (req, res, next) => {
    const userId = req.user._id;
    const { id: projectId } = req.params;
    const idIssues = validateIds({ userId, projectId });
    // const idIssues = validate({ userId, projectId }, { userId: { presence: true },  projectId: { presence: true } });

    const params = req.body;
    const issues = validate(params, constraints.create);

    if (idIssues) return res.status(401).json({ err: idIssues });
    if (issues) return res.status(422).json({ err: issues });

    try {
        const task = await TaskServiceV2.create(params, userId, projectId);
        // console.log(task);
        res.json(task);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.updateTask = async (req, res, next) => {
    const userId = req.user._id; 

    const { id: projectId, taskId } = req.params;
    const idIssues = validateIds({ projectId, taskId});

    const updates = req.body;
    const issues = validate(updates, constraints.update);

    if (idIssues) return res.status(422).json({ err: idIssues });
    if (issues) return res.status(422).json({ err: issues });

    try {
        const task = await TaskServiceV2.update(userId, projectId, taskId, updates);
        if (!task) return res.status(404).json({ error: "Task not found" });

        res.json(task);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.deleteTask = async (req, res, next) => {
    const userId = req.user._id;

    const { id: projectId, taskId } = req.params;
    const idIssues = validateIds({ projectId, taskId });
    if (idIssues) return res.status(422).json({ err: idIssues });

    try {
        const deletedTask = await TaskServiceV2.delete(userId, projectId, taskId);
        if (!deletedTask) return res.status(404).json({ error: "Task not found" });

        res.send(200);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}