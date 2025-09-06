const ProjectModel = require('./project.model');
const UserModel = require('../user/user.model');
const { mongoose } = require('mongoose');

exports.create = async (params = {}, userId) => {
    if (!userId) throw new Error("Missing user ID");
    try {
        return await ProjectModel.create({ ...params, owner: userId });
    } catch (e) {
        throw(e);
    }
}

exports.findOne = async (userId, slug) => {
    if (!userId) throw new Error("Missing user ID");
    try {
        const filter = {
            deleted: false,
            slug: slug,
            $or: [
                { owner: userId },
                { members: userId }
            ]
        };
        return await ProjectModel.findOne(filter);
    } catch (e) {
        throw (e);
    }
}

exports.find = async (userId, slug) => {
    try {
        const filter = {
            deleted: false,
            slug: slug,
            $or: [
                { owner: userId },
                { members: userId }
            ]
        };
        return await ProjectModel
            .findOne(filter)
            .populate({
                path: 'owner',
                select: 'email',
            })
            .lean();
    } catch (e) {
        throw(e);
    }
}

exports.findAll = async (query = "", options = {}, userId) => {
    try {
        let filter = {
            deleted: false,
            $or: [
                { owner: userId },
                { members: userId }
            ]
        };

        if(query) {
            filter.$text = { $search: query };
        }

        const paginateOptions = {
            page: options.options || 1,
            limit: options.limit || 10,
            sort: options.sort || { createdDate: -1 },
            lean: true,
            populate: { path: 'owner', select: 'email' }
        };
        const project = await ProjectModel.paginate(filter, paginateOptions);
        return project;
    } catch (e) {
        throw(e);
    }
}

exports.findById = async (userId) => {
    if (!userId) throw new Error("Missing ID");
    try {
        return await ProjectModel.findById(userId);
    } catch (e) {
        throw(e);
    }
}

exports.delete = async (userId, slug) => {
    if (!slug) throw new Error("Missing project");
    try {
        const filter = { deleted: false, slug: slug, owner: userId };
        const deletedProject = await ProjectModel.findOneAndUpdate(filter, { deleted: true }, { new: true });
        if (!deletedProject) throw new Error("Project not found");
        return deletedProject;
    } catch (e) {
        throw(e);
    }
}

exports.updateProject = async (userId, slug, updates = {}) => {
    if (!slug) throw new Error("Missing project");
    if (Object.keys(updates).length === 0) throw new Error("Updates can't be null");
    try {
        const filter = { deleted: false, slug: slug, owner: userId}
        return await ProjectModel.findOneAndUpdate(filter, updates, { new: true });
    } catch (e) {
        throw(e);
    }
}

exports.findValidMembers = async (ids = []) => {
    if (!ids.length) return [];
    
    const objectIds = ids.map(id =>
        id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(id)
    );
    return await UserModel
        .find({ deleted: false, _id: { $in: objectIds } })
        .select('_id email fullName');
}

exports.addMembers = async (userId, slug, members) => {
    if (!slug) throw new Error("Missing project");
    if (members.length === 0) throw new Error("New members can't be null");
    try {
        const filter = { deleted: false, owner: userId, slug: slug }
        const project = await ProjectModel.findOne(filter);
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

exports.removeMembers = async (userId, slug, memberId) => {
    if (!slug || !memberId) throw new Error("Missing ID parameter/s");
    try {
        const filter = { deleted: false, owner: userId, slug: slug }
        const project = await ProjectModel.findOne(filter);
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
