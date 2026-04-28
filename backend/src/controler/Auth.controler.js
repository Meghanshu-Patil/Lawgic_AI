const User = require("../models/user.odels");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");    

const {createUser, findUserByEmail, findById} = require("../services/dbServices");

async function registerUser(req , res) {
    try {
        const nameObj = req.body.fullname || req.body.fullName || {};
        const { firstName, lastName } = nameObj;
        const { email, password } = req.body;
        
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: "All fields are required" });
        }
        
        if (await findUserByEmail(User,email)) {
            return res.status(400).json({ error: "User already exists" });
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await createUser(User,{
            email:email,
            fullname:{firstName:firstName,lastName:lastName},
            password:hashedPassword             
        });

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
        res.cookie("Token", token);

        return res.status(201).json({ message: "User created successfully" , user :{
            id:user._id,
            email:user.email,
            fullname:user.fullname
        } });
        
    } catch (error) {
        console.log("Error in registerUser",error);
        return res.status(500).json({ error: "Registration error",
            message:error.message,
         });
    }
}

async function loginUser(req,res){

    const {email , password} = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const user = await findUserByEmail(User,email);

    if (!user) {
        return res.status(400).json({ error: "User not found" });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
        return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.cookie("Token", token);

    return res.status(200).json({ message: "User logged in successfully" , user :{
        id:user._id,
        email:user.email,
        fullName:user.fullName

    } });

}


module.exports = {registerUser,loginUser};

