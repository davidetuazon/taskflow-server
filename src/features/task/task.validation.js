const create = {
    title: {
        presence: { allowEmpty: false, message: "A title is required" },
    },
    description: {
        length: { maximum: 500 },
    },
    status: {
        inclusion: { 
            within: ["open", "in-progress", "in-review", "done"],
            message: "is not valid",
            allowEmpty: true }, 
    },
    dueDate: {}
}

const update = {
    title: {},
    description: {
        length: { maximum: 500, allowEmpty: true  },
    },
    status: {
        inclusion: { 
            within: ["open", "in-progress", "in-review", "done"],
            message: "is not valid",
            allowEmpty: true }, 
    },
    dueDate: {}
}

module.exports = {
    create,
    update,
}