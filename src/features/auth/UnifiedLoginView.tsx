import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Salad,
  Sparkles,
  AlertCircle,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { NutriluzLogo, NutriluzEmblem } from '../../components/common/NutriluzLogo';
import { storageService } from '../../lib/storage';

interface UnifiedLoginViewProps {
  onSuccess?: (role: 'NUTRIOLOGO' | 'PACIENTE') => void;
}

export const UnifiedLoginView: React.FC<UnifiedLoginViewProps> = ({ onSuccess }) => {
  const { loginUnified, organization } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMessage('Por favor ingresa tu correo, usuario o teléfono.');
      return;
    }
    if (!cleanPass) {
      setErrorMessage('Por favor ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = loginUnified(cleanId, cleanPass);
      setIsLoading(false);

      if (result.success) {
        if (result.role === 'NUTRIOLOGO') {
          showToast(
            '¡Bienvenida, Lic. Luz Elena Alcocer!',
            'Has iniciado sesión en tu panel clínico y prescripción.',
            'success'
          );
        } else if (result.role === 'PACIENTE' && result.patient) {
          showToast(
            `¡Bienvenido(a), ${result.patient.firstName}!`,
            'Has ingresado a tu portal de paciente, plan y SMAE.',
            'success'
          );
        }
        if (onSuccess && result.role) {
          onSuccess(result.role);
        }
      } else {
        const errorMsg =
          result.error ||
          'Credenciales no reconocidas. Si eres paciente, consulta con tu nutrióloga tus accesos. Si eres especialista, verifica tu correo y contraseña.';
        setErrorMessage(errorMsg);
        showToast('Acceso Denegado', errorMsg, 'error');
      }
    }, 280);
  };

  return (
    <div
      id="unified-login-page"
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 selection:bg-emerald-500 selection:text-white"
    >
      {/* Decorative ambient background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10 animate-fade-in">
        {/* Official Clinic Brand Header */}
        <div className="text-center space-y-3">
          {organization?.logoUrl ? (
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white p-2.5 shadow-2xl shadow-black/50 ring-4 ring-emerald-500/30 flex items-center justify-center overflow-hidden mx-auto transition-transform hover:scale-105">
              <img
                src={organization.logoUrl}
                alt={organization.name || 'Nutri Luz Elena'}
                className="w-full h-full object-contain filter drop-shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-3 shadow-xl shadow-emerald-950/40 ring-4 ring-emerald-500/20 flex items-center justify-center mx-auto">
              <NutriluzEmblem sizePx={80} />
            </div>
          )}

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {organization?.name || 'Nutri Luz Elena'}
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Plataforma de Consulta Clínica, Planes SMAE y Portal del Paciente
            </p>
          </div>
        </div>

        {/* Unified Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white leading-tight">Inicio de Sesión Único</h2>
                <p className="text-[10px] text-slate-400">Nutrióloga & Pacientes</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
              Acceso Seguro
            </span>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">No pudimos iniciar sesión</span>
                <span className="text-rose-300/90 leading-relaxed text-[11px]">{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Single Unified Identifier Field */}
            <div>
              <label
                htmlFor="unified-identifier-input"
                className="block text-xs font-bold text-slate-300 mb-1.5"
              >
                Usuario, Correo o Teléfono
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="unified-identifier-input"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ej. luzelenaalcocer14@gmail.com o tu usuario"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Ingresa tus credenciales clínicas o las asignadas a tu expediente.
              </span>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="unified-password-input"
                  className="block text-xs font-bold text-slate-300"
                >
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="unified-password-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce tu contraseña"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-0.5"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember session checkbox */}
            <div className="flex items-center text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700"
                />
                <span className="text-slate-400 text-[11px]">Recordar sesión activa</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="unified-login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-98 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security & Regulatory Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-slate-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>NOM-004-SSA3-2012 Expediente Clínico</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Salad className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sistema Mexicano de Alimentos Equivalentes (SMAE)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
