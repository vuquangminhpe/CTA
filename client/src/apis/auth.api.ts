import { LoginReqBody, LoginResponse, RegisterType } from '../types/Auth.type'
import { SuccessResponse } from '../types/Utils.type'
import http from '../utils/http'

const authApi = {
  login: (body: LoginReqBody) => http.post<SuccessResponse<LoginResponse>>('/users/login', body),

  register: (body: RegisterType) => http.post<SuccessResponse<{ message: string }>>('/users/register', body),

  logout: () => http.post<SuccessResponse<{ message: string }>>('/users/logout')
}

export default authApi
