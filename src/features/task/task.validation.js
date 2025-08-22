const create = {
    title: {
        presence: { allowEmpty: false, message: "A title is required" },
    },
    description: {
        length: { maximum: 500, allowEmpty: false, message: "A description is required" },
    },
    status: {
        inclusion: { 
            within: ["todo", "in-progress", "done"], message: "is not valid", allowEmpty: true }, 
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
            within: ["todo", "in-progress", "done"], message: "is not valid", allowEmpty: true }, 
    },
    dueDate: {}
}

module.exports = {
    create,
    update,
}