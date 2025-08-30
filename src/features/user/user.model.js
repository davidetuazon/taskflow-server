const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

// need to add a field for team members
const userSchema = new Schema(
    {
        deleted: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            enum: ['default', 'admin' ],
            default: 'default',
        },

        fullName: String,
        firstName: String,
        lastName: String,

        email: {
            type: String,
            lowercase: true,
            unique: true,
            match: [/\S+@\S+\.\S+/, 'Please use a valid email address'],
        },
        password: String,

        refreshToken: String,

    }, { timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' } }
);
userSchema.index({
    email: 'text',
    firstName: 'text',
    lastName: 'text',
    fullName: 'text',
});
userSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('User', userSchema);