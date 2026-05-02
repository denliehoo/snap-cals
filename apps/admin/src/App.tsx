import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/components/auth-context";
import { Layout } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";
import { ToastProvider } from "@/components/toast";
import { CreateAdminPage } from "@/pages/create-admin/index";
import { DashboardPage } from "@/pages/dashboard/index";
import { LoginPage } from "@/pages/login/index";
import { SettingsPage } from "@/pages/settings/index";
import { UserDetailPage } from "@/pages/user-detail/index";
import { UsersPage } from "@/pages/users/index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays "fresh" for 15s — tab switches serve cached data instantly.
      // Mutations call invalidateQueries() to force immediate refetch.
      staleTime: 15_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/users/:id" element={<UserDetailPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/admins/new" element={<CreateAdminPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
