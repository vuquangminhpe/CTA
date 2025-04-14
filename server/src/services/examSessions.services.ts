import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import ExamSession from '../models/schemas/ExamSession.schema'
import examService from './exams.services'

class ExamSessionService {
  async startExamSession({ exam_code, student_id }: { exam_code: string; student_id: string }) {
    // Get exam by code
    const exam = await examService.getExamByCode(exam_code)

    // Check if student already has an active session for this exam
    const existingSession = await databaseService.examSessions.findOne({
      exam_id: exam._id,
      student_id: new ObjectId(student_id),
      completed: false
    })

    if (existingSession) {
      // If session exists but not completed, return the existing session
      const examWithQuestions = await examService.getExamWithQuestions(exam._id.toString())

      return {
        session: existingSession,
        exam: examWithQuestions,
        remaining_time: this.calculateRemainingTime(existingSession.start_time, exam.duration)
      }
    }

    // Create new session
    const session = new ExamSession({
      exam_id: exam._id,
      student_id: new ObjectId(student_id),
      start_time: new Date()
    })

    await databaseService.examSessions.insertOne(session)

    // Get exam with questions
    const examWithQuestions = await examService.getExamWithQuestions(exam._id.toString())

    return {
      session,
      exam: examWithQuestions,
      remaining_time: exam.duration * 60 // duration in seconds
    }
  }

  private calculateRemainingTime(start_time: Date, duration: number): number {
    const elapsed = Math.floor((Date.now() - start_time.getTime()) / 1000)
    const remaining = duration * 60 - elapsed
    return Math.max(0, remaining)
  }

  async submitExamSession({
    session_id,
    answers
  }: {
    session_id: string
    answers: { question_id: string; selected_index: number }[]
  }) {
    // Get the session
    const session = await databaseService.examSessions.findOne({
      _id: new ObjectId(session_id)
    })

    if (!session) {
      throw new Error('Exam session not found')
    }

    if (session.completed) {
      throw new Error('Exam already completed')
    }

    // Get the exam
    const exam = await databaseService.exams.findOne({
      _id: session.exam_id
    })

    if (!exam) {
      throw new Error('Exam not found')
    }

    // Get all questions
    const questions = await databaseService.questions.find({ _id: { $in: exam.question_ids } }).toArray()

    // Calculate score
    let correctAnswers = 0

    const formattedAnswers = answers.map((answer) => ({
      question_id: new ObjectId(answer.question_id),
      selected_index: answer.selected_index
    }))

    for (const answer of formattedAnswers) {
      const question = questions.find((q) => q._id.toString() === answer.question_id.toString())

      if (question && question.correct_index === answer.selected_index) {
        correctAnswers++
      }
    }

    const score = (correctAnswers / questions.length) * 100

    // Update session
    const result = await databaseService.examSessions.findOneAndUpdate(
      { _id: new ObjectId(session_id) },
      {
        $set: {
          answers: formattedAnswers,
          score,
          end_time: new Date(),
          completed: true,
          updated_at: new Date()
        }
      },
      { returnDocument: 'after' }
    )

    return result
  }

  async recordViolation(session_id: string) {
    const result = await databaseService.examSessions.findOneAndUpdate(
      { _id: new ObjectId(session_id) },
      {
        $inc: { violations: 1 },
        $set: {
          score: 0, // Reset score to 0 on violation
          updated_at: new Date()
        }
      },
      { returnDocument: 'after' }
    )

    return result
  }

  async getStudentExamHistory(student_id: string) {
    const sessions = await databaseService.examSessions
      .find({ student_id: new ObjectId(student_id) })
      .sort({ start_time: -1 })
      .toArray()

    // Get exam details for each session
    const sessionsWithExams = await Promise.all(
      sessions.map(async (session) => {
        const exam = await databaseService.exams.findOne({
          _id: session.exam_id
        })

        return {
          ...session,
          exam_title: exam ? exam.title : 'Unknown Exam',
          duration: exam ? exam.duration : 0
        }
      })
    )

    return sessionsWithExams
  }
}
const examSessionService = new ExamSessionService()
export default examSessionService
