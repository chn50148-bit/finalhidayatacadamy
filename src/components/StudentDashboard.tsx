import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Lock,
  LogOut,
  Receipt,
  ShieldCheck,
  Unlock,
  Video,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import type {
  ClassSession,
  CoursePlan,
  DashboardPayload,
  PaymentMethod,
} from '../types';

interface StudentDashboardProps {
  token: string | null;
  plans: CoursePlan[];
  initialAuthMode: 'register' | 'login';
  initialIntent: 'trial' | 'enroll';
  preselectedPlanId: string | null;
  onAuthenticated: (token: string, payload: DashboardPayload) => void;
  onLogout: () => void;
  onBackToAcademy: () => void;
}

type PortalTab = 'overview' | 'enroll' | 'receipts';

const PAYMENT_INSTRUCTIONS: Record<
  PaymentMethod,
  {
    title: string;
    accountHeading: string;
    accountDetails: string;
    steps: string[];
    inputLabel: string;
    placeholder: string;
  }
> = {
  paypal: {
    title: 'PayPal (International)',
    accountHeading: 'PayPal Merchant Account',
    accountDetails: 'payments@hidayatacademy.com',
    steps: [
      'Log in to your PayPal account and choose Send Money / Goods & Services.',
      'Send the monthly tuition fee in USD to payments@hidayatacademy.com.',
      'Enter your PayPal Transaction ID or payer email below to unlock your dashboard.',
    ],
    inputLabel: 'PayPal Transaction ID or Payer Email',
    placeholder: 'e.g. 8HG92014XY123456A or yourname@gmail.com',
  },
  easypaisa: {
    title: 'Easypaisa Mobile Wallet',
    accountHeading: 'Easypaisa Account · Hidayat Academy',
    accountDetails: '0345-8812490',
    steps: [
      'Open your Easypaisa App (or dial *786#) and select Money Transfer.',
      'Send the monthly fee to Easypaisa account 0345-8812490 (Title: Hidayat Academy).',
      'Enter the 11-digit Transaction ID (TID) from your SMS receipt below.',
    ],
    inputLabel: 'Easypaisa TID or Sender Mobile Number',
    placeholder: 'e.g. TID 10948273615 or 0345-XXXXXXX',
  },
  jazzcash: {
    title: 'JazzCash Mobile Wallet',
    accountHeading: 'JazzCash Account · Hidayat Academy',
    accountDetails: '0300-4128901',
    steps: [
      'Open your JazzCash App (or dial *786#) and select Send Money -> JazzCash.',
      'Transfer the monthly tuition fee to 0300-4128901 (Title: Hidayat Academy).',
      'Paste your JazzCash TID or sender mobile number below to verify & unlock.',
    ],
    inputLabel: 'JazzCash TID or Sender Mobile Number',
    placeholder: 'e.g. TID 99827164501 or 0300-XXXXXXX',
  },
  card: {
    title: 'Debit / Credit Card',
    accountHeading: 'Visa · Mastercard · UnionPay',
    accountDetails: 'Instant Encrypted Card Verification',
    steps: [
      'Enter your cardholder name and last 4 card digits for billing verification.',
      'Monthly fee is processed immediately upon confirmation.',
    ],
    inputLabel: 'Cardholder Name & Last 4 Digits',
    placeholder: 'e.g. Ahmed Raza · Visa 4242',
  },
  bank_transfer: {
    title: 'Bank Transfer (IBAN)',
    accountHeading: 'HBL · Title: Hidayat Academy',
    accountDetails: 'PK42 HABB 0004 8179 0021 5503',
    steps: [
      'Transfer the monthly fee via Raast or IBAN to the HBL account above.',
      'Enter your bank transfer reference number below to activate your classes.',
    ],
    inputLabel: 'Bank Transfer Reference / Slip Number',
    placeholder: 'e.g. FT-2026-884120',
  },
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00d : 00h : 00m : 00s';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(days)}d : ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
}

