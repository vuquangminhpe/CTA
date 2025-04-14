import { checkSchema } from 'express-validator'
import { validate } from '../utils/validation'

export const generateExamValidator = validate(
  checkSchema(
    {
      title: {
        notEmpty: {
          errorMessage: 'Exam title is required'
        },
        isString: {
          errorMessage: 'Exam title must be a string'
        },
        trim: true
      },
      quantity: {
        notEmpty: {
          errorMessage: 'Quantity is required'
        },
        isInt: {
          options: { min: 1, max: 100 },
          errorMessage: 'Quantity must be an integer between 1 and 100'
        }
      },
      question_count: {
        notEmpty: {
          errorMessage: 'Question count is required'
        },
        isInt: {
          options: { min: 1 },
          errorMessage: 'Question count must be a positive integer'
        }
      },
      duration: {
        notEmpty: {
          errorMessage: 'Duration is required'
        },
        isInt: {
          options: { min: 1 },
          errorMessage: 'Duration must be a positive integer'
        }
      }
    },
    ['body']
  )
)
