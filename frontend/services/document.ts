import axios, { AxiosProgressEvent } from 'axios';
import { UploadResponse } from '@/types';
import { API_BASE_URL } from './system';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for processing large PDFs
});

export const documentService = {
  async uploadPDF(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return {
      ...response.data,
      file_size_bytes: file.size,
    };
  },

  async deleteDocument(): Promise<{ status: string; message: string }> {
    const response = await apiClient.delete<{ status: string; message: string }>('/document');
    return response.data;
  },
};
