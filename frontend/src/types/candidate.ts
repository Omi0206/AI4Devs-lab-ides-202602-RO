export interface CreateEducationRequest {
  institution: string;
  title: string;
  startDate: string;
  endDate?: string | null;
}

export interface CreateWorkExperienceRequest {
  company: string;
  position: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
}

export interface CreateResumeRequest {
  filePath: string;
  fileType: string;
}

export interface CreateCandidateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  educations?: CreateEducationRequest[];
  workExperiences?: CreateWorkExperienceRequest[];
  cv?: CreateResumeRequest;
}

export interface CreateCandidateResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
}

export interface FileUploadResponse {
  filePath: string;
  fileType: string;
}

export interface ErrorResponse {
  message: string;
  error?: string;
}
