export interface Student {
  id: string;
  name: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  students: Student[];
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  skill?: string;
  explanation?: string;
}

export interface Assignment {
  id: string;
  title: string;
  youtubeUrl: string;
  showVideo: boolean;
  maxListens: number;
  instructions: string;
  active: boolean;
  questions: Question[];
  createdAt?: string;
}

export interface StudentState {
  hasStarted: boolean;
  completed: boolean;
  listensUsed: number;
  maxListens: number;
  score: number | null;
  totalQuestions: number;
  completedAt: string | null;
}

export interface TeacherResultItem {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  status: "Completed" | "In Progress" | "Not Started";
  listensUsed: number;
  maxListens: number;
  score: number | null;
  percentage: number | null;
  totalQuestions: number;
  startedAt: string | null;
  completedAt: string | null;
  answers: Record<string, string>;
  questionResults: {
    questionId: string;
    question: string;
    studentChoice: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}
