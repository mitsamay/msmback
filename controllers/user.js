import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import tryCatch from "./utils/tryCatch.js";
import Room from '../models/Room.js';

export const register = tryCatch(async (req, res) => {
  // try {    //use tryCatch.js
  const { name, email, password } = req.body;
  if (password.length < 8)
    return res.status(400).json({
      success: false,
      message: "Password must be 8 characters or more",
    });
  const emailLowerCase = email.toLowerCase();
  const existedUser = await User.findOne({ email: emailLowerCase });
  if (existedUser)
    return res
      .status(400)
      .json({ success: false, message: "User already exists!" });
  // bcryptjs
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email: emailLowerCase,
    password: hashedPassword,
  });
  const { _id: id, photoURL, role, active } = user;
  // Json Webtoken
  const token = jwt.sign({ id, name, photoURL }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.status(201).json({
    success: true,
    result: { id, name, email: user.email, photoURL, token },
  });
  // } catch (error) {          //use tryCatch.js
  //   console.log(error);
  //   res.status(500).json({
  //     success: false,
  //     message: "Something went wrong! try again later",
  //   });
  // }
});

export const login = tryCatch(async (req, res) => {
  const { email, password } = req.body;

  const emailLowerCase = email.toLowerCase();
  const existedUser = await User.findOne({ email: emailLowerCase });
  if (!existedUser)
    return res
      .status(404)
      .json({ success: false, message: "User does not exist!" });
  const correctPassword = await bcrypt.compare(password, existedUser.password);
  if (!correctPassword)
    return res
      .status(400)
      .json({ success: false, message: "Invalid credentials" });

  const { _id: id, name, photoURL, role, active } = existedUser;
  // if (!active)
  //   return res
  //     .status(400)
  //     .json({
  //       success: false,
  //       message: 'This account has been suspended! Try to contact the admin',
  //     });
  const token = jwt.sign({ id, name, photoURL }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.status(200).json({
    success: true,
    result: { id, name, email: emailLowerCase, photoURL, token },
  });
});

export const updateProfile = tryCatch(async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
  });
  const { _id: id, name, photoURL } = updatedUser;

  // To Do: update all the rooms records added by this user
  await Room.updateMany({ uid: id }, { uName: name, uPhoto: photoURL });

  const token = jwt.sign({ id, name, photoURL }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
  res.status(200).json({ success: true, result: { name, photoURL, token } });
});

export const getUsers = tryCatch(async (req, res) => {
  const users = await User.find().sort({ _id: -1 });
  res.status(200).json({ success: true, result: users });
});

// export const updateStatus = tryCatch(async (req, res) => {
//   const { role, active } = req.body;
//   await User.findByIdAndUpdate(req.params.userId, { role, active });
//   res.status(200).json({ success: true, result: { _id: req.params.userId } });
// });
