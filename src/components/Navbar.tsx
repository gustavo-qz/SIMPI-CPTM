'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserSession } from '@/types/auth';
import LogoutButton from '@/components/LogoutButton';
import {
  ShieldCheck,
  Building2,
  Package,
  Layers,
  PlusCircle,
  Clock,
} from 'lucide-react';

interface NavbarProps {
  user: UserSession;
  totalPendencias?: number;
}

export default function Navbar({ user, totalPendencias }: NavbarProps) {
  const pathname = usePathname();

  const getPerfilBadge = (perfil: string) => {
    switch (perfil) {
      case 'SOLICITANTE':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PATRIMONIO':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ORIGEM':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'DESTINO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'LOGISTICA':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Layers },
    { href: '/bens', label: 'Consulta de Bens', icon: Package },
    {
      href: '/pendencias',
      label: 'Minhas Pendências',
      icon: Clock,
      badge: totalPendencias,
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-slate-900 tracking-tight">SIMPI</span>
                  <span className="hidden sm:inline-block text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-200">
                    MVP
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-none">Patrimônio &amp; Logística</p>
              </div>
            </Link>

            {/* Nav Menu */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                    {typeof link.badge === 'number' && link.badge > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action + User Info */}
          <div className="flex items-center gap-3">
            <Link
              href="/transferencias/nova"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Transferência</span>
            </Link>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {user.nome.split(' ')[0]} {user.nome.split(' ')[1] || ''}
              </span>
              <span className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                <Building2 className="w-2.5 h-2.5" />
                {user.unidadeSigla || user.unidadeNome || 'Sede'}
              </span>
            </div>

            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPerfilBadge(
                user.perfil
              )}`}
              title={`Perfil: ${user.perfil}`}
            >
              {user.perfil}
            </span>

            <LogoutButton />
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                  isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
                {typeof link.badge === 'number' && link.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-white font-bold">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
