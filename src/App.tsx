import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { ScrollToTop } from './components/ScrollToTop';
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
import { AllClassifiedsPage } from './pages/AllClassifiedsPage';
import { ClassifiedDetailPage } from './pages/ClassifiedDetailPage';
import { ClassifiedFormPage } from './pages/ClassifiedFormPage';
import { MyClassifiedsPage } from './pages/MyClassifiedsPage';
import { CouponsPage } from './pages/CouponsPage';
import { TravelPage } from './pages/TravelPage';
import { ChatBotPage } from './pages/ChatBotPage';
import { DealsBuddyPage } from './pages/DealsBuddyPage';
import BuddyServicesPage from './pages/BuddyServicesPage';
import ServiceProvidersListPage from './pages/ServiceProvidersListPage';
import ServiceProviderDetailPage from './pages/ServiceProviderDetailPage';
import AddBuddyServicePage from './pages/AddBuddyServicePage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminClassifiedsPage } from './pages/AdminClassifiedsPage';
import { AdminTravelCategoriesPage } from './pages/AdminTravelCategoriesPage';
import { AdminTravelPostsPage } from './pages/AdminTravelPostsPage';
import { AdminChatManagementPage } from './pages/AdminChatManagementPage';
import { AdminCouponsPage } from './pages/AdminCouponsPage';
import { AdminTemplateCategoriesPage } from './pages/AdminTemplateCategoriesPage';
import { AdminInviteTemplatesPage } from './pages/AdminInviteTemplatesPage';
import { AdminAdsPage } from './pages/AdminAdsPage';
import { AdminBuddyServiceCategoriesPage } from './pages/AdminBuddyServiceCategoriesPage';
import AdminBuddyServiceSubCategoriesPage from './pages/AdminBuddyServiceSubCategoriesPage';
import AdminBuddyServiceRequestsPage from './pages/AdminBuddyServiceRequestsPage';
import AdminBuddyServiceReviewsPage from './pages/AdminBuddyServiceReviewsPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { EventsListPage } from './pages/EventsListPage';
import { PostEventPage } from './pages/PostEventPage';
import { EditEventPage } from './pages/EditEventPage';
import { MyEventsPage } from './pages/MyEventsPage';
import { AdminEventsPage } from './pages/AdminEventsPage';
import { AdminDealCategoriesPage } from './pages/AdminDealCategoriesPage';
import { AdminDealsPage } from './pages/AdminDealsPage';

function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuth();
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/classifieds" element={<ClassifiedsPage />} />
          <Route path="/classifieds/all" element={<AllClassifiedsPage />} />
          <Route path="/classifieds-search" element={<ClassifiedsListPage />} />
          <Route
            path="/classifieds/my-listings"
            element={
              <ProtectedRoute>
                <MyClassifiedsPage />
              </ProtectedRoute>
            }
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
          <Route path="/deals" element={<DealsBuddyPage />} />
          <Route path="/buddy-services" element={<BuddyServicesPage />} />
          <Route path="/buddy-services/add" element={<AddBuddyServicePage />} />
          <Route path="/buddy-services/:category" element={<ServiceProvidersListPage />} />
          <Route path="/buddy-services/:category/:slug" element={<ServiceProviderDetailPage />} />
          <Route path="/travel" element={<TravelPage />} />
          <Route path="/chatbot" element={<ChatBotPage />} />
          <Route path="/events" element={<EventsListPage />} />
          <Route
            path="/events/new"
            element={
              <ProtectedRoute>
                <PostEventPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/mine"
            element={
              <ProtectedRoute>
                <MyEventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id/edit"
            element={
              <ProtectedRoute>
                <EditEventPage />
              </ProtectedRoute>
            }
          />

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
        <Route path="/master-admin/template-categories" element={<AdminTemplateCategoriesPage />} />
        <Route path="/master-admin/invite-templates" element={<AdminInviteTemplatesPage />} />
        <Route path="/master-admin/ads" element={<AdminAdsPage />} />
        <Route path="/master-admin/buddy-service-categories" element={<AdminBuddyServiceCategoriesPage />} />
        <Route path="/master-admin/buddy-service-subcategories" element={<AdminBuddyServiceSubCategoriesPage />} />
        <Route path="/master-admin/buddy-service-requests" element={<AdminBuddyServiceRequestsPage />} />
        <Route path="/master-admin/buddy-service-reviews" element={<AdminBuddyServiceReviewsPage />} />
        <Route path="/master-admin/events" element={<AdminEventsPage />} />
        <Route path="/master-admin/deal-categories" element={<AdminDealCategoriesPage />} />
        <Route path="/master-admin/deals" element={<AdminDealsPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
