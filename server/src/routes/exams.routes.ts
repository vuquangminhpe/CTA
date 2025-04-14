import { Router } from 'express'
import { generateExamController, getExamsController } from '../controllers/exams.controllers'
import {
  startExamController,
  submitExamController,
  getExamHistoryController
} from '../controllers/examSessions.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { teacherRoleValidator } from '../middlewares/role.middlewares'
import { wrapAsync } from '../utils/handler'
import { generateExamValidator } from '../middlewares/exam.validator'
import { startExamValidator, submitExamValidator } from '../middlewares/examSession.validator'

const examsRouter = Router()

// All routes require authentication and verification
examsRouter.use(AccessTokenValidator, verifiedUserValidator)

// Teacher routes
examsRouter.post('/generate', teacherRoleValidator, generateExamValidator, wrapAsync(generateExamController))
examsRouter.get('/', teacherRoleValidator, wrapAsync(getExamsController))

// Student routes
examsRouter.post('/start', startExamValidator, wrapAsync(startExamController))
examsRouter.post('/submit', submitExamValidator, wrapAsync(submitExamController))
examsRouter.get('/history', wrapAsync(getExamHistoryController))

export default examsRouter
