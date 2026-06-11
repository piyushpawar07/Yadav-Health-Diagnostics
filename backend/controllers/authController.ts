import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { readDbAsync, writeDb } from '../models/db';
import { JWT_SECRET } from '../middlewares/authMiddleware';
import { User } from '../../frontend/src/types';
import { sendResetEmail } from '../utils/email';

export const register = async (req: any, res: any) => {
  const { name, email, password, phone, address } = req.body;
  
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: 'Name, email, password, and phone number are required.' });
  }

  const db = await readDbAsync();
  const lowercaseEmail = email.toLowerCase().trim();
  const userExists = db.users.find(u => u.email.toLowerCase().trim() === lowercaseEmail);
  
  if (userExists) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const userId = 'u_' + Math.random().toString(36).substr(2, 9);
  const newUser: User = {
    id: userId,
    name,
    email: lowercaseEmail,
    role: 'patient', // default role
    phone,
    address: address || '',
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  db.passwords[userId] = bcrypt.hashSync(password, 10);
  writeDb(db);

  const token = jwt.sign(
    { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({ token, user: newUser });
};

export const login = async (req: any, res: any) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email/phone and password are required.' });
  }

  const db = await readDbAsync();
  const searchStr = email.toLowerCase().trim();
  
  // Find user by email OR by phone number (normalizing spaces, dashes, plus signs)
  const user = db.users.find(u => {
    const dbEmail = u.email ? u.email.toLowerCase().trim() : '';
    const dbPhone = u.phone ? u.phone.replace(/[\s\-\+]/g, '') : '';
    const cleanSearch = searchStr.replace(/[\s\-\+]/g, '');
    
    if (dbEmail === searchStr) return true;
    if (dbPhone && dbPhone === cleanSearch) return true;
    if (u.phone && u.phone.trim() === searchStr) return true;
    
    // Check last 10 digits match for robust mobile authentication
    const dbPhoneLast10 = dbPhone.slice(-10);
    const cleanSearchLast10 = cleanSearch.slice(-10);
    if (dbPhoneLast10.length === 10 && dbPhoneLast10 === cleanSearchLast10) {
      return true;
    }
    
    return false;
  });
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid email/phone address or password combination.' });
  }

  const passwordHash = db.passwords[user.id];
  if (!passwordHash || !bcrypt.compareSync(password, passwordHash)) {
    return res.status(401).json({ error: 'Invalid email/phone address or password combination.' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user });
};

export const forgotPassword = async (req: any, res: any) => {
  const { emailOrPhone } = req.body;
  if (!emailOrPhone) {
    return res.status(400).json({ error: 'Registered Email Address is required to request a password reset.' });
  }

  const db = await readDbAsync();
  const searchStr = emailOrPhone.toLowerCase().trim();
  const user = db.users.find(u => {
    const dbEmail = u.email ? u.email.toLowerCase().trim() : '';
    const dbPhone = u.phone ? u.phone.replace(/[\s\-\+]/g, '') : '';
    const cleanSearch = searchStr.replace(/[\s\-\+]/g, '');
    
    if (dbEmail === searchStr) return true;
    if (dbPhone && dbPhone === cleanSearch) return true;
    if (u.phone && u.phone.trim() === searchStr) return true;
    
    // Check last 10 digits match for robust mobile recovery
    const dbPhoneLast10 = dbPhone.slice(-10);
    const cleanSearchLast10 = cleanSearch.slice(-10);
    if (dbPhoneLast10.length === 10 && dbPhoneLast10 === cleanSearchLast10) {
      return true;
    }
    
    return false;
  });

  if (!user) {
    return res.status(404).json({ error: 'No registered user profile located matching this credential.' });
  }

  if (!user.email) {
    return res.status(400).json({ error: 'Your user profile does not have a registered email address to receive password reset links.' });
  }

  // Generate secure 32-byte hex reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpires = Date.now() + 3600000; // 1 hour validity

  // Save to database
  user.resetToken = resetToken;
  user.resetTokenExpires = resetTokenExpires;
  writeDb(db);

  // Calculate dynamic App URL
  const appUrl = process.env.APP_URL || req.get('origin') || `${req.protocol}://${req.get('host')}`;
  const resetUrl = `${appUrl}/?resetToken=${resetToken}`;

  try {
    await sendResetEmail(user.email, user.name, resetUrl);
    res.json({
      success: true,
      message: 'A secure password reset link has been sent to your registered email address.'
    });
  } catch (error: any) {
    console.error('Nodemailer SMTP Error:', error);
    res.status(500).json({
      error: `Failed to dispatch reset email via SMTP: ${error.message || error}. Please ensure correct SMTP credentials are set in environment variables.`
    });
  }
};

export const validateResetToken = async (req: any, res: any) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ valid: false, error: 'Token is missing.' });
  }

  const db = await readDbAsync();
  const user = db.users.find(u => u.resetToken === token);

  if (!user) {
    return res.status(400).json({ valid: false, error: 'Password reset link is invalid or has already been used.' });
  }

  if (!user.resetTokenExpires || user.resetTokenExpires < Date.now()) {
    return res.status(400).json({ valid: false, error: 'Password reset link has expired.' });
  }

  res.json({ valid: true, email: user.email });
};

export const resetPassword = async (req: any, res: any) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }

  const db = await readDbAsync();
  const user = db.users.find(u => u.resetToken === token);

  if (!user) {
    return res.status(400).json({ error: 'Invalid or already used password reset link.' });
  }

  if (!user.resetTokenExpires || user.resetTokenExpires < Date.now()) {
    return res.status(400).json({ error: 'Password reset link has expired. Please request another.' });
  }

  // Strong password validation: At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;
  if (!strongPasswordRegex.test(newPassword)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.'
    });
  }

  // Save new hashed password
  db.passwords[user.id] = bcrypt.hashSync(newPassword, 10);

  // Invalidate token
  user.resetToken = null;
  user.resetTokenExpires = null;
  writeDb(db);

  res.json({ success: true, message: 'Your password has been successfully updated. You can now log in.' });
};

export const getMe = async (req: any, res: any) => {
  const db = await readDbAsync();
  const user = db.users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User profile not found.' });
  }
  
  res.json({ user });
};
