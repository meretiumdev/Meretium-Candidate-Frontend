import { useEffect, useMemo, useState } from 'react';
import { Plus, Flame, Minus } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import { deleteProfileSkill } from '../../../services/profileApi';
import AddSkillModal from './AddSkillModal';

interface SkillsSectionProps {
  skills: unknown[];
  onSkillAdded?: () => Promise<void> | void;
}

interface SkillItem {
  id: string;
  skillId: string | null;
  name: string;
  category: string;
  hot: boolean;
  proficiencyLevel: number | null;
  progress: number;
}

interface ToastState {
  id: number;
  message: string;
}

const CATEGORY_ORDER = ['CORE', 'TOOLS', 'SOFT SKILLS'] as const;

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
  }
  return '';
}

function readNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function readBoolean(record: Record<string, unknown>, keys: string[]): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
  }
  return false;
}

function readSkillId(record: Record<string, unknown>): string | null {
  const idValue = record.id ?? record.skill_id;
  if (typeof idValue === 'string' && idValue.trim().length > 0) return idValue.trim();
  if (typeof idValue === 'number' && Number.isFinite(idValue)) return String(idValue);
  return null;
}

function normalizeCategoryLabel(raw: string): string {
  const normalized = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (normalized === 'TOOLS' || normalized === 'TOOL') return 'TOOLS';
  if (normalized === 'SOFT_SKILLS' || normalized === 'SOFTSKILLS' || normalized === 'SOFT') return 'SOFT SKILLS';
  return 'CORE';
}

function normalizeProgress(raw: number | null): number {
  if (raw === null) return 70;
  if (raw >= 1 && raw <= 5) return Math.round((raw / 5) * 100);
  if (raw >= 0 && raw <= 1) return Math.round(raw * 100);
  if (raw < 0) return 0;
  if (raw > 100) return 100;
  return Math.round(raw);
}

function normalizeProficiencyLevel(raw: number | null): number | null {
  if (raw === null) return null;
  const rounded = Math.round(raw);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

function normalizeSkills(skills: unknown[]): SkillItem[] {
  return skills.reduce<SkillItem[]>((acc, skill) => {
    if (typeof skill === 'string' && skill.trim().length > 0) {
      acc.push({
        id: skill.trim(),
        skillId: null,
        name: skill.trim(),
        category: 'CORE',
        hot: false,
        proficiencyLevel: null,
        progress: 70,
      });
      return acc;
    }

    const record = asRecord(skill);
    if (!record) return acc;

    const skillId = readSkillId(record);
    const name = readString(record, ['name', 'skill', 'title']);
    if (!name) return acc;

    const category = normalizeCategoryLabel(readString(record, ['category', 'group', 'type']) || 'CORE');
    const hot = readBoolean(record, ['hot', 'is_hot', 'featured']);
    const proficiencyLevel = normalizeProficiencyLevel(
      readNumber(record, ['proficiency_level', 'proficiencyLevel', 'level'])
    );
    const progress = normalizeProgress(
      readNumber(record, ['progress', 'proficiency', 'score']) ?? proficiencyLevel
    );

    acc.push({
      id: skillId || `${category}-${name}`,
      skillId,
      name,
      category,
      hot,
      proficiencyLevel,
      progress,
    });
    return acc;
  }, []);
}

export default function SkillsSection({ skills, onSkillAdded }: SkillsSectionProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [isModalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);

  const normalizedSkills = useMemo(() => normalizeSkills(skills), [skills]);
  const groupedSections = useMemo(() => {
    const groups = new Map<string, SkillItem[]>();
    CATEGORY_ORDER.forEach((category) => {
      groups.set(category, []);
    });

    normalizedSkills.forEach((skill) => {
      const existing = groups.get(skill.category) || [];
      existing.push(skill);
      groups.set(skill.category, existing);
    });

    return CATEGORY_ORDER.map((title) => ({
      title,
      skills: groups.get(title) || [],
    })).filter((group) => group.skills.length > 0);
  }, [normalizedSkills]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const handleDeleteSkill = async (skill: SkillItem) => {
    if (!accessToken) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.' });
      return;
    }

    if (!skill.skillId) {
      setToast({ id: Date.now(), message: 'Skill id is missing. Please refresh and try again.' });
      return;
    }

    setDeletingSkillId(skill.skillId);
    setToast(null);

    try {
      await deleteProfileSkill(accessToken, skill.skillId);
      if (onSkillAdded) {
        await onSkillAdded();
      }
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : 'Failed to delete skill.';
      setToast({ id: Date.now(), message });
    } finally {
      setDeletingSkillId(null);
    }
  };

  return (
    <>
      {toast && (
        <div
          key={toast.id}
          className="fixed top-4 right-4 z-[140] max-w-[360px] bg-[#FEF3F2] border border-[#FDA29B] text-[#B42318] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium"
        >
          {toast.message}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6 font-manrope transition-all duration-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[18px] md:text-[20px] font-bold text-[#101828]">Skills</h2>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 text-[14px] font-bold text-[#475467] hover:text-[#FF6934] transition-colors cursor-pointer"
          >
            <Plus size={18} className="text-[#475467]" /> Add skill
          </button>
        </div>

        {groupedSections.length === 0 ? (
          <div className="bg-[#F9FAFB] border border-[#EAECF0] rounded-xl px-4 py-5">
            <p className="text-[14px] text-[#667085] font-medium">No skills added yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedSections.map((section) => (
              <div key={section.title}>
                <h4 className="text-[14px] font-bold text-[#667085] uppercase tracking-wider mb-4">{section.title}</h4>
                <div className="flex flex-wrap gap-3">
                  {section.skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="bg-[#F9FAFB] border border-gray-200 rounded-xl px-4 py-3 flex flex-col gap-2.5 hover:border-[#FF6934] transition-all shadow-sm group min-w-[140px] relative"
                    >
                      <button
                        type="button"
                        onClick={() => { void handleDeleteSkill(skill); }}
                        disabled={!skill.skillId || deletingSkillId === skill.skillId}
                        className="absolute top-2 right-2 size-6 rounded-full border border-[#FECACA] bg-white text-[#F04438] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label={`Delete ${skill.name}`}
                        title={!skill.skillId ? 'Skill cannot be deleted (missing id)' : 'Delete skill'}
                      >
                        <Minus size={14} />
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-[#101828]">{skill.name}</span>
                        {(skill.proficiencyLevel === 5 || skill.hot) && (
                          <Flame size={18} strokeWidth={2.5} className="text-[#FF6934] shrink-0" />
                        )}
                      </div>
                      <div className="h-[4px] w-full bg-[#E4E7EC] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#FF6934] rounded-full transition-all duration-500"
                          style={{ width: `${skill.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <AddSkillModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSkillAdded={onSkillAdded} />
    </>
  );
}
