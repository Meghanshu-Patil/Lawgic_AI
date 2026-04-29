const mongoose = require('mongoose');


const messageSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    chat:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Chat',
        required:true,
    },
    content:{
        type:String,
        required:true,
    },
    sender:{ 
        type:String,
        enum:['user','model'],
        required:true,
    },
    fileUrl: {
        type: String,
        required: false,
    },
    mimeType: {
        type: String,
        required: false,
    }
}, {
    timestamps:true});

const message = mongoose.model('Message', messageSchema);

module.exports = message;