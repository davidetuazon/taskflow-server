const ProjectModel = require('./project.model');
const UserModel = require('../user/user.model');

exports.create = async (params = {}, userId) => {
    if (!userId) throw new Error("Missing user ID");
    try {
        return await ProjectModel.create({ ...params, owner: userId });
    } catch (e) {
        throw(e);
    }
}

exports.find = async (query = "", options = {}, userId) => {
    try {
        let filter = { deleted: false, $or: [ { owner: userId }, {members: userId } ] };

        if(query) {
            filter.$text = { $search: query };
        }

        const paginateOptions = {
            page: options.options || 1,
            limit: options.limit || 10,
            sort: options.sort || { createdDate: -1 },
        };
        return await ProjectModel.paginate(filter, paginateOptions);
    } catch (e) {
        throw(e);
    }
}

exports.delete = async (userId, projectId) => {
    if (!projectId) throw new Error("Missing project ID");
    try {
        const filter = { deleted: false, _id: projectId, owner: userId };
        const deletedProject = await ProjectModel.findOneAndUpdate(filter, { deleted: true }, { new: true });
        if (!deletedProject) throw new Error("Project not found");
        return deletedProject;
    } catch (e) {
        throw(e);
    }
}

exports.updateProject = async (userId, projectId, updates = {}) => {
    if (!projectId) throw new Error("Missing project ID");
    if (Object.keys(updates).length === 0) throw new Error("Updates can't be null");
    try {
        const filter = { deleted: false, _id: projectId, owner: userId}
        return await ProjectModel.findOneAndUpdate(filter, updates, { new: true });
    } catch (e) {
        throw(e);
    }
}

exports.addMembers = async (userId, projectId, members) => {
    if (!projectId) throw new Error("Missing project ID");
    if (members.length === 0) throw new Error("New members can't be null");
    try {
        const project = await ProjectModel.findById(projectId);
        if (project.owner.toString() !== userId.toString()) {
            throw new Error("Only project owner can add members");
        }

        const validUsers = await UserModel.find({ _id: { $in: members } });
        const oldMember = project.members.map(id => id.toString());

        const membersToAdd = validUsers.filter(u => !oldMember.includes(u._id.toString()));
        project.members.push(...membersToAdd);

        await project.save();
        return project;
    } catch (e) {
        throw(e);
    }
}

exports.removeMembers = async (userId, projectId, memberId) => {
    if (!projectId || !memberId) throw new Error("Missing ID parameter/s");
    try {
        const project = await ProjectModel.findById(projectId);
        if (project.owner.toString() !== userId.toString()) {
            throw new Error("Only project owner can remove members");
        }

        const validUser = await UserModel.findById(memberId);
        if (!validUser) throw new Error("User does not exist");

        if (!project.members.some(m => m.toString() === validUser._id.toString())) throw new Error("User is not a project member");

        const updatedMembers = project.members.filter(m => m.toString() !== validUser._id.toString());
        project.members = updatedMembers;

        await project.save();
        return project;
    } catch (e) {
        throw (e);
    }
}
