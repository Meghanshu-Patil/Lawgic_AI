const User = require("../models/user.odels");


async function createUser(User,data){
    try {
        const response = await User.create(data);
        return response;
    } catch (error) {
        console.log("Error in createUser",error);
        throw error;
    }
}


async function findUserByEmail(User,email){
    try {
        const response = await User.findOne({email});
        return response;
    } catch (error) {
        console.log("Error in findUserByEmail",error);
        throw error;
    }
}


async function findById(User , id ) {
    try {
        const response = await User.findById(id);
        return response;
    } catch (error) {
        console.log("Error in findById",error);
        throw error;
    }
} 

module.exports = {
    createUser,
    findUserByEmail,
    findById
}