const TaskService = require('./task.service');
const constraints = require('./task.validation');
const validate = require('validate.js');

exports.getTask = async (req, res, next) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const id = req.user._id;
        const options = { page: Number(page), limit: Number(limit) };

        const tasks = await TaskService.find(search || "", options, id);
        res.json(tasks);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.searchTask = async (req, res, next) => {
    try {
        const { search } = req.query;
        const id = req.user._id;

        const tasks = await TaskService.findAutoComplete(search || "", id);
        res.json(tasks);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.createTask = async (req, res, next) => {
    const params = { ...req.body };
    const id = req.user._id;
    const issues = validate(params, constraints.create);
    if (issues) return res.status(422).send({ err: issues });

    try { 
        const task = await TaskService.create(params, id);
        console.log(task);
        res.status(201);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.updateTask = async (req, res, next) => {
    const { id } = req.params;
    const idIssue = validate({ id }, { presence: true });

    const updates = req.body;
    const issues = validate({ ...updates }, constraints.update);

    if (idIssue) return res.status(422).send({ err: idIssue });
    if (issues) return res.status(422).send({ err: issues });

    try {
        const task = await TaskService.update({ _id: id }, updates);
        if (!task) return res.status(404).json({ error: "Task not found" });

        res.json(task);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.deleteTask = async (req, res, next) => {
    const { id } = req.params;
    const issues = validate({ id }, { presence: true });
    if (issues) return res.status(422).send({ err: issues });

    try {
        const task = await TaskService.delete(id);
        res.json(task);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}