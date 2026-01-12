import { FileItem } from "../type";

export interface FileReviewAction {
  fileId: string;
  fileName: string;
  action: 'accept' | 'revision';
  comment?: string;
}

export interface RevisionEmailData {
  jobCode: string;
  customerEmail?: string;
  salesEmail: string;
  fileName: string;
  fileUrl: string;
  comment: string;
  timestamp: string;
}

// Update single file status in the files array
export const updateFileStatus = (
  files: FileItem['files'],
  fileId: string,
  action: 'accept' | 'revision',
  comment?: string
): FileItem['files'] => {
  return files.map(file => {
    if (file.id === fileId) {
      if (action === 'accept') {
        return { ...file, accepted: true, comment: undefined };
      } else {
        return { ...file, accepted: false, comment: comment || file.comment };
      }
    }
    return file;
  });
};

// Check if file can be modified (not already accepted/has revision)
export const canModifyFile = (
  files: FileItem['files'],
  fileId: string,
  currentAction: 'accept' | 'revision'
): boolean => {
  const file = files.find(f => f.id === fileId);
  if (!file) return false;
  
  // If already accepted, cannot request revision
  if (file.accepted && currentAction === 'revision') return false;
  
  // If has revision comment pending, cannot accept (unless clearing revision)
  // Actually user can still accept after revision request
  return true;
};

// Format timestamp for email
export const formatTimestamp = (): string => {
  return new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
};
