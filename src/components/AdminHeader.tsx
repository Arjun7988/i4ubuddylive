import { Shield, LogOut, Key, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GradientButton } from './GradientButton';

interface AdminHeaderProps {
  adminName?: string;
  showBackButton?: boolean;
  onChangePassword: () => void;
  onLogout: () => void;
}

export function AdminHeader({ adminName, showBackButton = false, onChangePassword, onLogout }: AdminHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              {showBackButton ? (
                <button
                  onClick={() => navigate('/master-admin/dashboard')}
                  className="flex items-center gap-2 text-lg font-heading font-bold text-white hover:text-primary-400 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Dashboard
                </button>
              ) : (
                <>
                  <h1 className="text-xl font-heading font-bold text-white">Master Admin Dashboard</h1>
                  <p className="text-sm text-gray-400">Welcome, {adminName || 'System Administrator'}</p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GradientButton
              onClick={onChangePassword}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              Change Password
            </GradientButton>
            <GradientButton onClick={onLogout} variant="secondary" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  );
}
