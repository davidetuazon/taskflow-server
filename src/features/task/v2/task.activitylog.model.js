const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const ActivitySchema = new Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    details: {
        type: String,
    },
},  { timestamps: true });
ActivitySchema.index({
    taskId: 1,
    createdAt: -1
});
ActivitySchema.plugin(mongoosePaginate);
module.exports = mongoose.model('ActivityLog', ActivitySchema);