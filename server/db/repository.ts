import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { TEACHERS_SEED } from '../catalog.ts';
import {
  ClassSessionModel,
  PaymentModel,
  TeacherModel,
  UserModel,
} from '../models/schemas.ts';

export type AccessStatus = 'trial' | 'locked' | 'active';
export type UserRole = 'student' | 'admin';
export type PaymentMethod =
  | 'paypal'
  | 'easypaisa'
  | 'jazzcash'
  | 'card'
  | 'bank_transfer';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  trialStartDate: string;
  trialEndsAt: string;
  accessStatus: AccessStatus;
  enrolledPlan: string | null;
  preferredCourse: string;
  assignedTeacherId: string;
}

export interface TeacherRecord {
  id: string;
  slug: string;
  name: string;
  title: string;
  photoUrl: string;
  qualifications: string;
  experienceYears: number;
  languages: string[];
  specialty: string;
  bio: string;
  availability: string;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  planId: string;
  planName: string;
  amountUsd: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  accountLabel: string;
  status: 'pending' | 'paid';
  paidAt: string;
}

export interface ClassSessionRecord {
  id: string;
  studentId: string;
  teacherId: string;
  teacherName: string;
  courseTitle: string;
  scheduleLabel: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl: string;
  sessionType: 'trial' | 'enrolled';
  status: 'upcoming' | 'completed';
}

interface LocalStoreData {
  users: UserRecord[];
  teachers: TeacherRecord[];
  payments: PaymentRecord[];
  classes: ClassSessionRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const STORE_PATH = path.resolve(DATA_DIR, 'academy-store.json');

let usingMongo = false;

function ensureLocalStore(): LocalStoreData {
  if (!STORE_PATH.startsWith(DATA_DIR + path.sep)) {
    throw new Error('Invalid store path');
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const seededTeachers: TeacherRecord[] = TEACHERS_SEED.map((t, index) => ({
      id: `teacher-${index + 1}`,
      ...t,
    }));
    const initial: LocalStoreData = {
      users: [],
      teachers: seededTeachers,
      payments: [],
      classes: [],
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  const raw = fs.readFileSync(STORE_PATH, 'utf8');
  const parsed = JSON.parse(raw) as LocalStoreData;
  if (!parsed.teachers || parsed.teachers.length === 0) {
    parsed.teachers = TEACHERS_SEED.map((t, index) => ({
      id: `teacher-${index + 1}`,
      ...t,
    }));
    fs.writeFileSync(STORE_PATH, JSON.stringify(parsed, null, 2), 'utf8');
  }
  return parsed;
}

function writeLocalStore(data: LocalStoreData): void {
  if (!STORE_PATH.startsWith(DATA_DIR + path.sep)) {
    throw new Error('Invalid store path');
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function mapMongoUser(doc: Record<string, unknown>): UserRecord {
  return {
    id: String(doc._id),
    name: String(doc.name),
    email: String(doc.email),
    passwordHash: String(doc.passwordHash),
    role: (doc.role as UserRole) || 'student',
    trialStartDate: new Date(doc.trialStartDate as string | Date).toISOString(),
    trialEndsAt: new Date(doc.trialEndsAt as string | Date).toISOString(),
    accessStatus: (doc.accessStatus as AccessStatus) || 'trial',
    enrolledPlan: doc.enrolledPlan ? String(doc.enrolledPlan) : null,
    preferredCourse: String(doc.preferredCourse || 'Tajweed Mastery'),
    assignedTeacherId: String(doc.assignedTeacherId),
  };
}

function mapMongoTeacher(doc: Record<string, unknown>): TeacherRecord {
  return {
    id: String(doc._id),
    slug: String(doc.slug),
    name: String(doc.name),
    title: String(doc.title),
    photoUrl: String(doc.photoUrl),
    qualifications: String(doc.qualifications),
    experienceYears: Number(doc.experienceYears),
    languages: Array.isArray(doc.languages) ? doc.languages.map(String) : [],
    specialty: String(doc.specialty),
    bio: String(doc.bio),
    availability: String(doc.availability),
  };
}

export async function initDatabase(): Promise<'mongodb' | 'local-store'> {
  const mongoUri = process.env.MONGODB_URI?.trim();
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      usingMongo = true;
      const existingCount = await TeacherModel.countDocuments();
      if (existingCount === 0) {
        await TeacherModel.insertMany(TEACHERS_SEED);
      }
      console.log('[Hidayat Academy] Connected to MongoDB Atlas via Mongoose');
      return 'mongodb';
    } catch (err) {
      console.warn(
        '[Hidayat Academy] MongoDB connection unavailable, using local preview store:',
        err instanceof Error ? err.message : String(err)
      );
      usingMongo = false;
    }
  }
  ensureLocalStore();
  return 'local-store';
}

export function isUsingMongo(): boolean {
  return usingMongo;
}

export async function listTeachers(): Promise<TeacherRecord[]> {
  if (usingMongo) {
    const docs = await TeacherModel.find().lean();
    return docs.map((d) => mapMongoTeacher(d as Record<string, unknown>));
  }
  return ensureLocalStore().teachers;
}

export async function findTeacherById(id: string): Promise<TeacherRecord | null> {
  if (usingMongo) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const bySlug = await TeacherModel.findOne({ slug: id }).lean();
      return bySlug ? mapMongoTeacher(bySlug as Record<string, unknown>) : null;
    }
    const doc = await TeacherModel.findById(id).lean();
    return doc ? mapMongoTeacher(doc as Record<string, unknown>) : null;
  }
  const store = ensureLocalStore();
  return store.teachers.find((t) => t.id === id || t.slug === id) ?? null;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (usingMongo) {
    const doc = await UserModel.findOne({ email: cleanEmail }).lean();
    return doc ? mapMongoUser(doc as Record<string, unknown>) : null;
  }
  const store = ensureLocalStore();
  return store.users.find((u) => u.email === cleanEmail) ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  if (usingMongo) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await UserModel.findById(id).lean();
    return doc ? mapMongoUser(doc as Record<string, unknown>) : null;
  }
  const store = ensureLocalStore();
  return store.users.find((u) => u.id === id) ?? null;
}

