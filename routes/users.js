const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

dotenv.config();

const router = express.Router();
const secretKey = process.env.SECRET_KEY;

router.use(bodyParser.json({ limit: "50mb" }));
router.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

/**
 * @swagger
 * components:
 *  schemas:
 *      User:
 *          type: object
 *          properties:
 *              name:
 *                  type: string
 *                  description: The user's name
 *              email:
 *                  type: string
 *                  description: The user's email
 *              profile:
 *                  type: string
 *                  description: The user's profile picture in Base64
 *              description:
 *                  type: string
 *                  description: The user's description
 *          required:
 *              - name
 *              - email
 *              - profile
 *              - description
 *          example:
 *              name: Jhon
 *              email: jhon@gmail.com
 *              profile: iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=
 *              description: I'am John!
 *      Credentials:
 *          type: object
 *          properties:
 *              email:
 *                  type: string
 *                  description: The user's email
 *              password:
 *                  type: string
 *                  description: The user's password
 *          required:
 *              - email
 *              - password
 *          example:
 *              email: jhon@gmail.com
 *              password: Jhon@123
 *      NewUser:
 *          type: object
 *          properties:
 *              name:
 *                  type: string
 *                  description: The user's name
 *              email:
 *                  type: string
 *                  description: The user's email
 *              password:
 *                  type: string
 *                  description: The user's password
 *          required:
 *              - name
 *              - email
 *              - password
 *          example:
 *              name: Jhon
 *              email: jhon@gmail.com
 *              password: Jhon@123
 * tags:
 *   name: Users
 *   description: The Users API
 * /login:
 *   post:
 *     summary: Login to an User
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         'application/json':
 *            schema:
 *              $ref: '#/components/schemas/Credentials'
 *     responses:
 *       200:
 *         description: The user information.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Some error message
 *       500:
 *         description: Some server error
 * /register:
 *   post:
 *     summary: Register an User
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         'application/json':
 *            schema:
 *              $ref: '#/components/schemas/NewUser'
 *     responses:
 *       200:
 *         description: Success message
 *       409:
 *         description: Some error message
 *       500:
 *         description: Some server error
 * /users:
 *   get:
 *     summary: Create a new User
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The created user.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Some server error
 * /users/id:
 *   get:
 *     summary: Get a user information
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The user information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Some server error
 *   put:
 *     summary: Edit a user information
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         'application/json':
 *            schema:
 *              $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: The user information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Some server error
 */

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ message: "El usuario o la contraseña son incorrectos" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ message: "El usuario o la contraseña son incorrectos" });
    }

    const token = jwt.sign({ id: user._id }, secretKey);

    res.json({
      token,
      user: { id: user._id, name: user.name, profile: user.profile },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/register", async (req, res) => {
  const { name, email, password, profile, description } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      profile: "",
      description: "",
      password: hashedPassword,
    });

    res.status(201).json({ message: "Usuario creado, puede iniciar sesión" });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ message: "El email ya está en uso" });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find();

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, profile } = req.body;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    user.description = description || user.description;

    user.profile = profile || user.profile;

    user.name = name || user.name;

    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
