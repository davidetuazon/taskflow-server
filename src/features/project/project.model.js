const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const ProjectSchema = new Schema(
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
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }]
    }, {timestamps: { createdAt: "createdDate", updatedAt: "updatedDate" } }
);
ProjectSchema.index({
    owner: 1,
});
ProjectSchema.index({
    members: 1,
});
ProjectSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Project", ProjectSchema);
