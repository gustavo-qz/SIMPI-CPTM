'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, UserCheck, AlertCircle, KeyRound, Mail, Building2 } from 'lucide-react';

interface QuickUser {
  nome: string;
  perfil: string;
  email: string;
  unidade: string;
  badgeColor: string;
}

const QUICK_USERS: QuickUser[] = [
  {
    nome: 'Carlos (Solicitante)',
    perfil: 'SOLICITANTE',
    email: 'solicitante@simpi.gov.br',
    unidade: 'Sede Gabinete',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    nome: 'Ana (DFAS / Patrimônio)',
    perfil: 'PATRIMONIO',
    email: 'patrimonio@simpi.gov.br',
    unidade: 'Núcleo de Patrimônio',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    nome: 'Roberto (Gestor Origem)',
    perfil: 'ORIGEM',
    email: 'origem@simpi.gov.br',
    unidade: 'Sede Central',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    nome: 'Mariana (Gestora Destino)',
    perfil: 'DESTINO',
    email: 'destino@simpi.gov.br',
    unidade: 'Regional Norte',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    nome: 'Felipe (DFAL / Logística)',
    perfil: 'LOGISTICA',
    email: 'logistica@simpi.gov.br',
    unidade: 'Apoio Logístico',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [identificador, setIdentificador] = useState('solicitante@simpi.gov.br');
  const [senha, setSenha] = useState('simpi@123');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleQuickSelect = (u: QuickUser) => {
    setIdentificador(u.email);
    setSenha('simpi@123');
    setErro(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao autenticar.');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setErro(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          SIMPI
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-600">
          Sistema Integrado de Movimentação Patrimonial e Inventário
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Evolução contínua do SCI • DFAS &amp; DFAL
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {erro && (
            <div className="mb-5 flex items-start gap-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="identificador"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                E-mail ou Matrícula
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 h-5" />
                </div>
                <input
                  id="identificador"
                  name="identificador"
                  type="text"
                  required
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                  placeholder="usuario@simpi.gov.br ou MAT-1001"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="senha"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-5 h-5" />
                </div>
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
            >
              {loading ? 'Validando credenciais...' : 'Entrar no Sistema'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Atalho de Perfis para Teste do MVP */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Atalhos Rápidos de Acesso (Teste MVP)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Clique em um perfil para preencher automaticamente as credenciais seed:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_USERS.map((u) => (
                <button
                  key={u.perfil}
                  type="button"
                  onClick={() => handleQuickSelect(u)}
                  className={`text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition hover:shadow-sm ${u.badgeColor} ${
                    identificador === u.email ? 'ring-2 ring-blue-500 font-semibold' : ''
                  }`}
                >
                  <div>
                    <span className="font-semibold block">{u.nome}</span>
                    <span className="text-[11px] opacity-80 flex items-center gap-1">
                      <Building2 className="w-3 h-3 inline" /> {u.unidade}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/70">
                    {u.perfil}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-3 text-center">
              <span className="text-[11px] text-slate-400">Senha padrão: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">simpi@123</code></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
