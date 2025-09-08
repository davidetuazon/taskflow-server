const projectModel = require('../../project/project.model');
const UserModel = require('../../user/user.model');
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

const slugProjectMatcher = async (userId, username, slug) => {
    const user = await UserModel.findOne({ deleted: false, username: username });
    if (!user) throw new Error("User not found or deleted");

    const filter = { 
        deleted: false,
        slug: slug,
    };
    
    if (user._id.toString() === userId.toString()) {
        filter.$or = [
            { owner: userId },
            { members: userId }
        ]
    } else {
        filter.owner = user._id;
        filter.members = userId;
    }

    return await projectModel.findOne(filter);
}

// ------- SERVICES ------- //

exports.overview = async (userId) => {
    if (!userId) throw { status: 401, message: "Unauthorized" };
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

exports.getFeed = async (options = {}, userId, username) => {
    if (!userId) throw { status: 401, message: "Unauthorized" };
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const todayEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    try {
        const user = await UserModel.findOne({ username: username, deleted: false });
        if (!user) throw new Error("User not found or deleted");

        if (user._id.toString() !== userId.toString()) {
            throw { status: 401, message: 'Unauthorized' };
        }

        let filter = { 
            deleted: false
        };

        filter.status = { $ne: 'in-review'};
        filter.$or = [ { createdBy: user._id }, { assignedTo: user._id } ];

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
            })
            .lean();

        return task;
    } catch (e) {
        throw (e);
    }
}

exports.create = async (params = {}, userId, username, slug) => {
    if (!userId || !slug) throw new Error("Missing ID parameter/s");
    try {
        const project = await slugProjectMatcher(userId, username, slug);
        if (!project) throw { status: 404, message: "Project not found or missing authorization" };

        return await TaskModelV2.create({ ...params, createdBy: userId, projectId: project._id });
    } catch (e) {
        throw(e);
    }
};

exports.findAll = async (options = {}, userId, username, slug) => {
    if (!userId) throw { status: 401, message: "Unauthorized" };
    if (!username || !slug) throw new Error("Missing ID parameter/s");

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const todayEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    try {
        const project = await slugProjectMatcher(userId, username, slug);
        if (!project) throw { status: 404, message: "Project not found or missing authorization" };

        let filter = { 
            projectId: project._id,
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

    
        if (options.sort === 'ascending') {
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
            },
            lean: true,
        };
        return await TaskModelV2.paginate(filter, paginateOptions);
    } catch (e) {
        throw (e);
    }
};

exports.find = async (userId, username, slug, taskId) => {
    if (!userId) throw { status: 401, message: "Unauthorized" };
    try {
        const project = await slugProjectMatcher(userId, username, slug);
        if (!project) throw { status: 404, message: "Project not found or missing authorization" };

        return await TaskModelV2
        .findOne({ deleted: false, projectId: project._id, _id: taskId })
        .populate({
            path: 'assignedTo',
            select: 'email username fullName'
        });
    } catch (e) {
        throw (e);
    }
}

exports.update = async (userId, username, slug, taskId, updates = {}) => {
    if (!userId) throw { status: 401, message: "Unauthorized" };
    if (!taskId) throw new Error("Failed task updated due to missing task ID");
    if (Object.keys(updates).length === 0) throw new Error("Updates can't be null");
    try {
        const project = await slugProjectMatcher(userId, username, slug);
        if (!project) throw { status: 404, message: "Project not found or missing authorization" };

        const filter = buildTaskFilter(userId, project._id, taskId);
        return await TaskModelV2.findOneAndUpdate(filter, updates, { new: true });
    } catch (e) {
        throw (e);
    }
};

exports.delete = async (userId, username, slug, taskId) => {
    if (!userId) throw { status: 401, message: "Unauthorized" };
    if (!taskId) throw new Error("Missing task ID");
    try {
        const project = await slugProjectMatcher(userId, username, slug);
        if (!project) throw new Error("Missing project");

        const filter = buildTaskFilter(userId, project._id, taskId);
        const deletedTask =  await TaskModelV2.findOneAndUpdate(filter, { deleted: true }, { new: true });
        if (!deletedTask) throw new Error("Task not found");
        return deletedTask;
    } catch (e) {
        throw (e);
    }
};