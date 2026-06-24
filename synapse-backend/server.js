require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors()); //allow requests from react app(different port)
app.use(express.json());//parse JSON request bodies

app.use('/api/auth', authRoutes);//mount auth routes - all auth endpoints start with /api/auth

//simple test route
app.get('/', (req, res) =>{
    res.json({message: "synapse Backend is running"});
});

//connect mongo then start server
mongoose.connect(process.env.MONGODB_URI)
    .then(()=>{
        console.log("connected to mongoDB");
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, ()=>
            console.log(`server running on port ${PORT}` )
        );
    })
    .catch(err => {
        console.error('MongoDB connection error: ', err);
    });