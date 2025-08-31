const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const taskSchemaV2 = new Schema(
    {
        deleted: {
            type: Boolean,
            default: false,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        dueDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["open", "in-progress", "in-review", "done"],
            default: "open",
        },
        description: {
            type: String,
            default: "",
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        assignedTo: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
    }, { timestamps: { createdAt: "createdDate", updatedAt: "updatedDate" } }
);
taskSchemaV2.index({
    projectId: 1,
    dueDate: 1,
});
taskSchemaV2.index({
    projectId: 1,
    status: 1,
});
taskSchemaV2.index({
    assignedTo: 1,
});
taskSchemaV2.plugin(mongoosePaginate);
module.exports = mongoose.model("TaskV2", taskSchemaV2);