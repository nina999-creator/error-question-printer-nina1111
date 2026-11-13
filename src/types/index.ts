export interface VariantProblem {
  id: string;
  level: '基础巩固' | '变式进阶' | '挑战辨析' | string;
  title: string;
  questionText: string;
  options?: string[];
  standardAnswer: string;
  explanation: string;
  pitfallAnalysis: string;
  keywordsToHighlight: string[];
  // Interactive answering fields
  childAnswer?: string;
  isCorrect?: boolean | null;
  hasChecked?: boolean;
  answeredAt?: number;
}

export interface PracticeRound {
  round: number;
  generatedAt: number;
  title?: string;
  variants: VariantProblem[];
}

export interface MistakeRecord {
  id: string;
  createdAt: number;
  subject: string;
  gradeLevel?: string;
  knowledgePoint: string;
  questionText: string;
  options?: string[];
  userAnswer?: string;
  standardAnswer: string;
  explanation: string;
  difficulty?: string;
  imageUrl?: string;
  hasDiagram?: boolean;
  diagramDescription?: string;
  knowledgeSummary?: string;
  variants: VariantProblem[];
  // Multi-round practice support
  practiceRounds?: PracticeRound[];
  currentRound?: number;
  masteryStatus?: 'learning' | 'mastered';
  tags?: string[];
}

export type SubjectType = '全部' | '数学' | '物理' | '化学' | '英语' | '语文' | '生物' | '历史' | '地理' | '其他';
