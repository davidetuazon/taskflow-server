const projectModel = require('../../project/project.model');
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

const slugProjectMatcher = async (userId, slug) => {
    const filter = { deleted: false, $or: [{ owner: userId}, {members: userId}], slug: slug };
    return await projectModel.findOne(filter);
}

// ------- SERVICES ------- //

exports.overview = async (userId) => {
    if (!userId) throw new Error("Unauthorized");
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const todayEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    try {
        const overview = await TaskModelV2.aggregate([
            {
                $match: {
                    deleted: false,
                    $or: [
                        { createdBy: userId },
                        { assignedTo: userId }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    inProgress: { $sum: { $cond: [{ $and: [ { $eq: ["$status", "in-progress"] }, { $gte: ["$dueDate", new Date()] } ] }, 1, 0] } },
                    inReview: { $sum: { $cond: [{ $and: [ { $eq: ["$status", "in-review"] }, { $gte: ["$dueDate", new Date()] } ] }, 1, 0] } },
                    done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
                    dueToday: { $sum: { $cond: [{ $and: [{ $gte: ["$dueDate", todayStart] }, { $lte: ["$dueDate", todayEnd] }, { $ne: ["$status", "done"] } ] }, 1, 0] } },
                    overDue: { $sum: { $cond: [{ $and: [{ $lt: ["$dueDate", todayStart] }, { $ne: ["$status", "done"] }] }, 1, 0] } }
                }
            }
        ]);

        return overview[0] || {
            total: 0,
            inProgress: 0,
            inReview: 0,
            done: 0,
            dueToday: 0,
            overDue: 0
        };
    } catch (e) {
        throw e;
    }
};

exports.getFeed = async (options = {}, userId) => {
    if (!userId) throw new Error("Unauthorized");
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const todayEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    try {
        let filter = { deleted: false };
        filter.status = { $ne: 'in-review'};
        filter.$or = [ { createdBy: userId }, { assignedTo: userId } ];

        if (options.filter === "overdue") {
            filter.dueDate = { $lt: todayStart };
        }

        if (options.filter === "today") {
            filter.dueDate = { $gte: todayStart, $lte: todayEnd };
        }

        const limit = parseInt(options.limit) || 3;
        
        const task = await TaskModelV2.find(filter)
            .sort({ dueDate: 1 })
            .limit(limit)
            .populate({
                path: 'projectId',
                select: 'slug',
            });

        return task;
    } catch (e) {
        throw (e);
    }
}

exports.create = async (params = {}, userId, slug) => {
    if (!userId || !slug) throw new Error("Missing ID parameter/s");
    try {
        const match = await slugProjectMatcher(userId, slug);
        if (!match) throw new Error("Missin project");
        const projectId = match._id;

        return await TaskModelV2.create({ ...params, createdBy: userId, projectId: projectId });
    } catch (e) {
        throw(e);
    }
};

exports.find = async (options = {}, userId, slug) => {
    if (!userId) throw new Error("Unauthorized");

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const todayEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    try {
        const match = await slugProjectMatcher(userId, slug);
        if (!match) throw new Error("Missing project");
        const projectId = match._id;

        let filter = { 
            projectId: projectId,
            deleted : false,
            $or: [
                { createdBy: userId },
                { assignedTo: userId }
            ] 
        };
        
        switch (options.filter) {
            case 'overdue':
                filter.dueDate = { $lt: todayStart };
                break;
            case 'today':
                filter.dueDate = { $gte: todayStart, $lte: todayEnd };
                break;
            case 'upcoming':
                filter.dueDate = { $gt: todayEnd };
                break;
            case 'in-progress':
            filter.status = 'in-progress';
            break;
            case 'in-review':
                filter.status = 'in-review';
                break;
            case 'default':
                break;
        }

        let sort = { createdDate: -1 };

        if (options.sort === 'default') {
            sort;
        } else if (options.sort === 'ascending') {
            sort = { dueDate: 1 };
        } else if (options.sort == 'descending') {
            sort = { dueDate: -1 };
        }
    
        const paginateOptions = {
            page: options.page || 1,
            limit: options.limit || 10,
            sort,
            populate: {
                path: 'projectId',
                select: 'slug'
            }
        };
        return await TaskModelV2.paginate(filter, paginateOptions);
    } catch (e) {
        throw (e);
    }
};

exports.update = async (userId, slug, taskId, updates = {}) => {
    if (!taskId) throw new Error("Failed task updated due to missing ID");
    if (Object.keys(updates).length === 0) throw new Error("Updates can't be null");
    try {
        const match = await slugProjectMatcher(userId, slug);
        if (!match) throw new Error("Missing project");
        const projectId = match._id;

        const filter = buildTaskFilter(userId, projectId, taskId);
        return await TaskModelV2.findOneAndUpdate(filter, updates, { new: true });
    } catch (e) {
        throw (e);
    }
};

exports.delete = async (userId, slug, taskId) => {
    if (!taskId) throw new Error("Missing task ID");
    try {
        const match = await slugProjectMatcher(userId, slug);
        if (!match) throw new Error("Missing project");
        const projectId = match._id;

        const filter = buildTaskFilter(userId, projectId, taskId);
        const deletedTask =  await TaskModelV2.findOneAndUpdate(filter, { deleted: true }, { new: true });
        if (!deletedTask) throw new Error("Task not found");
        return deletedTask;
    } catch (e) {
        throw (e);
    }
};