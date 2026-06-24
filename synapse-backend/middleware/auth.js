const jwt = require('jsonwebtoken')

//this middleware protects route - checks if a valid token was sent or not

function authMiddleware(req, res, next){
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({error: 'No token provided'});
    }

    const token = authHeader.split(' ')[1] //extract just the token part

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next(); // token is valid, proceed to the actual route
    }catch(err){
        return res.status(401).json({error: 'Invalid or expired token'});
    }
}

module.exports = authMiddleware;