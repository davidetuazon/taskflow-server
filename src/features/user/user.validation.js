const register = {
    username: 
    {
        presence: { allowEmpty: false, message: "Username is required"},
        length: { minimum: 5, maximum: 20, message: "Username must be between 5-20 characters" },
        format: {
            pattern: /^(?!-)[a-zA-Z0-9]*-?[a-zA-Z0-9]*(?<!-)$/,
            message: "Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen"
        }
    },
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
    username: {},
    firstName: {},
    lastName: {},
}

module.exports = {
    register,
    signIn,
    update,
}