import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      res
        .status(401)
        .json({ message: "Unauthorized - No Access Token Provided" });
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.TOKEN_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        res
          .status(401)
          .json({ message: "Unauthorized - No User with this userId" });
      }
      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Unauthorized - Access Token expired" });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.log("Error in protectRoute controller: ", error.message);
    res.status(500).json({ message: "Server Error: ", error: error.message });
  }
};

export const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    //403 is forbidden error
    res.status(403).json({ message: "Access denied - Admin only" });
  }
};