export async function createUser(
  input: Omit<UserRecord, 'id'>
): Promise<UserRecord> {
  if (usingMongo) {
    const created = await UserModel.create({
      ...input,
      trialStartDate: new Date(input.trialStartDate),
      trialEndsAt: new Date(input.trialEndsAt),
    });
    return mapMongoUser(created.toObject() as unknown as Record<string, unknown>);
  }
  const store = ensureLocalStore();
  const user: UserRecord = {
    id: `student-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...input,
  };
  store.users.push(user);
  writeLocalStore(store);
  return user;
}

export async function updateUser(
  userId: string,
  patch: Partial<
    Pick<
      UserRecord,
      'accessStatus' | 'enrolledPlan' | 'trialEndsAt' | 'assignedTeacherId'
    >
  >
): Promise<UserRecord | null> {
  if (usingMongo) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const mongoPatch: Record<string, unknown> = { ...patch };
    if (patch.trialEndsAt) {
      mongoPatch.trialEndsAt = new Date(patch.trialEndsAt);
    }
    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { $set: mongoPatch },
      { new: true }
    ).lean();
    return updated ? mapMongoUser(updated as Record<string, unknown>) : null;
  }
  const store = ensureLocalStore();
  const index = store.users.findIndex((u) => u.id === userId);
  if (index === -1) return null;
  store.users[index] = {
    ...store.users[index],
    ...patch,
  };
  writeLocalStore(store);
  return store.users[index];
}

export async function listPaymentsByStudent(
  studentId: string
): Promise<PaymentRecord[]> {
  if (usingMongo) {
    const docs = await PaymentModel.find({ studentId }).sort({ paidAt: -1 }).lean();
    return docs.map((d) => ({
      id: String(d._id),
      studentId: String(d.studentId),
      planId: String(d.planId),
      planName: String(d.planName),
      amountUsd: Number(d.amountUsd),
      paymentMethod: d.paymentMethod as PaymentMethod,
      transactionRef: String(d.transactionRef),
      accountLabel: String(d.accountLabel),
      status: d.status as 'pending' | 'paid',
      paidAt: new Date(d.paidAt as Date).toISOString(),
    }));
  }
  const store = ensureLocalStore();
  return store.payments
    .filter((p) => p.studentId === studentId)
    .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
}

export async function createPayment(
  input: Omit<PaymentRecord, 'id'>
): Promise<PaymentRecord> {
  if (usingMongo) {
    const created = await PaymentModel.create({
      ...input,
      paidAt: new Date(input.paidAt),
    });
    const obj = created.toObject();
    return {
      id: String(obj._id),
      studentId: String(obj.studentId),
      planId: String(obj.planId),
      planName: String(obj.planName),
      amountUsd: Number(obj.amountUsd),
      paymentMethod: obj.paymentMethod as PaymentMethod,
      transactionRef: String(obj.transactionRef),
      accountLabel: String(obj.accountLabel),
      status: obj.status as 'pending' | 'paid',
      paidAt: new Date(obj.paidAt).toISOString(),
    };
  }
  const store = ensureLocalStore();
  const payment: PaymentRecord = {
    id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...input,
  };
  store.payments.push(payment);
  writeLocalStore(store);
  return payment;
}

export async function listClassesByStudent(
  studentId: string
): Promise<ClassSessionRecord[]> {
  if (usingMongo) {
    const docs = await ClassSessionModel.find({ studentId })
      .sort({ scheduledAt: 1 })
      .lean();
    return docs.map((d) => ({
      id: String(d._id),
      studentId: String(d.studentId),
      teacherId: String(d.teacherId),
      teacherName: String(d.teacherName),
      courseTitle: String(d.courseTitle),
      scheduleLabel: String(d.scheduleLabel),
      scheduledAt: new Date(d.scheduledAt as Date).toISOString(),
      durationMinutes: Number(d.durationMinutes),
      meetingUrl: String(d.meetingUrl),
      sessionType: d.sessionType as 'trial' | 'enrolled',
      status: d.status as 'upcoming' | 'completed',
    }));
  }
  const store = ensureLocalStore();
  return store.classes
    .filter((c) => c.studentId === studentId)
    .sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
}

export async function replaceClassesForStudent(
  studentId: string,
  sessions: Array<Omit<ClassSessionRecord, 'id'>>
): Promise<ClassSessionRecord[]> {
  if (usingMongo) {
    await ClassSessionModel.deleteMany({ studentId, status: 'upcoming' });
    const created = await ClassSessionModel.insertMany(
      sessions.map((s) => ({
        ...s,
        scheduledAt: new Date(s.scheduledAt),
      }))
    );
    return created.map((d) => {
      const obj = d.toObject();
      return {
        id: String(obj._id),
        studentId: String(obj.studentId),
        teacherId: String(obj.teacherId),
        teacherName: String(obj.teacherName),
        courseTitle: String(obj.courseTitle),
        scheduleLabel: String(obj.scheduleLabel),
        scheduledAt: new Date(obj.scheduledAt).toISOString(),
        durationMinutes: Number(obj.durationMinutes),
        meetingUrl: String(obj.meetingUrl),
        sessionType: obj.sessionType as 'trial' | 'enrolled',
        status: obj.status as 'upcoming' | 'completed',
      };
    });
  }
  const store = ensureLocalStore();
  store.classes = store.classes.filter(
    (c) => !(c.studentId === studentId && c.status === 'upcoming')
  );
  const created = sessions.map((s, idx) => ({
    id: `cls-${Date.now()}-${idx}`,
    ...s,
  }));
  store.classes.push(...created);
  writeLocalStore(store);
  return created;
}
