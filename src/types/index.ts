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
  knowledgeSummary?: string;
  variants: VariantProblem[];
  masteryStatus?: 'learning' | 'mastered';
  tags?: string[];
}

export type SubjectType = '全部' | '数学' | '物理' | '化学' | '英语' | '语文' | '生物' | '历史' | '地理' | '其他';
