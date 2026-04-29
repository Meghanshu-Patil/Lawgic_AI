const chatModel = require("../models/Chats.models");

const messageModel = require("../models/message.modle");

async function createChats(req,res){
    try {
        const { title} = req.body;
        const user = req.user;

        const chats = await chatModel.create({
            user: user._id,
            title: title || "New Legal Case",
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

async function getUserChats(req, res) {
    try {
        const user = req.user;
        const chats = await chatModel.find({ user: user._id }).sort({ lastActivity: -1 });
        res.status(200).json({ chats });
    } catch (error) {
        console.log("Error in getUserChats", error);
        res.status(500).json({ error: "Failed to fetch chats", message: error.message });
    }
}

async function getChatMessages(req, res) {
    try {
        const { chatId } = req.params;
        const messages = await messageModel.find({ chat: chatId }).sort({ createdAt: 1 });
        res.status(200).json({ messages });
    } catch (error) {
        console.log("Error in getChatMessages", error);
        res.status(500).json({ error: "Failed to fetch messages", message: error.message });
    }
}

async function deleteChat(req, res) {
    try {
        const { chatId } = req.params;
        const user = req.user;

        // Verify the chat belongs to the user
        const chat = await chatModel.findOne({ _id: chatId, user: user._id });
        if (!chat) {
            return res.status(404).json({ error: "Chat not found or unauthorized" });
        }

        // Delete the chat and all associated messages
        await chatModel.findByIdAndDelete(chatId);
        await messageModel.deleteMany({ chat: chatId });

        res.status(200).json({ message: "Chat deleted successfully" });
    } catch (error) {
        console.log("Error in deleteChat", error);
        res.status(500).json({ error: "Failed to delete chat", message: error.message });
    }
}

module.exports = { createChats, getUserChats, getChatMessages, deleteChat };