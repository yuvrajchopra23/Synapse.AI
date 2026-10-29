require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const authRoutes = require('./routes/auth');
const graphRoutes = require('./routes/graphs');

const uploadRoutes = require('./routes/upload');

app.use(cors({
  origin: '*',  // allow ALL origins during development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));//allow requests from react app(different port)
app.use(express.json());//parse JSON request bodies

const Graph = require('./models/Graph');
app.get('/api/shared/:token', async(req, res) => {
    try{
        const graph = await Graph.findOne({shareToken: req.params.token});
        if (!graph) return res.status(404).json({error: 'Graph not found'});
        res.json({topic: graph.topic, graph: graph.graph, createdAt: graph.createdAt});
    }catch(err){
        res.status(500).json({error: 'Failed to load shared graph'});
    }
});

app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);//mount auth routes - all auth endpoints start with /api/auth
app.use('/api/graphs', graphRoutes);
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