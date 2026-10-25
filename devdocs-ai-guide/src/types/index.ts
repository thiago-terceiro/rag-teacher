import type React from 'react';

// ==========================================
// 1. CURRICULUM, STEPS & PHASES
// ==========================================

export type StepStatus = 'not_started' | 'in_progress' | 'completed';

export interface Step {
  step_key: string;
  title: string;
  phase_key: string;
  sort_order: number;
  readTime: string;
  content: string;
  notes?: string;
  status?: StepStatus;
  id?: number;
  completedAt?: string | null;
}

export interface Phase {
  id: number;
  phase_key: string;
  title: string;
  description: string;
  sort_order: number;
  steps: Step[];
}

export type UserStepProgress = {
  status?: StepStatus;
  notes?: string;
  completedAt?: string | null;
};

export type CurriculumProgressMap = Record<string, UserStepProgress>;

export interface CurriculumStats {
  totalSteps: number;
  completedSteps: number;
  inProgressSteps: number;
  completionPercentage: number;
  totalQuizQuestions: number;
  answeredQuizQuestions: number;
  correctQuizQuestions: number;
  comprehensionScore: number | null;
}

export interface StepsContextType {
  phases: Phase[];
  stats: CurriculumStats;
  quizAnswers: QuizAnswerMap;
  answerQuizQuestion: (stepKey: string, questionId: string, optionIndex: number) => void;
  resetModuleQuiz: (stepKey: string) => void;
  updateStepProgress: (stepKey: string, status?: StepStatus, notes?: string) => void;
  getStepContent: (stepKey: string) => Step;
  resetAllProgress: () => void;
  exportStudyGuide: () => void;
  allSteps: Step[];
}

// ==========================================
// 2. READING SETTINGS & DISPLAY PRESETS
// ==========================================

export type ThemeMode = 'deep-blue' | 'oled-midnight' | 'daylight-paper';
export type FontSizeMode = 'normal' | 'comfortable' | 'large';
export type ContentWidthMode = 'normal' | 'wide';
export type LineSpacingMode = 'relaxed' | 'spacious';

export interface ReadingSettings {
  theme: ThemeMode;
  fontSize: FontSizeMode;
  contentWidth: ContentWidthMode;
  lineSpacing: LineSpacingMode;
}

export interface ReadingSettingsContextType {
  settings: ReadingSettings;
  updateSetting: <K extends keyof ReadingSettings>(key: K, value: ReadingSettings[K]) => void;
  resetSettings: () => void;
}

// ==========================================
// 3. KNOWLEDGE CHECKS (MODULE QUIZZES)
// ==========================================

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type ModuleQuizzesMap = Record<string, QuizQuestion[]>;

export type QuizAnswerMap = Record<string, Record<string, number>>;

// ==========================================
// 4. INTERVIEW SYSTEM DESIGN QUESTIONS
// ==========================================

export interface InterviewQuestion {
  id: number;
  step_key: string;
  step_title: string;
  phase: number;
  company: string;
  tags: string[];
  question: string;
  answer: string;
  track?: string;
}

// ==========================================
// 5. INTERNATIONALIZATION (i18n)
// ==========================================

export type SupportedLocale = 'en' | 'pt-BR' | 'es';

export interface LanguageOption {
  code: SupportedLocale;
  label: string;
  flag: string;
}

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

export interface I18nContextType {
  lang: SupportedLocale;
  setLang: (newLang: SupportedLocale) => void;
  t: (key: string, fallback?: string) => string;
  supportedLanguages: LanguageOption[];
}

// ==========================================
// 6. INTERACTIVE SANDBOX & WIDGETS
// ==========================================

export interface VectorPoint {
  x: number;
  y: number;
  label: string;
  color: string;
}

export interface PythonWorkerInbound {
  type: 'RUN' | 'INIT';
  code: string;
}

export interface PythonWorkerOutbound {
  type: 'STDOUT' | 'STDERR' | 'RESULT' | 'ERROR' | 'READY';
  payload?: unknown;
  error?: string;
}

export interface SandboxActionsContextType {
  openPythonSandbox: (customCode?: string | null) => void;
  openVectorSandbox: () => void;
}

export interface SandboxStateContextType {
  isPythonSandboxOpen: boolean;
  setIsPythonSandboxOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pythonSandboxCode: string | null;
  isVectorVisualizerOpen: boolean;
  setIsVectorVisualizerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export type SandboxContextType = SandboxActionsContextType & SandboxStateContextType;

// ==========================================
// 7. HEADINGS & TABLE OF CONTENTS
// ==========================================

export interface HeadingItem {
  level: number;
  id: string;
  text: string;
}
