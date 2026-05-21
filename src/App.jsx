import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import AreaDetail from './pages/AreaDetail';
import PatioWizard from './pages/PatioWizard';
import PatioSummary from './pages/PatioSummary';
import SiteManagementWizard from './pages/SiteManagementWizard';
import SiteManagementSummary from './pages/SiteManagementSummary';
import BedPrepWizard from './pages/BedPrepWizard';
import BedPrepSummary from './pages/BedPrepSummary';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Projects />} />
        <Route path="/project/:projectId" element={<ProjectDetail />} />
        <Route path="/area/:areaId" element={<AreaDetail />} />
        <Route path="/patio-wizard/:areaId" element={<PatioWizard />} />
        <Route path="/patio-summary/:areaId" element={<PatioSummary />} />
        <Route path="/site-management-wizard/:areaId" element={<SiteManagementWizard />} />
        <Route path="/site-management-summary/:areaId" element={<SiteManagementSummary />} />
        <Route path="/bed-prep-wizard/:areaId" element={<BedPrepWizard />} />
        <Route path="/bed-prep-summary/:areaId" element={<BedPrepSummary />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App