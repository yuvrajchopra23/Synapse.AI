const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();

//signup
router.post('/signup', async(req, res) => {
    try{
        const{name, email, password} = req.body;
        if(!name || !email || !password){
            return res.status(400).json({error: "All fields are required"});
        }
        if(password.length < 6){
            return res.status(400).json({error: "Password must be atleast 6 characters"});
        }

        const existing = await User.findOne({email: email.toLowerCase()});
        if (existing){
            return res.status(400).json({error: "email already registered"});
        }

        //hash the password

        const hashedPassword = await bcrypt.hash(password, 10);

        //create user

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
        });

        //create jwt token= to prove the user is logged in
        const token = jwt.sign(
            {userId: user._id},
            process.env.JWT_SECRET,
            {expiresIn: '7d'} //valid for 7 days
        );

        res.status(201).json({
            token,
            user: {id: user._id, name: user.name, email: user.email},
        });
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'server error during signup'});
    }
});

//login
router.post('/login', async(req, res)=>{
    try{
        const{email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({error: 'Email and password required'});
        }
        //find user
        const user = await User.findOne({email: email.toLowerCase()});
        if(!user){
            return res.status(400).json({error: 'invalid email or password'});
        }

        //compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({error: 'Invalid email or password'});
        }

        //create jwt token
        const token = jwt.sign(
            {userId: user._id},
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        );

        res.json({
            token,
            user: {id: user._id, name: user.name, email: user.email},
        });      
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'server error during login'});
    }
});

module.exports = router;