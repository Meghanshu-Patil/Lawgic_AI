const mongoose = require("mongoose");

const Chatmodel = new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    title : {
        type: String,
        required: true,
    },
    lastActivity : {
        type: Date,
        default: Date.now,
    },
},{
timestamp : true,
})  

const chatModel = mongoose.model("Chat",Chatmodel);

module.exports = chatModel;
