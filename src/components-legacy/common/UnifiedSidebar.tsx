import React from 'react';
import { Sidebar, SidebarItem } from '../ui/Sidebar';
import { UserRole } from '@/lib/types';
import {
  LayoutDashboard,
  BookOpen,
  Library,
  FileText,
  HelpCircle,
  BarChart3,
  MessageSquare,
  Calendar,
  FileCode,
  Video,
  ShieldCheck,
  Settings,
  CircleHelp,
  BookMarked,
  Users,
  RefreshCw,
  LineChart,
  Activity,
  Info
} from 'lucide-react';

interface UnifiedSidebarProps {
  role: UserRole;
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({ role, activePage, onNavigate, isOpen, onClose }) => {
  const normalizedActivePage = activePage === role ? 'dashboard' : activePage.split('/')[0];

  const studentItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'courses', label: 'Course Catalog', icon: <BookOpen size={20} /> },
    { id: 'my-courses', label: 'My Courses', icon: <Library size={20} /> },
    { id: 'assignments', label: 'Assignments', icon: <FileText size={20} /> },
    { id: 'quizzes', label: 'Quizzes', icon: <HelpCircle size={20} /> },
    { id: 'grades', label: 'Grades', icon: <BookMarked size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'discussions', label: 'Discussions', icon: <MessageSquare size={20} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
    { id: 'materials', label: 'Materials', icon: <FileCode size={20} /> },
    { id: 'planner', label: 'Planner', icon: <Calendar size={20} /> },
    { id: 'live', label: 'Live Classes', icon: <Video size={20} /> },
    { id: 'anti-cheat', label: 'Anti-Cheat', icon: <ShieldCheck size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
    { id: 'help', label: 'Help', icon: <CircleHelp size={20} /> },
  ];

  const teacherItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen size={20} /> },
    { id: 'materials', label: 'Materials', icon: <FileCode size={20} /> },
    { id: 'assignments', label: 'Assignments', icon: <FileText size={20} /> },
    { id: 'grading', label: 'Grading Queue', icon: <BarChart3 size={20} /> },
    { id: 'gradebook', label: 'Grade Book', icon: <BookMarked size={20} /> },
    { id: 'students', label: 'Students', icon: <Users size={20} /> },
    { id: 'discussions', label: 'Discussions', icon: <MessageSquare size={20} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
    { id: 'quizzes', label: 'Quizzes', icon: <HelpCircle size={20} /> },
    { id: 'help', label: 'Help', icon: <CircleHelp size={20} /> },
    { id: 'live', label: 'Live Classes', icon: <Video size={20} /> },
    { id: 'anti-cheat', label: 'Anti-Cheat', icon: <ShieldCheck size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const adminItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={20} /> },
    { id: 'resets', label: 'Password Resets', icon: <RefreshCw size={20} /> },
    { id: 'users', label: 'Users', icon: <Users size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <LineChart size={20} /> },
    { id: 'maintenance', label: 'System & Admin Control', icon: <ShieldCheck size={20} /> },
    { id: 'health', label: 'System Health', icon: <Activity size={20} /> },
    { id: 'management', label: 'System Management', icon: <Settings size={20} /> },
    { id: 'settings', label: 'Admin Settings', icon: <Settings size={20} /> },
    { id: 'help', label: 'Help', icon: <CircleHelp size={20} /> },
    { id: 'system', label: 'System Info', icon: <Info size={20} /> },
  ];

  let items: SidebarItem[] = [];
  let title = 'SmartLMS';

  if (role === 'admin') {
    items = adminItems;
    title = 'SmartLMS Admin';
  } else if (role === 'teacher') {
    items = teacherItems;
  } else {
    items = studentItems;
  }

  return (
    <Sidebar
      title={title}
      activePage={normalizedActivePage}
      onNavigate={onNavigate}
      isOpen={isOpen}
      onClose={onClose}
      items={items}
    />
  );
};
