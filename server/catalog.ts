export interface TeacherSeed {
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

export interface CoursePlan {
  id: string;
  name: string;
  audience: string;
  priceUsd: number;
  billingCycle: string;
  sessionsPerWeek: number;
  durationMinutes: number;
  features: string[];
}

export const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export const TEACHERS_SEED: TeacherSeed[] = [
  {
    slug: 'ustad-tariq-al-azhari',
    name: 'Ustad Tariq Al-Azhari',
    title: 'Senior Qari & Ijazah Instructor',
    photoUrl: '/src/assets/images/teacher_tariq_1795605516935.jpg',
    qualifications: 'B.A. Usool al-Din (Al-Azhar) · Sanad Ijazah in Hafs an Asim',
    experienceYears: 12,
    languages: ['English', 'Arabic', 'Urdu'],
    specialty: 'Tajweed Mastery & Quran Recitation',
    bio: 'Certified Qari with an unbroken chain of narration (Ijazah). Specializes in Makharij refinement, rhythmic Tarteel, and building recitation confidence for adults and youth.',
    availability: 'Mon – Sat · Flexible UTC Slots',
  },
  {
    slug: 'ustadha-aisha-siddiqui',
    name: 'Ustadha Aisha Siddiqui',
    title: 'Lead Female Hifz & Nazra Scholar',
    photoUrl: '/src/assets/images/teacher_aisha_1795605518077.jpg',
    qualifications: 'Alimah Degree · Certified Hafiza & Tajweed Examiner',
    experienceYears: 9,
    languages: ['English', 'Urdu', 'Arabic'],
    specialty: 'Sisters & Children Hifz-ul-Quran',
    bio: 'Dedicated female mentor guiding sisters and young learners through structured memorization milestones, daily Sabaq revision, and gentle Noorani Qaida foundations.',
    availability: 'Sun – Fri · UK, US & PK Friendly',
  },
  {
    slug: 'qari-zayd-al-mansoor',
    name: 'Qari Zayd Al-Mansoor',
    title: 'Ten Qiraat & Tafseer Specialist',
    photoUrl: '/src/assets/images/teacher_zayd_1795605518060.jpg',
    qualifications: 'M.A. Quranic Sciences · Ijazah in Qiraat Asharah',
    experienceYears: 15,
    languages: ['English', 'Arabic'],
    specialty: 'Advanced Tajweed & Tafseer Studies',
    bio: 'Fifteen years teaching advanced phonetic precision, Ahkam al-Tajweed, and thematic Surah reflection for intermediate and advanced students worldwide.',
    availability: 'Tue – Sun · Evening & Weekend Slots',
  },
  {
    slug: 'ustadha-fatima-zahra',
    name: 'Ustadha Fatima Zahra',
    title: 'Noorani Qaida & Arabic Instructor',
    photoUrl: '/src/assets/images/teacher_fatima_1795605519424.jpg',
    qualifications: 'B.A. Arabic Literature · Certified Noorani Qaida Specialist',
    experienceYears: 7,
    languages: ['English', 'Arabic', 'Somali'],
    specialty: 'Beginners Qaida & Quranic Arabic',
    bio: 'Warm, structured instruction designed for beginners starting from the Arabic alphabet, connecting letter recognition directly to fluent Quran reading and vocabulary.',
    availability: 'Mon – Fri · Morning & After-School',
  },
];

export const COURSE_PLANS: CoursePlan[] = [
  {
    id: 'noorani-qaida',
    name: 'Noorani Qaida',
    audience: '',
    priceUsd: 39,
    billingCycle: 'per month',
    sessionsPerWeek: 2,
    durationMinutes: 30,
    features: [
      '2 live 1-on-1 classes weekly (30 min each)',
      'Arabic alphabet, harakat & fluent joining',
      'Foundation reading readiness assessment',
      'Academy-assigned certified scholar',
    ],
  },
  {
    id: 'tajweed',
    name: 'Tajweed',
    audience: '',
    priceUsd: 55,
    billingCycle: 'per month',
    sessionsPerWeek: 3,
    durationMinutes: 45,
    features: [
      '3 live 1-on-1 classes weekly (45 min each)',
      'Makharij & Ahkam al-Tajweed precision',
      'Recitation correction & audio practice',
      'Academy-assigned Ijazah scholar',
    ],
  },
  {
    id: 'hifz',
    name: 'Hifz',
    audience: '',
    priceUsd: 79,
    billingCycle: 'per month',
    sessionsPerWeek: 5,
    durationMinutes: 45,
    features: [
      '5 live 1-on-1 classes weekly (45 min each)',
      'Structured daily Sabaq, Sabqi & Manzil',
      'Weekly Juz retention & revision check',
      'Academy-assigned senior Hafiz/Hafiza',
    ],
  },
  {
    id: 'qirat',
    name: 'Qirat',
    audience: '',
    priceUsd: 69,
    billingCycle: 'per month',
    sessionsPerWeek: 3,
    durationMinutes: 45,
    features: [
      '3 live 1-on-1 classes weekly (45 min each)',
      'Authentic recitation styles & vocal control',
      'Maqamat & classical Qiraat discipline',
      'Academy-assigned specialist Qari',
    ],
  },
];
