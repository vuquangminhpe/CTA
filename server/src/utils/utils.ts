import { config } from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'
config()
export function convertS3Url(inputUrl: string): string {
  const httpS3UrlPattern = /^https?:\/\/([^.]+)\.s3\.([^/]+)\.amazonaws\.com\/(.+)$/

  const s3UrlPattern = /^s3:\/\/([^/]+)\/(.+)$/

  const httpMatch = inputUrl.match(httpS3UrlPattern)
  if (httpMatch) {
    const [, bucket, region, key] = httpMatch
    const newKey = key.split('/master.m3u8')[0]
    return `s3://${bucket}/${newKey}`
  }

  const s3Match = inputUrl.match(s3UrlPattern)
  if (s3Match) {
    return inputUrl
  }
  throw new Error('Invalid S3 URL format')
}

export const callGeminiAPI = async (imageBuffer: Buffer, prompt: string) => {
  const apiKey = process.env.GERMINI_API_KEY

  try {
    const genAI = new GoogleGenerativeAI(apiKey as string)

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash'
    })

    const imageData = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    }
    const result = await model.generateContent([prompt, imageData])

    const response = await result.response
    const text = response.text()

    return text
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    throw error
  }
}

export function extractGeminiData(geminiResponse: string | object): any {
  try {
    let parsedData: any

    if (typeof geminiResponse === 'object') {
      parsedData = geminiResponse as any
    } else if (typeof geminiResponse === 'string') {
      try {
        const cleanJson = geminiResponse
          .replace(/```json\n/g, '')
          .replace(/```(\n)?/g, '')
          .trim()

        parsedData = JSON.parse(cleanJson)
      } catch (error) {
        console.error('Failed to parse Gemini response as JSON:', error)
        console.log('Original response:', geminiResponse)
        throw new Error('Failed to parse Gemini response')
      }
    } else {
      throw new Error('Invalid input type')
    }

    if (parsedData.status === 'VIOLATION') {
      return {
        status: 'VIOLATION',
        message: parsedData.message || 'Nội dung không phù hợp'
      }
    }

    if (parsedData.status === 'SUCCESS' && parsedData.data) {
      return {
        status: 'SUCCESS',
        data: {
          content: parsedData.data.content || 'Không xác định',
          hashtags: parsedData.data.hashtags || [],
          scheduled_time: parsedData.data.scheduled_time || 'Không xác định',
          sentiment_analysis: parsedData.data.sentiment_analysis || {
            sentiment: '',
            confidence_score: 0
          },
          analytics_tags: parsedData.data.analytics_tags || {
            campaign: '',
            source: '',
            target_audience: ''
          }
        }
      }
    }

    return {
      status: 'VIOLATION',
      message: 'Không thể xử lý phản hồi. Vui lòng thử lại.'
    }
  } catch (error) {
    console.error('Error in extractGeminiData:', error)
    return {
      status: 'VIOLATION',
      message: 'Đã xảy ra lỗi khi xử lý phản hồi'
    }
  }
}

export async function extractContentAndInsertToDB(user_id: string, aiResponseText: string, message: string) {
  try {
    let content = extractContentFromResponse(aiResponseText)

    const _id = new ObjectId()
    const _id2 = new ObjectId()
    const sender_id_gemini = new ObjectId('60f3b3b3b3b3b3b3b3b3b3b3')

    return {
      result: content
    }
  } catch (error) {
    console.error('Error extracting content or inserting to DB:', error)
    throw error
  }
}

function extractContentFromResponse(response: string): string {
  try {
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/)

    if (jsonMatch && jsonMatch[1]) {
      const parsedJson = JSON.parse(jsonMatch[1])

      if (parsedJson.data && parsedJson.data.content) {
        return parsedJson.data.content
      }
    }

    try {
      const directParse = JSON.parse(response)
      if (directParse.data && directParse.data.content) {
        return directParse.data.content
      }
    } catch (e) {}

    return response
  } catch (error) {
    console.error('Error parsing response:', error)
    return response
  }
}
