const express = require('express');
const { authMiddleware } = require('../middleware/Auth.middleware');
const chatControler = require('../controler/Chats.controler');
const chatRoute = express.Router();


chatRoute.post("/",authMiddleware,chatControler.createChats);
chatRoute.get("/", authMiddleware, chatControler.getUserChats);
chatRoute.get("/:chatId/messages", authMiddleware, chatControler.getChatMessages);
chatRoute.delete("/:chatId", authMiddleware, chatControler.deleteChat);

module.exports = chatRoute;
