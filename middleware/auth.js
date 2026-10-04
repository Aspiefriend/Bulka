const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if(!JWT_SECRET) {
    console.error('[middleware/auth] JWT_SECRET is not set')
    process.exit(1)
}

module.exports = (req,res,next) => {

const authHeader = req.headers.authorization;
if(!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({error: {message:'No token provided', code : 'UNAUTHORIZED'}})

}
const token = authHeader.split(' ')[1]
try{

    const payload = jwt.verify(token,JWT_SECRET)

     req.user = payload
     next()
}
catch (err) {

    return res.status(401).json({error:{message: 'Invalid or expired token', code:'UNAUTHORIZED'}})
}

}
