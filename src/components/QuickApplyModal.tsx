import { X, Building2, MapPin, Briefcase, FileText, Upload, ChevronLeft, ChevronDown, ChevronRight, Check, Loader2, Sparkles, Globe, User, Link2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactElement } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { getCandidateJobDetail, type CandidateJobScreeningQuestion } from '../services/jobsApi';
import { getCandidateCvs, uploadCandidateCv, type CandidateCvItem } from '../services/cvApi';
import { applyToCandidateJob, generateCandidateCoverLetter } from '../services/applicationsApi';
import githubIcon from '../assets/github.svg';
import linkedinIcon from '../assets/linkedin.svg';
import { formatJobTypeLabel } from '../utils/formatJobTypeLabel';
import {
  SUPPORTED_CV_ACCEPT,
  SUPPORTED_CV_FORMAT_LABEL,
  isSupportedCvFile,
} from '../utils/cvFileFormats';
import ModalPortal from './ModalPortal';

export interface QuickApplyModalJob {
  id?: string | number;
  title?: string;
  company?: string | { name?: string };
  location?: string;
  type?: string;
  job_type?: string;
  key_responsibilities?: string[];
  questions?: CandidateJobScreeningQuestion[];
}

interface QuickApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: QuickApplyModalJob | null;
  onApplySuccess?: () => void;
  onApplyError?: (message: string) => void;
}

interface ToastState {
  id: number;
  message: string;
  type: 'error' | 'success';
}

type Step = 1 | 2 | 3 | 4 | 5;

type SocialPlatform = 'LinkedIn' | 'GitHub' | 'Portfolio';
type ReviewSectionKey = 'cv' | 'screening' | 'profile' | 'cover';

const SOCIAL_LINK_FIELDS: Array<{
  platform: SocialPlatform;
  placeholder: string;
  iconBgClassName: string;
  renderIcon: () => ReactElement;
}> = [
  {
    platform: 'LinkedIn',
    placeholder: 'https://linkedin.com/in/yourname',
    iconBgClassName: 'bg-[#0A66C218]',
    renderIcon: () => <img src={linkedinIcon} alt="" className="size-4" aria-hidden="true" />,
  },
  {
    platform: 'GitHub',
    placeholder: 'https://github.com/yourusername',
    iconBgClassName: 'bg-[#24292F18]',
    renderIcon: () => <img src={githubIcon} alt="" className="size-4" aria-hidden="true" />,
  },
  {
    platform: 'Portfolio',
    placeholder: 'https://yourportfolio.com',
    iconBgClassName: 'bg-[#7C3AED18]',
    renderIcon: () => <Globe size={16} className="text-[#7C3AED]" />,
  },
];

const DEFAULT_COVER_LETTER = `Dear Hiring Manager,

I am writing to express my strong interest in this position. With my relevant experience and hands-on skills, I am confident I would be a strong addition to your team.

Throughout my career, I have focused on delivering high-quality work and collaborating effectively with cross-functional teams.

Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute.

Best regards`;

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function getCompanyName(company: QuickApplyModalJob['company']): string {
  if (typeof company === 'string' && company.trim()) return company.trim();
  if (
    typeof company === 'object'
    && company !== null
    && typeof company.name === 'string'
    && company.name.trim()
  ) {
    return company.name.trim();
  }
  return 'Company';
}

function formatCvUpdatedLabel(value: string): string {
  if (!value) return 'Last updated recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Last updated recently';

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const dayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.floor(diffMs / dayMs);

  if (totalDays <= 0) return 'Last updated today';
  if (totalDays === 1) return 'Last updated 1 day ago';
  return `Last updated ${totalDays} days ago`;
}

function getLinkPlaceholder(linkKind: string | null): string {
  const normalized = (linkKind || '').trim().toLowerCase();
  if (normalized === 'github') return 'https://github.com/your-username';
  if (normalized === 'linkedin') return 'https://linkedin.com/in/your-profile';
  if (normalized === 'portfolio') return 'https://your-portfolio.com';
  return 'https://example.com';
}

function getFileUploadTitle(question: CandidateJobScreeningQuestion): string {
  const fileTypeLabel = question.file_types?.[0] || 'File';
  return `Upload ${fileTypeLabel}`;
}

function getSupportedFileText(question: CandidateJobScreeningQuestion): string {
  const formatLabel = question.file_types && question.file_types.length > 0
    ? question.file_types.join(', ')
    : 'Any';

  if (question.max_file_size_mb) {
    return `Supported formats: ${formatLabel} (Max ${question.max_file_size_mb}MB)`;
  }

  return `Supported formats: ${formatLabel}`;
}

