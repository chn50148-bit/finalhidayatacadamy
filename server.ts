import path from 'node:path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { COURSE_PLANS, THREE_DAYS_MS } from './server/catalog.ts';
import {
  createPayment,
  createUser,
  findTeacherById,
  findUserByEmail,
  initDatabase,
  listClassesByStudent,
  listPaymentsByStudent,
  listTeachers,
  replaceClassesForStudent,
  updateUser,
  type ClassSessionRecord,
  type PaymentMethod,
  type UserRecord,
} from './server/db/repository.ts';
import {
  requireAuth,
  requireUnlockedAccess,
  signAuthToken,
  syncTrialLockState,
  type AuthenticatedRequest,
} from './server/middleware/auth.ts';

dotenv.config();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_PAYMENT_METHODS: PaymentMethod[] = [
  'paypal',
  'easypaisa',
  'jazzcash',
  'card',
  'bank_transfer',
];

function sanitizeUser(user: UserRecord) {
  const now = Date.now();
  const trialEndsMs = new Date(user.trialEndsAt).getTime();
  const trialRemainingMs =
    user.accessStatus === 'active' ? 0 : Math.max(0, trialEndsMs - now);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    trialStartDate: user.trialStartDate,
    trialEndsAt: user.trialEndsAt,
    trialRemainingMs,
    accessStatus: user.accessStatus,
    enrolledPlan: user.enrolledPlan,
    preferredCourse: user.preferredCourse,
    assignedTeacherId: user.assignedTeacherId,
  };
}

function buildScheduleSessions(
  studentId: string,
  teacherId: string,
  teacherName: string,
  courseTitle: string,
  sessionType: 'trial' | 'enrolled',
  sessionCount: number,
  durationMinutes: number
): Array<Omit<ClassSessionRecord, 'id'>> {
  const now = Date.now();
  const roomPrefix = studentId.replace(/[^a-zA-Z0-9-]/g, '').slice(-8);
  const sessions: Array<Omit<ClassSessionRecord, 'id'>> = [];

  for (let i = 0; i < sessionCount; i += 1) {
    const offsetHours = i === 0 ? 4 : i * 24 + 14;
    const scheduledDate = new Date(now + offsetHours * 60 * 60 * 1000);
    const label = scheduledDate.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    sessions.push({
      studentId,
      teacherId,
      teacherName,
      courseTitle,
      scheduleLabel: label,
      scheduledAt: scheduledDate.toISOString(),
      durationMinutes,
      meetingUrl: `https://meet.jit.si/hidayat-academy-${roomPrefix}-${i + 1}`,
      sessionType,
      status: 'upcoming',
    });
  }
  return sessions;
}

