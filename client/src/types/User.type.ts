export enum UserRole {
  Student = 'student',
  Teacher = 'teacher',
  Admin = 'admin'
}

export interface User {
  _id: string
  username: string
  name?: string
  email?: string
  role: UserRole
  created_at: string
  updated_at: string
  teacher_level?: string
}
