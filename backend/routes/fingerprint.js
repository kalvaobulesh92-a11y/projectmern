import express from 'express';
import Fingerprint from '../fingerprint.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
const fp = new Fingerprint(process.env.FP_SERIAL_PORT, parseInt(process.env.FP_BAUDRATE || '115200'));

// Enroll fingerprint for a user (protected)
// Workflow: frontend calls /start-enroll to reserve id (or server chooses), then server asks for 3 scans
router.post('/start-enroll', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Mongo user id
    // pick an integer fingerprint ID. For simplicity use lower 16-bit of Mongo id timestamp or use an auto counter.
    const fpId = Math.floor(Math.random() * 20000); // replace with deterministic allocation in production

    await fp.openSensor();

    // tell client to place finger for step 1
    res.json({ message: 'Place finger for step 1', fpId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to start enroll' });
  }
});

// perform enroll step (1,2,3) — frontend triggers step after user placed finger and saw prompt
router.post('/enroll-step', authMiddleware, async (req, res) => {
  // body: { step: 1|2|3, fpId }
  try {
    const { step, fpId } = req.body;
    if (![1,2,3].includes(step)) return res.status(400).json({ message: 'Invalid step' });

    await fp.openSensor();

    // capture
    await fp.captureFinger();
    await fp.enrollStart(fpId); // only required at step=1 depending on module; kept idempotent
    const resp = await fp.enrollStep(step);

    // examine resp to decide success — here we assume any response is success; parse as necessary
    res.json({ success: true, resp: resp.toString('hex') });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Enroll step failed', error: String(err) });
  }
});

// finalize enroll: associate fingerprint id with user in DB
router.post('/finalize-enroll', authMiddleware, async (req, res) => {
  try {
    const { fpId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.fingerprintId = fpId;
    await user.save();
    res.json({ success: true, message: 'Fingerprint saved to user' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save fingerprint' });
  }
});

// Identify endpoint — read sensor, return matched fingerprint ID and associated user
router.post('/identify', async (req, res) => {
  try {
    await fp.openSensor();
    await fp.captureFinger();
    const resp = await fp.identify();
    // parse resp to extract matched ID — this depends on sensor response format
    // for example assume resp[4] contains ID (replace with real parsing)
    const raw = resp;
    // naive parse: convert hex and attempt to find id bytes
    let matchedId = null;
    if (raw && raw.length >= 6) {
      matchedId = raw[5];
    }

    if (matchedId == null) return res.status(401).json({ success: false, message: 'No match' });

    // find user with that fingerprintId
    const user = await User.findOne({ fingerprintId: matchedId });
    if (!user) return res.status(404).json({ success: false, message: 'Matched fingerprint but no linked user' });

    // return JWT so client can be logged in
    import('../utils/jwt.js').then(({ signToken }) => {
      const token = signToken({ id: user._id, email: user.email });
      res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
    }).catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Token generation failed' });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Identify failed', error: String(err) });
  }
});

export default router;