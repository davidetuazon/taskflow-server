const TaskModel = require('./task.model');

// basically this handles business logic/database queries

exports.create = async (params = {}, id) => {
    try {

        return await TaskModel.create({ ...params, createdBy: id });
    } catch (e) {
        throw(e);
    }
}

exports.find = async (query = "", options = {}, id) => {
    try {
        const filter = query ? 
        { deleted: false, $text: { $search: query }, $or: [ { createdBy: id }, { assignedTo: id } ], }
        : { deleted: false, $or: [ { createdBy: id }, { assignedTo: id } ] };
        const paginateOptions = {
            page: options.page || 1,
            limit: options.limit || 10,
            sort: options.sort || { createdDate: -1 },
        };
        return await TaskModel.paginate(filter, paginateOptions);
    } catch (e) {
        throw(e);
    }
}

exports.findAutoComplete = async (query = "", id) => {
    try {
        const filter = query ?
        { $and: [ { $or: [ { createdBy: id }, { assignedTo: id } ] }, { title: { $regex: query, $options: "i" } } ] } :
        { $or: [{ createdBy: id }, { assignedTo: id }] };

        return await TaskModel.find(filter).limit(10);
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