export function StudentDashboard({
  token,
  plans,
  initialAuthMode,
  initialIntent,
  preselectedPlanId,
  onAuthenticated,
  onLogout,
  onBackToAcademy,
}: StudentDashboardProps) {
  const [authMode, setAuthMode] = useState<'register' | 'login'>(initialAuthMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredCourse, setPreferredCourse] = useState('Noorani Qaida');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [activeTab, setActiveTab] = useState<PortalTab>(
    initialIntent === 'enroll' ? 'enroll' : 'overview'
  );
  const [remainingMs, setRemainingMs] = useState(0);

  // Payment / Enrollment state
  const [checkoutPlanId, setCheckoutPlanId] = useState(
    preselectedPlanId || plans[1]?.id || 'tajweed'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');
  const [accountLabel, setAccountLabel] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);

  const [activeClassroom, setActiveClassroom] = useState<ClassSession | null>(null);

  useEffect(() => {
    setAuthMode(initialAuthMode);
  }, [initialAuthMode]);

  useEffect(() => {
    if (preselectedPlanId) {
      setCheckoutPlanId(preselectedPlanId);
    }
  }, [preselectedPlanId]);

  useEffect(() => {
    if (initialIntent === 'enroll') {
      setActiveTab('enroll');
    }
  }, [initialIntent]);

  useEffect(() => {
    if (!token) {
      setDashboard(null);
      return;
    }

    let cancelled = false;
    setLoadingDashboard(true);
    fetch('/api/student/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Session expired');
        }
        return (await res.json()) as DashboardPayload;
      })
      .then((data) => {
        if (!cancelled) {
          setDashboard(data);
          setRemainingMs(data.user.trialRemainingMs);
          if (data.user.accessStatus === 'locked' || initialIntent === 'enroll') {
            setActiveTab('enroll');
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          onLogout();
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingDashboard(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, initialIntent, onLogout]);

  useEffect(() => {
    if (!dashboard || dashboard.user.accessStatus !== 'trial') {
      return;
    }
    const targetMs = new Date(dashboard.user.trialEndsAt).getTime();
    const timer = window.setInterval(() => {
      const next = Math.max(0, targetMs - Date.now());
      setRemainingMs(next);
      if (next === 0 && token) {
        fetch('/api/student/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((updated: DashboardPayload | null) => {
            if (updated) {
              setDashboard(updated);
              if (updated.user.accessStatus === 'locked') {
                setActiveTab('enroll');
              }
            }
          })
          .catch(() => {});
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [dashboard, token]);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const endpoint =
        authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body =
        authMode === 'register'
          ? {
              name,
              email,
              password,
              preferredCourse,
            }
          : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed.');
        return;
      }

      const dashRes = await fetch('/api/student/dashboard', {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const dashData = (await dashRes.json()) as DashboardPayload;
      setDashboard(dashData);
      setRemainingMs(dashData.user.trialRemainingMs);
      onAuthenticated(data.token, dashData);
      if (dashData.user.accessStatus === 'locked' || initialIntent === 'enroll') {
        setActiveTab('enroll');
      } else {
        setActiveTab('overview');
      }
    } catch {
      setAuthError('Network error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSimulateExpiry = async () => {
    if (!token) return;
    setCheckoutSuccess(null);
    const res = await fetch('/api/student/simulate-expiry', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const dashRes = await fetch('/api/student/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dashData = (await dashRes.json()) as DashboardPayload;
      setDashboard(dashData);
      setRemainingMs(0);
      setActiveClassroom(null);
      setActiveTab('enroll');
    }
  };

  const handleCheckoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCheckoutError(null);
    setCheckoutSuccess(null);
    setCheckoutLoading(true);

    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: checkoutPlanId,
          paymentMethod,
          accountLabel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || 'Payment verification failed.');
        return;
      }

      const dashRes = await fetch('/api/student/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dashData = (await dashRes.json()) as DashboardPayload;
      setDashboard(dashData);
      setCheckoutSuccess(data.message);
      setAccountLabel('');
      setActiveTab('overview');
    } catch {
      setCheckoutError('Unable to complete payment. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!token) {
    const isEnrollFlow = initialIntent === 'enroll';

    return (
      <main className="mx-auto max-w-5xl px-6 py-12 lg:py-16">
        <button
          type="button"
          onClick={onBackToAcademy}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#3C4641] hover:text-[#093628]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Hidayat Academy
        </button>

        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#C8BEA8] bg-white lg:grid-cols-12">
          <div className="flex flex-col justify-between bg-[#093628] p-8 text-white lg:col-span-5 lg:p-10">
            <div>
              <p className="text-xs font-semibold text-[#D6B87C]">
                {isEnrollFlow ? 'Student Enrollment & Fee Payment' : '3-Day Free Trial'}
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white">
                {isEnrollFlow
                  ? 'Enroll in Hidayat Academy & Pay Tuition Fee'
                  : 'Begin your Quran journey with a 3-day free trial'}
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-white/85">
                {isEnrollFlow
                  ? 'Create your student account or sign in to choose your Quran course and pay securely via PayPal, Easypaisa, JazzCash, Card, or Bank Transfer.'
                  : 'Register to activate your 3-day free trial. Our academy administration assigns your certified Quran scholar automatically.'}
              </p>
            </div>

            <div className="mt-8 space-y-3 border-t border-white/15 pt-6 text-xs text-white/85">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-[#D6B87C] shrink-0" aria-hidden="true" />
                <span>72-hour trial timer starts on student registration</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Lock className="h-4 w-4 text-[#D6B87C] shrink-0" aria-hidden="true" />
                <span>Dashboard locks after 3 days until tuition fee is paid</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Unlock className="h-4 w-4 text-[#D6B87C] shrink-0" aria-hidden="true" />
                <span>PayPal, Easypaisa, JazzCash &amp; Bank IBAN accepted</span>
              </div>
            </div>
          </div>

          <div className="p-8 lg:col-span-7 lg:p-10">
            <div className="mb-6 flex items-center gap-1 rounded-lg bg-[#EAE2D3] p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                }}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                  authMode === 'register'
                    ? 'bg-white text-[#111815] shadow-sm'
                    : 'text-[#3C4641] hover:text-[#111815]'
                }`}
              >
                {isEnrollFlow ? 'New Student Enrollment' : 'Create 3-Day Trial Account'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                }}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                  authMode === 'login'
                    ? 'bg-white text-[#111815] shadow-sm'
                    : 'text-[#3C4641] hover:text-[#111815]'
                }`}
              >
                Existing Student
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label
                    htmlFor="student-name"
                    className="block text-xs font-semibold text-[#111815]"
                  >
                    Student Full Name
                  </label>
                  <input
                    id="student-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ayesha Khan"
                    className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="student-email"
                  className="block text-xs font-semibold text-[#111815]"
                >
                  Email Address
                </label>
                <input
                  id="student-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="student-password"
                  className="block text-xs font-semibold text-[#111815]"
                >
                  Password
                </label>
                <input
                  id="student-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
                />
              </div>

              {authMode === 'register' && (
                <div>
                  <label
                    htmlFor="preferred-course"
                    className="block text-xs font-semibold text-[#111815]"
                  >
                    Select Quran Program
                  </label>
                  <select
                    id="preferred-course"
                    value={preferredCourse}
                    onChange={(e) => setPreferredCourse(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
                  >
                    <option value="Noorani Qaida">01. Noorani Qaida</option>
                    <option value="Tajweed">02. Tajweed</option>
                    <option value="Hifz">03. Hifz</option>
                    <option value="Qirat">04. Qirat</option>
                  </select>
                  <p className="mt-1.5 text-xs text-[#525B56]">
                    Teacher assignment is managed by Hidayat Academy administration.
                  </p>
                </div>
              )}

              {authError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
                >
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-lg bg-[#093628] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#06261C] disabled:opacity-60"
              >
                {authLoading
                  ? 'Please wait...'
                  : authMode === 'register'
                  ? isEnrollFlow
                    ? 'Continue to Fee Payment'
                    : 'Activate 3-Day Free Trial'
                  : 'Sign In & Continue'}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  if (loadingDashboard || !dashboard) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-[#D4CBB8]" />
          <div className="h-44 w-full animate-pulse rounded-xl bg-[#EAE2D3]" />
        </div>
      </main>
    );
  }

  const { user, assignedTeacher, payments, classes } = dashboard;
  const isLocked = user.accessStatus === 'locked';
  const isTrial = user.accessStatus === 'trial';
  const isActive = user.accessStatus === 'active';
  const selectedCheckoutPlan =
    plans.find((p) => p.id === checkoutPlanId) || plans[1] || plans[0];
  const paymentGuide = PAYMENT_INSTRUCTIONS[paymentMethod];

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 lg:py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <div className="rounded-xl border border-[#C8BEA8] bg-white p-5">
            <div className="border-b border-[#D4CBB8] pb-4">
              <p className="text-xs font-medium text-[#525B56]">Student Account</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-[#111815]">
                {user.name}
              </h2>
              <p className="truncate text-xs text-[#525B56]">{user.email}</p>
            </div>

            <nav aria-label="Dashboard sections" className="mt-4 space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-[#093628] text-white'
                    : 'text-[#111815] hover:bg-[#EAE2D3]'
                }`}
              >
                <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Overview &amp; Classes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('enroll')}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  activeTab === 'enroll'
                    ? 'bg-[#093628] text-white'
                    : 'text-[#111815] hover:bg-[#EAE2D3]'
                }`}
              >
                <CreditCard className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Enroll &amp; Pay Fee</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('receipts')}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  activeTab === 'receipts'
                    ? 'bg-[#093628] text-white'
                    : 'text-[#111815] hover:bg-[#EAE2D3]'
                }`}
              >
                <Receipt className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Billing Receipts</span>
              </button>
            </nav>

            <div className="mt-6 space-y-2 border-t border-[#D4CBB8] pt-4">
              <button
                type="button"
                onClick={onBackToAcademy}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#3C4641] hover:bg-[#EAE2D3] hover:text-[#111815]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Back to Academy</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Viewport */}
        <section className="space-y-6 lg:col-span-9">
          {/* Top Status Strip */}
          <div className="flex flex-col gap-4 rounded-xl border border-[#C8BEA8] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                {isActive && (
                  <>
                    <CheckCircle2
                      className="h-4 w-4 text-[#093628]"
                      aria-hidden="true"
                    />
                    <span className="text-[#093628]">
                      Enrolled &amp; Unlocked · {user.enrolledPlan || user.preferredCourse}
                    </span>
                  </>
                )}
                {isTrial && (
                  <>
                    <Clock className="h-4 w-4 text-[#9F7225]" aria-hidden="true" />
                    <span className="text-[#8A611C]">
                      3-Day Free Trial Active · {user.preferredCourse}
                    </span>
                  </>
                )}
                {isLocked && (
                  <>
                    <Lock className="h-4 w-4 text-red-700" aria-hidden="true" />
                    <span className="text-red-700">
                      Dashboard Locked · 3-Day Free Trial Expired
                    </span>
                  </>
                )}
              </div>

              <h1 className="mt-1.5 font-display text-3xl font-bold text-[#111815]">
                {isLocked
                  ? 'Complete Enrollment to Unlock Classes'
                  : isActive
                  ? 'Your Live Quran Classroom'
                  : 'Welcome to Your 3-Day Free Trial'}
              </h1>
            </div>

            {isTrial && (
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <div className="rounded-lg border border-[#C8BEA8] bg-[#F3EDE2] px-4 py-2 text-right">
                  <p className="text-[11px] font-semibold text-[#525B56]">
                    Trial Time Remaining
                  </p>
                  <p className="font-mono text-sm font-bold text-[#111815] tabular-nums">
                    {formatCountdown(remainingMs)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateExpiry}
                  className="text-xs font-semibold text-[#3C4641] underline underline-offset-4 hover:text-[#093628]"
                >
                  Test 3-day expiry lock now
                </button>
              </div>
            )}

            {isLocked && (
              <button
                type="button"
                onClick={() => setActiveTab('enroll')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#093628] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#06261C] whitespace-nowrap shrink-0"
              >
                <Unlock className="h-4 w-4" aria-hidden="true" />
                Pay Fee &amp; Unlock
              </button>
            )}
          </div>

          {checkoutSuccess && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-xl border border-[#093628]/30 bg-[#093628]/10 px-5 py-4 text-sm font-semibold text-[#093628]"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{checkoutSuccess}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW & LIVE CLASSES */}
          {activeTab === 'overview' && (
            <>
              {isLocked ? (
                <div className="rounded-xl border border-[#C8BEA8] bg-white p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
                    <Lock className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 font-display text-3xl font-bold text-[#111815]">
                    Your 3-Day Free Trial Has Ended
                  </h2>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#3C4641]">
                    Live classroom access and upcoming teacher sessions are locked until
                    you enroll in a monthly plan and pay via PayPal, Easypaisa,
                    JazzCash, Card, or Bank Transfer.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('enroll')}
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#093628] px-6 py-3 text-sm font-semibold text-white hover:bg-[#06261C]"
                  >
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    Enroll Now &amp; Pay Fee
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {assignedTeacher && (
                    <div className="flex flex-col gap-4 rounded-xl border border-[#C8BEA8] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={assignedTeacher.photoUrl}
                          alt={assignedTeacher.name}
                          referrerPolicy="no-referrer"
                          className="h-14 w-14 rounded-lg object-cover object-top border border-[#C8BEA8]"
                        />
                        <div>
                          <p className="text-xs font-medium text-[#525B56]">
                            Academy-Assigned Quran Scholar
                          </p>
                          <h3 className="font-display text-xl font-bold text-[#111815]">
                            {assignedTeacher.name}
                          </h3>
                          <p className="text-xs text-[#525B56]">
                            {assignedTeacher.qualifications}
                          </p>
                        </div>
                      </div>
                      {isTrial && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('enroll')}
                          className="inline-flex items-center justify-center rounded-lg border border-[#093628] px-4 py-2 text-xs font-semibold text-[#093628] hover:bg-[#093628] hover:text-white whitespace-nowrap shrink-0"
                        >
                          Enroll in Monthly Plan
                        </button>
                      )}
                    </div>
                  )}

                  {activeClassroom && (
                    <div className="rounded-xl border border-[#093628] bg-[#093628] p-6 text-white">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold text-[#D6B87C]">
                            Live 1-on-1 Session Ready
                          </p>
                          <h3 className="mt-1 font-display text-2xl font-bold text-white">
                            {activeClassroom.courseTitle} — {activeClassroom.teacherName}
                          </h3>
                          <p className="mt-1 text-xs text-white/80">
                            Scheduled: {activeClassroom.scheduleLabel} ·{' '}
                            {activeClassroom.durationMinutes} minutes
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveClassroom(null)}
                          className="self-start rounded-lg border border-white/25 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
                        >
                          Close Room Panel
                        </button>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-4 rounded-lg bg-white/10 p-4 text-xs sm:grid-cols-3">
                        <div>
                          <p className="font-semibold text-white">1. Mushaf Readiness</p>
                          <p className="mt-1 text-white/80">
                            Keep your Quran or Noorani Qaida open for live Tajweed screen
                            guidance.
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-white">2. Audio Check</p>
                          <p className="mt-1 text-white/80">
                            Ensure microphone clarity so your Qari can hear Makharij
                            precisely.
                          </p>
                        </div>
                        <div className="flex items-center sm:justify-end">
                          <a
                            href={activeClassroom.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-[#D6B87C] px-4 py-2.5 text-xs font-bold text-[#093628] hover:bg-[#E2C994] whitespace-nowrap shrink-0"
                          >
                            <Video className="h-4 w-4" aria-hidden="true" />
                            Launch Video Classroom
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="overflow-hidden rounded-xl border border-[#C8BEA8] bg-white">
                    <div className="border-b border-[#D4CBB8] px-6 py-4">
                      <h3 className="font-display text-2xl font-bold text-[#111815]">
                        Upcoming Online Classes
                      </h3>
                    </div>

                    {classes.length === 0 ? (
                      <div className="p-8 text-center text-sm text-[#525B56]">
                        No classes scheduled yet. Complete enrollment to generate your
                        weekly timetable.
                      </div>
                    ) : (
                      <div className="divide-y divide-[#D4CBB8]">
                        {classes.map((session) => (
                          <div
                            key={session.id}
                            className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-semibold text-[#111815]">
                                {session.courseTitle}
                              </p>
                              <p className="mt-0.5 text-xs text-[#525B56]">
                                Teacher: {session.teacherName} ·{' '}
                                <span className="font-mono tabular-nums">
                                  {session.scheduleLabel}
                                </span>{' '}
                                · {session.durationMinutes} min
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveClassroom(session)}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#093628] px-4 py-2 text-xs font-semibold text-white hover:bg-[#06261C] whitespace-nowrap shrink-0"
                            >
                              <Video className="h-3.5 w-3.5" aria-hidden="true" />
                              Join Live Class
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: ENROLL & FEE PAYMENT (PayPal, Easypaisa, JazzCash, Card, Bank) */}
          {activeTab === 'enroll' && (
            <div className="rounded-xl border border-[#C8BEA8] bg-white p-6 lg:p-8">
              <div className="border-b border-[#D4CBB8] pb-5">
                <p className="text-xs font-semibold text-[#093628]">
                  Enroll Now &amp; Fee Payment Guide
                </p>
                <h2 className="mt-1 font-display text-3xl font-bold text-[#111815]">
                  Select Your Quran Course &amp; Pay Tuition Fee
                </h2>
                <p className="mt-1 text-sm text-[#3C4641]">
                  Choose your course, follow the payment instructions for PayPal,
                  Easypaisa, JazzCash, Card, or Bank Transfer, and unlock your live
                  online classes immediately.
                </p>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="mt-6 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-[#111815]">
                    1. Select Monthly Program
                  </label>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {plans.map((plan) => {
                      const active = checkoutPlanId === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setCheckoutPlanId(plan.id)}
                          className={`rounded-xl border p-4 text-left transition-colors ${
                            active
                              ? 'border-[#093628] bg-[#093628] text-white'
                              : 'border-[#C8BEA8] bg-[#F3EDE2] text-[#111815] hover:border-[#093628]'
                          }`}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-display text-xl font-bold">
                              {plan.name}
                            </span>
                            <span
                              className={`font-mono text-base font-semibold tabular-nums ${
                                active ? 'text-[#D6B87C]' : 'text-[#093628]'
                              }`}
                            >
                              ${plan.priceUsd}
                            </span>
                          </div>
                          <p
                            className={`mt-2 text-xs font-medium ${
                              active ? 'text-white/85' : 'text-[#3C4641]'
                            }`}
                          >
                            {plan.sessionsPerWeek} classes/week · {plan.durationMinutes}{' '}
                            min
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#111815]">
                    2. Choose Fee Payment Method
                  </label>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {(
                      [
                        ['paypal', 'PayPal'],
                        ['easypaisa', 'Easypaisa'],
                        ['jazzcash', 'JazzCash'],
                        ['card', 'Debit / Card'],
                        ['bank_transfer', 'Bank IBAN'],
                      ] as Array<[PaymentMethod, string]>
                    ).map(([methodKey, label]) => {
                      const active = paymentMethod === methodKey;
                      return (
                        <button
                          key={methodKey}
                          type="button"
                          onClick={() => setPaymentMethod(methodKey)}
                          className={`rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors ${
                            active
                              ? 'border-[#093628] bg-[#093628] text-white'
                              : 'border-[#C8BEA8] bg-[#F3EDE2] text-[#111815] hover:border-[#093628]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step-by-step Instructions for selected method */}
                <div className="rounded-xl border border-[#C8BEA8] bg-[#F3EDE2] p-5">
                  <div className="flex flex-col gap-1 border-b border-[#D4CBB8] pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#093628]">
                        {paymentGuide.accountHeading}
                      </p>
                      <p className="font-mono text-sm font-bold text-[#111815] tabular-nums">
                        {paymentGuide.accountDetails}
                      </p>
                    </div>
                    <p className="font-mono text-sm font-bold text-[#093628] tabular-nums">
                      Fee Due: ${selectedCheckoutPlan?.priceUsd ?? 55} USD
                    </p>
                  </div>

                  <ol className="mt-3 space-y-1.5 text-xs leading-relaxed text-[#3C4641]">
                    {paymentGuide.steps.map((step, i) => (
                      <li key={step}>
                        <span className="font-semibold text-[#111815]">{i + 1}.</span>{' '}
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <label
                    htmlFor="payment-ref"
                    className="block text-xs font-semibold text-[#111815]"
                  >
                    3. {paymentGuide.inputLabel}
                  </label>
                  <input
                    id="payment-ref"
                    type="text"
                    required
                    value={accountLabel}
                    onChange={(e) => setAccountLabel(e.target.value)}
                    placeholder={paymentGuide.placeholder}
                    className="mt-2 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
                  />
                </div>

                {checkoutError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800"
                  >
                    {checkoutError}
                  </div>
                )}

                <div className="flex flex-col gap-4 border-t border-[#D4CBB8] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#3C4641]">
                    <ShieldCheck className="h-4 w-4 text-[#093628]" aria-hidden="true" />
                    <span>
                      Scholar assignment is handled by Hidayat Academy ·{' '}
                      <strong className="font-mono text-[#111815] tabular-nums">
                        ${selectedCheckoutPlan?.priceUsd ?? 55}/month
                      </strong>
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={checkoutLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#093628] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#06261C] disabled:opacity-60 whitespace-nowrap shrink-0"
                  >
                    <Unlock className="h-4 w-4" aria-hidden="true" />
                    {checkoutLoading
                      ? 'Verifying Payment...'
                      : `Submit ${paymentGuide.title.split(' ')[0]} Payment & Unlock`}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: BILLING RECEIPTS */}
          {activeTab === 'receipts' && (
            <div className="overflow-hidden rounded-xl border border-[#C8BEA8] bg-white">
              <div className="border-b border-[#D4CBB8] px-6 py-4">
                <h2 className="font-display text-2xl font-bold text-[#111815]">
                  Payment &amp; Enrollment History
                </h2>
              </div>

              {payments.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-[#525B56]">
                    No fee payments recorded yet. Enroll in a plan to unlock full
                    monthly classes.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('enroll')}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#093628] px-4 py-2 text-xs font-semibold text-white hover:bg-[#06261C]"
                  >
                    Enroll Now &amp; Pay Fee
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-[#D4CBB8] bg-[#F3EDE2] text-xs font-semibold text-[#3C4641]">
                      <tr>
                        <th className="px-6 py-3">Reference</th>
                        <th className="px-6 py-3">Course</th>
                        <th className="px-6 py-3">Method</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3 text-right">Amount</th>
                        <th className="px-6 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4CBB8]">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-[#F3EDE2]/60">
                          <td className="px-6 py-3.5 font-mono text-xs text-[#111815] tabular-nums">
                            {p.transactionRef}
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-[#111815]">
                            {p.planName}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-[#3C4641]">
                            {p.paymentMethod} · {p.accountLabel}
                          </td>
                          <td className="px-6 py-3.5 font-mono text-xs text-[#3C4641] tabular-nums">
                            {new Date(p.paidAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono font-semibold text-[#111815] tabular-nums">
                            ${p.amountUsd}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#093628]">
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Paid
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
