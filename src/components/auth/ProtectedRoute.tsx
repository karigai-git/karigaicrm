import React from 'react';
import { Navigate } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  if (!pb.authStore.isValid) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
