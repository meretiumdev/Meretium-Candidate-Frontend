import React from 'react';
import { useSelector } from 'react-redux';
import { Bug, ChevronUp, ChevronDown, Upload } from 'lucide-react';
import type { RootState } from '../../../../redux/store';
import { submitBugReport } from '../../../../services/bugReportApi';

interface ReportBugSectionProps {
  expanded: boolean;
  onToggle: () => void;
}

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

type BugSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

const BUG_SEVERITY_OPTIONS: BugSeverity[] = ['Low', 'Medium', 'High', 'Critical'];
const MAX_SCREENSHOT_SIZE_BYTES = 10 * 1024 * 1024;

function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes('edg/')) return 'Microsoft Edge';
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera';
  if (ua.includes('chrome/') && !ua.includes('edg/')) return 'Chrome';
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
  if (ua.includes('firefox/')) return 'Firefox';
  if (ua.includes('trident/') || ua.includes('msie')) return 'Internet Explorer';

  return 'Unknown';
}

function detectOperatingSystem(userAgent: string, platform: string): string {
  const ua = userAgent.toLowerCase();
  const pf = platform.toLowerCase();

  if (pf.includes('win') || ua.includes('windows')) return 'Windows';
  if (pf.includes('mac') || ua.includes('mac os')) return 'macOS';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'iOS';
  if (ua.includes('android')) return 'Android';
  if (pf.includes('linux') || ua.includes('linux')) return 'Linux';

  return 'Unknown';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to submit bug report. Please try again.';
}

