const register = {
    firstName: {
        presence: { allowEmpty: false, message: "First name can't be blank" },
    },
    lastName: {
        presence: { allowEmpty: false, message: "Last name can't be blank" },
    },
    email: {
        presence: { allowEmpty: false, message: "Email is required" },
        email: { message: "is not valid" }
    },
    password: {
        presence: { allowEmpty: false, message: "Password is required" },
        length: { minimum: 8, message: "Password must be at least 8 characters" },
    }
}

const signIn = {
    email: {
        presence: { allowEmpty: false, message: "Email is required" },
    },
    password: {
        presence: { allowEmpty: false, message: "Password is required" },
    }
}

const update = {
    firstName: {},
    lastName: {},
}

module.exports = {
    register,
    signIn,
    update,
}