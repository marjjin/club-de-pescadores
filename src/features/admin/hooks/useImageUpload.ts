import { useMutation } from '@tanstack/react-query'
import { uploadNewsImage } from '../api/images'

export function useImageUpload() {
  return useMutation({ mutationFn: uploadNewsImage })
}
