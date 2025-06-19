/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError, AxiosInstance, HttpStatusCode } from 'axios'
import configBase from '../constants/config'
import { clearLocalStorage, getAccessTokenFromLS, saveAccessTokenToLS, setProfileFromLS } from './auth'
import path from '../constants/path'
import { toast } from 'sonner'
class Http {
  instance: AxiosInstance
  private accessToken: string
  constructor() {
    this.accessToken = `Bearer ${getAccessTokenFromLS()}`
    this.instance = axios.create({
      baseURL: configBase.baseURL,
      timeout: 1000000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
    this.instance.interceptors.request.use(
      (config) => {
        if (this.accessToken && config.headers) {
          config.headers.authorization = this.accessToken
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    this.instance.interceptors.response.use(
      (response) => {
        const { url } = response.config
        if (url === path.register || url === path.login) {
          const data = response.data
          this.accessToken = data.data?.access_token

          saveAccessTokenToLS(this.accessToken)
          setProfileFromLS(data.data.user)
        } else if (url === '/logout') {
          this.accessToken = ''
          clearLocalStorage()
        }
        return response
      },
      function (error: AxiosError) {
        console.error('[HTTP Client Error]', error)

        // Create a safe error object that won't cause 'cannot read properties' errors
        const safeError = {
          message: error?.message || 'Unknown error',
          status: error?.response?.status || 500,
          data: error?.response?.data || { message: 'No response data available' }
        }
        if (error.response?.status === HttpStatusCode.ServiceUnavailable) {
          toast.error(
            (error?.response?.data as any)?.message || 'Service is currently unavailable. Please try again later.'
          )
        }
        if (error.response?.status !== HttpStatusCode.UnprocessableEntity) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          // const data: any | undefined = error.response?.data
          // const message = data.message || error.message
          // toast.error(message)
        }
        if (error.response?.status === HttpStatusCode.Unauthorized) {
          // clearLocalStorage()
        }
        return Promise.reject(safeError)
      }
    )
  }
}
const http = new Http().instance
export default http
