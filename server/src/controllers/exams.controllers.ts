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
