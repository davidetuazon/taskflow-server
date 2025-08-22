require('dotenv').config();

const jwt = require('jsonwebtoken');
const UserModel = require('../../features/user/user.model');
const CONSTANTS = require('./constants');
const { ROLES } = require('./constants');

// check token validity, attach user info
const authenticate = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);
    try {
        const userLogged = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = await UserModel.findOne({ email: userLogged.email }).select(CONSTANTS.USER_FIELD);
        console.log({ user: req.user });

        if (!req.user) return res.status(404).json({ message: "User not found" });
        next();
    } catch (e) {
        return res.sendStatus(403);
    }
}

// admin only access
const authorize = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);
    try {
        const userLogged = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = await UserModel.findOne({ email: userLogged.email }).select(CONSTANTS.USER_FIELD);
        // console.log({ user: req.user });

        if (!req.user || req.user.role !== ROLES.ADMIN) {
            return res.status(401).json({ message: 'Unauthorized'});
        }
        next();
    } catch (e) {
        return res.sendStatus(403);
    }
}

module.exports = {
    authenticate,
    authorize,
}