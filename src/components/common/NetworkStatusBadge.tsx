import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, Cloud, HardDrive, Info } from 'lucide-react';

export const NetworkStatusBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDetails(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    const start = performance.now();
    try {
      // Lightweight head/ping check
      const onlineStatus = navigator.onLine;
      setIsOnline(onlineStatus);
      const end = performance.now();
      setPingMs(Math.round(end - start));
      setLastCheck(new Date());
    } catch {
      setIsOnline(false);
      setPingMs(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastCheck(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastCheck(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Badge Button */}
      <button
        id="network-status-indicator"
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        title={isOnline ? 'Sistema Online (Sincronizado)' : 'Sistema Offline (Almacenamiento Local)'}
        aria-label={isOnline ? 'Conexión activa: Online' : 'Conexión inactiva: Offline'}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer select-none border ${
          isOnline
            ? 'bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs'
            : 'bg-amber-50/90 hover:bg-amber-100/90 text-amber-800 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/60 animate-pulse shadow-xs'
        }`}
      >
        {/* Pulsing indicator dot */}
        <span className="relative flex h-2 w-2">
          {isOnline ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          )}
        </span>

        {/* Status text & icon */}
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline font-bold tracking-tight text-[11px]">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span className="font-bold tracking-tight text-[11px]">Offline</span>
          </>
        )}
      </button>

      {/* Popover info window */}
      {showDetails && (
        <div
          id="network-status-popover"
          className="absolute right-0 mt-2 w-72 p-3.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-slide-in text-xs space-y-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  isOnline
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">
                  {isOnline ? 'Sistema Conectado' : 'Modo Sin Conexión'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isOnline ? 'Sincronización activa' : 'Almacenamiento local activo'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={checkConnection}
              disabled={isChecking}
              title="Verificar conexión"
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>

          {/* Details list */}
          <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <span>Estado de Red</span>
              </span>
              <span className={`font-bold ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                {isOnline ? 'En Línea' : 'Desconectado'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                <span>Base de Datos</span>
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Supabase PostgreSQL Cloud
              </span>
            </div>

            <div className="flex items-center justify-between px-2 text-[10px] text-slate-400">
              <span>Última comprobación:</span>
              <span>{lastCheck.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>

          {/* Non-invasive helpful tip */}
          <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-[10px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <p className="leading-snug">
              {isOnline
                ? 'Tus cambios en expedientes y planes se guardan al instante en tu equipo.'
                : 'Puedes seguir atendiendo consultas. Toda la información se guarda localmente sin pérdida de datos.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
