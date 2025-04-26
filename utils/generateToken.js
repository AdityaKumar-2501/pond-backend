import jwt from "jsonwebtoken";

const generateToken = (user) => {
   return jwt.sign({
        user: {
          id: user._id,
          email: user.email,
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
};

export default generateToken;
