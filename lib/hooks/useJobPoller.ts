import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { JobStatusResponse } from '../../types';

export function useJobPoller(jobId: string | null) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async (): Promise<JobStatusResponse> => {
      const { data } = await api.get(`/v1/jobs/${jobId}`);
      return data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Poll every 1 second if queued or processing
      const status = query.state.data?.status;
      if (status === 'queued' || status === 'processing') {
        return 1000;
      }
      return false;
    },
  });
}
