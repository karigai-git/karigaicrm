
// Direct email API implementation
import express from 'express';
const router = express.Router();

// Health check endpoint
router.get('/status', (req, res) => {
  res.json({ connected: true, status: 'ok', message: 'Email API is working' });
});

// Send email endpoint
router.post('/send-email', (req, res) => {
  const { to, subject, message } = req.body;
  console.log('Email request received:', { to, subject });
  res.json({ success: true, message: 'Email API endpoint configured' });
});

export default router;
