const create = {
    title: {
        presence: { allowEmpty: false, message: "Project title is required" }
    },
    description: {
        length: { maximum: 500 },
    },
    members: {}
};

const update = {
    title: {},
    description: {
        length: { maximum: 500, allowEmpty: true }
    }
}

const addMembers = {
    members: {
        presence: { allowEmpty: false, message: "are required" },
    }
}

module.exports = {
    create,
    update,
    addMembers,
}