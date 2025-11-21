import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SplitPage } from './pages/SplitPage';
import { SplitFriendsPage } from './pages/SplitFriendsPage';
import { SplitNewExpensePage } from './pages/SplitNewExpensePage';
import { SplitFriendLedgerPage } from './pages/SplitFriendLedgerPage';
import { RSVPPage } from './pages/RSVPPage';
import { RSVPCreatePage } from './pages/RSVPCreatePage';
import { RSVPRespondPage } from './pages/RSVPRespondPage';
import { PublicRSVPPage } from './pages/PublicRSVPPage';
import { ClassifiedsPage } from './pages/ClassifiedsPage';
import { ClassifiedsListPage } from './pages/ClassifiedsListPage';
import { ClassifiedDetailPage } from './pages/ClassifiedDetailPage';
import { ClassifiedFormPage } from './pages/ClassifiedFormPage';
import { CouponsPage } from './pages/CouponsPage';
import { TravelPage } from './pages/TravelPage';
import { ChatBotPage } from './pages/ChatBotPage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminClassifiedsPage } from './pages/AdminClassifiedsPage';
import { AdminTravelCategoriesPage } from './pages/AdminTravelCategoriesPage';
import { AdminTravelPostsPage } from './pages/AdminTravelPostsPage';
import { AdminChatManagementPage } from './pages/AdminChatManagementPage';
import { AdminCouponsPage } from './pages/AdminCouponsPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuth();
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/old-classifieds" element={<ClassifiedsPage />} />
          <Route
            path="/classifieds"
            element={<ClassifiedsListPage />}
          />
          <Route
            path="/classifieds/:id"
            element={<ClassifiedDetailPage />}
          />
          <Route
            path="/classifieds/new"
            element={
              <ProtectedRoute>
                <ClassifiedFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classifieds/:id/edit"
            element={
              <ProtectedRoute>
                <ClassifiedFormPage />
              </ProtectedRoute>
            }
          />
          <Route path="/coupons" element={<CouponsPage />} />
          <Route path="/travel" element={<TravelPage />} />
          <Route path="/chatbot" element={<ChatBotPage />} />

        <Route path="/rsvp" element={<RSVPPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route path="/split" element={<SplitPage />} />

        <Route
          path="/split/friends"
          element={
            <ProtectedRoute>
              <SplitFriendsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/split/new"
          element={
            <ProtectedRoute>
              <SplitNewExpensePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/split/:friendId"
          element={
            <ProtectedRoute>
              <SplitFriendLedgerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rsvp/create"
          element={
            <ProtectedRoute>
              <RSVPCreatePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rsvp/edit/:eventId"
          element={
            <ProtectedRoute>
              <RSVPCreatePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rsvp/respond/:eventId"
          element={<RSVPRespondPage />}
        />

        <Route path="/rsvp/r/:shareToken" element={<PublicRSVPPage />} />

        <Route path="/master-admin/login" element={<AdminLoginPage />} />
        <Route path="/master-admin" element={<AdminDashboardPage />} />
        <Route path="/master-admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/master-admin/users" element={<AdminUsersPage />} />
        <Route path="/master-admin/classifieds" element={<AdminClassifiedsPage />} />
        <Route path="/master-admin/travel-categories" element={<AdminTravelCategoriesPage />} />
        <Route path="/master-admin/travel-posts" element={<AdminTravelPostsPage />} />
        <Route path="/master-admin/chat" element={<AdminChatManagementPage />} />
        <Route path="/master-admin/coupons" element={<AdminCouponsPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
