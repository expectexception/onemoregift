const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const isAuth = (req, res, next) => {
    const authHeader = req.header("Authorization");
    const cookieToken = req.cookies?.user_token;
    const cleanToken = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : cookieToken;

    if (!cleanToken) {
        return res
            .status(401)
            .json({ error: true, msg: "Access denied. Please authenticate using a valid token." });
    }
    try {
        const data = jwt.verify(cleanToken, JWT_SECRET);
        if (!data) {
            return res
                .status(401)
                .json({ error: true, msg: "Access denied. Please authenticate using a valid token." });
        }
        req.user = data;

    } catch (error) {
        return res
            .status(401)
            .json({ error: true, msg: "Access denied. Please authenticate using a valid token." });
    }

    next();
};
module.exports = isAuth;