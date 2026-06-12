import { useMutation } from '@tanstack/react-query';
import { api } from '../api';

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File): Promise<{ upload_id: string; url: string }> => {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data } = await api.post('/v1/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
  });
}
