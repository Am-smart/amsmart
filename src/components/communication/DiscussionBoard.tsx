import React, { useState, useEffect, useCallback } from 'react';
import { DiscussionDTO } from '@/lib/types';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import * as actions from '@/lib/api-actions';

interface DiscussionBoardProps {
  courseId?: string;
  userId: string;
}

export const DiscussionBoard: React.FC<DiscussionBoardProps> = ({ courseId, userId }) => {
  const [discussions, setDiscussions] = useState<DiscussionDTO[]>([]);
  const [message, setMessage] = useState('');

  const fetchDiscussions = useCallback(async () => {
    const data = await actions.getDiscussions(courseId || 'global');
    setDiscussions(data || []);
  }, [courseId]);

  useEffect(() => { fetchDiscussions(); }, [fetchDiscussions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      const res = await actions.saveDiscussionPost({
        course_id: courseId || undefined,
        content: message
      });
      if (res.success) {
        setMessage('');
        fetchDiscussions();
      }
    } catch (err) {
      console.error('Failed to post message:', err);
    }
  };

  const handleDelete = async (id: string) => {
      try {
        const res = await actions.deleteDiscussionPost(id);
        if (res.success) {
            fetchDiscussions();
        }
      } catch (err) {
        console.error('Failed to delete message:', err);
      }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
      <header className="p-6 border-b bg-slate-50 flex items-center gap-3">
        <MessageSquare className="text-blue-600" />
        <h3 className="font-bold text-slate-900">{courseId ? 'Course Discussion' : 'Global Discussion'}</h3>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {discussions.map(d => (
          <div key={d.id} className={`flex flex-col ${d.user_id === userId ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${d.user_id === userId ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">
                {d.user?.full_name || 'Anonymous User'}
              </div>
              <p className="text-sm leading-relaxed">{d.content}</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-400 font-medium">{new Date(d.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                {d.user_id === userId && (
                    <button onClick={() => handleDelete(d.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={12} />
                    </button>
                )}
            </div>
          </div>
        ))}
        {discussions.length === 0 && (
          <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
            No messages yet. Start the conversation!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border-t flex gap-3">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-sm"
        />
        <button type="submit" className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
