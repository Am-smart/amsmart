import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Crown, Users } from 'lucide-react';
import { getEnrollments } from '@/lib/api-actions';
import type { AssignmentGroup, EnrollmentDTO } from '@/lib/types';

interface GroupBuilderProps {
  courseId: string;
  groups: AssignmentGroup[];
  onChange: (groups: AssignmentGroup[]) => void;
}

const newGroupId = () => `grp-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Teacher-facing group builder for group assignments. Membership is drawn from
 * the enrolled students of the selected course, a student can only sit in one
 * group, and one member per group can be marked as leader.
 */
export const GroupBuilder: React.FC<GroupBuilderProps> = ({ courseId, groups, onChange }) => {
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!courseId) {
      setEnrollments([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getEnrollments(undefined, [courseId])
      .then((rows) => {
        if (!cancelled) setEnrollments(rows || []);
      })
      .catch((err) => console.error('Failed to load course roster:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const roster = useMemo(
    () =>
      enrollments.map((e) => ({
        id: e.student_id,
        name: e.student?.full_name || e.student?.email || e.student_id,
      })),
    [enrollments],
  );

  const assignedElsewhere = useCallback(
    (studentId: string, groupId: string) =>
      groups.some((g) => g.id !== groupId && g.member_ids.includes(studentId)),
    [groups],
  );

  const updateGroup = (groupId: string, patch: Partial<AssignmentGroup>) => {
    onChange(groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)));
  };

  const toggleMember = (group: AssignmentGroup, studentId: string) => {
    const isMember = group.member_ids.includes(studentId);
    const member_ids = isMember
      ? group.member_ids.filter((id) => id !== studentId)
      : [...group.member_ids, studentId];
    const leader_id = group.leader_id && !member_ids.includes(group.leader_id) ? null : group.leader_id;
    updateGroup(group.id, { member_ids, leader_id });
  };

  const addGroup = () => {
    onChange([
      ...groups,
      { id: newGroupId(), name: `Group ${groups.length + 1}`, member_ids: [], leader_id: null },
    ]);
  };

  const unassigned = roster.filter((s) => !groups.some((g) => g.member_ids.includes(s.id)));

  return (
    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
            <Users size={16} /> Groups
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Only members of a group can open, submit, and follow up on this assignment.
          </p>
        </div>
        <button
          type="button"
          onClick={addGroup}
          className="flex items-center gap-2 self-start text-[10px] font-bold uppercase tracking-widest bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} /> Add Group
        </button>
      </div>

      {!courseId && <p className="text-sm text-slate-500 italic">Pick a course first to load its students.</p>}
      {courseId && loading && <p className="text-sm text-slate-500 animate-pulse">Loading students…</p>}
      {courseId && !loading && roster.length === 0 && (
        <p className="text-sm text-amber-600">No students are enrolled in this course yet.</p>
      )}

      {groups.length === 0 ? (
        <p className="text-sm text-slate-500 italic">No groups yet — add at least one group.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.id} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  value={group.name}
                  onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                  placeholder="Group name"
                  className="flex-1 p-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none font-bold text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => onChange(groups.filter((g) => g.id !== group.id))}
                  className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  aria-label={`Remove ${group.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roster.map((student) => {
                  const checked = group.member_ids.includes(student.id);
                  const blocked = !checked && assignedElsewhere(student.id, group.id);
                  return (
                    <label
                      key={student.id}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                        checked
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : blocked
                            ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 cursor-pointer'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          className="accent-blue-600"
                          checked={checked}
                          disabled={blocked}
                          onChange={() => toggleMember(group, student.id)}
                        />
                        <span className="truncate">{student.name}</span>
                      </span>
                      {checked && (
                        <button
                          type="button"
                          onClick={() =>
                            updateGroup(group.id, {
                              leader_id: group.leader_id === student.id ? null : student.id,
                            })
                          }
                          title={group.leader_id === student.id ? 'Remove as leader' : 'Make leader'}
                          className={`p-1 rounded-lg transition-colors ${
                            group.leader_id === student.id
                              ? 'text-amber-500 bg-amber-50'
                              : 'text-slate-300 hover:text-amber-500'
                          }`}
                        >
                          <Crown size={14} />
                        </button>
                      )}
                    </label>
                  );
                })}
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {group.member_ids.length} member{group.member_ids.length === 1 ? '' : 's'}
                {group.leader_id
                  ? ` · leader: ${roster.find((s) => s.id === group.leader_id)?.name || 'unknown'}`
                  : ' · no leader set'}
              </p>
            </div>
          ))}
        </div>
      )}

      {groups.length > 0 && unassigned.length > 0 && (
        <p className="text-xs text-amber-600">
          {unassigned.length} enrolled student{unassigned.length === 1 ? '' : 's'} not in any group — they won't see this
          assignment.
        </p>
      )}
    </div>
  );
};
