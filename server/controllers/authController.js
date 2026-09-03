import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../model/User.js";

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "sgs_ai_interview_secret_jwt_key_2026", {
    expiresIn: "30d",
  });
};

// Email & Phone regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;

/**
 * @desc    Register a new candidate user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, location, qualification } = req.body;

    if (!name || !email || !phone || !password || !location || !qualification) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Validations
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    // Check existing email or phone
    const existingUser = await User.findOne({
      $or: [{ email: cleanEmail }, { phone: cleanPhone }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (userType ALWAYS candidate, credits default 5)
    const user = await User.create({
      name,
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      location,
      qualification,
      userType: "candidate",
      credits: 5,
    });

    if (user) {
      const token = generateToken(user._id);
      return res.status(201).json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          location: user.location,
          qualification: user.qualification,
          userType: user.userType,
          credits: user.credits,
        },
      });
    } else {
      return res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * @desc    Login user with single input (Email or Mobile Number)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Please enter email/phone and password" });
    }

    const cleanInput = identifier.trim();
    let query = {};

    if (cleanInput.includes("@")) {
      query = { email: cleanInput.toLowerCase() };
    } else if (phoneRegex.test(cleanInput)) {
      query = { phone: cleanInput };
    } else {
      // Could be email without @ or non-10-digit number -> query both or check existence
      query = { $or: [{ email: cleanInput.toLowerCase() }, { phone: cleanInput }] };
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(400).json({ message: "User doesn't exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        qualification: user.qualification,
        userType: user.userType,
        credits: user.credits,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * @desc    Get current user profile (auto-auth / persistent login)
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error("GetMe error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};
