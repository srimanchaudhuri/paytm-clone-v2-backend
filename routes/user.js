const express = require("express");
const zod = require("zod");
const { User, Account } = require("../db.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { JWT_SECRET } = require("../config");
const { authMiddleware } = require("../middleware.js");

const userRouter = express.Router();

const signUpBody = zod.object({
  firstName: zod.string(),
  lastName: zod.string(),
  username: zod.string().email(),
  password: zod.string().min(6).max(36),
});

const signInBody = zod.object({
  username: zod.string().email(),
  password: zod.string().min(6).max(36),
});

const updateBody = zod.object({
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
  password: zod.string().min(6).max(36).optional(),
});

// SIGNUP ROUTE
userRouter.post("/signup", async (req, res, next) => {
  const body = req.body;
  const response = signUpBody.safeParse(body);

  if (!response.success) {
    return res.status(400).json(response.error);
  }

  const existingUser = await User.findOne({ username: req.body.username });

  if (existingUser) {
    return res.status(409).json({
      message: "Email already taken.",
    });
  }

  // Generate salt and hash password
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(response.data.password, salt);

  try {
    const user = await User.create({ ...response.data, password: hash });

    if (!user) {
      return res.status(500).json({ error: "Problem creating user" });
    }

    const userId = user._id;

    const account = await Account.create(
        {
            balance: Math.round((Math.random() * 10000)),
            userId: userId
        }
    )

    const jwtToken = jwt.sign({ userId }, JWT_SECRET);

    res.status(201).json({
      message: "User created successfully",
      token: jwtToken,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// SIGNIN ROUTE
userRouter.post("/signin", async (req, res) => {
  const body = req.body;
  const response = signInBody.safeParse(body);

  if (!response.success) {
    return res.status(400).json(response.error);
  }

  const user = await User.findOne({ username: req.body.username });

  if (!user) {
    return res.status(404).json({ message: "User does not exist" });
  }

  // Use await instead of then/catch
  const isPasswordValid = await bcrypt.compare(
    response.data.password,
    user.password
  );

  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid password" });
  }

  const userId = user._id;
  const jwtToken = jwt.sign({ userId }, JWT_SECRET);

  res.status(200).json({
    message: "User signed in successfully",
    token: jwtToken,
  });
});

userRouter.put("/", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const body = req.body;
  const result = updateBody.safeParse(body);

  if (!result.success) {
    return res.status(411).json({
      message: "Invalid Inputs",
    });
  }

    // Generate salt and hash password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(body.password, salt);

    body.password = hash

  await User.findOneAndUpdate(
    {
      _id: userId,
    },
    {
      ...body,
    }
  );

  res.status(200).json({
    message: "User updated",
  });
});

userRouter.get("/bulk", authMiddleware, async (req, res) => {
    const filter = req.params.filter || ""

    const users = await User.find({
        firstName: {$regex: filter},
        lastName: {$regex: filter}
    })

    res.status(200).json({
        user: users.map(user => (
            {
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                _id: user._id
            }
        ))
    })
})

module.exports = userRouter;
