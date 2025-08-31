const TaskModelV2 = require('./task.model-v2');

const buildTaskFilter = (userId, projectId, taskId) => {
    if (!taskId) throw new Error("Task ID missing");

    // let filter = { _id: taskId, deleted: false, projectId: projectId };

    // if (user.role !== "admin") {
    //     filter.$or = [ { createdBy: user._id }, { assignedTo: user._id } ] 
    // }
    // return filter;

    return {
        _id: taskId,
        deleted: false,
        projectId: projectId,
        $or: [ { createdBy: userId }, { assignedTo: userId } ]
    };
}

// ------- SERVICES ------- //

exports.create = async (params = {}, userId, projectId) => {
    if (!userId || !projectId) throw new Error("Missing ID parameter/s");
    try {
        return await TaskModelV2.create({ ...params, createdBy: userId, projectId: projectId });
    } catch (e) {
        throw(e);
    }
};

exports.find = async (query = "", options = {}, id, projectId) => {
    try {
        let filter = { projectId: projectId, deleted : false, $or: [ { createdBy: id }, { assignedTo: id } ] };

        if (query) {
            filter.$text = { $search: query };
        }

        if (options.status) {
            filter.status = options.status;
        }

        const paginateOptions = {
            page: options.page || 1,
            limit: options.limit || 10,
            sort: options.sort || { createdDate: -1 },
        };
        return await TaskModelV2.paginate(filter, paginateOptions);
    } catch (e) {
        throw (e);
    }
};

exports.update = async (userId, projectId, taskId, updates = {}) => {
    if (!taskId) throw new Error("Failed task updated due to missing ID");
    if (Object.keys(updates).length === 0) throw new Error("Updates can't be null");
    try {
        const filter = buildTaskFilter(userId, projectId, taskId);
        return await TaskModelV2.findOneAndUpdate(filter, updates, { new: true });
    } catch (e) {
        throw (e);
    }
};

exports.delete = async (userId, projectId, taskId) => {
    if (!taskId) throw new Error("Missing task ID");
    try {
        const filter = buildTaskFilter(userId, projectId, taskId);
        const deletedTask =  await TaskModelV2.findOneAndUpdate(filter, { deleted: true }, { new: true });
        if (!deletedTask) throw new Error("Task not found");
        return deletedTask;
    } catch (e) {
        throw (e);
    }
};