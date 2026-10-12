import React, { useState, useMemo } from 'react';
import { MessageSquare, Send, Phone, Search, CheckCheck, Users, Sparkles } from 'lucide-react';
import { storageService } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage } from '../../types';

export const ChatView: React.FC = () => {
  const { currentUser } = useAuth();
  const patients = storageService.getPatients();
  const [activePatientId, setActivePatientId] = useState(patients[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [allMessages, setAllMessages] = useState<ChatMessage[]>(() => storageService.getMessages());
  const [input, setInput] = useState('');

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter((p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.phone?.includes(term)
    );
  }, [patients, searchTerm]);

  const activePatient = patients.find((p) => p.id === activePatientId) || patients[0];

  const currentConversationMessages = useMemo(() => {
    if (!activePatient) return [];
    return allMessages.filter(
      (m) => m.conversationId === activePatient.id || m.senderId === activePatient.id
    );
  }, [allMessages, activePatient]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || !activePatient) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: activePatient.id,
      senderId: currentUser?.id || 'user-lic-luz-elena',
      senderName: `${currentUser?.firstName || 'Luz Elena'} ${currentUser?.lastName || 'Alcocer'}`.trim(),
      senderRole: 'NUTRIOLOGO',
      content: text,
      isRead: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [...allMessages, newMsg];
    setAllMessages(updated);
    storageService.saveMessages(updated);
    setInput('');
  };

  const getLastMessage = (patientId: string) => {
    const pMsgs = allMessages.filter(
      (m) => m.conversationId === patientId || m.senderId === patientId
    );
    return pMsgs[pMsgs.length - 1];
  };

  if (patients.length === 0) {
    return (
      <div id="chat-view" className="h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xs text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          No hay pacientes registrados aún
        </h2>
        <p className="text-xs text-slate-500 max-w-md">
          Para iniciar conversaciones y dar seguimiento por chat, registra tu primer paciente desde el módulo de Pacientes.
        </p>
      </div>
    );
  }

  return (
    <div id="chat-view" className="h-[calc(100vh-140px)] flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs animate-fade-in">
      {/* Patient List Sidebar */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Conversaciones</h2>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {patients.length} {patients.length === 1 ? 'paciente' : 'pacientes'}
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar paciente..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {filteredPatients.map((p) => {
            const lastMsg = getLastMessage(p.id);
            const isSelected = activePatient?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setActivePatientId(p.id)}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-600'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {p.firstName?.charAt(0)}{p.lastName?.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {p.firstName} {p.lastName}
                    </span>
                    {lastMsg && (
                      <span className="text-[10px] text-slate-400">
                        {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {lastMsg ? lastMsg.content : 'Sin mensajes aún'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      {activePatient ? (
        <div className="flex-1 flex flex-col justify-between bg-white dark:bg-slate-900">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activePatient.photoUrl ? (
                <img src={activePatient.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                  {activePatient.firstName?.charAt(0)}{activePatient.lastName?.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {activePatient.firstName} {activePatient.lastName}
                </h3>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Paciente Activo
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(activePatient.whatsapp || activePatient.phone) && (
                <a
                  href={`https://wa.me/${(activePatient.whatsapp || activePatient.phone || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {currentConversationMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No hay mensajes previos en esta conversación
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Escribe un mensaje abajo para dar indicaciones, resolver dudas o enviar sugerencias a {activePatient.firstName}.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center max-w-md pt-2">
                  <button
                    type="button"
                    onClick={() => handleSend(`¡Hola ${activePatient.firstName}! ¿Cómo te has sentido con tu plan nutricional esta semana?`)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-slate-200 dark:border-slate-700 text-[11px] rounded-xl text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Preguntar por adherencia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend(`¡Hola ${activePatient.firstName}! Recuerda registrar tu consumo de agua y comidas en tu portal.`)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-slate-200 dark:border-slate-700 text-[11px] rounded-xl text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Recordatorio de registro</span>
                  </button>
                </div>
              </div>
            ) : (
              currentConversationMessages.map((m) => {
                const isDoctor = m.senderRole === 'NUTRIOLOGO' || m.senderId?.includes('user');
                return (
                  <div
                    key={m.id}
                    className={`flex gap-2 text-xs ${isDoctor ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`p-3.5 rounded-2xl max-w-md shadow-xs ${
                        isDoctor
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-line">{m.content}</p>
                      <div className="flex items-center justify-end gap-1 text-[9px] opacity-75 mt-1">
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isDoctor && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Bar */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Escribe un mensaje para ${activePatient.firstName}...`}
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
};
