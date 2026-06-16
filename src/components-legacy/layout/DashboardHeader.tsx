import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Header } from '../ui/Header';
import { useAppContext } from '../AppContext';
import { NotificationPanel } from './NotificationPanel';
import { markNotificationAsRead, markAllNotificationsAsRead, dismissNotification, acknowledgeNotification } from '@/lib/api-actions';
import { Notification, User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { parseDeepLink } from '@/lib/utils';

interface HeaderStats {
  courses: number;
  dueSoon: number;
}

interface DashboardHeaderProps {
  user: User | null;
  onLogout: () => void;
  onMenuClick: () => void;
  stats?: HeaderStats;
  className?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  onLogout,
  onMenuClick,
  stats
}) => {
  const router = useRouter();
  const { notifications } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);
      }

      const path = parseDeepLink(notification.link, user?.role);
      if (path) {
          router.push(path);
          setShowNotifications(false);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      if (user) {
        await markAllNotificationsAsRead(user.id);
      }
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  const handleDismiss = async (id: string) => {
      try {
          await dismissNotification(id);
      } catch (error) {
          console.error('Failed to dismiss notification:', error);
      }
  };

  const handleAcknowledge = async (id: string) => {
      try {
          await acknowledgeNotification(id);
      } catch (error) {
          console.error('Failed to acknowledge notification:', error);
      }
  };

  const getTitle = () => {
    if (!user) return 'Dashboard';
    if (user.role === 'student') return `Hi, ${user.full_name || 'Student'}!`;
    if (user.role === 'teacher') return 'Teacher Dashboard';
    if (user.role === 'admin') return 'Admin Dashboard';
    return 'Dashboard';
  };

  const centerContent = user?.role === 'student' && stats ? (
    <div className="hidden sm:flex gap-4 sm:gap-6 items-center">
        <div className="text-center px-2 sm:px-4 border-r border-[#e2e8f0]">
          <div className="text-[0.6rem] sm:text-[0.7rem] uppercase font-bold text-[#64748b] tracking-wider mb-0.5 sm:mb-1">Courses</div>
          <div className="text-[#1e293b] font-extrabold text-sm sm:text-lg">{stats.courses}</div>
        </div>
        <div className="text-center px-2 sm:px-4">
          <div className="text-[0.6rem] sm:text-[0.7rem] uppercase font-bold text-[#64748b] tracking-wider mb-0.5 sm:mb-1">Due Soon</div>
          <div className="text-[#ef4444] font-extrabold text-sm sm:text-lg">{stats.dueSoon}</div>
        </div>
    </div>
  ) : null;

  const rightContent = (
    <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-2xl cursor-pointer p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-[#f1f5f9] relative"
            aria-label="Notifications"
          >
            <Bell size={20} className="text-slate-600 sm:w-6 sm:h-6" />
            {unreadCount > 0 && (
              <div className="absolute top-0.5 right-0.5 bg-[#ef4444] text-white text-[8px] sm:text-[10px] font-bold min-w-[14px] sm:min-w-[18px] h-[14px] sm:h-[18px] rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </div>
            )}
          </button>
        </div>
        <button
          onClick={onLogout}
          className={`${user?.role === 'admin' ? 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]' : 'bg-[#f1f5f9] text-[#1e293b] hover:bg-[#e2e8f0]'} px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all`}
        >
          Logout
        </button>
    </div>
  );

  return (
    <>
      <Header
          title={getTitle()}
          onMenuClick={onMenuClick}
          centerContent={centerContent}
          rightContent={rightContent}
      />
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onNotificationClick={handleNotificationClick}
          onClearAll={handleClearAll}
          onDismiss={handleDismiss}
          onAcknowledge={handleAcknowledge}
        />
      )}
    </>
  );
};
