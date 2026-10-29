
const express = require('express');
const Graph = require('../models/Graph');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

//all routes require login
router.use(authMiddleware);

// get/api/graphs - fetch all graphs for logged-in-users
router.get('/', async(req, res)=> {
    try{
        const graphs = await Graph.find({userId: req.userId}).sort({ createdAt: -1}).select('-__v');

        res.json(graphs);
    }catch(err){
        console.error(err);
        res.status(500).json({error: 'Failed to fetch graphs'});
    }
});

// POST/api/graphs - save a new graph

router.post('/', async(req, res) =>{
    try{
        const{ topic, graph, sourceFiles, extractedText} = req.body;
        if(!topic || !graph){
            return res.status(400).json({ error: 'topic and graph are required '})
        }

        const newGraph = await Graph.create({
            userId: req.userId,
            topic,
            graph,
            sourceFiles: sourceFiles || [],
            extractedText: extractedText || '',
        });

        res.status(201).json(newGraph);
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Failed to save the graph'});
    }
});

// PUT/api/graphs/:id -update graph (after the node expansion)
router.put('/:id', async(req, res) =>{
    try{
        const {graph} = req.body;

        const updated = await Graph.findOneAndUpdate(
            {_id: req.params.id, userId: req.userId}, //make sure user owns it
            {graph},
            {new: true}
        );

        if(!updated){
            return res.status(404).json({ error: 'Graph not found'});
        }

        res.json(updated);
    }catch (err){
        console.error(err);
        res.status(500).json({ error: 'Failed to generate the graph'});
    }
});

//Delete/api/graph/:id - delete an existing graph
router.delete('/:id', async(req, res) => {
    try{
        const deleted = await Graph.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId,
        });

        if(!deleted){
            return res.status(404).json({error: 'Graoh not found'});
        }

        res.json({message: 'Graph deleted'});
    }catch(err){
        console.error(err);
        res.status(500).json({error: 'failed to delete the graph'});
    }
});

//POST /api/graphs/:id/share - generate a public share token
router.post('/:id/share', async(req, res) => {
    try{
        const graph = await Graph.findOne({
            _id: req.params.id, 
            userId: req.userId,
        });
        if(!graph) return res.status(404).json({error: 'Graph not found'});

        //generate a unique share token if not already shared
        if(!graph.shareToken){
            graph.shareToken = require('crypto').randomBytes(16).toString('hex');
            await graph.save();
        }

        res.json({shareToken: graph.shareToken});
    }catch(err){
        console.error(err);
        res.status(500).json({error: 'Failed to generate share token'});
    }
});

//GET /api/shared/:token - public route, no auth needed
router.get('/shared/:token', async(req, res) => {
    try{
        const graph = await Graph.findOne({shareToken: req.params.token});

        if(!graph){
            return res.status(404).json({error: 'Graph not found or link expired'});
        }

        res.json({
            topic: graph.topic,
            graph: graph.graph,
            createdAt: graph.createdAt,
        });
    }catch(err){
        console.error(err);
        res.status(500).json({error: 'failed to load shared graph'});
    }
});

module.exports = router;