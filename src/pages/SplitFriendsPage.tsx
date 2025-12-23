import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Edit2, Trash2, User, Home, ChevronRight } from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const friendSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type FriendFormData = z.infer<typeof friendSchema>;

interface Friend {
  id: string;
  name: string;
}

export function SplitFriendsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FriendFormData>({
    resolver: zodResolver(friendSchema),
  });

  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user]);

  const loadFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', user!.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setFriends(data || []);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FriendFormData) => {
    try {
      if (editingFriend) {
        const { error } = await supabase
          .from('friends')
          .update({ name: data.name })
          .eq('id', editingFriend.id);

        if (error) throw error;
        alert('Friend updated successfully!');
      } else {
        const { error } = await supabase
          .from('friends')
          .insert({ user_id: user!.id, name: data.name });

        if (error) throw error;
        alert('Friend added successfully!');
      }

      setIsModalOpen(false);
      setEditingFriend(null);
      reset();
      loadFriends();
    } catch (error) {
      console.error('Error saving friend:', error);
      alert('Failed to save friend');
    }
  };

  const handleEdit = (friend: Friend) => {
    setEditingFriend(friend);
    reset({ name: friend.name });
    setIsModalOpen(true);
  };

  const handleDelete = async (friendId: string) => {
    if (!confirm('Are you sure you want to delete this friend?')) {
      return;
    }

    try {
      const { error } = await supabase.from('friends').delete().eq('id', friendId);

      if (error) throw error;
      alert('Friend deleted successfully!');
      loadFriends();
    } catch (error) {
      console.error('Error deleting friend:', error);
      alert('Failed to delete friend');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative flex-1 pt-[calc(128px+50px)] container mx-auto px-4 w-full">
        <div className="space-y-6">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link
              to="/"
              className="flex items-center gap-1 text-gray-400 hover:text-primary-400 transition-colors"
            >
              <Home className="w-4 h-4 flex-shrink-0" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <Link to="/split" className="text-gray-400 hover:text-primary-400 transition-colors">
              Split Bills
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <span className="text-white font-medium">Friends</span>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/split')}
              className="p-2 hover:bg-surface rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-heading font-bold text-white mb-2">Friends</h1>
              <p className="text-gray-400">Manage your friends list</p>
            </div>
            <GradientButton
              onClick={() => {
                setEditingFriend(null);
                reset({ name: '' });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Friend
            </GradientButton>
          </div>

      <GlowingCard>
        {friends.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No friends added yet</p>
            <GradientButton
              onClick={() => {
                setEditingFriend(null);
                reset({ name: '' });
                setIsModalOpen(true);
              }}
            >
              Add Your First Friend
            </GradientButton>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-4 bg-surface/50 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white font-medium">{friend.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(friend)}
                    className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-primary-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(friend.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlowingCard>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFriend(null);
          reset();
        }}
        title={editingFriend ? 'Edit Friend' : 'Add Friend'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('name')}
            label="Friend Name"
            placeholder="Enter friend's name"
            error={errors.name?.message}
          />

          <div className="flex gap-3 pt-4">
            <GradientButton
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingFriend(null);
                reset();
              }}
              className="flex-1"
            >
              Cancel
            </GradientButton>
            <GradientButton type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : editingFriend ? 'Update' : 'Add'}
            </GradientButton>
          </div>
        </form>
      </Modal>
        </div>
      </main>
      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
