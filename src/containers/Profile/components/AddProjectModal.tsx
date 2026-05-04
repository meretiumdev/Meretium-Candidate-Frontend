import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import { createProfileProject, updateProfileProject } from '../../../services/profileApi';
import ModalPortal from '../../../components/ModalPortal';

export type ProjectSkillCategory = 'TOOLS' | 'SOFT_SKILLS' | 'CORE';

export interface ProjectSkillItem {
  name: string;
  category: ProjectSkillCategory;
}

export interface ProjectItem {
  id: string;
  projectId: string | null;
  title: string;
  duration: string;
  link: string;
  description: string;
  skills: ProjectSkillItem[];
}

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated?: () => Promise<void> | void;
  project?: ProjectItem | null;
}

interface ToastState {
  id: number;
  message: string;
  type: 'error' | 'success';
}

const SKILL_CATEGORY_OPTIONS: Array<{ label: string; value: ProjectSkillCategory }> = [
  { label: 'Tools', value: 'TOOLS' },
  { label: 'Soft Skills', value: 'SOFT_SKILLS' },
  { label: 'Core', value: 'CORE' },
];

const EMPTY_SKILLS_BY_CATEGORY: Record<ProjectSkillCategory, string> = {
  TOOLS: '',
  SOFT_SKILLS: '',
  CORE: '',
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function parseSkills(value: string): string[] {
  const seen = new Set<string>();

  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .reduce<string[]>((acc, name) => {
      const key = name.toLowerCase();
      if (seen.has(key)) return acc;
      seen.add(key);
      acc.push(name);
      return acc;
    }, []);
}

function buildSkillsByCategory(skills: ProjectSkillItem[]): Record<ProjectSkillCategory, string> {
  const grouped: Record<ProjectSkillCategory, string[]> = {
    TOOLS: [],
    SOFT_SKILLS: [],
    CORE: [],
  };

  skills.forEach((skill) => {
    grouped[skill.category].push(skill.name);
  });

  return {
    TOOLS: grouped.TOOLS.join(', '),
    SOFT_SKILLS: grouped.SOFT_SKILLS.join(', '),
    CORE: grouped.CORE.join(', '),
  };
}

function buildProjectSkillsPayload(skillsByCategory: Record<ProjectSkillCategory, string>): ProjectSkillItem[] {
  return SKILL_CATEGORY_OPTIONS.flatMap(({ value }) =>
    parseSkills(skillsByCategory[value]).map((name) => ({
      name,
      category: value,
    }))
  );
}

export default function AddProjectModal({
  isOpen,
  onClose,
  onProjectUpdated,
  project,
}: AddProjectModalProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const isEditMode = !!project;
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<ProjectSkillCategory>('TOOLS');
  const [skillsByCategory, setSkillsByCategory] = useState<Record<ProjectSkillCategory, string>>(EMPTY_SKILLS_BY_CATEGORY);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const skillTags = useMemo(
    () => parseSkills(skillsByCategory[selectedSkillCategory]),
    [selectedSkillCategory, skillsByCategory]
  );

  useEffect(() => {
    if (isEditMode && project) {
      setTitle(project.title);
      setLink(project.link);
      setSkillsByCategory(buildSkillsByCategory(project.skills));
      setSelectedSkillCategory('TOOLS');
      setDescription(project.description);
      return;
    }

    setTitle('');
    setLink('');
    setSelectedSkillCategory('TOOLS');
    setSkillsByCategory(EMPTY_SKILLS_BY_CATEGORY);
    setDescription('');
  }, [project, isEditMode, isOpen]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  if (!isOpen && !toast) return null;

  const closeModal = (force = false) => {
    if (saving && !force) return;
    onClose();
  };

  const validate = (): boolean => title.trim().length > 0;

  const handleSubmit = async () => {
    if (!validate()) return;

    if (!accessToken) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.', type: 'error' });
      return;
    }

    const payload = {
      title: title.trim(),
      link: link.trim(),
      skills: buildProjectSkillsPayload(skillsByCategory),
      description: description.trim(),
    };

    setSaving(true);
    setToast(null);

    try {
      if (isEditMode) {
        const projectId = project?.projectId?.trim() || '';
        if (!projectId) throw new Error('Project id is missing. Please refresh and try again.');
        await updateProfileProject(accessToken, projectId, payload);
      } else {
        await createProfileProject(accessToken, payload);
      }

      await onProjectUpdated?.();
      setToast({
        id: Date.now(),
        message: isEditMode ? 'Project updated successfully.' : 'Project added successfully.',
        type: 'success',
      });
      closeModal(true);
    } catch (error: unknown) {
      setToast({
        id: Date.now(),
        message: getErrorMessage(error, isEditMode ? 'Failed to update project.' : 'Failed to add project.'),
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {toast && (
        <div
          key={toast.id}
          className={`fixed top-4 right-4 z-[140] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
            toast.type === 'error'
              ? 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
              : 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
          }`}
        >
          {toast.message}
        </div>
      )}

      {isOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-all"
            onClick={() => closeModal()}
          >
            <div
              className="w-full max-w-[520px] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col font-manrope"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                <h3 className="text-[20px] md:text-[22px] font-semibold text-[#101828]">
                  {isEditMode ? 'Edit Project' : 'Add Project'}
                </h3>
                <button
                  onClick={() => closeModal()}
                  disabled={saving}
                  className="text-[#667085] hover:text-gray-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-[#101828] text-[13px] font-medium mb-2">Project Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Stripe"
                    disabled={saving}
                    className="w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3]"
                  />
                </div>

                <div>
                  <label className="block text-[#101828] text-[13px] font-medium mb-2">Link</label>
                  <input
                    type="text"
                    value={link}
                    onChange={(event) => setLink(event.target.value)}
                    placeholder="https://example.com/project"
                    disabled={saving}
                    className="w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3]"
                  />
                </div>

                <div>
                  <label className="block text-[#101828] text-[13px] font-medium mb-2">Add Skills</label>
                  <input
                    type="text"
                    value={skillsByCategory[selectedSkillCategory]}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setSkillsByCategory((current) => ({
                        ...current,
                        [selectedSkillCategory]: nextValue,
                      }));
                    }}
                    placeholder="e.g. React, Product Design, Leadership"
                    disabled={saving}
                    className="w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3]"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {SKILL_CATEGORY_OPTIONS.map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => setSelectedSkillCategory(category.value)}
                        disabled={saving}
                        className={`px-4 py-2 rounded-[8px] text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedSkillCategory === category.value
                            ? 'bg-[#FF6934] text-white'
                            : 'bg-[#FFF7EB] text-[#475467] hover:bg-[#FFEBD6]'
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                  {skillTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {skillTags.map((skill) => (
                        <span
                          key={skill}
                          className="bg-[#FFF4EC] text-[#475467] border border-[#F9E2B7] rounded-[6px] px-2.5 py-1 text-[12px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[#101828] text-[13px] font-medium mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe your key achievements and responsibilities..."
                    disabled={saving}
                    className="w-full min-h-[110px] border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3] resize-y"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-100 shrink-0">
                <button
                  onClick={() => closeModal()}
                  disabled={saving}
                  className="text-[#475467] text-[14px] font-medium px-4 py-2 hover:bg-gray-50 rounded-[8px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { void handleSubmit(); }}
                  disabled={!title.trim() || saving}
                  className="bg-[#FF6934] text-white rounded-[8px] px-5 py-2 text-[14px] font-medium transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Project'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
