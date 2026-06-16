import React, { useState, useEffect, useCallback } from 'react';
import { PlannerItemDTO } from '@/lib/types';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useAppContext } from '../AppContext';
import { useAuth } from '../auth/AuthContext';
import { savePlannerItem, deletePlannerItem, getPlannerItems } from '@/lib/api-actions';
import { Countdown } from '@/components/ui/Countdown';
import { Edit2, Check, X, Trash2 } from 'lucide-react';

interface PlannerViewProps {
  userId: string;
}

export const PlannerView: React.FC<PlannerViewProps> = ({ userId }) => {
  const { user } = useAuth();
  const { addToast } = useAppContext();
  const { isOnline, addToQueue, setCache, getCache } = useIndexedDB();
  const [items, setItems] = useState<PlannerItemDTO[]>([]);
  const [newItem, setNewItem] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PlannerItemDTO>>({});

  const fetchPlanner = useCallback(async () => {
    setIsLoading(true);

    const cached = await getCache<PlannerItemDTO[]>('planner_items');
    if (cached) setItems(cached);

    if (isOnline) {
        const data = await getPlannerItems(userId);
        if (data) {
            setItems(data);
            await setCache('planner_items', data);
        }
    }
    setIsLoading(false);
  }, [userId, isOnline, getCache, setCache]);

  useEffect(() => {
    fetchPlanner();
  }, [fetchPlanner]);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem) return;

    const payload = {
      user_id: userId,
      title: newItem,
      description: description || undefined,
      priority,
      due_date: dueDate || undefined,
      completed: false,
      created_at: new Date().toISOString()
    };

    if (isOnline) {
        try {
          await savePlannerItem(payload);
          setNewItem('');
          setDescription('');
          setPriority('medium');
          setDueDate('');
          fetchPlanner();
          addToast('Task added!', 'success');
        } catch (err) {
          console.error('Failed to add task:', err);
          addToast('Failed to add task.', 'error');
        }
    } else {
        await addToQueue('PLANNER_UPDATE', payload, user?.sessionId);
        setItems(prev => [...prev, payload as PlannerItemDTO]);
        setNewItem('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        addToast('Task queued offline.', 'info');
    }
  };

  const toggleComplete = async (item: PlannerItemDTO) => {
    const updated = { ...item, completed: !item.completed };
    if (isOnline) {
        try {
          await savePlannerItem({ id: item.id, completed: !item.completed });
          fetchPlanner();
        } catch (err) {
          console.error('Failed to toggle completion:', err);
          addToast('Failed to update task.', 'error');
        }
    } else {
        await addToQueue('PLANNER_UPDATE', updated, user?.sessionId);
        setItems(prev => prev.map(i => i.id === item.id ? updated : i));
        addToast('Change queued offline.', 'info');
    }
  };

  const deleteItem = async (id: string) => {
    if (!isOnline) {
        addToast('Cannot delete tasks while offline.', 'error');
        return;
    }
    try {
      await deletePlannerItem(id);
      fetchPlanner();
    } catch (err) {
      console.error('Failed to delete item:', err);
      addToast('Failed to delete item.', 'error');
    }
  };

  const startEditing = (item: PlannerItemDTO) => {
      setEditingId(item.id);
      setEditData({
          title: item.title,
          description: item.description,
          priority: item.priority,
          due_date: item.due_date ? item.due_date.split('T')[0] : ''
      });
  };

  const saveEdit = async () => {
      if (!editingId) return;
      try {
          await savePlannerItem({ ...editData, id: editingId });
          setEditingId(null);
          fetchPlanner();
          addToast('Task updated!', 'success');
      } catch (err) {
          console.error('Failed to update task:', err);
          addToast('Failed to update task.', 'error');
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Personal Study Planner</h2>
        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-1 rounded-full">
            {items.filter(i => !i.completed).length} Tasks Pending
        </span>
      </div>

      <form onSubmit={addItem} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="What's your next study goal?"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="flex-1 min-w-[200px] p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-white"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <textarea
          placeholder="Task description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all resize-none h-24"
        />
        <div className="flex justify-end">
          <button type="submit" className="btn-primary px-8 py-3">Add Task</button>
        </div>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading your planner...</div>
        ) : items.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {items.map(item => (
              <div key={item.id} className={`p-4 flex items-center gap-4 group hover:bg-slate-50 transition-colors ${item.completed ? 'opacity-50' : ''}`}>
                {editingId === item.id ? (
                    <div className="flex-1 space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={editData.title || ''}
                                onChange={e => setEditData({ ...editData, title: e.target.value })}
                                className="flex-1 p-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
                            />
                            <select
                                value={editData.priority}
                                onChange={e => setEditData({ ...editData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                                className="p-2 text-xs rounded-lg border border-slate-200"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <textarea
                            value={editData.description || ''}
                            onChange={e => setEditData({ ...editData, description: e.target.value })}
                            className="w-full p-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 outline-none h-16"
                        />
                        <div className="flex justify-between items-center">
                            <input
                                type="date"
                                value={editData.due_date || ''}
                                onChange={e => setEditData({ ...editData, due_date: e.target.value })}
                                className="p-2 text-xs rounded-lg border border-slate-200"
                            />
                            <div className="flex gap-2">
                                <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:text-slate-600"><X size={18} /></button>
                                <button onClick={saveEdit} className="p-2 text-green-500 hover:text-green-600"><Check size={18} /></button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleComplete(item)}
                          className="w-5 h-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1 py-1">
                          <div className="flex items-center gap-2">
                            <div className={`font-bold ${item.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>{item.title}</div>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              item.priority === 'high' ? 'bg-red-100 text-red-600' :
                              item.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {item.priority}
                            </span>
                            {!item.completed && item.due_date && (
                                <Countdown targetDate={item.due_date} compact className="text-[10px]" />
                            )}
                          </div>
                          {item.description && (
                            <div className={`text-sm mt-1 ${item.completed ? 'text-slate-400' : 'text-slate-600'}`}>{item.description}</div>
                          )}
                          {item.due_date && (
                            <div className="text-xs text-slate-500 mt-1 font-medium">Due: {new Date(item.due_date).toLocaleDateString()}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => startEditing(item)}
                              className="p-2 text-slate-400 hover:text-blue-500"
                              title="Edit task"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-2 text-slate-400 hover:text-red-500"
                              title="Delete task"
                            >
                              <Trash2 size={16} />
                            </button>
                        </div>
                    </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 italic">No tasks yet. Start planning your study schedule!</div>
        )}
      </div>
    </div>
  );
};
