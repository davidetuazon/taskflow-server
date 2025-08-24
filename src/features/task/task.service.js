const TaskModel = require('./task.model');

// basically this handles business logic/database queries

exports.create = async (id, params = {}) => {
    try {

        return await TaskModel.create({ ...params, createdBy: id });
    } catch (e) {
        throw(e);
    }
}

exports.find = async (query = "", options = {}, id) => {
    try {
        const filter = query ? 
        { $text: { $search: query }, $or: [ { createdBy: id }, { assignedTo: id } ] }
        : { $or: [ { createdBy: id }, { assignedTo: id } ] };
        const paginateOptions = {
            page: options.page || 1,
            limit: options.limit || 10,
            sort: options.sort || { createdAt: -1 },
        };
        return await TaskModel.paginate(filter, paginateOptions);
    } catch (e) {
        throw(e);
    }
}

exports.update = async (id, updates = {}) => {
    try {
        return await TaskModel.findByIdAndUpdate(id, updates, { new: true });
    } catch (e) {
        throw(e);
    }
}

exports.delete = async (id) => {
    try {
        const task = await TaskModel.findById(id);
        if (task.deleted) throw new Error("Task already deleted");

        const deletedTask = await TaskModel.findByIdAndUpdate(id, { deleted: true }, { new: true });
        if (!deletedTask) throw new Error("Task not found");
        return deletedTask;
    } catch (e) {
        throw(e);
    }
}