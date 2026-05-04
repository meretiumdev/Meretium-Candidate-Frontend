import { useEffect, useMemo, useState } from 'react';
import { Edit3, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import { deleteProfileProject } from '../../../services/profileApi';
import AddProjectModal, { type ProjectItem, type ProjectSkillCategory, type ProjectSkillItem } from './AddProjectModal';
import DeleteProfileItemModal from './DeleteProfileItemModal';

interface ProjectsSectionProps {
  projects: Array<Record<string, unknown>>;
  onProjectUpdated?: () => Promise<void> | void;
}

interface ToastState {
  id: number;
  message: string;
  type: 'error' | 'success';
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null) return null;
  return input as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return '';
}

function readProjectId(record: Record<string, unknown>): string | null {
  const idValue = record.id ?? record.project_id;
  if (typeof idValue === 'string' && idValue.trim().length > 0) return idValue.trim();
  if (typeof idValue === 'number' && Number.isFinite(idValue)) return String(idValue);
  return null;
}

function toMonthYear(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
}

function getDuration(record: Record<string, unknown>): string {
  const explicitDuration = readString(record, ['duration']);
  if (explicitDuration) return explicitDuration;

  const start = readString(record, ['start_date', 'startDate', 'from']);
  const end = readString(record, ['end_date', 'endDate', 'to']);

  if (!start && !end) return '';
  if (start && end) return `${toMonthYear(start)} - ${toMonthYear(end)}`;
  if (start) return toMonthYear(start);
  return toMonthYear(end);
}

function normalizeSkillCategory(input: unknown): ProjectSkillCategory {
  if (typeof input !== 'string') return 'CORE';

  const normalized = input.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (normalized === 'TOOLS') return 'TOOLS';
  if (normalized === 'SOFT_SKILLS') return 'SOFT_SKILLS';
  return 'CORE';
}

function readProjectSkills(input: unknown): ProjectSkillItem[] {
  if (!Array.isArray(input)) return [];

  const seen = new Set<string>();
  return input.reduce<ProjectSkillItem[]>((acc, item) => {
    const itemRecord = asRecord(item);
    const name = typeof item === 'string'
      ? item.trim()
      : readString(itemRecord || {}, ['name', 'skill', 'title']);

    if (!name) return acc;

    const category = normalizeSkillCategory(itemRecord?.category ?? itemRecord?.skill_category ?? itemRecord?.type);
    const key = `${category}:${name.toLowerCase()}`;
    if (seen.has(key)) return acc;
    seen.add(key);
    acc.push({ name, category });
    return acc;
  }, []);
}

function normalizeProjects(projects: Array<Record<string, unknown>>): ProjectItem[] {
  return projects.reduce<ProjectItem[]>((acc, project, index) => {
    const projectId = readProjectId(project);
    const title = readString(project, ['title', 'name', 'project_title']) || `Project ${index + 1}`;

    acc.push({
      id: projectId || `project-${index + 1}`,
      projectId,
      title,
      duration: getDuration(project),
      link: readString(project, ['link', 'url', 'project_url']),
      description: readString(project, ['description', 'summary']),
      skills: readProjectSkills(project.skills),
    });

    return acc;
  }, []);
}

export default function ProjectsSection({ projects, onProjectUpdated }: ProjectsSectionProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const normalizedProjects = useMemo(() => normalizeProjects(projects), [projects]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const openAddModal = () => {
    setEditingProject(null);
    setProjectModalOpen(true);
  };

  const openEditModal = (project: ProjectItem) => {
    setEditingProject(project);
    setProjectModalOpen(true);
  };

  const closeProjectModal = () => {
    setProjectModalOpen(false);
    setEditingProject(null);
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;

    if (!accessToken) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.', type: 'error' });
      return;
    }

    if (!deleteTarget.projectId) {
      setToast({ id: Date.now(), message: 'Project id is missing. Please refresh and try again.', type: 'error' });
      return;
    }

    setDeleting(true);
    setToast(null);

    try {
      await deleteProfileProject(accessToken, deleteTarget.projectId);
      setDeleteTarget(null);
      await onProjectUpdated?.();
      setToast({ id: Date.now(), message: 'Project deleted successfully.', type: 'success' });
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : 'Failed to delete project.';
      setToast({ id: Date.now(), message, type: 'error' });
    } finally {
      setDeleting(false);
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

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6 font-manrope transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] md:text-[20px] font-bold text-[#101828]">Projects & Portfolio</h2>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 text-[14px] font-medium text-[#475467] hover:text-gray-900 transition-colors cursor-pointer"
          >
            <Plus size={18} className="text-[#475467]" /> Add
          </button>
        </div>

        {normalizedProjects.length === 0 ? (
          <div className="bg-[#F9FAFB] border border-[#EAECF0] rounded-xl px-4 py-5">
            <p className="text-[14px] text-[#667085] font-medium">No projects added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {normalizedProjects.map((project) => (
              <div
                key={project.id}
                className="border border-gray-200 rounded-xl px-5 py-4 bg-white hover:border-[#FF6934]/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-bold text-[#101828] mb-3">{project.title}</h3>

                    {project.description && (
                      <p className="text-[13px] text-[#475467] font-medium leading-relaxed whitespace-pre-wrap max-w-[560px]">
                        {project.description}
                      </p>
                    )}

                    {/* {(project.duration || project.link) && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-[#98A2B3]">
                        {project.duration && <span>{project.duration}</span>}
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex max-w-full items-center gap-1 text-[#475467] hover:text-[#FF6934] transition-colors"
                          >
                            <span className="truncate max-w-[260px]">{project.link}</span>
                            <ExternalLink size={13} className="shrink-0" />
                          </a>
                        )}
                      </div>
                    )} */}

                    {project.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {project.skills.map((skill) => (
                          <span
                            key={`${project.id}-${skill.category}-${skill.name}`}
                            className="bg-[#F2F4F7] text-[#475467] rounded-[4px] px-2 py-0.5 text-[12px] font-medium"
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0 pt-1">
                    <button
                      className="text-[#98A2B3] hover:text-gray-600 transition-colors cursor-pointer"
                      aria-label={`Reorder ${project.title}`}
                    >
                      <GripVertical size={16} />
                    </button>
                    <button
                      onClick={() => openEditModal(project)}
                      className="text-[#475467] hover:text-gray-900 transition-colors cursor-pointer"
                      aria-label={`Edit ${project.title}`}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(project)}
                      className="text-[#F04438] hover:opacity-80 transition-opacity cursor-pointer"
                      aria-label={`Delete ${project.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddProjectModal
        isOpen={isProjectModalOpen}
        onClose={closeProjectModal}
        onProjectUpdated={onProjectUpdated}
        project={editingProject}
      />

      <DeleteProfileItemModal
        isOpen={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteProject}
        deleting={deleting}
        title="Delete project?"
        message="This project will be removed from your profile."
      />
    </>
  );
}
