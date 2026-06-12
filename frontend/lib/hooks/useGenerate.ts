import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
import { GenerateRequest, GenerateResponse } from '../../types';

export function useGenerate() {
  return useMutation({
    mutationFn: async (payload: GenerateRequest): Promise<GenerateResponse> => {
      const { data } = await api.post('/v1/generate', payload);
      return data;
    },
  });
}
