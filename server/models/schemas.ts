import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    trialStartDate: { type: Date, required: true, default: Date.now },
    trialEndsAt: { type: Date, required: true },
    accessStatus: {
      type: String,
      enum: ['trial', 'locked', 'active'],
      default: 'trial',
    },
    enrolledPlan: { type: String, default: null },
    preferredCourse: { type: String, default: 'Tajweed Mastery' },
    assignedTeacherId: { type: String, required: true },
  },
  { timestamps: true }
);

const teacherSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    title: { type: String, required: true },
    photoUrl: { type: String, required: true },
    qualifications: { type: String, required: true },
    experienceYears: { type: Number, required: true },
    languages: [{ type: String }],
    specialty: { type: String, required: true },
    bio: { type: String, required: true },
    availability: { type: String, required: true },
  },
  { timestamps: true }
);

const paymentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true },
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    amountUsd: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['paypal', 'easypaisa', 'jazzcash', 'card', 'bank_transfer'],
      required: true,
    },
    transactionRef: { type: String, required: true },
    accountLabel: { type: String, required: true },
    status: { type: String, enum: ['pending', 'paid'], default: 'paid' },
    paidAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

const classSessionSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true },
    teacherId: { type: String, required: true },
    teacherName: { type: String, required: true },
    courseTitle: { type: String, required: true },
    scheduleLabel: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    meetingUrl: { type: String, required: true },
    sessionType: { type: String, enum: ['trial', 'enrolled'], default: 'trial' },
    status: { type: String, enum: ['upcoming', 'completed'], default: 'upcoming' },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
export const TeacherModel =
  mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);
export const PaymentModel =
  mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export const ClassSessionModel =
  mongoose.models.ClassSession || mongoose.model('ClassSession', classSessionSchema);
