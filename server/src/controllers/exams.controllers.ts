import { Request, Response } from 'express'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import examService from '../services/exams.services'

export const generateExamController = async (req: Request, res: Response) => {
  const { title, quantity, question_count, duration } = req.body
  const { user_id } = req.decode_authorization as TokenPayload

  try {
    const qrCodes = await examService.bulkGenerateExams({
      title,
      teacher_id: user_id,
      quantity,
      question_count,
      duration
    })

    res.json({
      message: 'Exams generated successfully',
      result: qrCodes
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to generate exams',
      error: error
    })
  }
}

export const getExamsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload

  try {
    const exams = await examService.getExamsByTeacher(user_id)

    res.json({
      message: 'Exams retrieved successfully',
      result: exams
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to retrieve exams',
      error: error
    })
  }
}

// New controller to get exam results
export const getExamResultsController = async (req: Request, res: Response) => {
  const { exam_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload

  try {
    // Verify the exam belongs to the current teacher
    const exam = await examService.getExamById(exam_id)

    if (!exam) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Exam not found'
      })
    }

    if (exam.teacher_id.toString() !== user_id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'Not authorized to view results for this exam'
      })
    }

    const results = await examService.getExamResults(exam_id)

    res.json({
      message: 'Exam results retrieved successfully',
      result: results
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to retrieve exam results',
      error: error
    })
  }
}

// New controller to get exam statistics
export const getExamStatisticsController = async (req: Request, res: Response) => {
  const { exam_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload

  try {
    // Verify the exam belongs to the current teacher
    const exam = await examService.getExamById(exam_id)

    if (!exam) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Exam not found'
      })
    }

    if (exam.teacher_id.toString() !== user_id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'Not authorized to view statistics for this exam'
      })
    }

    const statistics = await examService.getExamStatistics(exam_id)

    res.json({
      message: 'Exam statistics retrieved successfully',
      result: statistics
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to retrieve exam statistics',
      error: error
    })
  }
}