export default function ReportBugSection({ expanded, onToggle }: ReportBugSectionProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [severity, setSeverity] = React.useState<BugSeverity>('Medium');
  const [title, setTitle] = React.useState('');
  const [whatHappened, setWhatHappened] = React.useState('');
  const [whatExpected, setWhatExpected] = React.useState('');
  const [screenshot, setScreenshot] = React.useState<File | null>(null);
  const [titleError, setTitleError] = React.useState<string | null>(null);
  const [whatHappenedError, setWhatHappenedError] = React.useState<string | null>(null);
  const [whatExpectedError, setWhatExpectedError] = React.useState<string | null>(null);
  const [screenshotError, setScreenshotError] = React.useState<string | null>(null);
  const [capturedAt, setCapturedAt] = React.useState<Date>(new Date());
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!expanded) return;
    setCapturedAt(new Date());
  }, [expanded]);

  React.useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const capturedContext = React.useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        browser: 'Unknown',
        os: 'Unknown',
        page: 'Unknown',
        time: capturedAt.toLocaleString(),
      };
    }

    const userAgent = window.navigator.userAgent || '';
    const platform = window.navigator.platform || '';
    const pagePath = `${window.location.pathname}${window.location.search || ''}${window.location.hash || ''}`;

    return {
      browser: detectBrowser(userAgent),
      os: detectOperatingSystem(userAgent, platform),
      page: pagePath || '/',
      time: capturedAt.toLocaleString(),
    };
  }, [capturedAt]);

  const systemInfo = React.useMemo(() => [
    { label: 'Browser', value: capturedContext.browser },
    { label: 'OS', value: capturedContext.os },
    { label: 'Page', value: capturedContext.page },
    { label: 'Time', value: capturedContext.time },
  ], [capturedContext]);

  const showSuccessToast = React.useCallback((message: string) => {
    setToast({ id: Date.now(), message, type: 'success' });
  }, []);

  const showErrorToast = React.useCallback((message: string) => {
    setToast({ id: Date.now(), message, type: 'error' });
  }, []);

  const validate = React.useCallback((): boolean => {
    let isValid = true;

    if (!title.trim()) {
      setTitleError('Bug title is required.');
      isValid = false;
    } else {
      setTitleError(null);
    }

    if (!whatHappened.trim()) {
      setWhatHappenedError('Please describe what happened.');
      isValid = false;
    } else if (whatHappened.trim().length < 10) {
      setWhatHappenedError('What happened must be at least 10 characters.');
      isValid = false;
    } else {
      setWhatHappenedError(null);
    }

    if (!whatExpected.trim()) {
      setWhatExpectedError('Please describe what you expected.');
      isValid = false;
    } else if (whatExpected.trim().length < 10) {
      setWhatExpectedError('What you expected must be at least 10 characters.');
      isValid = false;
    } else {
      setWhatExpectedError(null);
    }

    return isValid;
  }, [title, whatExpected, whatHappened]);

  const handleScreenshotChange = (file: File | null) => {
    if (!file) {
      setScreenshot(null);
      setScreenshotError(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setScreenshot(null);
      setScreenshotError('Screenshot must be an image file.');
      return;
    }

    if (file.size > MAX_SCREENSHOT_SIZE_BYTES) {
      setScreenshot(null);
      setScreenshotError('Screenshot must be 10MB or less.');
      return;
    }

    setScreenshot(file);
    setScreenshotError(null);
  };

  const resetForm = React.useCallback(() => {
    setTitle('');
    setWhatHappened('');
    setWhatExpected('');
    setSeverity('Medium');
    setScreenshot(null);
    setTitleError(null);
    setWhatHappenedError(null);
    setWhatExpectedError(null);
    setScreenshotError(null);
  }, []);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!validate()) return;

    if (!accessToken?.trim()) {
      showErrorToast('You are not authenticated. Please log in again.');
      return;
    }

    const reportTimestamp = new Date();
    setCapturedAt(reportTimestamp);
    setIsSubmitting(true);

    try {
      const successMessage = await submitBugReport(accessToken, {
        title: title.trim(),
        what_happened: whatHappened.trim(),
        what_expected: whatExpected.trim(),
        severity: severity.toLowerCase(),
        browser: capturedContext.browser,
        os: capturedContext.os,
        page: capturedContext.page,
        reported_at: reportTimestamp.toISOString(),
        screenshot,
      });

      showSuccessToast(successMessage || 'Bug report submitted successfully.');
      resetForm();
    } catch (error: unknown) {
      showErrorToast(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-all duration-300 font-manrope">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[180] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
            toast.type === 'success'
              ? 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
              : 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
          }`}
        >
          {toast.message}
        </div>
      )}

      <button
        onClick={onToggle}
        className="w-full p-6 sm:p-8 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[10px] bg-[#FFF1EC] border border-[#FF693410] flex items-center justify-center shadow-sm">
            <Bug className="text-[#FF6934]" size={24} />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-[#101828]">Report a Bug</h3>
            <p className="text-[14px] text-[#667085]">Help us improve Meretium</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="text-[#667085]" /> : <ChevronDown className="text-[#667085]" />}
      </button>

      {expanded && (
        <div className="px-6 sm:px-8 pb-8 space-y-8 animate-in fade-in duration-300">
          <div className="bg-[#F9FAFB] rounded-[10px] p-6 border border-gray-200 shadow-sm">
            <p className="text-[12px] font-semibold text-[#667085] mb-4">Auto-captured system info</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-12">
              {systemInfo.map((info) => (
                <div key={info.label} className="flex items-center gap-2">
                  <span className="text-[12px] text-[#98A2B3] w-16">{info.label}:</span>
                  <span className="text-[12px] font-medium text-[#475467]">{info.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[14px] font-semibold text-[#101828] mb-2 block">Bug title *</label>
              <input
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setTitleError(null);
                }}
                placeholder="Brief summary of the issue"
                className={`w-full h-[52px] px-4 py-3 bg-white border rounded-[10px] shadow-sm text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 font-manrope ${
                  titleError ? 'border-[#FDA29B]' : 'border-gray-200'
                }`}
              />
              {titleError && (
                <p className="mt-2 text-[12px] text-[#B42318]">{titleError}</p>
              )}
            </div>

            <div>
              <label className="text-[14px] font-semibold text-[#101828] mb-2 block">What happened? *</label>
              <textarea
                value={whatHappened}
                onChange={(event) => {
                  setWhatHappened(event.target.value);
                  setWhatHappenedError(null);
                }}
                placeholder="Describe what went wrong..."
                rows={4}
                className={`w-full px-4 py-3 bg-white border rounded-[10px] shadow-sm text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 resize-none font-manrope ${
                  whatHappenedError ? 'border-[#FDA29B]' : 'border-gray-200'
                }`}
              />
              {whatHappenedError && (
                <p className="mt-2 text-[12px] text-[#B42318]">{whatHappenedError}</p>
              )}
            </div>

            <div>
              <label className="text-[14px] font-semibold text-[#101828] mb-2 block">What did you expect? *</label>
              <textarea
                value={whatExpected}
                onChange={(event) => {
                  setWhatExpected(event.target.value);
                  setWhatExpectedError(null);
                }}
                placeholder="Describe the expected behavior..."
                rows={4}
                className={`w-full px-4 py-3 bg-white border rounded-[10px] shadow-sm text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 resize-none font-manrope ${
                  whatExpectedError ? 'border-[#FDA29B]' : 'border-gray-200'
                }`}
              />
              {whatExpectedError && (
                <p className="mt-2 text-[12px] text-[#B42318]">{whatExpectedError}</p>
              )}
            </div>

            <div>
              <label className="text-[14px] font-semibold text-[#101828] mb-3 block">Severity *</label>
              <div className="flex bg-[#F9FAFB] p-1 rounded-[10px] border border-gray-200 gap-1 shadow-sm">
                {BUG_SEVERITY_OPTIONS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSeverity(level)}
                    type="button"
                    className={`flex-1 py-2 text-[14px] font-medium rounded-[8px] transition-all cursor-pointer ${
                      severity === level
                        ? 'bg-[#FF6934] text-white shadow-sm'
                        : 'text-[#667085] hover:text-[#101828]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[14px] font-semibold text-[#101828] mb-2 block">Screenshot (optional)</label>
              <label className="border border-gray-200 border-dashed rounded-[10px] p-8 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 transition-all cursor-pointer group shadow-sm">
                <div className="w-10 h-10 rounded-[10px] bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <Upload className="text-[#667085]" size={20} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-medium text-[#101828]">Drag and drop or click to upload</p>
                  <p className="text-[12px] text-[#98A2B3] mt-1">PNG, JPG up to 10MB</p>
                </div>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    handleScreenshotChange(file);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
              {screenshot && (
                <div className="mt-3 flex items-center justify-between rounded-[10px] border border-[#EAECF0] px-3 py-2">
                  <p className="truncate text-[13px] text-[#475467]">{screenshot.name}</p>
                  <button
                    onClick={() => handleScreenshotChange(null)}
                    type="button"
                    className="text-[12px] font-medium text-[#B42318] hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
              {screenshotError && (
                <p className="mt-2 text-[12px] text-[#B42318]">{screenshotError}</p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => { void handleSubmit(); }}
                disabled={isSubmitting}
                className="px-8 py-3 bg-[#FF6934] text-white rounded-[10px] text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
              >
                {isSubmitting ? 'Submitting...' : 'Report bug'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
