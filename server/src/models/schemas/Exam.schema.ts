import { ObjectId } from 'mongodb'

interface ExamType {
  _id?: ObjectId
  title: string
  exam_code: string
  teacher_id: ObjectId
  question_ids: ObjectId[]
  duration: number // in minutes
  created_at?: Date
  active?: boolean
}

export default class Exam {
  _id?: ObjectId
  title: string
  exam_code: string
  teacher_id: ObjectId
  question_ids: ObjectId[]
  duration: number
  created_at: Date
  active: boolean

  constructor({ _id, title, exam_code, teacher_id, question_ids, duration, created_at, active }: ExamType) {
    const date = new Date()
    this._id = _id
    this.title = title
    this.exam_code = exam_code
    this.teacher_id = teacher_id
    this.question_ids = question_ids
    this.duration = duration
    this.created_at = created_at || date
    this.active = active !== undefined ? active : true
  }
}
