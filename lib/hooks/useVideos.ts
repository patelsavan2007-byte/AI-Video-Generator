import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { VideoListItem } from '../../types';

export function useVideos() {
  return useQuery({
    queryKey: ['videos'],
    queryFn: async (): Promise<VideoListItem[]> => {
      const { data } = await api.get('/v1/videos');
      return data;
    },
  });
}
