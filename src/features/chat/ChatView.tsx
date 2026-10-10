import React, { useState } from 'react';
import { MessageSquare, Send, Paperclip, Phone, Video, Search, CheckCheck } from 'lucide-react';
import { storageService } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';

export const ChatView: React.FC = () => {
  const { currentUser } = useAuth();
  const patients = storageService.getPatients();
  const [activePatientId, setActivePatientId] = useState(patients[0]?.id || '');
  const activePatient = patients.find((p) => p.id === activePatientId) || patients[0];

  const [messages, setMessages] = useState([
    { id: '1', sender: 'patient', text: 'Hola Lic. Sofía, ¿puedo sustituir las almendras por nueces en la colación?', time: '09:15' },
    { id: '2', sender: 'doctor', text: '¡Hola Ana! Sí, claro, 3 nueces enteras equivalen a las 10 almendras (ambos son 1 equivalente de aceites y grasas con proteína del SMAE).', time: '09:20' },
    { id: '3', sender: 'patient', text: '¡Perfecto! Ya registré mi comida de hoy en la app.', time: '09:22' },
  ]);

  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'doctor',
        text: input.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInput('');
  };

  return (
    <div id="chat-view" className="h-[calc(100vh-140px)] flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs animate-fade-in">
      {/* Patient List Sidebar */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Conversaciones</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {patients.map((p) => (
            <div
              key={p.id}
              onClick={() => setActivePatientId(p.id)}
              className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                activePatientId === p.id
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-600'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <img src={p.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{p.firstName} {p.lastName}</span>
                  <span className="text-[10px] text-slate-400">09:22</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">Ya registré mi comida de hoy...</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col justify-between bg-white dark:bg-slate-900">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={activePatient.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{activePatient.firstName} {activePatient.lastName}</h3>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">● En línea en App Paciente</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activePatient.whatsapp && (
              <a
                href={`https://wa.me/${activePatient.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-300"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
              </a>
            )}
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2 text-xs ${m.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`p-3.5 rounded-2xl max-w-md ${
                  m.sender === 'doctor'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'
                }`}
              >
                <p className="leading-relaxed">{m.text}</p>
                <div className="flex items-center justify-end gap-1 text-[9px] opacity-75 mt-1">
                  <span>{m.time}</span>
                  {m.sender === 'doctor' && <CheckCheck className="w-3 h-3" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Escribe un mensaje para ${activePatient.firstName}...`}
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
          />
          <button
            type="submit"
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
