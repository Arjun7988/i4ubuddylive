import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, LogOut, ArrowLeft, Trash2, Pin, Send } from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Avatar } from '../components/Avatar';
import { AdminHeader } from '../components/AdminHeader';
import { AdminFooter } from '../components/AdminFooter';
import { supabase } from '../lib/supabase';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  last_login: string;
}

interface ChatMessage {
  id: string;
  user_id: string | null;
  message: string;
  created_at: string;
  is_pinned: boolean;
  pinned_at: string | null;
  pinned_by: string | null;
  admin_name: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export function AdminChatManagementPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (adminUser) {
      loadMessages();

      const subscription = supabase
        .channel('admin:chat_messages')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_messages',
          },
          () => {
            loadMessages();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [adminUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');

    if (!token || !userStr) {
      navigate('/master-admin/login');
      return;
    }

    setAdminUser(JSON.parse(userStr));
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/master-admin/login');
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    try {
      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!token) {
        setPasswordError('Session expired. Please login again.');
        setTimeout(() => navigate('/master-admin/login'), 2000);
        return;
      }
      const url = `${supabaseUrl}/functions/v1/admin-users`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token,
        },
        body: JSON.stringify({
          action: 'change_password',
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          if (responseData.error === 'Current password is incorrect') {
            setPasswordError('Current password is incorrect');
          } else {
            setPasswordError('Session expired. Please login again.');
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            setTimeout(() => navigate('/master-admin/login'), 2000);
          }
          return;
        }
        throw new Error(responseData.error || 'Failed to change password');
      }
      alert('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordError('');
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Failed to change password: ' + (error as Error).message);
    }
  };

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-chat-post`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': token || '',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load messages');
      }

      const result = await response.json();
      setMessages(result.data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-chat-post?id=${messageId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': token || '',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete message');
      }

      await loadMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete message');
    }
  };

  const handleTogglePin = async (message: ChatMessage) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-chat-post`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': token || '',
          },
          body: JSON.stringify({
            message_id: message.id,
            is_pinned: !message.is_pinned,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle pin');
      }

      await loadMessages();
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert(error instanceof Error ? error.message : 'Failed to toggle pin');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !adminUser || isSending) return;

    setIsSending(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-chat-post`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': token || '',
          },
          body: JSON.stringify({
            message: inputMessage.trim(),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-background via-background to-surface flex flex-col overflow-hidden">
      <AdminHeader
        adminName={adminUser?.full_name}
        showBackButton={true}
        onChangePassword={() => setShowPasswordModal(true)}
        onLogout={handleLogout}
      />

      <div className="flex-1 container mx-auto px-4 py-8 w-full flex flex-col overflow-hidden min-h-0">
        <GlowingCard className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border flex-shrink-0">
            <h2 className="text-xl font-heading font-semibold text-white">Chat Management ({messages.length} messages)</h2>
            <div className="text-sm text-gray-400">
              Pinned: <span className="text-white font-medium">{messages.filter(m => m.is_pinned).length}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">No messages yet</p>
              </div>
            ) : (
              messages.map((message) => {
                const displayName = message.admin_name || message.profiles?.full_name || message.profiles?.email || 'Anonymous';
                const isAdminMessage = message.admin_name === 'Admin';

                return (
                  <div
                    key={message.id}
                    id={`message-${message.id}`}
                    className={`p-4 rounded-xl border transition-all ${
                      message.is_pinned
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : 'bg-surface/50 border-border hover:border-primary-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {isAdminMessage ? (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-primary shadow-glow">
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                        ) : (
                          <Avatar
                            src={message.profiles?.avatar_url}
                            alt={displayName}
                            size="md"
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-primary-400">{displayName}</p>
                            {message.is_pinned && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">
                                Pinned
                              </span>
                            )}
                          </div>
                          <p className="text-gray-200 whitespace-pre-line break-words">{message.message}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-xs text-gray-500">{formatTime(message.created_at)}</p>
                            {message.is_pinned && message.pinned_by && (
                              <p className="text-xs text-yellow-500">Pinned by {message.pinned_by}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePin(message)}
                          className={`p-2 rounded-lg transition-colors ${
                            message.is_pinned
                              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                              : 'bg-surface/50 text-gray-400 hover:bg-surface hover:text-yellow-400'
                          }`}
                          title={message.is_pinned ? 'Unpin message' : 'Pin message'}
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="p-2 rounded-lg bg-surface/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                          title="Delete message"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-border pt-4 flex-shrink-0">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Post an admin announcement or update..."
                className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                maxLength={1000}
              />
              <GradientButton
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="px-6"
              >
                <Send className="w-5 h-5" />
              </GradientButton>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Post important updates and announcements. Use the pin feature to highlight messages.
            </p>
          </form>
        </GlowingCard>
      </div>

      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setPasswordError('');
        }}
        title="Change Admin Password"
      >
        <div className="space-y-4">
          {passwordError && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {passwordError}
            </div>
          )}
          <Input
            type="password"
            label="Current Password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            placeholder="Enter current password"
            required
          />
          <Input
            type="password"
            label="New Password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            placeholder="Enter new password (min 8 characters)"
            required
          />
          <Input
            type="password"
            label="Confirm New Password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            placeholder="Confirm new password"
            required
          />
          <div className="flex gap-3 pt-4">
            <GradientButton onClick={handleChangePassword} className="flex-1">
              Change Password
            </GradientButton>
            <GradientButton
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordError('');
              }}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </GradientButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
