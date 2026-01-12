import { FileItem } from "../type";
import { apiClient } from "./api";

export const getOuputOrder = async (job_code: string) => {
  try {
    const response :FileItem = await apiClient.get(`/${job_code}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const postUpdateOutputOrder = async (job_code: string, data: any) => {
  try {
    const response : FileItem = await apiClient.post(`/${job_code}`, data);
    return response;
  } catch (error) {
    throw error;
  }
};


