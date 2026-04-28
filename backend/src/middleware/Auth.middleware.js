const userModel = require("../models/user.odels");
const {findById} = require('../services/dbServices');
const jwt = require("jsonwebtoken");




async function authMiddleware(req, res,next){
    try {
        const token = req.cookies.Token;
        if(!token){
            return res.status(401).json({ error: "Unauthorized" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await findById(userModel,decoded._id);
        if(!user){
            return res.status(401).json({ error: "Unauthorized" });
        }
        req.user = user;
        next();
        
    } catch (error) {
        res.status(500).json({ error: "Error in authMiddleware",
            message:error.message,
         });
    }
    
}

module.exports = {authMiddleware};
