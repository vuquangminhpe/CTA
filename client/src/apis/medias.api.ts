import { Media } from '../types/Medias.type'
import { SuccessResponse } from '../types/Utils.type'
import http from '../utils/http'

const mediasApi = {
  uploadImages: (image: File) => {
    const formData = new FormData()
    formData.append('image', image)

    return http.post<SuccessResponse<Media[]>>('/medias/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 0
    })
  },
  deleteS3: ({ url, link }: { url: string; link: string }) =>
    http.post<SuccessResponse<Media>>(
      `/medias/delete-s3`,
      { url, link },
      {
        timeout: 0
      }
    ),
  uploadVideo: (video: File) => {
    const formData = new FormData()
    formData.append('video', video)

    return http.post<SuccessResponse<Media[]>>('/medias/upload-video-hls', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 0
    })
  }
}
export default mediasApi
