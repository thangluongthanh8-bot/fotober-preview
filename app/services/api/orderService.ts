import { FileItem } from "../type";
import { apiClient } from "./api";

// Interface for feedback request
export interface FeedbackFile {
  url: string;
  type: string;
  comment: string;
  accepted: boolean;
}

export interface FeedbackRequest {
  job_code: string;
  files: FeedbackFile[];
}

// Get order output by job_code
export const getOuputOrder = async (job_code: string) => {
  try {
    const response: FileItem = await apiClient.get(`/${job_code}`);
    return response;
  } catch (error) {
    throw error;
  }
};


export const postUpdateOutputOrder = async (job_code: string, files: FileItem['files']) => {
  try {
    // Transform files to match API format
    const feedbackFiles: FeedbackFile[] = files.map(file => ({
      url: file.url,
      type: file.type.toLowerCase(),
      comment: file.comment || '',
      accepted: file.accepted
    }));

    const requestBody: FeedbackRequest = {
      job_code,
      files: feedbackFiles
    };

    console.log('[API] Sending feedback:', JSON.stringify(requestBody, null, 2));

    // POST to feedback endpoint
    const response = await apiClient.post('/feedback', requestBody);
    console.log('[API] Feedback response:', response);
    return response;
  } catch (error) {
    console.error('[API] Failed to post feedback:', error);
    throw error;
  }
};

