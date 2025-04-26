import bycrypt from 'bcrypt';
import {User} from '../models/User.db.js'
import jwt from 'jsonwebtoken';
import generateToken from '../utils/generateToken.js';

async function signupUser(req, res) {
    const name = req.body.name;
    const email = req.body.email;
    const password = await bycrypt.hash(req.body.password,12); 

    // check if user exists
    const user = await User.findOne({email:email});
    if(user){
        return res.status(400).json({message:"User already exists"});
    }

    try{
        // else create a new user
        const newUsr = await User.create({
            name,
            email,
            password
        });

        return res.status(201).json({message:"User created successfully", user:newUsr});
    }
    catch(err){
        console.log(err);
        return res.status(500).json({message:"Internal Server Error"});
    }

}

async function loginUser(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    // check if user exists
    const user = await User.findOne({email:email});
    if(!user){
        return res.status(404).json({message:"User does not exist"});
    }

    // check if password is correct
    const isValid = await bycrypt.compare(password, user.password);

    if(!isValid){
        return res.status(401).json({message:"Invalid credentials"});
    }

    // authenticate user with jwt
    const token = generateToken(user);

    return res.status(200).json({message:"User logged in successfully", token});
}


async function getUsers(req, res) {
    try{
        const users = await User.find();
        return res.status(200).json({message:"Users fetched successfully", users});
    }
    catch(err){
        console.log(err);
        return res.status(500).json({message:"Internal Server Error"});
    }
}
export { signupUser, loginUser, getUsers };