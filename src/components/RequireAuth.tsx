import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const RequireAuth: React.FC<{ children: React.ReactNode; account?: 'TALENT' | 'COMPANY' }> = ({ children, account }) => {
  const { authLoading, currentRole, lang } = useApp();
  const location = useLocation();

  if (authLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-[#5B5B7B]">{lang === 'ar' ? 'جارٍ التحقق من الحساب…' : 'Checking your account…'}</div>;
  }
  if (currentRole === 'visitor') {
    return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />;
  }
  if (account === 'COMPANY' && currentRole !== 'company') return <Navigate to="/problems" replace />;
  if (account === 'TALENT' && currentRole === 'company') return <Navigate to="/company/problems" replace />;
  return <>{children}</>;
};
