const mongoose = require('mongoose');

const graphSchema = new mongoose.Schema({
    userId: {
        type : mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    topic: {
        type:String,
        required: true,
    },
    graph: {
        type: Object,
        required: true,
    },
    createdAt: {
        type:Data,
        default: Date.now,
    },
});

module.exports = mongoose.model('Graph', graphSchema);