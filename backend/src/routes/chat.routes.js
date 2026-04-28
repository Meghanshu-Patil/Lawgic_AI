const express = require('express');
const { authMiddleware } = require('../middleware/Auth.middleware');
const chatControler = require('../controler/Chats.controler');
const chatRoute = express.Router();


chatRoute.post("/",authMiddleware,chatControler.createChats);









module.exports = chatRoute;
