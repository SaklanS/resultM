export interface Department {
  id: number;
  code: string;
  name: string;
}

export interface Student {
  id: number;
  student_id: string;
  name: string;
  email: string;
  department_id: number;
  password_hash?: string; // Added for student portal account
  phone?: string; // Added student contact details
  session?: string; // Added e.g. "Spring 2024"
  key_field?: string; // 'id' | 'name'
  alternate_id?: string;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  credit: number;
  ecr?: number; // Made optional to avoid ECR system
  teacher?: string; // Added for tracking which teacher conducted the course
}

export interface Result {
  id: number;
  student_id: number; // Foreign key to Student.id
  course_id: number;  // Foreign key to Course.id
  letter_grade: string;
  grade_point: number | null;
  remarks?: string;
  semester: string; // 'Spring' | 'Summer' | 'Fall'
  passing_year: number;
}

export interface UploadLog {
  id: number;
  filename: string;
  original_name: string;
  file_path?: string;
  semester: string;
  year: number;
  department: string;
  status: 'completed' | 'completed_with_errors' | 'failed' | 'processing';
  students_imported: number;
  courses_imported: number;
  results_imported: number;
  error_message?: string;
  uploaded_by: string;
  created_at: string;
}

export interface SystemLog {
  id: number;
  ip: string;
  request_type: string;
  action: string;
  timestamp: string;
}

export interface AdminUser {
  username: string;
  password_hash: string;
  last_login?: string;
}

export interface DbSchema {
  departments: Department[];
  students: Student[];
  courses: Course[];
  results: Result[];
  upload_logs: UploadLog[];
  system_logs: SystemLog[];
  admin_user: AdminUser;
}
