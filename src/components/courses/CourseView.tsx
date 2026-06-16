import React, { useState, useEffect } from 'react';
import { CourseDTO, LessonDTO } from '@/lib/types';
import { ArrowLeft, BookOpen, Video, FileText, ChevronRight, CheckCircle } from 'lucide-react';
import { markLessonComplete, getLessonCompletions } from '@/lib/api-actions';
import { useAppContext } from '@/components/AppContext';
import { useAuth } from '@/components/auth/AuthContext';

interface CourseViewProps {
    course: CourseDTO;
    lessons: LessonDTO[];
    onBack: () => void;
}

export const CourseView: React.FC<CourseViewProps> = ({ course, lessons, onBack }) => {
    const { addToast } = useAppContext();
    const { user } = useAuth();
    const [activeLesson, setActiveLesson] = useState<LessonDTO | null>(null);
    const [completions, setCompletions] = useState<string[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showLessonDetails, setShowLessonDetails] = useState(false);

    useEffect(() => {
        const fetchCompletions = async () => {
            if (user) {
                const data = await getLessonCompletions(user.id);
                if (data) setCompletions((data).map((c) => (c.lesson_id as string)));
            }
        };
        fetchCompletions();
    }, [user]);

    useEffect(() => {
        if (lessons.length > 0 && !activeLesson) {
            const params = new URLSearchParams(window.location.search);
            const lessonId = params.get('lessonId');
            if (lessonId) {
                const lesson = lessons.find(l => l.id === lessonId);
                if (lesson) {
                    setActiveLesson(lesson);
                } else {
                    setActiveLesson(lessons[0]);
                }
            } else {
                setActiveLesson(lessons[0]);
            }
        }
    }, [lessons, activeLesson]);

    const handleMarkComplete = async () => {
        if (!activeLesson || isUpdating) return;
        setIsUpdating(true);
        try {
            await markLessonComplete(activeLesson.id, course.id);
            setCompletions(prev => [...prev, activeLesson.id]);
            addToast('Lesson marked as complete!', 'success');
        } catch (err) {
            console.error('Failed to mark lesson complete:', err);
            addToast('Failed to mark lesson complete.', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const getEmbedUrl = (url?: string) => {
        if (!url) return null;
        try {
            const videoId = url.includes('v=')
                ? url.split('v=')[1].split('&')[0]
                : url.split('/').pop();
            return `https://www.youtube.com/embed/${videoId}`;
        } catch {
            return url;
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden rounded-3xl border border-slate-100">
            <header className="bg-white p-6 border-b flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"><ArrowLeft size={20} /></button>
                    <div>
                        <h2 className="text-base md:text-xl font-bold text-slate-900 line-clamp-1">{course.title}</h2>
                        <p className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wider">
                            {lessons.length} Lessons available • BY {course.created_by || 'Unknown Instructor'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowLessonDetails(true)}
                    className="lg:hidden p-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-wider border border-blue-100"
                >
                    Lessons
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar: Lesson List */}
                <aside className="w-80 bg-white border-r overflow-y-auto hidden lg:block">
                    <div className="p-4 space-y-2">
                        {lessons.map((lesson, idx) => (
                            <button
                                key={lesson.id}
                                onClick={() => setActiveLesson(lesson)}
                                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left ${activeLesson?.id === lesson.id ? 'bg-blue-50 border-2 border-blue-100' : 'hover:bg-slate-50 border-2 border-transparent'}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${activeLesson?.id === lesson.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className={`text-sm font-bold ${activeLesson?.id === lesson.id ? 'text-blue-900' : 'text-slate-700'}`}>{lesson.title}</h4>
                                        {completions.includes(lesson.id) && <CheckCircle size={14} className="text-green-500" />}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        {lesson.video_url ? <Video size={10} className="text-slate-400" /> : <FileText size={10} className="text-slate-400" />}
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">{lesson.video_url ? 'Video' : 'Reading'}</span>
                                    </div>
                                </div>
                                <ChevronRight size={14} className={activeLesson?.id === lesson.id ? 'text-blue-400' : 'text-slate-300'} />
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
                    {activeLesson ? (
                        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {activeLesson.video_url && getEmbedUrl(activeLesson.video_url) && (
                                <div className="aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                                    <iframe
                                        src={getEmbedUrl(activeLesson.video_url) || ''}
                                        className="w-full h-full"
                                        allowFullScreen
                                        title="Lesson Video"
                                    />
                                </div>
                            )}

                            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-900">{activeLesson.title}</h1>
                                    {!completions.includes(activeLesson.id) ? (
                                        <button
                                            onClick={handleMarkComplete}
                                            disabled={isUpdating}
                                            className="btn-primary py-2 px-6 text-xs flex items-center gap-2"
                                        >
                                            <CheckCircle size={16} /> Mark as Complete
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 text-green-600 font-bold text-xs bg-green-50 px-4 py-2 rounded-full border border-green-100">
                                            <CheckCircle size={16} /> COMPLETED
                                        </div>
                                    )}
                                </div>
                                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
                                    {activeLesson.content}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-8 border-t border-slate-200">
                                <button
                                    disabled={!activeLesson || lessons.findIndex(l => l.id === activeLesson.id) <= 0}
                                    onClick={() => {
                                        if (!activeLesson) return;
                                        const idx = lessons.findIndex(l => l.id === activeLesson.id);
                                        if (idx > 0 && idx < lessons.length) {
                                            setActiveLesson(lessons[idx - 1]);
                                        }
                                    }}
                                    className="btn-secondary px-8 py-3 text-xs disabled:opacity-30"
                                >
                                    Previous Lesson
                                </button>
                                <button
                                    disabled={!activeLesson || lessons.findIndex(l => l.id === activeLesson.id) === -1 || lessons.findIndex(l => l.id === activeLesson.id) >= lessons.length - 1}
                                    onClick={() => {
                                        if (!activeLesson) return;
                                        const idx = lessons.findIndex(l => l.id === activeLesson.id);
                                        if (idx !== -1 && idx < lessons.length - 1) {
                                            setActiveLesson(lessons[idx + 1]);
                                        }
                                    }}
                                    className="btn-primary px-8 py-3 text-xs disabled:opacity-30"
                                >
                                    Next Lesson
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-6">
                                <BookOpen size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">No lessons found</h3>
                            <p className="text-slate-500 mt-2 font-medium">This course doesn&apos;t have any content yet.</p>
                        </div>
                    )}
                </main>
            </div>

            {showLessonDetails && (
                <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in duration-300">
                        <header className="p-6 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Course Lessons</h3>
                            <button onClick={() => setShowLessonDetails(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </header>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {lessons.map((lesson, idx) => (
                                <button
                                    key={lesson.id}
                                    onClick={() => {
                                        setActiveLesson(lesson);
                                        setShowLessonDetails(false);
                                    }}
                                    className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left ${activeLesson?.id === lesson.id ? 'bg-blue-50 border-2 border-blue-100' : 'hover:bg-slate-50 border-2 border-transparent'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${activeLesson?.id === lesson.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`text-sm font-bold truncate ${activeLesson?.id === lesson.id ? 'text-blue-900' : 'text-slate-700'}`}>{lesson.title}</h4>
                                            {completions.includes(lesson.id) && <CheckCircle size={14} className="text-green-500 shrink-0" />}
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className={activeLesson?.id === lesson.id ? 'text-blue-400' : 'text-slate-300'} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
