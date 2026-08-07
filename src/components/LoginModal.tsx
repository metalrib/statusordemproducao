import React, { useState } from 'react';
import { Shield, Lock, Factory, ClipboardList, KeyRound } from 'lucide-react';
import { Role } from '../types';
import { CREDS } from '../constants';

interface LoginModalProps {
  onLogin: (role: Role) => void;
  darkMode: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, darkMode }) => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedRole) {
      setError('Selecione um perfil de acesso.');
      return;
    }

    if (password === CREDS[selectedRole]) {
      onLogin(selectedRole);
    } else {
      setError('Senha incorreta. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all animate-fade-in">
        {/* Header Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-center text-white relative">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-2xl font-black">
            M
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">METALRIB</h1>
          <p className="text-xs text-blue-200 uppercase tracking-widest mt-0.5">
            Portas Frigoríficas & Sistemas PCP
          </p>
          <div className="inline-block mt-3 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[11px] font-semibold text-blue-100">
            Acompanhamento de Ordens & Prazos
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleLogin} className="p-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
            Selecione seu Perfil de Acesso
          </label>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* PCP Role */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole('pcp');
                setError('');
              }}
              className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                selectedRole === 'pcp'
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <ClipboardList className={`w-7 h-7 ${selectedRole === 'pcp' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`} />
              <div className="font-extrabold text-sm">PCP</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Planejamento & Nomus
              </div>
            </button>

            {/* Produção Role */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole('producao');
                setError('');
              }}
              className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                selectedRole === 'producao'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <Factory className={`w-7 h-7 ${selectedRole === 'producao' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`} />
              <div className="font-extrabold text-sm">Eduardo</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Supervisão de Fábrica
              </div>
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Senha de Acesso
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Digite a senha..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            {error && (
              <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!selectedRole}
            className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg cursor-pointer ${
              selectedRole
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            ENTRAR NO SISTEMA
          </button>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
            <span>Credenciais padrão:</span>
            <span className="font-mono text-slate-500 dark:text-slate-400">
              PCP: <strong className="text-slate-700 dark:text-slate-200">pcp01</strong> | Eduardo: <strong className="text-slate-700 dark:text-slate-200">metalrib01</strong>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
