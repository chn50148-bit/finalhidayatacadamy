import { useCallback, useEffect, useState } from 'react';
import { AcademyLanding } from './components/AcademyLanding';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import type { CoursePlan, DashboardPayload, StudentUser, Teacher } from './types';

export default function App() {
  const [view, setView] = useState<'academy' | 'portal'>('academy');
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [portalIntent, setPortalIntent] = useState<'trial' | 'enroll'>('trial');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(null);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [plans, setPlans] = useState<CoursePlan[]>([]);
  const [preselectedPlanId, setPreselectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/teachers').then((r) => r.json()),
      fetch('/api/plans').then((r) => r.json()),
    ])
      .then(([tData, pData]) => {
        if (Array.isArray(tData.teachers)) {
          setTeachers(tData.teachers);
        }
        if (Array.isArray(pData.plans)) {
          setPlans(pData.plans);
        }
      })
      .catch(() => {});
  }, []);

  const handleNavigateSection = useCallback(
    (sectionId: string) => {
      if (view !== 'academy') {
        setView('academy');
        window.setTimeout(() => {
          const el = document.getElementById(sectionId);
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 60);
      } else {
        const el = document.getElementById(sectionId);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [view]
  );

  const handleOpenPortal = useCallback(
    (mode: 'register' | 'login' = 'register', intent: 'trial' | 'enroll' = 'trial') => {
      setAuthMode(mode);
      setPortalIntent(intent);
      setView('portal');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const handleStartTrial = useCallback((options?: { planId?: string }) => {
    if (options?.planId) setPreselectedPlanId(options.planId);
    setAuthMode('register');
    setPortalIntent('trial');
    setView('portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleEnrollNow = useCallback(
    (options?: { planId?: string }) => {
      if (options?.planId) setPreselectedPlanId(options.planId);
      setAuthMode(currentUser ? 'login' : 'register');
      setPortalIntent('enroll');
      setView('portal');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [currentUser]
  );

  const handleAuthenticated = useCallback(
    (token: string, payload: DashboardPayload) => {
      setAuthToken(token);
      setCurrentUser(payload.user);
    },
    []
  );

  const handleLogout = useCallback(() => {
    setAuthToken(null);
    setCurrentUser(null);
    setAuthMode('login');
  }, []);

  return (
    <div className="min-h-screen bg-[#F3EDE2] text-[#111815]">
      <Navbar
        currentView={view}
        user={currentUser}
        onNavigateSection={handleNavigateSection}
        onOpenPortal={handleOpenPortal}
      />

      {view === 'academy' ? (
        <AcademyLanding
          teachers={teachers}
          plans={plans}
          onStartTrial={handleStartTrial}
          onEnrollNow={handleEnrollNow}
        />
      ) : (
        <StudentDashboard
          token={authToken}
          plans={plans}
          initialAuthMode={authMode}
          initialIntent={portalIntent}
          preselectedPlanId={preselectedPlanId}
          onAuthenticated={handleAuthenticated}
          onLogout={handleLogout}
          onBackToAcademy={() => setView('academy')}
        />
      )}
    </div>
  );
}
