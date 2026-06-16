"use client";

import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Notification } from '@/lib/types';
import { X, CheckCircle2, AlertCircle, Info, Bell, Trash2, Filter, Eye, Check } from 'lucide-react';
import * as actions from '@/lib/api-actions';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onNotificationClick: (notification: Notification) => Promise<void>;
  onClearAll?: () => Promise<void>;
  onDismiss?: (id: string) => Promise<void>;
  onAcknowledge?: (id: string) => Promise<void>;
}

// Get icon based on notification type
const getNotificationIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'success':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'error':
    case 'alert':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'broadcast':
        return <Bell className="w-5 h-5 text-orange-500" />;
    case 'grading':
        return <CheckCircle2 className="w-5 h-5 text-purple-500" />;
    case 'info':
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

export const NotificationPanel: React.FC<NotificationPanelProps> = memo(({
  notifications,
  onClose,
  onNotificationClick,
  onClearAll,
  onDismiss,
  onAcknowledge,
}) => {
  const [isNavigating, setIsNavigating] = useState(false);

  // Track viewed notifications
  useEffect(() => {
      const markAsViewed = async () => {
          const unviewedIds = notifications.filter(n => !n.viewed_at).map(n => n.id);
          if (unviewedIds.length > 0) {
              try {
                  await actions.markNotificationsAsViewed(unviewedIds);
              } catch (error) {
                  console.error('Failed to mark notifications as viewed:', error);
              }
          }
      };

      if (notifications.length > 0) {
          markAsViewed();
      }
  }, [notifications]);

  const [filter, setFilter] = useState<'all' | 'unread' | 'system' | 'academic'>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  // Grouping logic
  const groupedNotifications = useMemo(() => {
    const filtered = notifications.filter(n => {
      if (filter === 'unread') return !n.is_read;
      if (filter === 'system') return n.type === 'system' || n.type === 'broadcast';
      if (filter === 'academic') return ['enrollment', 'assignment', 'quiz', 'grading', 'lesson', 'assignment_published', 'quiz_published', 'live_class', 'class_ended'].includes(n.type);
      return true;
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { title: string; items: Notification[] }[] = [
      { title: 'Today', items: [] },
      { title: 'Yesterday', items: [] },
      { title: 'Earlier', items: [] },
    ];

    filtered.forEach(n => {
      const date = new Date(n.created_at);
      if (date >= today) groups[0].items.push(n);
      else if (date >= yesterday) groups[1].items.push(n);
      else groups[2].items.push(n);
    });

    return groups.filter(g => g.items.length > 0);
  }, [notifications, filter]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      setIsNavigating(true);

      // Track engagement
      await actions.createSystemLog({
          level: 'info',
          category: 'engagement',
          message: `Notification clicked: ${notification.title}`,
          metadata: { notification_id: notification.id, link: notification.link }
      });

      // Call the callback to mark as read or perform other actions
      // DashboardHeader handles navigation and marking as read
      await onNotificationClick(notification);
    } catch (error) {
      console.error('Failed to handle notification click:', error);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (onDismiss) await onDismiss(id);
  };

  const handleAcknowledge = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (onAcknowledge) await onAcknowledge(id);
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 md:top-16 right-0 w-full md:max-w-md h-full md:h-auto bg-white shadow-2xl z-50 md:rounded-bl-3xl max-h-[100dvh] md:max-h-[calc(100vh-80px)] flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden"
      >
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between rounded-t-3xl md:rounded-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Bell size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Activity</h3>
          </div>
          <div className="flex items-center gap-2">
             {onClearAll && notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Clear all notifications"
                >
                  <Trash2 size={20} />
                </button>
              )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
              aria-label="Close notifications"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="shrink-0 px-6 py-3 bg-slate-50/50 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-100">
          <Filter size={14} className="text-slate-400 mr-1 shrink-0" />
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'academic', label: 'Academic' },
            { id: 'system', label: 'System' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as 'all' | 'unread' | 'system' | 'academic')}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                filter === f.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto bg-white p-2">
          {groupedNotifications.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Bell size={32} />
              </div>
              <div>
                <p className="text-slate-900 font-bold">All caught up!</p>
                <p className="text-slate-500 text-xs mt-1">No new notifications in this category.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              {groupedNotifications.map((group) => (
                <div key={group.title} className="space-y-2">
                  <h4 className="px-4 pt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {group.title}
                  </h4>
                  <div className="space-y-1">
                    {group.items.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        disabled={isNavigating}
                        className={`w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden ${
                          !notification.is_read
                            ? 'bg-blue-50/50 hover:bg-blue-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex gap-4">
                          {/* Icon */}
                          <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                             !!notification.broadcast_id || notification.type === 'broadcast'
                                ? 'bg-orange-50'
                                : !notification.is_read ? 'bg-white shadow-sm' : 'bg-slate-100'
                          }`}>
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 py-0.5">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className={`font-bold text-sm mb-1 truncate ${
                                !notification.is_read ? 'text-slate-900' : 'text-slate-600'
                              }`}>
                                {notification.title}
                              </h4>
                              <span className="shrink-0 text-[10px] font-medium text-slate-400">
                                {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                              {notification.message}
                            </p>
                          </div>

                          {/* Unread indicator */}
                          {!notification.is_read && (
                            <div className="shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute right-4 bottom-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.acknowledged_at && (
                                <button
                                    onClick={(e) => handleAcknowledge(e, notification.id)}
                                    className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                    title="Acknowledge"
                                >
                                    <Check size={14} />
                                </button>
                            )}
                            <button
                                onClick={(e) => handleDismiss(e, notification.id)}
                                className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                                title="Dismiss"
                            >
                                <Eye size={14} />
                            </button>
                        </div>

                        {/* Deep link indicator */}
                        {notification.link && (
                          <div className="mt-3 ml-16 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            View details
                            <span className="text-base leading-none">→</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl md:rounded-none">
          <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
            {notifications.filter(n => !n.is_read).length} Unread Notifications
          </p>
        </div>
      </div>
    </>
  );
});

NotificationPanel.displayName = 'NotificationPanel';
