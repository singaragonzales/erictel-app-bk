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
 *          required:
 *              - name
 *              - email
 *          example:
 *              name: Jhon
 *              email: jhon@gmail.com
 *      UserArray:
 *          type: array
 *          items:
 *              $ref: '#/components/schemas/User'
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

/**
 * @swagger
 * tags:
 *   name: User
 *   description: The Users API
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
 *               $ref: '#/components/schemas/UserArray'
 *       500:
 *         description: Some server error
 *
 */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * tags:
 *   name: User
 *   description: The Users API
 * /users/:id:
 *   get:
 *     summary: Create a new User
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: The created user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       500:
 *         description: Some server error
 *
 */
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
