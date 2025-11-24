export type GroupType = 'haitech' | 'promdesign' | 'promrobo' | 'energy' | 'bio' | 'aero' | 'media' | 'vrar';

export interface Group {
  _id: string;
  name: GroupType;
  displayName: string;
  logo: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: 'student' | 'teacher' | 'admin';
  group?: GroupType;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  summary?: string; // Итоговый текст курса
  category: 'network' | 'system-linux' | 'system-windows';
  level: 'beginner' | 'intermediate' | 'advanced';
  thumbnail?: string;
  groups?: GroupType[];
  instructor?: User | string; // Преподаватель/создатель курса
  enrolledStudents?: User[] | string[]; // Список зачисленных студентов
  lessons: Lesson[] | string[];
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  _id: string;
  title: string;
  description: string;
  content: string;
  course: Course | string;
  order: number;
  duration?: number;
  videoUrl?: string;
  resources?: string[];
  exercises?: Exercise[];
  photos?: string[];
  photoDisplayType?: 'single' | 'carousel';
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  title: string;
  description: string;
  type: 'practical' | 'theoretical';
  instructions: string;
}

export interface Quiz {
  _id: string;
  title: string;
  description: string;
  lesson?: Lesson | string;
  course: Course | string;
  questions: Question[];
  timeLimit?: number;
  passingScore: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  _id?: string;
  question: string;
  type: 'single' | 'multiple' | 'text';
  options?: string[];
  correctAnswers?: string[] | string;
  points: number;
  explanation?: string;
}

export interface Progress {
  _id: string;
  user: string;
  course: string;
  lesson: string;
  completed: boolean;
  completedAt?: string;
  timeSpent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizResult {
  _id: string;
  user: string;
  quiz: string;
  course: string;
  answers: Answer[];
  score: number;
  percentage: number;
  passed: boolean;
  timeSpent?: number;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  points: number;
}

export interface Submission {
  _id: string;
  user: string;
  course: string;
  lesson: string;
  exerciseIndex?: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  grade?: number;
  feedback?: string;
  reviewedBy?: User;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  _id: string;
  title: string;
  description: string;
  icon: string;
  category: 'lessons' | 'quizzes' | 'streak' | 'time' | 'courses' | 'special';
  requirement: {
    type: 'lessons_completed' | 'quizzes_passed' | 'streak_days' | 'time_spent' | 'courses_completed' | 'perfect_quiz' | 'custom';
    value: number;
  };
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
  unlocked?: boolean;
  unlockedAt?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserAchievement {
  _id: string;
  user: string;
  achievement: Achievement;
  unlockedAt?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  user: string;
  type: 'achievement' | 'lesson' | 'quiz' | 'deadline' | 'comment' | 'grade' | 'system';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  _id: string;
  user: string;
  course?: Course;
  lesson?: Lesson;
  quiz?: Quiz;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  _id: string;
  user: string | User;
  course: string | Course;
  certificateNumber: string;
  issuedAt: string;
  completedAt: string;
  grade?: number;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

