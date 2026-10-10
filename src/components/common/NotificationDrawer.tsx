import React from 'react';
import { Bell, Check, X, ArrowRight, AlertTriangle, Calendar, Bot, CreditCard } from 'lucide-react';
import { AppNotification } from '../../types';
import { storageService } from '../../lib/storage';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (link: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  const [notifications, setNotifications] = React.useState<AppNotification[]>(() =>
    storageService.getNotifications()
  );

  if (!isOpen) return null;

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    storageService.saveNotifications(updated);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PACIENTE':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'AGENDA':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'IA':
        return <Bot className="w-4 h-4 text-purple-500" />;
      case 'PAGOS':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div
      id="notification-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-2xs"
      onClick={onClose}
    >
      <div
        id="notification-drawer"
        className="absolute top-16 right-6 w-96 max-w-[90vw] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Centro de Notificaciones</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="mark-all-read-btn"
              onClick={markAllAsRead}
              className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium"
            >
              Marcar leídas
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No tienes notificaciones pendientes</div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                id={`notif-item-${notif.id}`}
                className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                  !notif.isRead ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    {getCategoryIcon(notif.category)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{notif.title}</h4>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{notif.message}</p>
                    {notif.actionLink && (
                      <button
                        onClick={() => {
                          onNavigate(notif.actionLink!);
                          onClose();
                        }}
                        className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        Ver detalle <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
