import { Book, ChevronUp, ChevronDown, Search, ChevronRight, ArrowLeft, ThumbsUp, ThumbsDown, Lightbulb } from 'lucide-react';
import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../redux/store';
import { submitArticleFeedback } from '../../../../services/articleFeedbackApi';

interface HelpCenterSectionProps {
  expanded: boolean;
  onToggle: () => void;
  onSelectArticle: (article: string) => void;
  selectedArticle: string | null;
  onBackToTopics: () => void;
}

const topics = [
  { id: '04d1acfd-7ef1-4445-ac64-7004dc9b806a', title: 'Managing your CV', category: 'Getting Started' },
  { id: '8cfe3f63-6b55-4dd7-a784-2367f64165bf', title: 'Applying for jobs', category: 'Applications' },
  { id: '06b52272-4e5b-4027-a706-73bca4f58e30', title: 'AI match score explained', category: 'AI Features' },
  { id: '0fa8aa70-5b89-4e43-85c3-cf7ad6152fd0', title: 'Profile visibility', category: 'Privacy' },
  { id: 'f1d77988-c7d2-4fdf-9de7-2d1c858403ba', title: 'Understanding job recommendations', category: 'AI Features' },
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to submit feedback. Please try again.';
}

export default function HelpCenterSection({ expanded, onToggle, onSelectArticle, selectedArticle, onBackToTopics }: HelpCenterSectionProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false);
  const [feedbackSelection, setFeedbackSelection] = React.useState<boolean | null>(null);
  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null);
  const [feedbackError, setFeedbackError] = React.useState<string | null>(null);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const selectedTopic = React.useMemo(
    () => topics.find((topic) => topic.title === selectedArticle) || null,
    [selectedArticle]
  );

  React.useEffect(() => {
    setFeedbackSelection(null);
    setFeedbackMessage(null);
    setFeedbackError(null);
  }, [selectedArticle]);

  const filteredTopics = React.useMemo(() => {
    if (!normalizedSearchQuery) return topics;

    return topics.filter((topic) => (
      topic.title.toLowerCase().includes(normalizedSearchQuery)
      || topic.category.toLowerCase().includes(normalizedSearchQuery)
    ));
  }, [normalizedSearchQuery]);

  const handleFeedbackSubmit = async (isHelpful: boolean) => {
    if (isSubmittingFeedback) return;
    if (!selectedTopic) return;

    if (!accessToken?.trim()) {
      setFeedbackError('You are not authenticated. Please log in again.');
      setFeedbackMessage(null);
      return;
    }

    setIsSubmittingFeedback(true);
    setFeedbackError(null);
    setFeedbackMessage(null);

    try {
      const responseMessage = await submitArticleFeedback(accessToken, {
        article_id: selectedTopic.id,
        is_helpful: isHelpful,
      });
      setFeedbackSelection(isHelpful);
      setFeedbackMessage(responseMessage || 'Thanks for your feedback.');
    } catch (error: unknown) {
      setFeedbackError(getErrorMessage(error));
    } finally {
      setIsSubmittingFeedback(false);
    }
  };
  
  const renderArticleContent = () => (
    <div className="space-y-6 font-manrope animate-in fade-in slide-in-from-left-4 duration-300 bg-white">
      <button 
        onClick={onBackToTopics} 
        className="text-[14px] font-semibold text-[#FF6934] hover:opacity-80 mb-6 flex items-center gap-2 cursor-pointer transition-opacity"
      >
        <ArrowLeft size={16} /> Back to articles
      </button>
      
      <div className="max-w-3xl">
        <h2 className="text-[24px] font-bold text-[#101828] mb-6">{selectedArticle}</h2>
        
        <div className="space-y-6 text-[14px] text-[#475467] leading-relaxed">
          <div className="space-y-4">
            <p><span className="font-bold text-[#101828]">Step 1:</span> Navigate to your profile page by clicking your avatar in the top navigation.</p>
            <p><span className="font-bold text-[#101828]">Step 2:</span> Look for the section you want to edit and click the edit icon.</p>
            <p><span className="font-bold text-[#101828]">Step 3:</span> Make your changes and click "Save" to update your profile.</p>
          </div>

          <div className="bg-[#F9FAFB] rounded-xl p-6 border border-gray-100 flex items-start gap-4 mt-8">
            <div className="shrink-0 mt-1">
              <Lightbulb className="text-yellow-500" size={18} />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-[#101828] mb-1">Pro Tip</h4>
              <p className="text-[13px] text-[#667085]">
                Use the AI-powered suggestions to enhance your profile and improve your match score!
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 mt-10">
            <p className="font-semibold text-[#101828] mb-4">Was this helpful?</p>
            <div className="flex gap-3">
              <button
                onClick={() => { void handleFeedbackSubmit(true); }}
                disabled={isSubmittingFeedback}
                className={`flex items-center gap-2 px-4 py-2 border rounded-[10px] transition-colors text-[14px] font-medium ${
                  feedbackSelection === true
                    ? 'border-[#12B76A] bg-[#ECFDF3] text-[#027A48]'
                    : 'border-gray-200 hover:bg-gray-50 text-[#344054]'
                } ${isSubmittingFeedback ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <ThumbsUp size={16} /> Yes
              </button>
              <button
                onClick={() => { void handleFeedbackSubmit(false); }}
                disabled={isSubmittingFeedback}
                className={`flex items-center gap-2 px-4 py-2 border rounded-[10px] transition-colors text-[14px] font-medium ${
                  feedbackSelection === false
                    ? 'border-[#FDA29B] bg-[#FEF3F2] text-[#B42318]'
                    : 'border-gray-200 hover:bg-gray-50 text-[#344054]'
                } ${isSubmittingFeedback ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <ThumbsDown size={16} /> No
              </button>
            </div>
            {feedbackMessage && (
              <p className="mt-3 text-[13px] text-[#027A48] font-medium">{feedbackMessage}</p>
            )}
            {feedbackError && (
              <p className="mt-3 text-[13px] text-[#B42318] font-medium">{feedbackError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-all duration-300">
      <button 
        onClick={onToggle}
        className="w-full p-6 sm:p-8 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[10px] bg-[#FFF1EC] border border-[#FF693410] flex items-center justify-center shadow-sm">
            <Book className="text-[#FF6934]" size={24} />
          </div>
          <div className="font-manrope">
            <h3 className="text-[16px] font-semibold text-[#101828]">Help Center</h3>
            <p className="text-[14px] text-[#667085]">Browse articles and FAQs</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="text-[#667085]" /> : <ChevronDown className="text-[#667085]" />}
      </button>

      {expanded && (
        <div className="px-6 sm:px-8 pb-10 font-manrope animate-in fade-in slide-in-from-top-2 duration-300">
          {selectedArticle ? (
            renderArticleContent()
          ) : (
            <>
              <div className="relative mb-8 pt-2">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#98A2B3] flex items-center justify-center h-full">
                  <Search size={18} />
                </div>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search help articles..."
                  className="w-full h-[52px] pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 transition-all font-manrope shadow-sm"
                />
              </div>

              <div className="space-y-0">
                <h4 className="text-[14px] font-semibold text-[#101828] mb-4">
                  {normalizedSearchQuery ? 'Search results' : 'Popular topics'}
                </h4>
                {filteredTopics.length > 0 ? (
                  <div className="space-y-3">
                    {filteredTopics.map((topic) => (
                      <button 
                        key={topic.title}
                        onClick={() => onSelectArticle(topic.title)}
                        className="w-full p-4 sm:p-5 rounded-xl border border-gray-200 bg-white hover:border-[#FF6934/50] hover:shadow-sm transition-all group text-left cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-[14px] font-semibold text-[#101828] mb-1 group-hover:text-[#FF6934] transition-colors">{topic.title}</h4>
                          <p className="text-[12px] text-[#667085]">{topic.category}</p>
                        </div>
                        <ChevronRight size={18} className="text-[#98A2B3] group-hover:text-[#FF6934] transition-colors" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-white p-5 text-[14px] text-[#667085]">
                    No help articles found for "<span className="font-medium text-[#344054]">{searchQuery.trim()}</span>".
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
