const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const taskSchema = new Schema(
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
        description: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["todo", "in-progress", "done"],
            default: "todo",
        },
        dueDate: {
            type: Date,
        },


        createdBy: {
            type: Schema.Types.ObjectId, ref: "User", required: true
        },
        assignedTo: {
            type: Schema.Types.ObjectId, ref: "User"
        },
        
    }, { timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' } }
);
taskSchema.index({
    title: "text",
    description: "text",
    status: "text",
});
taskSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Task', taskSchema);