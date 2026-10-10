import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  UserCheck,
  FileText,
  Utensils,
  Camera,
  Activity,
  AlertTriangle,
  RefreshCw,
  Copy,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Sliders,
  Scale,
  Zap,
} from 'lucide-react';
import { aiService } from '../../services/aiService';
import { storageService } from '../../lib/storage';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { NutritionPlan } from '../../types';
import { NutriCopilotPlanWizardModal } from './NutriCopilotPlanWizardModal';
import { ExecutivePdfExportModal } from '../../components/ExecutivePdfExportModal';

export const NutriCopilotView: React.FC = () => {
  const { showToast } = useToast();
  const { organization, currentUser } = useAuth();
  const patients = storageService.getPatients();

  const [activeTool, setActiveTool] = useState<
    'chat' | 'draft_plan' | 'parse_24h' | 'consultation_prep' | 'labs' | 'meal_photo' | 'risk_detector'
  >('chat');

  // Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardPatientId, setWizardPatientId] = useState<string>(patients[0]?.id || '');
  const [editingPlanForPdf, setEditingPlanForPdf] = useState<NutritionPlan | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Interactive Chat State
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: '¡Hola! Soy **NutriCopilot AI**, tu asistente clínico en nutrición. Puedo ayudarte a calcular equivalentes SMAE, estructurar planes de alimentación paso a paso con bioimpedancia, interpretar laboratorios clínicos o preparar consultas.',
      time: 'Ahora',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 24H Recall Parser State
  const [recallText, setRecallText] = useState('');
  const [recallResult, setRecallResult] = useState<string | null>(null);

  // Quick Plan Generator State
  const [planPatientId, setPlanPatientId] = useState(patients[0]?.id || '');
  const [planGoal, setPlanGoal] = useState(patients[0]?.goal || '');
  const [planResult, setPlanResult] = useState<string | null>(null);

  // Lab interpreter state
  const [labInput, setLabInput] = useState('');
  const [labResult, setLabResult] = useState<string | null>(null);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const userText = chatInput.trim();
    setChatInput('');
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);

    setIsLoading(true);
    const response = await aiService.queryNutriCopilot({
      action: 'chat',
      payload: { message: userText },
    });
    setIsLoading(false);

    setMessages((prev) => [
      ...prev,
      {
        sender: 'ai',
        text: response.result,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleRun24hParse = async () => {
    setIsLoading(true);
    const response = await aiService.queryNutriCopilot({
      action: 'parse_24h_recall',
      payload: { rawText: recallText },
    });
    setIsLoading(false);
    setRecallResult(response.result);
  };

  const handleRunDraftPlan = async () => {
    setIsLoading(true);
    const patient = patients.find((p) => p.id === planPatientId) || patients[0];
    const response = await aiService.queryNutriCopilot({
      action: 'draft_plan',
      payload: {
        patientName: `${patient.firstName} ${patient.lastName}`,
        age: 28,
        gender: patient.gender,
        weight: patient.currentWeight,
        height: patient.height,
        goal: planGoal,
      },
    });
    setIsLoading(false);
    setPlanResult(response.result);
  };

  const handleRunLabAnalysis = async () => {
    setIsLoading(true);
    const response = await aiService.queryNutriCopilot({
      action: 'analyze_labs',
      payload: { labText: labInput },
    });
    setIsLoading(false);
    setLabResult(response.result);
  };

  return (
    <div id="nutricopilot-view" className="space-y-6 animate-fade-in">
      {/* Wizard Modal */}
      {isWizardOpen && (
        <NutriCopilotPlanWizardModal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          initialPatientId={wizardPatientId}
          onOpenPdfEditor={(createdPlan) => {
            setEditingPlanForPdf(createdPlan);
            setIsWizardOpen(false);
            setIsPdfModalOpen(true);
          }}
        />
      )}

      {/* Direct PDF & Colaciones Editor Modal */}
      {isPdfModalOpen && editingPlanForPdf && (
        <ExecutivePdfExportModal
          isOpen={isPdfModalOpen}
          onClose={() => {
            setIsPdfModalOpen(false);
            setEditingPlanForPdf(null);
          }}
          plan={editingPlanForPdf}
          patient={storageService.getPatientById(editingPlanForPdf.patientId) || patients[0]}
          organization={organization}
          specialist={currentUser}
          showToast={showToast}
          initialTab="editor"
          onPlanUpdate={(updated) => {
            setEditingPlanForPdf(updated);
            storageService.saveNutritionPlan(updated);
          }}
        />
      )}

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-2 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Motor Clínico Gemini 2.5 Flash • SMAE 5ta Ed.</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            NutriCopilot AI
          </h1>
          <p className="mt-1 text-emerald-100 text-xs sm:text-sm max-w-xl">
            Asistente inteligente para la práctica de la nutrición: redacción de planes por pasos, cálculo de equivalentes SMAE, bioimpedancia, análisis de R24H e interpretación de laboratorios.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => {
              setWizardPatientId(planPatientId || patients[0]?.id || '');
              setIsWizardOpen(true);
            }}
            className="px-5 py-3 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 font-extrabold text-xs shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Prescribir Plan Clínico Guiado</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'chat', label: 'Chat Clínico', icon: Bot },
          { id: 'draft_plan', label: 'Estructurador de Plan', icon: Utensils },
          { id: 'parse_24h', label: 'Analizador Recordatorio 24h', icon: FileText },
          { id: 'labs', label: 'Intérprete de Laboratorios', icon: Activity },
          { id: 'risk_detector', label: 'Detector de Riesgo / Deserción', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTool === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTool(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Mode Body */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        {/* TAB 1: CHAT INTERACTIVO */}
        {activeTool === 'chat' && (
          <div className="space-y-4">
            <div className="h-96 overflow-y-auto space-y-4 pr-2">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 text-xs ${
                    m.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl max-w-xl whitespace-pre-line leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'
                    }`}
                  >
                    {m.text}
                    <span className="block text-[9px] opacity-70 mt-1 text-right">{m.time}</span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 text-xs justify-start items-center text-slate-400">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <span className="italic">NutriCopilot está razonando...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <input
                id="nutricopilot-chat-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Pregunta sobre equivalentes SMAE, cálculo calórico, patologías o recomendaciones..."
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isLoading || !chatInput.trim()}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: DRAFT PLAN */}
        {activeTool === 'draft_plan' && (
          <div className="space-y-6 text-xs">
            {/* Promotion banner for the clinical wizard */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/60 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Asistente de Prescripción Guiada por Pasos (Recomendado)
                </h4>
                <p className="text-slate-600 dark:text-slate-300 text-xs">
                  Incluye auto-llenado desde el expediente, fórmulas (Mifflin, Cunningham, Harris), % grasa/músculo, patologías, alergias y plantillas 1-clic.
                </p>
              </div>
              <button
                onClick={() => {
                  setWizardPatientId(planPatientId);
                  setIsWizardOpen(true);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                <span>Abrir Asistente Paso a Paso</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Paciente Objetivo
                </label>
                <select
                  value={planPatientId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setPlanPatientId(newId);
                    const target = patients.find((p) => p.id === newId);
                    setPlanGoal(target?.goal || '');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.currentWeight} kg)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Meta Clínica
                </label>
                <input
                  type="text"
                  value={planGoal}
                  onChange={(e) => setPlanGoal(e.target.value)}
                  placeholder="Ej. Pérdida de grasa, ganancia muscular, control glucémico..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRunDraftPlan}
                disabled={isLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isLoading ? 'Generando Plan...' : 'Generar Propuesta Rápida'}</span>
              </button>
              <button
                onClick={() => {
                  setWizardPatientId(planPatientId);
                  setIsWizardOpen(true);
                }}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                <span>Personalizar con Bioimpedancia & Fórmulas</span>
              </button>
            </div>

            {planResult && (
              <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-200 animate-slide-in">
                {planResult}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PARSE 24H RECALL */}
        {activeTool === 'parse_24h' && (
          <div className="space-y-6 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pega el texto libre del Recordatorio de 24 Horas o notas de la consulta:
              </label>
              <textarea
                rows={5}
                value={recallText}
                onChange={(e) => setRecallText(e.target.value)}
                placeholder="Ejemplo: Desayuno: 2 huevos con 2 tortillas y café sin azúcar. Comida: 150g de pechuga con ensalada y arroz... (Escribe o pega aquí el recordatorio de 24h del paciente)"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-sans"
              />
            </div>

            <button
              onClick={handleRun24hParse}
              disabled={isLoading || !recallText.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'Analizando...' : 'Estructurar y Calcular Macros R24H'}</span>
            </button>

            {recallResult && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-200 animate-slide-in">
                {recallResult}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: LABORATORIOS */}
        {activeTool === 'labs' && (
          <div className="space-y-6 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ingresa los valores de laboratorio para interpretación nutricional:
              </label>
              <textarea
                rows={6}
                value={labInput}
                onChange={(e) => setLabInput(e.target.value)}
                placeholder="Ejemplo:&#10;Glucosa en ayuno: 95 mg/dL&#10;HbA1c: 5.4%&#10;Triglicéridos: 135 mg/dL&#10;Colesterol Total: 190 mg/dL&#10;(Pega aquí los valores de laboratorio del paciente)"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>

            <button
              onClick={handleRunLabAnalysis}
              disabled={isLoading || !labInput.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>{isLoading ? 'Interpretando...' : 'Interpretar Laboratorios con IA'}</span>
            </button>

            {labResult && (
              <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-200 animate-slide-in">
                {labResult}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DETECTOR DE RIESGO */}
        {activeTool === 'risk_detector' && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pacientes con Alerta de Deserción o Baja Adherencia</h3>
            <p className="text-slate-500">
              NutriCopilot analiza la frecuencia de registros de comida, hidratación y asistencias para predecir abandono.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {patients.filter((p) => p.riskLevel !== 'NORMAL').map((p) => (
                <div key={p.id} className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{p.firstName} {p.lastName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                      {p.riskLevel}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    • Adherencia reciente: {p.adherenceRate}%
                    <br />• Diagnóstico IA: Riesgo de abandono por falta de registros en los últimos 7 días.
                  </p>
                  <button
                    onClick={() => showToast('Mensaje preparado', `Se ha generado mensaje de reconexión por WhatsApp para ${p.firstName}`, 'success')}
                    className="mt-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Enviar Mensaje de Motivación
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
