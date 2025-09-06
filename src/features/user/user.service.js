const userModel = require('./user.model');
const UserModel = require('./user.model');
const bcrypt = require('bcryptjs');

exports.create = async (params = {}) => {
    try {
        return await UserModel.create(params);
    } catch (e) {
        throw(e);
    }
}

exports.signIn = async (params) => {
    try {
        const user = await UserModel.findOne({ 
            deleted: false,
            email: params.email
         });

        if (!user) throw({
            status: 404,
            message: 'User not found'
        });

        const matched = await bcrypt.compare(params.password, user.password);
        if (!matched) throw({
            status: 400,
            message: 'Incorrect username / password'
        });

        return ({
            role: user.role,
            email: user.email,
            username: user.username,
        })
    } catch (e) {
        throw(e);
    }
}

exports.find = async (query = "", options = {}) => {
    try {
        const filter = query ? { $text: { $search: query }, deleted: false } : { deleted: false };
        const paginateOptions = {
            page: options.page || 1,
            limit: options.limit || 10,
            sort: options.sort || { createdAt: -1 },
        }

        return await UserModel.paginate(filter, paginateOptions);
    } catch (e) {
        throw(e);
    }
}

exports.update = async (id, updates = {}) => {
    try {
        return await UserModel.findByIdAndUpdate(id, updates, { new: true });
    } catch (e) {
        throw(e);
    }
}

exports.delete = async (id) => {
    try {
        const user = await UserModel.findById(id);
        if (user.deleted) throw new Error("User already deleted");

        const suffix = new Date().toISOString().split("T")[0];
        const deletedUser = await UserModel.findByIdAndUpdate(id, {
            deleted: true,
            email: `${user.email}_deleted_${suffix}_${Math.random().toString(36).slice(2,6)}`
            }, { new: true });
        if (!deletedUser) throw new Error("User not found");
        return deletedUser;
    } catch (e) {
        throw(e);
    }
}