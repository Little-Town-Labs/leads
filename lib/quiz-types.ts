/**
 * Shared quiz types for client and server components
 */

export type QuizQuestion = {
  id: string;
  questionNumber: number;
  questionType: 'contact_info' | 'multiple_choice' | 'checkbox' | 'text';
  questionText: string;
  questionSubtext?: string | null;
  options?: any;
  scoringWeight: number;
  isRequired: boolean;
  placeholder?: string | null;
  minSelections?: number | null;
};

export type ContactInfo = {
  email?: string;
  full_name?: string;
  company?: string;
  phone?: string;
  [key: string]: string | undefined;
};
