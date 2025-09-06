const ProjectModel = require('./project.model');
const UserModel = require('../user/user.model');
const { mongoose } = require('mongoose');

exports.create = async (userId, username, params = {}) => {
    if (!userId) throw new Error("Missing user ID");
    try {
        const matched = await UserModel.findOne({ username: username, deleted: false });
        if (!matched) throw new Error("User not found or deleted");

        if ( matched._id.toString() !== userId.toString()) {
            throw { status: 403, message: "Cannot create projects for other users" };
        }

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

exports.find = async (userId, slug, username) => {
    try {
        const me = await UserModel.findOne({ _id: userId, deleted: false });
        if (!me) throw new Error("Unauthorized");

        const user = await UserModel.findOne({ username: username, deleted: false });
        if (!user)throw new Error("User not found or deleted");

        let filter = {
            deleted: false,
            slug: slug
        };

        if (me._id.toString() === user._id.toString()) {
            filter.$or = [
                { owner: me._id },
                { members: me._id }
            ];
        } else {
            filter.owner = user._id;
            filter.members = me._id;
        }


        return await ProjectModel
            .findOne(filter)
            .populate({
                path: 'owner',
                select: 'email username',
            })
            .lean();
    } catch (e) {
        throw(e);
    }
}

exports.findAll = async (query = "", options = {}, userId, username) => {
    try {
        const user = await UserModel.findOne({ username: username, deleted: false });
        if (!user)throw new Error("User not found or deleted");

        if(user._id.toString() !== userId.toString()) {
            throw { status: 403, message: "Cannot view projects you're not a member or own" };
        }

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
            populate: { path: 'owner', select: 'email username' }
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

exports.delete = async (userId, slug, username) => {
    if (!slug) throw new Error("Missing project");
    try {
        const matched = await UserModel.findOne({ username: username, deleted: false });
        if (!matched) throw new Error("User not found or deleted");

        if (matched._id.toString() !== userId.toString()) {
            throw { status: 403, message: "Cannot delete projects for other users" };
        }

        const filter = { deleted: false, slug: slug, owner: matched._id };
        const deletedProject = await ProjectModel.findOneAndUpdate(filter, { deleted: true }, { new: true });
        if (!deletedProject) throw new Error("Project not found");
        return deletedProject;
    } catch (e) {
        throw(e);
    }
}

exports.updateProject = async (userId, slug, username, updates = {}) => {
    if (!slug) throw new Error("Missing project");
    if (Object.keys(updates).length === 0) throw new Error("Updates can't be null");
    try {
        const matched = await UserModel.findOne({ username: username, deleted: false });
        if (!matched) throw new Error("User not found or deleted");

        if (matched._id.toString() !== userId.toString()) {
            throw { status: 403, message: "Cannot update projects for other users" };
        }

        const filter = { deleted: false, slug: slug, owner: matched._id}
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
        .select('_id email fullName username');
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