async function startServer() {
  await initDatabase();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/teachers', async (_req, res) => {
    try {
      const teachers = await listTeachers();
      res.json({ teachers });
    } catch {
      res.status(500).json({ error: 'Unable to load teachers.' });
    }
  });

  app.get('/api/plans', (_req, res) => {
    res.json({ plans: COURSE_PLANS });
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, preferredCourse, teacherId } = req.body ?? {};

      if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string'
      ) {
        res.status(400).json({ error: 'Name, email, and password are required.' });
        return;
      }

      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (cleanName.length < 2 || cleanName.length > 80) {
        res.status(400).json({ error: 'Please enter a valid full name.' });
        return;
      }
      if (!EMAIL_REGEX.test(cleanEmail)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }
      if (password.length < 6) {
        res
          .status(400)
          .json({ error: 'Password must be at least 6 characters long.' });
        return;
      }

      const existing = await findUserByEmail(cleanEmail);
      if (existing) {
        res
          .status(409)
          .json({ error: 'An account with this email already exists. Please sign in.' });
        return;
      }

      const teachers = await listTeachers();
      const selectedTeacher =
        (typeof teacherId === 'string' &&
          teachers.find((t) => t.id === teacherId || t.slug === teacherId)) ||
        teachers[0];

      const passwordHash = await bcrypt.hash(password, 10);
      const now = Date.now();
      const trialStartDate = new Date(now).toISOString();
      const trialEndsAt = new Date(now + THREE_DAYS_MS).toISOString();
      const courseName =
        typeof preferredCourse === 'string' && preferredCourse.trim()
          ? preferredCourse.trim().slice(0, 60)
          : 'Tajweed Mastery';

      const newUser = await createUser({
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        role: 'student',
        trialStartDate,
        trialEndsAt,
        accessStatus: 'trial',
        enrolledPlan: null,
        preferredCourse: courseName,
        assignedTeacherId: selectedTeacher.id,
      });

      const trialSessions = buildScheduleSessions(
        newUser.id,
        selectedTeacher.id,
        selectedTeacher.name,
        `${courseName} (Free Trial)`,
        'trial',
        3,
        30
      );
      await replaceClassesForStudent(newUser.id, trialSessions);

      const token = signAuthToken(newUser);
      res.status(201).json({ token, user: sanitizeUser(newUser) });
    } catch {
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body ?? {};
      if (typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(cleanEmail)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }

      const user = await findUserByEmail(cleanEmail);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const syncedUser = await syncTrialLockState(user);
      const token = signAuthToken(syncedUser);
      res.json({ token, user: sanitizeUser(syncedUser) });
    } catch {
      res.status(500).json({ error: 'Sign in failed. Please try again.' });
    }
  });

  app.get('/api/student/dashboard', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.authUser!;
      const [teacher, payments, allClasses] = await Promise.all([
        findTeacherById(user.assignedTeacherId),
        listPaymentsByStudent(user.id),
        user.accessStatus === 'locked'
          ? Promise.resolve([])
          : listClassesByStudent(user.id),
      ]);

      res.json({
        user: sanitizeUser(user),
        assignedTeacher: teacher,
        payments,
        classes: allClasses,
        plans: COURSE_PLANS,
      });
    } catch {
      res.status(500).json({ error: 'Unable to load student dashboard.' });
    }
  });

  app.get(
    '/api/classes',
    requireAuth,
    requireUnlockedAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        const classes = await listClassesByStudent(req.authUser!.id);
        res.json({ classes });
      } catch {
        res.status(500).json({ error: 'Unable to load classes.' });
      }
    }
  );

  app.post(
    '/api/student/simulate-expiry',
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.authUser!;
        if (user.accessStatus === 'active') {
          res.status(400).json({
            error: 'Enrolled paid accounts cannot be locked by trial expiry.',
          });
          return;
        }
        const expiredDate = new Date(Date.now() - 60_000).toISOString();
        const updated = await updateUser(user.id, {
          trialEndsAt: expiredDate,
          accessStatus: 'locked',
        });
        res.json({ user: sanitizeUser(updated ?? user) });
      } catch {
        res.status(500).json({ error: 'Unable to update trial preview state.' });
      }
    }
  );

  app.post(
    '/api/payments/checkout',
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.authUser!;
        const { planId, paymentMethod, accountLabel, teacherId } = req.body ?? {};

        if (typeof planId !== 'string' || typeof paymentMethod !== 'string') {
          res.status(400).json({ error: 'Please select a course plan and payment method.' });
          return;
        }

        const plan = COURSE_PLANS.find((p) => p.id === planId);
        if (!plan) {
          res.status(400).json({ error: 'Selected course plan was not found.' });
          return;
        }

        if (!VALID_PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)) {
          res.status(400).json({ error: 'Unsupported payment method.' });
          return;
        }

        const cleanLabel =
          typeof accountLabel === 'string' && accountLabel.trim().length >= 3
            ? accountLabel.trim().slice(0, 48)
            : '';

        if (!cleanLabel) {
          res.status(400).json({
            error: 'Please enter a valid card last-4, mobile wallet, or transfer reference.',
          });
          return;
        }

        const teachers = await listTeachers();
        const chosenTeacher =
          (typeof teacherId === 'string' &&
            teachers.find((t) => t.id === teacherId || t.slug === teacherId)) ||
          teachers.find((t) => t.id === user.assignedTeacherId) ||
          teachers[0];

        const transactionRef = `HDA-${Date.now().toString(36).toUpperCase()}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;

        const payment = await createPayment({
          studentId: user.id,
          planId: plan.id,
          planName: plan.name,
          amountUsd: plan.priceUsd,
          paymentMethod: paymentMethod as PaymentMethod,
          transactionRef,
          accountLabel: cleanLabel,
          status: 'paid',
          paidAt: new Date().toISOString(),
        });

        const updatedUser = await updateUser(user.id, {
          accessStatus: 'active',
          enrolledPlan: plan.id,
          assignedTeacherId: chosenTeacher.id,
        });

        const enrolledClasses = buildScheduleSessions(
          user.id,
          chosenTeacher.id,
          chosenTeacher.name,
          plan.name,
          'enrolled',
          plan.sessionsPerWeek,
          plan.durationMinutes
        );
        const classes = await replaceClassesForStudent(user.id, enrolledClasses);

        res.json({
          message: 'Payment verified. Your student dashboard and live classes are now unlocked.',
          user: sanitizeUser(updatedUser ?? user),
          payment,
          classes,
          assignedTeacher: chosenTeacher,
        });
      } catch {
        res.status(500).json({ error: 'Payment processing failed. Please try again.' });
      }
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hidayat Academy] Server listening on port ${PORT}`);
  });
}

startServer();