export default function QuickApplyModal({ isOpen, onClose, job, onApplySuccess, onApplyError }: QuickApplyModalProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const profile = useSelector((state: RootState) => state.auth.profile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvsRequestRef = useRef(0);
  const jobDetailRequestRef = useRef(0);
  const coverLetterRequestRef = useRef(0);
  const coverLetterTextareaRef = useRef<HTMLTextAreaElement>(null);

  const jobId = useMemo(() => {
    if (!job || job.id === undefined || job.id === null) return '';
    return String(job.id).trim();
  }, [job]);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedCV, setSelectedCV] = useState('');
  const [hasUserSelectedCv, setHasUserSelectedCv] = useState(false);
  const [coverLetter, setCoverLetter] = useState(DEFAULT_COVER_LETTER);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [cvs, setCvs] = useState<CandidateCvItem[]>([]);
  const [isLoadingCvs, setIsLoadingCvs] = useState(false);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [cvsError, setCvsError] = useState<string | null>(null);

  const [screeningQuestions, setScreeningQuestions] = useState<CandidateJobScreeningQuestion[]>([]);
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const [screeningFiles, setScreeningFiles] = useState<Record<string, File | null>>({});
  const [socialLinks, setSocialLinks] = useState<Record<SocialPlatform, string>>({
    LinkedIn: '',
    GitHub: '',
    Portfolio: '',
  });
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const [jobResponsibilities, setJobResponsibilities] = useState<string[]>([]);
  const [jobTypeLabel, setJobTypeLabel] = useState('');

  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewSectionOpen, setReviewSectionOpen] = useState<Record<ReviewSectionKey, boolean>>({
    cv: true,
    screening: true,
    profile: true,
    cover: true,
  });
  const totalSteps = 5;
  const visibleStep = currentStep;

  const selectedCvName = useMemo(() => {
    const selected = cvs.find((cv) => cv.id === selectedCV);
    return selected?.name || 'Selected CV';
  }, [cvs, selectedCV]);
  const selectedCvDetails = useMemo(
    () => cvs.find((cv) => cv.id === selectedCV) || null,
    [cvs, selectedCV]
  );
  const screeningCompletedCount = useMemo(
    () => screeningQuestions.filter((question) => (screeningAnswers[question.id] || '').trim().length > 0).length,
    [screeningAnswers, screeningQuestions]
  );
  const filledSocialLinks = useMemo(
    () => SOCIAL_LINK_FIELDS
      .map((field) => ({
        platform: field.platform,
        url: (socialLinks[field.platform] || '').trim(),
      }))
      .filter((item) => item.url.length > 0),
    [socialLinks]
  );

  const clearErrors = () => {
    setStepError(null);
    setSubmitError(null);
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const toggleReviewSection = (section: ReviewSectionKey) => {
    setReviewSectionOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const loadCvs = useCallback(async () => {
    const requestId = ++cvsRequestRef.current;
    if (!accessToken?.trim()) {
      setIsLoadingCvs(false);
      setCvs([]);
      setCvsError('You are not authenticated. Please log in again.');
      return;
    }

    setIsLoadingCvs(true);
    setCvsError(null);

    try {
      const response = await getCandidateCvs(accessToken);
      if (requestId !== cvsRequestRef.current) return;
      setCvs(response);
    } catch (error: unknown) {
      if (requestId !== cvsRequestRef.current) return;
      setCvs([]);
      setCvsError(getErrorMessage(error, 'Unable to load CV list.'));
    } finally {
      if (requestId === cvsRequestRef.current) {
        setIsLoadingCvs(false);
      }
    }
  }, [accessToken]);

  const loadJobDetailData = useCallback(async () => {
    const requestId = ++jobDetailRequestRef.current;

    if (!accessToken?.trim() || !jobId) {
      setIsLoadingQuestions(false);
      return;
    }

    setIsLoadingQuestions(true);
    setQuestionsError(null);

    try {
      const response = await getCandidateJobDetail(accessToken, jobId);
      if (requestId !== jobDetailRequestRef.current) return;
      setScreeningQuestions(response.questions || []);
      setJobTypeLabel(formatJobTypeLabel(response.job_type, ''));
    } catch (error: unknown) {
      if (requestId !== jobDetailRequestRef.current) return;
      setScreeningQuestions([]);
      setQuestionsError(getErrorMessage(error, 'Unable to load screening questions.'));
    } finally {
      if (requestId === jobDetailRequestRef.current) {
        setIsLoadingQuestions(false);
      }
    }
  }, [accessToken, jobId]);

  useEffect(() => {
    if (!isOpen || !job) {
      cvsRequestRef.current += 1;
      jobDetailRequestRef.current += 1;
      coverLetterRequestRef.current += 1;
      return;
    }

    setCurrentStep(1);
    setSelectedCV('');
    setHasUserSelectedCv(false);
    setCoverLetter(DEFAULT_COVER_LETTER);
    setIsConfirmed(false);
    setIsGenerating(false);
    setHasGenerated(false);
    setReviewSectionOpen({
      cv: true,
      screening: true,
      profile: true,
      cover: true,
    });
    setScreeningAnswers({});
    setScreeningFiles({});
    setSocialLinks({
      LinkedIn: '',
      GitHub: '',
      Portfolio: '',
    });
    setQuestionErrors({});
    setScreeningQuestions(Array.isArray(job.questions) ? job.questions : []);
    setJobResponsibilities(Array.isArray(job.key_responsibilities) ? job.key_responsibilities : []);
    setJobTypeLabel(formatJobTypeLabel(job.job_type || job.type || '', ''));
    setCvs([]);
    setCvsError(null);
    setQuestionsError(null);
    setIsSubmitting(false);
    coverLetterRequestRef.current += 1;
    clearErrors();

    void loadCvs();
    void loadJobDetailData();
  }, [isOpen, job, loadCvs, loadJobDetailData]);

  useEffect(() => {
    if (cvs.length === 0) {
      if (selectedCV) setSelectedCV('');
      if (hasUserSelectedCv) setHasUserSelectedCv(false);
      return;
    }

    const selectedCvExists = selectedCV ? cvs.some((cv) => cv.id === selectedCV) : false;
    const shouldAutoSelectDefaultCv = profile?.quick_apply_default_cv ?? true;

    if (selectedCvExists && hasUserSelectedCv) return;

    if (selectedCvExists && !hasUserSelectedCv) {
      if (!shouldAutoSelectDefaultCv) {
        setSelectedCV('');
      }
      return;
    }

    if (hasUserSelectedCv && selectedCV && !selectedCvExists) {
      setHasUserSelectedCv(false);
    }

    if (!shouldAutoSelectDefaultCv) {
      if (selectedCV) setSelectedCV('');
      return;
    }

    const primaryCv = cvs.find((cv) => cv.is_primary);
    const fallbackCv = cvs[0];
    const nextSelectedCv = primaryCv?.id || fallbackCv?.id || '';
    if (nextSelectedCv !== selectedCV) {
      setSelectedCV(nextSelectedCv);
    }
  }, [cvs, selectedCV, hasUserSelectedCv, profile?.quick_apply_default_cv]);

  const handleCvSelect = (cvId: string) => {
    setSelectedCV(cvId);
    setHasUserSelectedCv(true);
  };

  useEffect(() => {
    if (!isOpen || currentStep !== 4 || !hasGenerated) return;

    const textarea = coverLetterTextareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight + 2}px`;
  }, [coverLetter, currentStep, hasGenerated, isOpen]);

  const handleUploadClick = () => {
    if (isUploadingCv) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!accessToken?.trim()) {
      setCvsError('You are not authenticated. Please log in again.');
      event.target.value = '';
      return;
    }
    if (!isSupportedCvFile(file)) {
      setCvsError(`Unsupported CV format. Upload ${SUPPORTED_CV_FORMAT_LABEL}.`);
      event.target.value = '';
      return;
    }

    setIsUploadingCv(true);
    setCvsError(null);

    try {
      await uploadCandidateCv({ file, accessToken });
      await loadCvs();
    } catch (error: unknown) {
      setCvsError(getErrorMessage(error, 'Unable to upload CV.'));
    } finally {
      setIsUploadingCv(false);
      event.target.value = '';
    }
  };

  const updateQuestionAnswer = (questionId: string, value: string) => {
    setScreeningAnswers((prev) => ({ ...prev, [questionId]: value }));
    setQuestionErrors((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const updateQuestionFile = (questionId: string, file: File | null) => {
    setScreeningFiles((prev) => ({ ...prev, [questionId]: file }));
    updateQuestionAnswer(questionId, file ? file.name : '');
  };

  const updateSocialLink = (platform: SocialPlatform, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [platform]: value }));
  };

  const validateStepOne = (): boolean => {
    if (!selectedCV) {
      setStepError('Please select a CV to continue.');
      return false;
    }
    return true;
  };

  const validateStepTwo = (): boolean => {
    if (isLoadingQuestions) {
      setStepError('Please wait for screening questions to load.');
      return false;
    }
    if (questionsError) {
      setStepError('Screening questions are not available right now.');
      return false;
    }

    const nextErrors: Record<string, string> = {};
    screeningQuestions.forEach((question) => {
      const answer = (screeningAnswers[question.id] || '').trim();
      const normalizedType = question.type.toLowerCase();

      if (question.required && !answer) {
        nextErrors[question.id] = 'This field is required.';
        return;
      }

      if (answer && normalizedType === 'multiple_choice' && question.options?.length) {
        const hasMatch = question.options.some((option) => option.value === answer);
        if (!hasMatch) {
          nextErrors[question.id] = 'Please choose one of the provided options.';
          return;
        }
      }

      if (answer && normalizedType === 'numeric' && !Number.isFinite(Number(answer))) {
        nextErrors[question.id] = 'Please enter a valid number.';
        return;
      }

      if (normalizedType === 'file_upload') {
        const selectedFile = screeningFiles[question.id];
        if (question.required && !selectedFile) {
          nextErrors[question.id] = 'Please upload a file.';
          return;
        }

        if (
          selectedFile
          && question.max_file_size_mb
          && selectedFile.size > question.max_file_size_mb * 1024 * 1024
        ) {
          nextErrors[question.id] = `File size must be ${question.max_file_size_mb} MB or less.`;
        }
      }
    });

    setQuestionErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStepError('Please complete all required questions.');
      return false;
    }
    return true;
  };

  const validateStepThree = (): boolean => {
    return true;
  };

  const validateStepFour = (): boolean => {
    if (!hasGenerated) {
      setStepError('Please generate cover letter with AI first.');
      return false;
    }
    if (!coverLetter.trim()) {
      setStepError('Cover letter is required.');
      return false;
    }
    return true;
  };

  const validateStepFive = (): boolean => {
    if (!isConfirmed) {
      setStepError('Please confirm before submitting.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!accessToken?.trim()) {
      setSubmitError('You are not authenticated. Please log in again.');
      return;
    }
    if (!jobId) {
      setSubmitError('Invalid job selected.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await applyToCandidateJob(accessToken, jobId, {
        cv_id: selectedCV,
        cover_letter: coverLetter,
        screening_answers: screeningQuestions
          .map((question) => ({
            question_id: question.id,
            answer: (screeningAnswers[question.id] || '').trim(),
          }))
          .filter((item) => item.answer.length > 0),
        social_links: SOCIAL_LINK_FIELDS.map((field) => {
          const rawValue = socialLinks[field.platform] || '';
          const url = rawValue.trim();
          return {
            platform: field.platform,
            url: url || null,
          };
        }),
      });
      onClose();
      window.setTimeout(() => {
        onApplySuccess?.();
      }, 0);
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Unable to submit application.');
      const normalizedMessage = message.toLowerCase();

      if (
        normalizedMessage.includes('already applied for this job')
        || normalizedMessage.includes('already applied')
      ) {
        onClose();
        window.setTimeout(() => {
          onApplyError?.(message);
        }, 0);
        return;
      }

      setSubmitError(message);
      setToast({
        id: Date.now(),
        message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    clearErrors();

    if (!accessToken?.trim()) {
      setStepError('You are not authenticated. Please log in again.');
      return;
    }

    if (!jobId) {
      setStepError('Invalid job selected.');
      return;
    }

    const requestId = ++coverLetterRequestRef.current;
    setIsGenerating(true);
    setHasGenerated(false);

    try {
      const response = await generateCandidateCoverLetter(accessToken, jobId);
      if (requestId !== coverLetterRequestRef.current) return;

      const generatedCoverLetter = response.cover_letter.trim();
      if (!generatedCoverLetter) {
        throw new Error('Received an empty cover letter.');
      }

      setCoverLetter(generatedCoverLetter);
      setHasGenerated(true);
    } catch (error: unknown) {
      if (requestId !== coverLetterRequestRef.current) return;
      setStepError(getErrorMessage(error, 'Unable to generate cover letter right now.'));
    } finally {
      if (requestId === coverLetterRequestRef.current) {
        setIsGenerating(false);
      }
    }
  };

  const handleNext = async () => {
    clearErrors();

    if (currentStep === 1) {
      if (!validateStepOne()) return;
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!validateStepTwo()) return;
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      if (!validateStepThree()) return;
      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      if (!validateStepFour()) return;
      setCurrentStep(5);
      return;
    }

    if (!validateStepFive()) return;
    await handleSubmit();
  };

  const handleBack = () => {
    clearErrors();
    if (currentStep === 4) {
      if (hasGenerated) {
        setHasGenerated(false);
        setIsGenerating(false);
        return;
      }
      if (isGenerating) {
        coverLetterRequestRef.current += 1;
        setIsGenerating(false);
        return;
      }
    }
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      return;
    }
    onClose();
  };

  const renderQuestionInput = (question: CandidateJobScreeningQuestion) => {
    const value = screeningAnswers[question.id] || '';
    const normalizedType = question.type.toLowerCase();
    const selectedFile = screeningFiles[question.id];

    if (normalizedType === 'yes_no') {
      return (
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => updateQuestionAnswer(question.id, 'yes')}
            className={`flex-1 py-3 px-6 rounded-xl border font-medium text-[15px] transition-all cursor-pointer shadow-sm ${
              value === 'yes' ? 'bg-[#FF6934] text-white border-[#FF6934]' : 'bg-white text-[#475467] border-gray-200 hover:bg-gray-50'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => updateQuestionAnswer(question.id, 'no')}
            className={`flex-1 py-3 px-6 rounded-xl border font-medium text-[15px] transition-all cursor-pointer shadow-sm ${
              value === 'no' ? 'bg-[#FF6934] text-white border-[#FF6934]' : 'bg-white text-[#475467] border-gray-200 hover:bg-gray-50'
            }`}
          >
            No
          </button>
        </div>
      );
    }

    if (normalizedType === 'multiple_choice' && question.options && question.options.length > 0) {
      return (
        <div className="space-y-2">
          {question.options.map((option) => (
            <button
              key={`${question.id}-${option.value}`}
              type="button"
              onClick={() => updateQuestionAnswer(question.id, option.value)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-[15px] transition-colors ${
                value === option.value
                  ? 'bg-[#FFF4ED] border-[#FF6934] text-[#101828]'
                  : 'bg-white border-gray-200 text-[#475467] hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      );
    }

    if (normalizedType === 'file_upload') {
      return (
        <div className="space-y-2">
          <label
            htmlFor={`screening-file-${question.id}`}
            className="w-full min-h-[155px] px-6 py-6 rounded-xl border border-dashed border-[#BFC5CF] bg-[#F8F9FB] hover:bg-[#F2F4F7] cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
          >
            <Upload size={36} className="text-[#98A2B3] mb-2" />
            <div className="space-y-1">
              <p className="text-[16px] font-medium text-[#344054] mt-3">
                {selectedFile ? 'File Selected' : getFileUploadTitle(question)}
              </p>
              <p className="text-[15px] text-[#667085]">
                {selectedFile ? selectedFile.name : 'Drag and drop or click to browse'}
              </p>
              <p className="text-[14px] text-[#98A2B3]">
                {getSupportedFileText(question)}
              </p>
            </div>
            <input
              id={`screening-file-${question.id}`}
              type="file"
              className="hidden"
              onChange={(event) => updateQuestionFile(question.id, event.target.files?.[0] || null)}
            />
          </label>
        </div>
      );
    }

    if (normalizedType === 'link') {
      return (
        <input
          type="url"
          value={value}
          onChange={(event) => updateQuestionAnswer(question.id, event.target.value)}
          placeholder={getLinkPlaceholder(question.link_kind)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6934]/10 focus:border-[#FF6934] text-[15px] placeholder:text-[#98A2B3] shadow-sm"
        />
      );
    }

    if (normalizedType === 'long_text') {
      return (
        <textarea
          value={value}
          onChange={(event) => updateQuestionAnswer(question.id, event.target.value)}
          placeholder="Type your answer..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6934]/10 focus:border-[#FF6934] text-[15px] placeholder:text-[#98A2B3] min-h-[140px] resize-none shadow-sm"
        />
      );
    }

    return (
      <input
        type={normalizedType === 'numeric' ? 'number' : 'text'}
        value={value}
        onChange={(event) => updateQuestionAnswer(question.id, event.target.value)}
        placeholder={normalizedType === 'short_text' ? 'Type your answer...' : undefined}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6934]/10 focus:border-[#FF6934] text-[15px] placeholder:text-[#98A2B3] shadow-sm"
      />
    );
  };

  const renderStepError = () => {
    if (!stepError) return null;
    return <p className="text-[13px] text-[#B42318] mb-4">{stepError}</p>;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-[#F9FAFB] border border-gray-200 rounded-xl p-8 shadow-sm">
              <h3 className="text-[18px] font-semibold text-[#101828] font-heading mb-4">Role preview</h3>

              <h2 className="text-[24px] font-semibold text-gray-900 font-heading leading-tight mb-2">{job?.title || 'Untitled role'}</h2>
              <div className="flex items-center gap-2 text-[#475467] text-[14px] font-regular font-body mb-6">
                <Building2 size={18} className="opacity-70" /> {getCompanyName(job?.company)}
              </div>

              <div className="flex flex-row gap-6 mb-6">
                <div className="flex items-center gap-3 text-[14px] text-[#475467] font-regular font-body">
                  <MapPin size={17} className="opacity-60" /> {job?.location || 'Location not provided'}
                </div>
                <div className="flex items-center gap-3 text-[14px] text-[#475467] font-regular font-body">
                  <Briefcase size={17} className="opacity-60" /> {jobTypeLabel || 'Full time'}
                </div>
              </div>

              {jobResponsibilities.length > 0 && (
                <div>
                  <h4 className="text-[14px] font-regular text-[#101828] font-heading mb-4">Key responsibilities:</h4>
                  <ul className="space-y-3">
                    {jobResponsibilities.slice(0, 5).map((item, idx) => (
                      <li key={`${item}-${idx}`} className="flex items-start gap-3 text-[14px] text-[#4B5563] font-medium font-body leading-relaxed">
                        <span className="size-1.5 bg-[#FF6934] rounded-full mt-2 shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-[18px] font-semibold text-[#101828] font-heading mb-4">Select a CV</h3>
              {renderStepError()}

              <input
                ref={fileInputRef}
                type="file"
                accept={SUPPORTED_CV_ACCEPT}
                className="hidden"
                onChange={(event) => { void handleFileChange(event); }}
              />

              <div className="flex flex-col gap-3">
                {isLoadingCvs ? (
                  <div className="min-h-[140px] rounded-xl border border-gray-200 bg-white flex items-center justify-center gap-2 text-[14px] text-[#475467]">
                    <Loader2 size={18} className="animate-spin text-[#FF6934]" />
                    Loading CVs...
                  </div>
                ) : cvs.length === 0 ? (
                  <div className="min-h-[140px] rounded-xl border border-gray-200 bg-white flex items-center justify-center text-center px-6 text-[14px] text-[#667085]">
                    No CV found. Upload a CV to continue.
                  </div>
                ) : (
                  cvs.map((cv) => (
                    <div
                      key={cv.id}
                      onClick={() => handleCvSelect(cv.id)}
                      className={`relative p-4 rounded-xl border transition-all cursor-pointer group flex items-start gap-4 ${
                        selectedCV === cv.id
                          ? 'border-[#FF6934] bg-[#FFF9F2] shadow-sm'
                          : 'border-gray-200 hover:border-orange-200 bg-white'
                      }`}
                    >
                      {cv.is_primary && (
                        <div className="absolute -top-2.5 right-4 bg-[#ECFDF3] text-[#10B981] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#D1FADF]">
                          Recommended
                        </div>
                      )}

                      <div className={`mt-0.5 size-5 rounded-[3px] border-1 flex items-center justify-center transition-colors ${
                        selectedCV === cv.id ? 'bg-[#FF6934] border-[#FF6934]' : 'border-[#FF6934]'
                      }`}>
                        {selectedCV === cv.id && <Check size={14} className="text-white stroke-[3.5]" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-[14px] font-medium text-[#101828] font-body mb-1">
                          <FileText size={17} className="text-[#101828]" /> {cv.name}
                        </div>
                        <div className="text-[12px] font-medium text-[#475467] font-body">
                          {formatCvUpdatedLabel(cv.uploaded_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={isUploadingCv}
                  className="flex items-center justify-between w-full p-4 rounded-xl bg-[#FFF9F2]/50 border border-gray-200 hover:border-orange-200 hover:bg-[#FFF9F2] transition-all group mt-2 cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3 text-[14px] font-medium text-[#475467] font-body">
                    {isUploadingCv ? <Loader2 size={18} className="animate-spin text-[#475467]" /> : <Upload size={18} className="text-[#475467] group-hover:text-[#FF6934]" />}
                    {isUploadingCv ? 'Uploading CV...' : 'Upload new CV'}
                  </div>
                </button>

                {cvsError && <p className="text-[13px] text-[#B42318]">{cvsError}</p>}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="p-8 space-y-8 min-h-[400px]">
            <h3 className="text-[20px] font-bold text-[#101828] font-heading mb-6 -mt-2">Screening questions</h3>
            {renderStepError()}

            {isLoadingQuestions ? (
              <div className="min-h-[220px] rounded-xl border border-gray-200 bg-white flex items-center justify-center gap-2 text-[14px] text-[#475467]">
                <Loader2 size={18} className="animate-spin text-[#FF6934]" />
                Loading screening questions...
              </div>
            ) : questionsError ? (
              <div className="bg-[#FEF3F2] border border-[#FDA29B] rounded-xl p-4 text-[14px] text-[#B42318] flex items-center justify-between gap-3">
                <span>{questionsError}</span>
                <button
                  type="button"
                  onClick={() => { void loadJobDetailData(); }}
                  className="underline cursor-pointer whitespace-nowrap"
                >
                  Retry
                </button>
              </div>
            ) : (
              screeningQuestions.map((question) => (
                <div key={question.id} className="space-y-3">
                  <label className="block text-[15px] font-medium text-[#101828]">
                    {question.text}
                    {question.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderQuestionInput(question)}
                  {questionErrors[question.id] && <p className="text-[12px] text-[#B42318]">{questionErrors[question.id]}</p>}
                </div>
              ))
            )}
          </div>
        );
      case 3:
        return (
          <div className="p-8 space-y-6 min-h-[400px]">
            <div>
              <h3 className="text-[20px] font-bold text-[#101828] font-heading mb-2">Profile links</h3>
              <p className="text-[14px] text-[#475467]">
                Add links to help recruiters learn more about you. All fields are optional.
              </p>
            </div>
            {renderStepError()}

            <div className="space-y-4">
              {SOCIAL_LINK_FIELDS.map((field) => (
                <div key={field.platform} className="bg-[#F9FAFB] rounded-xl p-4 border border-[#EAECF0]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`size-8 rounded-[10px] flex items-center justify-center ${field.iconBgClassName}`}>
                      {field.renderIcon()}
                    </div>
                    <span className="text-[16px] font-medium text-[#1D2939]">{field.platform}</span>
                  </div>
                  <input
                    type="url"
                    value={socialLinks[field.platform]}
                    onChange={(event) => updateSocialLink(field.platform, event.target.value)}
                    placeholder={field.placeholder}
                    className="w-full h-11 px-4 rounded-[10px] border border-[#D0D5DD] bg-white text-[15px] text-[#344054] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/10 focus:border-[#FF6934]"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      case 4:
        if (hasGenerated) {
          return (
            <div className="p-5 sm:p-8 space-y-6">
              <h3 className="text-[20px] font-bold text-[#101828] font-heading mb-4">Review and edit your cover letter</h3>
              {renderStepError()}
              <div className="relative group">
                <textarea
                  ref={coverLetterTextareaRef}
                  value={coverLetter}
                  onChange={(event) => setCoverLetter(event.target.value)}
                  className="w-full min-h-[320px] p-5 pb-10 sm:p-8 sm:pb-12 rounded-xl border border-gray-200 bg-white text-[#344054] text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#FF6934]/5 focus:border-[#FF6934] transition-colors shadow-sm font-body resize-none overflow-hidden"
                />
                <div className="absolute bottom-4 right-4 text-[12px] text-gray-400 font-medium">
                  {coverLetter.length} characters
                </div>
              </div>
            </div>
          );
        }

        if (isGenerating) {
          return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
              <div className="size-20 bg-orange-50 rounded-full flex items-center justify-center text-[#FF6934] mb-12">
                <Sparkles size={40} />
              </div>

              <div className="w-full max-w-[400px] space-y-5 mb-10">
                <div className="flex items-center gap-4 text-[16px] font-medium text-gray-900">
                  <div className="size-6 rounded-full bg-[#12B76A] flex items-center justify-center text-white">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  Analyzing your CV
                </div>
                <div className="flex items-center gap-4 text-[16px] font-medium text-gray-900">
                  <div className="size-6 rounded-full bg-[#FF6934] flex items-center justify-center animate-pulse">
                    <div className="size-2 bg-white rounded-full"></div>
                  </div>
                  Matching job requirements
                </div>
                <div className="flex items-center gap-4 text-[16px] font-medium text-[#98A2B3]">
                  <div className="size-6 rounded-full bg-[#F2F4F7] flex items-center justify-center">
                    <div className="size-2 bg-[#D0D5DD] rounded-full"></div>
                  </div>
                  Writing your personalized cover letter
                </div>
              </div>

              <div className="w-full max-w-[440px] h-2 bg-[#F2F4F7] rounded-full overflow-hidden">
                <div className="w-[60%] h-full bg-[#FF6934] rounded-full transition-all duration-1000 animate-pulse"></div>
              </div>
            </div>
          );
        }

        return (
          <div className="p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
            {renderStepError()}

            <div className="size-20 bg-orange-50 rounded-full flex items-center justify-center text-[#FF6934] mb-8 animate-pulse">
              <Sparkles size={40} strokeWidth={2} />
            </div>

            <h3 className="text-[26px] font-semibold text-[#101828] mb-4">Generate AI cover letter</h3>
            <p className="text-[17px] text-[#475467] max-w-[500px] mb-10 leading-relaxed">
              Our AI will write a personalized cover letter based on your CV and the job requirements
            </p>

            <button
              type="button"
              onClick={() => {
                void handleGenerateCoverLetter();
              }}
              className="bg-[#FF6934] text-white px-8 py-3.5 rounded-[12px] font-semibold text-[16px] shadow-lg shadow-orange-100 flex items-center gap-3 hover:opacity-90 transition-all cursor-pointer group"
            >
              <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
              Generate cover letter
            </button>
          </div>
        );
      case 5:
        return (
          <div className="p-8 space-y-4">
            <div>
              <h3 className="text-[20px] font-bold text-[#101828] font-heading leading-tight">Review your application</h3>
              <p className="text-[14px] text-[#475467] mt-1">Make sure everything looks good before submitting.</p>
            </div>
            {renderStepError()}
            {submitError && <p className="text-[13px] text-[#B42318]">{submitError}</p>}

            <div className="rounded-xl border border-[#E4E7EC] bg-[#F8F9FB] p-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-xl border border-[#E4E7EC] bg-white flex items-center justify-center shrink-0 mt-0.5">
                  <Briefcase size={17} className="text-[#667085]" />
                </div>
                <div>
                  <p className="text-[18px] font-semibold text-[#101828] leading-tight">{job?.title || 'Untitled role'}</p>
                  <p className="text-[14px] text-[#475467] leading-tight mt-1">{getCompanyName(job?.company)} - {job?.location || 'Location not provided'}</p>
                </div>
              </div>
              <span className="text-[14px] font-medium text-[#F04438] border border-[#FECACA] bg-[#FFF1F3] rounded-full px-3 py-1 whitespace-nowrap">
                {jobTypeLabel || 'Full-time'}
              </span>
            </div>

            <div className="rounded-xl border border-[#E4E7EC] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleReviewSection('cv')}
                className="w-full bg-[#F8F9FB] px-4 py-3 flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl border border-[#E4E7EC] bg-white flex items-center justify-center">
                    <FileText size={17} className="text-[#667085]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[16px] font-semibold text-[#101828]">Selected CV</p>
                    <span className="text-[12px] text-[#98A2B3] bg-[#EEF1F5] px-2 py-0.5 rounded-md">Step 1</span>
                  </div>
                </div>
                {reviewSectionOpen.cv ? (
                  <ChevronDown size={18} className="text-[#98A2B3]" />
                ) : (
                  <ChevronRight size={18} className="text-[#98A2B3]" />
                )}
              </button>
              {reviewSectionOpen.cv && (
                <div className="p-4 bg-white border-t border-[#E4E7EC]">
                  <div className="rounded-xl border border-[#E4E7EC] px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <FileText size={17} className="text-[#667085]" />
                      <span className="text-[15px] font-medium text-[#1D2939] break-all">{selectedCvName}</span>
                    </div>
                    {selectedCvDetails?.is_primary && (
                      <span className="text-[12px] font-medium text-[#027A48] bg-[#D1FADF] rounded-full px-2.5 py-0.5 whitespace-nowrap">
                        Recommended
                      </span>
                    )}
                  </div>
                  {selectedCvDetails?.uploaded_at && (
                    <p className="text-[13px] text-[#98A2B3] mt-2">{formatCvUpdatedLabel(selectedCvDetails.uploaded_at)}</p>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#E4E7EC] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleReviewSection('screening')}
                className="w-full bg-[#F8F9FB] px-4 py-3 flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl border border-[#E4E7EC] bg-white flex items-center justify-center">
                    <User size={17} className="text-[#667085]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[16px] font-semibold text-[#101828]">Screening questions</p>
                      <span className="text-[12px] text-[#98A2B3] bg-[#EEF1F5] px-2 py-0.5 rounded-md">Step 2</span>
                    </div>
                    <p className="text-[13px] text-[#98A2B3]">{screeningCompletedCount} of {screeningQuestions.length} completed</p>
                  </div>
                </div>
                {reviewSectionOpen.screening ? (
                  <ChevronDown size={18} className="text-[#98A2B3]" />
                ) : (
                  <ChevronRight size={18} className="text-[#98A2B3]" />
                )}
              </button>
              {reviewSectionOpen.screening && (
                <div className="p-4 bg-white border-t border-[#E4E7EC] space-y-3">
                  {screeningQuestions.length === 0 ? (
                    <p className="text-[15px] italic text-[#98A2B3]">No screening questions</p>
                  ) : (
                    screeningQuestions.map((question, index) => {
                      const answer = (screeningAnswers[question.id] || '').trim();
                      return (
                        <div key={question.id} className="rounded-xl border border-[#E4E7EC] px-4 py-3">
                          <p className="text-[12px] text-[#98A2B3]">Q{index + 1}</p>
                          <p className="text-[15px] text-[#1D2939] mt-0.5">{question.text}</p>
                          {answer ? (
                            <p className="text-[14px] text-[#344054] mt-1 flex items-center gap-2">
                              <span className="size-4 rounded-full border border-[#12B76A] flex items-center justify-center bg-[#ECFDF3]">
                                <Check size={10} className="text-[#12B76A] stroke-[3]" />
                              </span>
                              {answer}
                            </p>
                          ) : (
                            <p className="text-[14px] mt-1 text-[#98A2B3] italic">Not answered</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#E4E7EC] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleReviewSection('profile')}
                className="w-full bg-[#F8F9FB] px-4 py-3 flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl border border-[#E4E7EC] bg-white flex items-center justify-center">
                    <Link2 size={17} className="text-[#667085]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[16px] font-semibold text-[#101828]">Profile links</p>
                      <span className="text-[12px] text-[#98A2B3] bg-[#EEF1F5] px-2 py-0.5 rounded-md">Step 3</span>
                    </div>
                    <p className="text-[13px] text-[#98A2B3]">{filledSocialLinks.length} of 3 completed</p>
                  </div>
                </div>
                {reviewSectionOpen.profile ? (
                  <ChevronDown size={18} className="text-[#98A2B3]" />
                ) : (
                  <ChevronRight size={18} className="text-[#98A2B3]" />
                )}
              </button>
              {reviewSectionOpen.profile && (
                <div className="p-4 bg-white border-t border-[#E4E7EC]">
                  {filledSocialLinks.length === 0 ? (
                    <p className="text-[15px] italic text-[#98A2B3]">No links added</p>
                  ) : (
                    <div className="space-y-3">
                      {filledSocialLinks.map((item) => {
                        const field = SOCIAL_LINK_FIELDS.find((socialField) => socialField.platform === item.platform);
                        return (
                          <div key={item.platform} className="rounded-xl border border-[#E4E7EC] px-4 py-3">
                            <div className="flex items-center gap-2">
                              {field && (
                                <div className={`size-7 rounded-lg flex items-center justify-center ${field.iconBgClassName}`}>
                                  {field.renderIcon()}
                                </div>
                              )}
                              <p className="text-[14px] font-medium text-[#1D2939]">{item.platform}</p>
                            </div>
                            <p className="text-[14px] text-[#475467] break-all mt-1">{item.url}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#E4E7EC] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleReviewSection('cover')}
                className="w-full bg-[#F8F9FB] px-4 py-3 flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-[#FFF4ED] flex items-center justify-center">
                    <Sparkles size={17} className="text-[#FF6934]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[16px] font-semibold text-[#101828]">Cover letter</p>
                    <span className="text-[12px] text-[#98A2B3] bg-[#EEF1F5] px-2 py-0.5 rounded-md">Step 4</span>
                  </div>
                </div>
                {reviewSectionOpen.cover ? (
                  <ChevronDown size={18} className="text-[#98A2B3]" />
                ) : (
                  <ChevronRight size={18} className="text-[#98A2B3]" />
                )}
              </button>
              {reviewSectionOpen.cover && (
                <div className="p-4 bg-white border-t border-[#E4E7EC]">
                  <div className="rounded-xl border border-[#E4E7EC] px-4 py-3">
                    <p className="text-[14px] text-[#344054] leading-relaxed whitespace-pre-wrap">
                      {coverLetter}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-start gap-3 px-0.5 pt-1 pb-1">
              <div
                onClick={() => setIsConfirmed(!isConfirmed)}
                className={`mt-1 size-5 rounded-[5px] border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isConfirmed ? 'bg-[#FF6934] border-[#FF6934]' : 'border-[#D0D5DD] hover:border-[#FF6934]'
                }`}
              >
                {isConfirmed && <Check size={13} className="text-white stroke-[3]" />}
              </div>
              <p className="text-[15px] text-[#344054] leading-relaxed select-none">
                I confirm that the information provided is correct and I understand that {getCompanyName(job?.company)} will review my application.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isSubmitBlockedByConfirmation = currentStep === 5 && !isConfirmed;

  if (!isOpen || !job) return null;

  return (
    <ModalPortal>
    {toast && (
      <div
        key={toast.id}
        className={`fixed top-4 right-4 z-[160] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
          toast.type === 'error'
            ? 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
            : 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
        }`}
      >
        {toast.message}
      </div>
    )}
    <div
      className="fixed inset-0 bg-black/60 z-50 flex min-h-dvh items-center justify-center overflow-hidden overscroll-none p-3 sm:p-4 md:p-6 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-xl overflow-hidden w-full max-w-[840px] max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] md:max-h-[calc(100dvh-3rem)] shadow-2xl relative flex flex-col font-manrope transition-all duration-300"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 sm:px-8 sm:pt-8 sm:pb-6 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[24px] font-semibold text-[#111827] font-heading">Quick Apply</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 bg-gray-50 hover:bg-gray-100 rounded-full cursor-pointer">
              <X size={20} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[14px] font-regular text-gray-500 font-body">Step {visibleStep} of {totalSteps}</span>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF6934] rounded-full transition-all duration-300"
                style={{ width: `${(visibleStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y scrollbar-hide">
          {renderStep()}
        </div>

        <div className="px-5 py-4 sm:px-8 sm:py-6 bg-white border-t border-gray-200 flex items-center justify-between shrink-0">
          <button
            onClick={currentStep === 1 ? onClose : handleBack}
            className="text-[15px] font-medium text-[#475467] hover:text-[#101828] transition-colors cursor-pointer flex items-center gap-1"
            disabled={isSubmitting}
          >
            {currentStep > 1 && <ChevronLeft size={18} />}
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {!isGenerating && (
            <button
              onClick={() => { void handleNext(); }}
              disabled={isSubmitting || isSubmitBlockedByConfirmation}
              className="bg-[#FF6934] text-white px-8 py-3 rounded-[10px] font-medium shadow-lg shadow-orange-100 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {currentStep === 5 ? 'Submit Application' : 'Continue'}
            </button>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
