
const express = require('express');
const Graph = require('../models/Graph');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

//all routes require login
router.use(authMiddleware);

// get/api/graphs - fetch all graphs for logged-in-users
router.get('/', async(req, res)=> {
    try{
        const graphs = await Graphlfind({userId: req.userId}).sort({ createdAt: -1}).select('-__v');

        res.json(graphs);
    }catch(err){
        console.error(err);
        res.status(500).json({error: 'Failed to fetch graphs'});
    }
});

// POST/api/graphs - save a new graph

router.post('/', async(req, res) =>{
    try{
        const{ topic, graph} = req.body;
        if(!topic || !graph){
            return res.status(400).json({ error: 'topic and graph are required '})
        }

        const newGraph = await Graph.create({
            userId: req.userId,
            topic,
            graph,
        });

        res.status(201).json(newgraph);
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

module.exports = router;