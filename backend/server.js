require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const { connect } = require('./connect');
const { cloudinary, upload } = require('./cloudinary');
const {
  TeamRegistration,
  AppSettings,
  ProblemStatement,
  RoundMarks,
} = require('./model');

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.adminPassword;
const DOWNLOAD_PASSWORD = process.env.DOWNLOAD_PASSWORD || process.env.downloadPassword;

if (!ADMIN_PASSWORD || !DOWNLOAD_PASSWORD) {
  console.error('Missing required environment variables: ADMIN_PASSWORD and DOWNLOAD_PASSWORD');
  process.exit(1);
}

// Middleware
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper: Validate Admin Passcode
const secureCompare = (input, expected) => {
  if (typeof input !== 'string' || typeof expected !== 'string') return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

const validateAdminPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  const input = String(password).trim();
  return secureCompare(input, ADMIN_PASSWORD) || secureCompare(input, DOWNLOAD_PASSWORD);
};

// Helper: Upload file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder = 'uploads') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// ==========================================
// 1. CONFIG & APP SETTINGS ROUTES
// ==========================================

// GET /api/registration-status
app.get('/api/registration-status', async (req, res) => {
  try {
    let setting = await AppSettings.findOne({ key: 'registrationStatus' });
    if (!setting) {
      setting = await AppSettings.create({ key: 'registrationStatus', enabled: true });
    }
    res.json({ success: true, enabled: setting.enabled });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/toggle-registration
app.post('/api/toggle-registration', async (req, res) => {
  try {
    const { password, enabled } = req.body;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }
    const setting = await AppSettings.findOneAndUpdate(
      { key: 'registrationStatus' },
      { enabled: Boolean(enabled), updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, enabled: setting.enabled });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/max-teams
app.get('/api/max-teams', async (req, res) => {
  try {
    let setting = await AppSettings.findOne({ key: 'maxTeams' });
    if (!setting) {
      setting = await AppSettings.create({ key: 'maxTeams', maxTeams: 50 });
    }
    res.json({ success: true, maxTeams: setting.maxTeams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/update-max-teams
app.post('/api/update-max-teams', async (req, res) => {
  try {
    const { password, maxTeams } = req.body;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }
    const num = Number(maxTeams);
    if (!num || num < 1) {
      return res.status(400).json({ success: false, message: 'Max teams must be a positive number' });
    }
    const setting = await AppSettings.findOneAndUpdate(
      { key: 'maxTeams' },
      { maxTeams: num, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, maxTeams: setting.maxTeams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payment-qr
app.get('/api/payment-qr', async (req, res) => {
  try {
    let setting = await AppSettings.findOne({ key: 'paymentQr' });
    res.json({ success: true, qrUrl: setting ? setting.qrUrl : '' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/upload-qr
app.post('/api/upload-qr', upload.single('qrCode'), async (req, res) => {
  try {
    const password = req.body.password;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No QR code image uploaded' });
    }
    const result = await uploadToCloudinary(req.file.buffer, 'qr_codes');
    const setting = await AppSettings.findOneAndUpdate(
      { key: 'paymentQr' },
      { qrUrl: result.secure_url, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, url: setting.qrUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/config/problems-enabled
app.get('/api/config/problems-enabled', async (req, res) => {
  try {
    let setting = await AppSettings.findOne({ key: 'problemStatementsEnabled' });
    if (!setting) {
      setting = await AppSettings.create({ key: 'problemStatementsEnabled', enabled: true });
    }
    res.json({ success: true, enabled: setting.enabled });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/config/problems-enabled
app.post('/api/config/problems-enabled', async (req, res) => {
  try {
    const { password, enabled } = req.body;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }
    const setting = await AppSettings.findOneAndUpdate(
      { key: 'problemStatementsEnabled' },
      { enabled: Boolean(enabled), updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, enabled: setting.enabled });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. REGISTRATION & PUBLIC ROUTES
// ==========================================

// GET /api/teams/count
app.get('/api/teams/count', async (req, res) => {
  try {
    const count = await TeamRegistration.countDocuments();
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/check-team-name/:teamName
app.get('/api/check-team-name/:teamName', async (req, res) => {
  try {
    const teamName = decodeURIComponent(req.params.teamName).trim();
    const existing = await TeamRegistration.findOne({
      teamName: { $regex: new RegExp(`^${teamName}$`, 'i') },
    });
    res.json({ success: true, exists: Boolean(existing) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payment-status/:teamName
app.get('/api/payment-status/:teamName', async (req, res) => {
  try {
    const teamName = decodeURIComponent(req.params.teamName).trim();
    const team = await TeamRegistration.findOne({
      teamName: { $regex: new RegExp(`^${teamName}$`, 'i') },
    });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team registration not found' });
    }
    res.json({
      success: true,
      status: team.payment.status,
      verifiedAt: team.payment.verifiedAt,
      teamName: team.teamName,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/upload-receipt
app.post('/api/upload-receipt', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No receipt file uploaded' });
    }
    const result = await uploadToCloudinary(req.file.buffer, 'payment_receipts');
    res.json({
      success: true,
      url: result.secure_url,
      fileName: req.file.originalname,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/register
app.post('/api/register', async (req, res) => {
  try {
    // Check registration status
    const regSetting = await AppSettings.findOne({ key: 'registrationStatus' });
    if (regSetting && !regSetting.enabled) {
      return res.status(400).json({ success: false, message: 'Registrations are currently closed.' });
    }

    // Check max teams
    const maxSetting = await AppSettings.findOne({ key: 'maxTeams' });
    const maxTeams = maxSetting ? maxSetting.maxTeams : 50;
    const currentCount = await TeamRegistration.countDocuments();
    if (currentCount >= maxTeams) {
      return res.status(400).json({ success: false, message: 'Registration capacity reached.' });
    }

    const { teamName, teamLeader, teamMember1, teamMember2, teamMember3, payment } = req.body;

    if (!teamName || !teamLeader || !teamMember1 || !teamMember2 || !teamMember3 || !payment) {
      return res.status(400).json({ success: false, message: 'All registration fields are required.' });
    }

    // Check if team name already exists
    const existingTeam = await TeamRegistration.findOne({
      teamName: { $regex: new RegExp(`^${teamName.trim()}$`, 'i') },
    });
    if (existingTeam) {
      return res.status(400).json({ success: false, message: 'Team name is already taken.' });
    }

    // Check if transaction ID already exists
    const existingTx = await TeamRegistration.findOne({
      'payment.transactionId': payment.transactionId.trim(),
    });
    if (existingTx) {
      return res.status(400).json({ success: false, message: 'Transaction ID has already been submitted.' });
    }

    const newTeam = await TeamRegistration.create({
      teamName: teamName.trim(),
      teamLeader,
      teamMember1,
      teamMember2,
      teamMember3,
      payment: {
        transactionId: payment.transactionId.trim(),
        receiptUrl: payment.receiptUrl,
        receiptFileName: payment.receiptFileName || '',
        status: 'pending',
      },
    });

    res.json({ success: true, team: newTeam });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. ADMIN & PAYMENTS / EXPORT ROUTES
// ==========================================

// POST /api/admin/verify & POST /api/verify-admin
const handleVerifyAdmin = (req, res) => {
  const { password } = req.body;
  if (!validateAdminPassword(password)) {
    return res.status(401).json({ success: false, message: 'Invalid administrator key' });
  }
  res.json({ success: true });
};
app.post('/api/admin/verify', handleVerifyAdmin);
app.post('/api/verify-admin', handleVerifyAdmin);

// GET /api/all-payments
app.get('/api/all-payments', async (req, res) => {
  try {
    const password = req.query.password;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }

    const teams = await TeamRegistration.find().sort({ submittedAt: -1 }).populate('selectedProblemStatement');

    const statusCounts = { pending: 0, verified: 0, rejected: 0 };
    teams.forEach((t) => {
      const st = t.payment?.status || 'pending';
      if (statusCounts[st] !== undefined) statusCounts[st]++;
    });

    res.json({ success: true, data: teams, statusCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/update-payment-status
app.post('/api/update-payment-status', async (req, res) => {
  try {
    const { password, transactionId, teamId, status } = req.body;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }
    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    let filter = {};
    if (transactionId) filter = { 'payment.transactionId': transactionId };
    else if (teamId) filter = { _id: teamId };
    else return res.status(400).json({ success: false, message: 'Transaction ID or Team ID required' });

    const update = {
      'payment.status': status,
      'payment.verifiedAt': status === 'verified' ? new Date() : null,
    };

    const team = await TeamRegistration.findOneAndUpdate(filter, update, { new: true });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team record not found' });
    }

    res.json({ success: true, team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/download-stats
app.post('/api/download-stats', async (req, res) => {
  try {
    const { password } = req.body;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }

    const teams = await TeamRegistration.find();
    let totalTeams = teams.length;
    let verifiedTeams = 0;
    let pendingTeams = 0;
    let rejectedTeams = 0;
    let totalMembers = 0;
    let hostelersCount = 0;
    let dayScholarsCount = 0;

    teams.forEach((t) => {
      if (t.payment.status === 'verified') verifiedTeams++;
      else if (t.payment.status === 'rejected') rejectedTeams++;
      else pendingTeams++;

      const members = [t.teamLeader, t.teamMember1, t.teamMember2, t.teamMember3].filter(
        (m) => m && m.name
      );
      totalMembers += members.length;

      members.forEach((m) => {
        if (m.residenceType === 'hosteler') hostelersCount++;
        else dayScholarsCount++;
      });
    });

    res.json({
      success: true,
      stats: {
        totalTeams,
        verifiedTeams,
        pendingTeams,
        rejectedTeams,
        totalMembers,
        hostelersCount,
        dayScholarsCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/download-teams (Excel generator)
app.post('/api/download-teams', async (req, res) => {
  try {
    const { password, category } = req.body;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }

    let filter = {};
    if (category === 'verified') filter['payment.status'] = 'verified';
    else if (category === 'pending') filter['payment.status'] = 'pending';
    else if (category === 'rejected') filter['payment.status'] = 'rejected';

    const teams = await TeamRegistration.find(filter)
      .sort({ submittedAt: -1 })
      .populate('selectedProblemStatement');

    let finalTeams = teams;
    if (category === 'hosteler' || category === 'dayScholar') {
      finalTeams = teams.filter((t) => {
        const members = [t.teamLeader, t.teamMember1, t.teamMember2, t.teamMember3].filter(Boolean);
        return members.some((m) => m.residenceType === category);
      });
    }

    const rows = [];
    finalTeams.forEach((t) => {
      const leader = t.teamLeader || {};
      const m1 = t.teamMember1 || {};
      const m2 = t.teamMember2 || {};
      const m3 = t.teamMember3 || {};
      const problem = t.selectedProblemStatement?.title || 'Not Selected';

      rows.push({
        'Team Name': t.teamName,
        'Payment Status': t.payment?.status || 'pending',
        'Transaction ID': t.payment?.transactionId || '',
        'Design Brief': problem,

        'Leader Name': leader.name || '',
        'Leader RegNo': leader.regNo || '',
        'Leader Phone': leader.phoneNo || '',
        'Leader Year': leader.year || '',
        'Leader Branch': leader.branch || '',
        'Leader Section': leader.section || '',
        'Leader Gender': leader.gender || '',
        'Leader Residence': leader.residenceType || '',
        'Leader Hostel': leader.hostelName || '',
        'Leader Room': leader.roomNo || '',

        'Member 1 Name': m1.name || '',
        'Member 1 RegNo': m1.regNo || '',
        'Member 1 Phone': m1.phoneNo || '',
        'Member 1 Year': m1.year || '',
        'Member 1 Branch': m1.branch || '',
        'Member 1 Section': m1.section || '',

        'Member 2 Name': m2.name || '',
        'Member 2 RegNo': m2.regNo || '',
        'Member 2 Phone': m2.phoneNo || '',
        'Member 2 Year': m2.year || '',
        'Member 2 Branch': m2.branch || '',
        'Member 2 Section': m2.section || '',

        'Member 3 Name': m3.name || '',
        'Member 3 RegNo': m3.regNo || '',
        'Member 3 Phone': m3.phoneNo || '',
        'Member 3 Year': m3.year || '',
        'Member 3 Branch': m3.branch || '',
        'Member 3 Section': m3.section || '',
        'Submitted At': t.submittedAt ? new Date(t.submittedAt).toISOString() : '',
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teams');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=teams_${category || 'all'}_${Date.now()}.xlsx`);
    res.send(excelBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. PROBLEM STATEMENTS & DASHBOARD ROUTES
// ==========================================

// GET /api/admin/problems
app.get('/api/admin/problems', async (req, res) => {
  try {
    const password = req.query.password;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }
    const problems = await ProblemStatement.find().sort({ createdAt: -1 });
    res.json({ success: true, data: problems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/problems
app.get('/api/problems', async (req, res) => {
  try {
    let setting = await AppSettings.findOne({ key: 'problemStatementsEnabled' });
    if (setting && !setting.enabled) {
      return res.json({ success: true, disabled: true, data: [] });
    }
    const problems = await ProblemStatement.find().sort({ createdAt: -1 });
    res.json({ success: true, disabled: false, data: problems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/problems
app.post('/api/problems', async (req, res) => {
  try {
    const { password, title, themePng, shortDescription, fullDescription, limit } = req.body;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }
    if (!title || !shortDescription) {
      return res.status(400).json({ success: false, message: 'Title and Short Description are required.' });
    }
    const newProblem = await ProblemStatement.create({
      title: title.trim(),
      themePng: themePng ? themePng.trim() : '',
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription ? fullDescription.trim() : '',
      limit: Number(limit) || 7,
    });
    res.json({ success: true, data: newProblem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/problems/:id
app.put('/api/problems/:id', async (req, res) => {
  try {
    const { password, title, themePng, shortDescription, fullDescription, limit } = req.body;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }
    const updated = await ProblemStatement.findByIdAndUpdate(
      req.params.id,
      {
        title: title ? title.trim() : undefined,
        themePng: themePng !== undefined ? themePng.trim() : undefined,
        shortDescription: shortDescription ? shortDescription.trim() : undefined,
        fullDescription: fullDescription !== undefined ? fullDescription.trim() : undefined,
        limit: limit ? Number(limit) : undefined,
      },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Problem statement not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/problems/:id
app.delete('/api/problems/:id', async (req, res) => {
  try {
    const password = req.body.password || req.query.password;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }
    const deleted = await ProblemStatement.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Problem statement not found' });
    }
    res.json({ success: true, message: 'Problem statement deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/teams/selected
app.get('/api/admin/teams/selected', async (req, res) => {
  try {
    const password = req.query.password;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }
    const teams = await TeamRegistration.find({
      selectedProblemStatement: { $ne: null },
    }).populate('selectedProblemStatement');
    res.json({ success: true, data: teams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/teams/:id/reset-problem
app.post('/api/admin/teams/:id/reset-problem', async (req, res) => {
  try {
    const { password } = req.body;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }
    const team = await TeamRegistration.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    if (team.selectedProblemStatement) {
      await ProblemStatement.findByIdAndUpdate(team.selectedProblemStatement, {
        $inc: { slotsTaken: -1 },
      });
      team.selectedProblemStatement = null;
      team.selectedProblemSelectedAt = null;
      await team.save();
    }
    res.json({ success: true, message: 'Design brief selection unlocked' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/teams/:teamName/add-form
app.post('/api/admin/teams/:teamName/add-form', async (req, res) => {
  try {
    const { password } = req.body;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }
    const teamName = decodeURIComponent(req.params.teamName).trim();
    const team = await TeamRegistration.findOne({
      teamName: { $regex: new RegExp(`^${teamName}$`, 'i') },
    }).populate('selectedProblemStatement');
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    team.submissions.push({
      canvaFigmaLink: '',
      note: '',
      isSubmitted: false,
      submittedAt: null,
    });
    await team.save();
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/teams/:teamName/reset-form/:idx
app.post('/api/admin/teams/:teamName/reset-form/:idx', async (req, res) => {
  try {
    const { password } = req.body;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }
    const teamName = decodeURIComponent(req.params.teamName).trim();
    const idx = Number(req.params.idx);
    const team = await TeamRegistration.findOne({
      teamName: { $regex: new RegExp(`^${teamName}$`, 'i') },
    }).populate('selectedProblemStatement');
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    if (team.submissions[idx]) {
      team.submissions[idx] = {
        canvaFigmaLink: '',
        note: '',
        isSubmitted: false,
        submittedAt: null,
      };
      await team.save();
    }
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/teams/:teamName/remove-form/:idx
app.post('/api/admin/teams/:teamName/remove-form/:idx', async (req, res) => {
  try {
    const { password } = req.body;
    if (!validateAdminPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid administrator key' });
    }
    const teamName = decodeURIComponent(req.params.teamName).trim();
    const idx = Number(req.params.idx);
    const team = await TeamRegistration.findOne({
      teamName: { $regex: new RegExp(`^${teamName}$`, 'i') },
    }).populate('selectedProblemStatement');
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    if (team.submissions[idx] !== undefined) {
      team.submissions.splice(idx, 1);
      await team.save();
    }
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/team/:key
app.get('/api/team/:key', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key).trim();
    const team = await TeamRegistration.findOne({
      teamName: { $regex: new RegExp(`^${key}$`, 'i') },
    }).populate('selectedProblemStatement');
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team key not found' });
    }
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/team/:teamName/select-problem
app.post('/api/team/:teamName/select-problem', async (req, res) => {
  try {
    const teamName = decodeURIComponent(req.params.teamName).trim();
    const { problemId } = req.body;

    const team = await TeamRegistration.findOne({
      teamName: { $regex: new RegExp(`^${teamName}$`, 'i') },
    });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    if (team.selectedProblemStatement) {
      return res.status(400).json({ success: false, message: 'Team has already selected a design brief.' });
    }

    const problem = await ProblemStatement.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Design brief not found' });
    }
    if (problem.slotsTaken >= problem.limit) {
      return res.status(400).json({ success: false, message: 'All slots for this design brief are taken.' });
    }

    problem.slotsTaken += 1;
    await problem.save();

    team.selectedProblemStatement = problem._id;
    team.selectedProblemSelectedAt = new Date();
    await team.save();

    const updatedTeam = await TeamRegistration.findById(team._id).populate('selectedProblemStatement');
    res.json({ success: true, data: updatedTeam });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/team/:teamName/submit-form/:idx
app.post('/api/team/:teamName/submit-form/:idx', async (req, res) => {
  try {
    const teamName = decodeURIComponent(req.params.teamName).trim();
    const idx = Number(req.params.idx);
    const { canvaFigmaLink, note } = req.body;

    const team = await TeamRegistration.findOne({
      teamName: { $regex: new RegExp(`^${teamName}$`, 'i') },
    }).populate('selectedProblemStatement');
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Ensure array length up to idx
    while (team.submissions.length <= idx) {
      team.submissions.push({
        canvaFigmaLink: '',
        note: '',
        isSubmitted: false,
        submittedAt: null,
      });
    }

    team.submissions[idx] = {
      canvaFigmaLink: canvaFigmaLink ? canvaFigmaLink.trim() : '',
      note: note ? note.trim() : '',
      isSubmitted: true,
      submittedAt: new Date(),
    };

    await team.save();
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 5. MARKS & LEADERBOARD ROUTES
// ==========================================

// GET /api/marks-board
app.get('/api/marks-board', async (req, res) => {
  try {
    const rounds = await RoundMarks.find();
    const roundNames = rounds.map((r) => r.roundName);
    const outOfByRound = {};
    rounds.forEach((r) => {
      outOfByRound[r.roundName] = r.outOf;
    });

    const teams = await TeamRegistration.find().populate('selectedProblemStatement');
    const problemStatements = await ProblemStatement.find();

    const teamsWithMarks = teams.map((team) => {
      const roundMarks = {};
      let total = 0;

      rounds.forEach((r) => {
        const found = r.teamMarks.find((m) => m.teamName === team.teamName);
        const mark = found ? found.mark : 0;
        roundMarks[r.roundName] = mark;
        total += mark;
      });

      return {
        _id: team._id,
        teamName: team.teamName,
        teamLeader: team.teamLeader,
        teamMember1: team.teamMember1,
        teamMember2: team.teamMember2,
        teamMember3: team.teamMember3,
        payment: team.payment,
        selectedProblemStatement: team.selectedProblemStatement,
        roundMarks,
        total,
      };
    });

    res.json({
      success: true,
      rounds: roundNames,
      outOfByRound,
      problemStatements,
      data: teamsWithMarks,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/rounds
app.get('/api/rounds', async (req, res) => {
  try {
    const rounds = await RoundMarks.find();
    res.json({ success: true, data: rounds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/rounds
app.post('/api/rounds', async (req, res) => {
  try {
    const { roundName, outOf } = req.body;
    if (!roundName || !outOf) {
      return res.status(400).json({ success: false, message: 'roundName and outOf required' });
    }
    const round = await RoundMarks.findOneAndUpdate(
      { roundName: roundName.trim() },
      { outOf: Number(outOf) },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: round });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/rounds/:roundName
app.put('/api/rounds/:roundName', async (req, res) => {
  try {
    const oldRoundName = decodeURIComponent(req.params.roundName).trim();
    const { newRoundName, outOf } = req.body;
    if (!newRoundName || !outOf) {
      return res.status(400).json({ success: false, message: 'newRoundName and outOf required' });
    }

    const round = await RoundMarks.findOne({ roundName: oldRoundName });
    if (!round) {
      return res.status(404).json({ success: false, message: 'Round not found' });
    }

    round.roundName = newRoundName.trim();
    round.outOf = Number(outOf);
    await round.save();

    res.json({ success: true, data: round });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/rounds/:roundName
app.delete('/api/rounds/:roundName', async (req, res) => {
  try {
    const roundName = decodeURIComponent(req.params.roundName).trim();
    await RoundMarks.findOneAndDelete({ roundName });
    res.json({ success: true, message: 'Round deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/marks & POST /api/marks
const handleUpdateMarks = async (req, res) => {
  try {
    const { teamName, roundName, mark } = req.body;
    if (!teamName || !roundName || mark === undefined) {
      return res.status(400).json({ success: false, message: 'teamName, roundName, and mark are required' });
    }

    const round = await RoundMarks.findOne({ roundName: roundName.trim() });
    if (!round) {
      return res.status(404).json({ success: false, message: 'Round not found' });
    }

    const targetMark = Math.max(0, Math.min(Number(mark), round.outOf));
    const idx = round.teamMarks.findIndex((tm) => tm.teamName === teamName.trim());

    if (idx !== -1) {
      round.teamMarks[idx].mark = targetMark;
    } else {
      round.teamMarks.push({ teamName: teamName.trim(), mark: targetMark });
    }

    await round.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

app.patch('/api/marks', handleUpdateMarks);
app.post('/api/marks', handleUpdateMarks);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});