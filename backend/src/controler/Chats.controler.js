const chatModel = require("../models/Chats.models");

async function createChats(req,res){
    try {
        const { title} = req.body;
        const user = req.user;

        const chats = await chatModel.create({
            user: user._id,
            title: title ,
        });

        res.status(200).json({
            message:"chat created successfully",
            chat:{
                id:chats._id,
                title:chats.title,
                lastActivity:chats.lastActivity,
            }
        });
    } catch (error) {
        console.log("Error in createChats", error);
        res.status(500).json({ error: "Failed to create chat", message: error.message });
    }
}

module.exports = {createChats};