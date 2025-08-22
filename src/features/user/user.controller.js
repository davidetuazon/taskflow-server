require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const validate = require('validate.js');
const constraints = require('./user.validation');
const UserService = require('./user.service');

exports.register = async (req, res, next) => {
    const params = { ...req.body };

    // params.firstName = params.firstName?.trim();
    // params.lastName = params.lastName?.trim();
    // params.email = params.email?.trim().toLowerCase();
    // params.password = params.password?.trim();

    const issues = validate(params, constraints.register);
    if (issues) return res.status(422).send({ err: issues });
    
    try {
        params.password = await bcrypt.hash(params.password, 16);
        await UserService.create(params);
    
        res.status(201).json({ message: 'Registration successful' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.login = async (req, res, next) => {
    const params = { ...req.body };
    const issues = validate(params, constraints.signIn);
    if (issues) return res.status(422).send({ err: 'Invalid parameter/s' });

    try {
        const user = await UserService.signIn(params);
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const payload = {
            role: user.role,
            email: user.email
        };
        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
        
        res.send({
            role: payload.role,
            email: payload.email,
            token: accessToken
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

// should have a logic for adding users into their team
exports.getUsers = async (req, res, next) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const options = { page: Number(page), limit: Number(limit) };

        const users = await UserService.find(search || "", options);
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.updateUser = async (req, res, next) => {
    const { id } = req.params;
    const idIssues = validate({ id }, { presence: true });
    if (idIssues) return res.status(422).json({ err: idIssues });

    const updates = req.body;
    const issues = validate({ ...updates }, constraints.update);
    if (issues) return res.status(422).json({ err: issues });

    try {
        const user = await UserService.update({ _id: id }, updates);
        if (!user) return res.status(404).json({ err: "User not found" });

        res.json(user);
    } catch (e) {
        res.status(500).json({ err: e.message });
    }
}

exports.deleteUser = async (req, res, next) => {
    const { id } = req.params;
    const issues = validate({ id }, { presence: true });
    if (issues) return res.status(422).json({ err: issues });

    try {
        const deletedUser = await UserService.delete(id);
        console.log(deletedUser);
        
        res.status(200);
    } catch (e) {
        res.status(500).json({ err: e.message });
    }
}