import { X, Building2, MapPin, Briefcase, FileText, Upload, ChevronLeft, Check, Loader2, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { getCandidateJobDetail, type CandidateJobScreeningQuestion } from '../services/jobsApi';
import { getCandidateCvs, uploadCandidateCv, type CandidateCvItem } from '../services/cvApi';
import { applyToCandidateJob } from '../services/applicationsApi';
import { formatJobTypeLabel } from '../utils/formatJobTypeLabel';

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

type Step = 1 | 2 | 3 | 4;

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

export default function QuickApplyModal({ isOpen, onClose, job, onApplySuccess, onApplyError }: QuickApplyModalProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvsRequestRef = useRef(0);
  const jobDetailRequestRef = useRef(0);

  const jobId = useMemo(() => {
    if (!job || job.id === undefined || job.id === null) return '';
    return String(job.id).trim();
  }, [job]);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedCV, setSelectedCV] = useState('');
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
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const [jobResponsibilities, setJobResponsibilities] = useState<string[]>([]);
  const [jobTypeLabel, setJobTypeLabel] = useState('');

  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shouldSkipScreeningStep = !isLoadingQuestions && !questionsError && screeningQuestions.length === 0;
  const totalSteps = shouldSkipScreeningStep ? 3 : 4;
  const visibleStep = shouldSkipScreeningStep && currentStep > 2 ? currentStep - 1 : currentStep;

  const selectedCvName = useMemo(() => {
    const selected = cvs.find((cv) => cv.id === selectedCV);
    return selected?.name || 'CV.pdf';
  }, [cvs, selectedCV]);

  const clearErrors = () => {
    setStepError(null);
    setSubmitError(null);
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
      if (requestId !== cvsRequestRef.current) return;
      setIsLoadingCvs(false);
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
      if (requestId !== jobDetailRequestRef.current) return;
      setIsLoadingQuestions(false);
    }
  }, [accessToken, jobId]);

  useEffect(() => {
    if (!isOpen || !job) {
      cvsRequestRef.current += 1;
      jobDetailRequestRef.current += 1;
      return;
    }

    setCurrentStep(1);
    setSelectedCV('');
    setCoverLetter(DEFAULT_COVER_LETTER);
    setIsConfirmed(false);
    setIsGenerating(false);
    setHasGenerated(false);
    setScreeningAnswers({});
    setQuestionErrors({});
    setScreeningQuestions(Array.isArray(job.questions) ? job.questions : []);
    setJobResponsibilities(Array.isArray(job.key_responsibilities) ? job.key_responsibilities : []);
    setJobTypeLabel(formatJobTypeLabel(job.job_type || job.type || '', ''));
    setCvs([]);
    setCvsError(null);
    setQuestionsError(null);
    setIsSubmitting(false);
    clearErrors();

    void loadCvs();
    void loadJobDetailData();
  }, [isOpen, job, loadCvs, loadJobDetailData]);

  useEffect(() => {
    if (!isGenerating || hasGenerated) return;
    const timer = window.setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [isGenerating, hasGenerated]);

  useEffect(() => {
    if (selectedCV && cvs.some((cv) => cv.id === selectedCV)) return;
    const primaryCv = cvs.find((cv) => cv.is_primary);
    const fallbackCv = cvs[0];
    setSelectedCV(primaryCv?.id || fallbackCv?.id || '');
  }, [cvs, selectedCV]);

  useEffect(() => {
    if (currentStep !== 2 || !shouldSkipScreeningStep) return;
    setCurrentStep(3);
  }, [currentStep, shouldSkipScreeningStep]);

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
    if (questionErrors[questionId]) {
      setQuestionErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
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

      if (answer && normalizedType === 'numeric' && !Number.isFinite(Number(answer))) {
        nextErrors[question.id] = 'Please enter a valid number.';
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

  const validateStepFour = (): boolean => {
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    clearErrors();

    if (currentStep === 1) {
      if (!validateStepOne()) return;
      if (shouldSkipScreeningStep) {
        setCurrentStep(3);
        return;
      }
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

    if (!validateStepFour()) return;
    await handleSubmit();
  };

  const handleBack = () => {
    clearErrors();
    if (currentStep === 3) {
      if (hasGenerated) {
        setHasGenerated(false);
        setIsGenerating(false);
        return;
      }
      if (isGenerating) {
        setIsGenerating(false);
        return;
      }
    }
    if (currentStep === 3 && shouldSkipScreeningStep) {
      setCurrentStep(1);
      return;
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

    if (question.options && question.options.length > 0) {
      return (
        <select
          value={value}
          onChange={(event) => updateQuestionAnswer(question.id, event.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6934]/10 focus:border-[#FF6934] text-[15px] shadow-sm"
        >
          <option value="">Select an option</option>
          {question.options.map((option) => (
            <option key={`${question.id}-${option}`} value={option}>{option}</option>
          ))}
        </select>
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
                accept=".pdf,.doc,.docx"
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
                      onClick={() => setSelectedCV(cv.id)}
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
        if (hasGenerated) {
          return (
            <div className="p-8 space-y-6">
              <h3 className="text-[20px] font-bold text-[#101828] font-heading mb-4">Review and edit your cover letter</h3>
              {renderStepError()}
              <div className="relative group">
                <textarea
                  value={coverLetter}
                  onChange={(event) => setCoverLetter(event.target.value)}
                  className="w-full min-h-[460px] p-8 rounded-xl border border-gray-200 bg-white text-[#344054] text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#FF6934]/5 focus:border-[#FF6934] transition-all scrollbar-hide shadow-sm font-body"
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
                clearErrors();
                setIsGenerating(true);
              }}
              className="bg-[#FF6934] text-white px-8 py-3.5 rounded-[12px] font-semibold text-[16px] shadow-lg shadow-orange-100 flex items-center gap-3 hover:opacity-90 transition-all cursor-pointer group"
            >
              <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
              Generate cover letter
            </button>
          </div>
        );
      case 4:
        return (
          <div className="p-8 space-y-6">
            <h3 className="text-[20px] font-bold text-[#101828] font-heading mb-4">Review your application</h3>
            {renderStepError()}
            {submitError && <p className="text-[13px] text-[#B42318]">{submitError}</p>}

            <div className="space-y-4">
              <div className="bg-[#F9FAFB] rounded-xl p-5 border border-gray-200 shadow-sm">
                <h4 className="text-[14px] font-semibold text-[#101828] mb-2">Selected CV</h4>
                <div className="flex items-center gap-3 text-[14px] text-[#475467]">
                  <FileText size={18} className="text-[#344054]" />
                  {selectedCvName}
                </div>
              </div>

              <div className="bg-[#F9FAFB] rounded-xl p-5 border border-gray-200 shadow-sm">
                <h4 className="text-[14px] font-semibold text-[#101828] mb-1">Applying to</h4>
                <div className="text-[15px] font-semibold text-gray-900">{job?.title || 'Untitled role'}</div>
                <div className="text-[14px] text-[#475467]">{getCompanyName(job?.company)}</div>
              </div>

              <div className="bg-[#F9FAFB] rounded-xl p-5 border border-gray-200 shadow-sm">
                <h4 className="text-[14px] font-semibold text-[#101828] mb-3">Cover letter</h4>
                <p className="text-[14px] text-[#475467] leading-relaxed line-clamp-5 whitespace-pre-wrap">
                  {coverLetter}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-4">
              <div
                onClick={() => setIsConfirmed(!isConfirmed)}
                className={`mt-1 size-5 rounded-[4px] border-1 flex items-center justify-center transition-all cursor-pointer shrink-0 ${isConfirmed ? 'bg-[#FF6934] border-[#FF6934]' : 'border-[#D0D5DD] hover:border-[#FF6934]'}`}
              >
                {isConfirmed && <Check size={14} className="text-white stroke-[3.5]" />}
              </div>
              <p className="text-[14px] text-[#475467] leading-relaxed select-none">
                I confirm that the information provided is correct and I understand that {getCompanyName(job?.company)} will review my application.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isSubmitBlockedByConfirmation = currentStep === 4 && !isConfirmed;

  if (!isOpen || !job) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-xl overflow-hidden w-full max-w-[840px] shadow-2xl relative flex flex-col font-manrope transition-all duration-300"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-8 pt-8 pb-6 border-b border-gray-200">
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

        <div className="overflow-y-auto scrollbar-hide max-h-[calc(90vh-200px)]">
          {renderStep()}
        </div>

        <div className="px-8 py-6 bg-white border-t border-gray-200 flex items-center justify-between">
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
              {currentStep === 4 ? 'Submit Application' : 'Continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
