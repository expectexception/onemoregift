const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const isAdmin = (req, res, next) => {
    const authHeader = req.header("Authorization");
    const cookieToken = req.cookies?.admin_token;
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
        req.user = data.user;
        if (!data.user.isAdmin) {
            return res
                .status(401)
                .json({ error: true, msg: "Access denied. Please authenticate using a valid token." });
        }
        // if (data.isAdmin != true) {
        //   console.log("You are not an admin");
        // }
    } catch (error) {
        return res
            .status(401)
            .json({ error: true, msg: "Access denied. Please authenticate using a valid token." });
    }

    next();
};
module.exports = isAdmin;