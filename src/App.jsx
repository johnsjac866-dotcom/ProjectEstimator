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
import RoughGradingWizard from './pages/RoughGradingWizard';
import RoughGradingSummary from './pages/RoughGradingSummary';
import DemolitionWizard from './pages/DemolitionWizard';
import DemolitionSummary from './pages/DemolitionSummary';
import ProjectSummary from './pages/ProjectSummary';
import BedEdgingWizard from './pages/BedEdgingWizard';
import BedEdgingSummary from './pages/BedEdgingSummary';
import PlantingWizard from './pages/PlantingWizard';
import PlantingSummary from './pages/PlantingSummary';
import MulchWizard from './pages/MulchWizard';
import MulchSummary from './pages/MulchSummary';
import DrainageWizard from './pages/DrainageWizard';
import DrainageSummary from './pages/DrainageSummary';
import LawnWizard from './pages/LawnWizard';
import LawnSummary from './pages/LawnSummary';
import BouldersWizard from './pages/BouldersWizard';
import BouldersSummary from './pages/BouldersSummary';

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
        <Route path="/project-summary/:projectId" element={<ProjectSummary />} />
        <Route path="/rough-grading-wizard/:areaId" element={<RoughGradingWizard />} />
        <Route path="/rough-grading-summary/:areaId" element={<RoughGradingSummary />} />
        <Route path="/demolition-wizard/:areaId" element={<DemolitionWizard />} />
        <Route path="/demolition-summary/:areaId" element={<DemolitionSummary />} />
        <Route path="/bed-edging-wizard/:areaId" element={<BedEdgingWizard />} />
        <Route path="/bed-edging-summary/:areaId" element={<BedEdgingSummary />} />
        <Route path="/planting-wizard/:areaId" element={<PlantingWizard />} />
        <Route path="/planting-summary/:areaId" element={<PlantingSummary />} />
        <Route path="/mulch-wizard/:areaId" element={<MulchWizard />} />
        <Route path="/mulch-summary/:areaId" element={<MulchSummary />} />
        <Route path="/drainage-wizard/:areaId" element={<DrainageWizard />} />
        <Route path="/drainage-summary/:areaId" element={<DrainageSummary />} />
        <Route path="/lawn-wizard/:areaId" element={<LawnWizard />} />
        <Route path="/lawn-summary/:areaId" element={<LawnSummary />} />
        <Route path="/boulders-wizard/:areaId" element={<BouldersWizard />} />
        <Route path="/boulders-summary/:areaId" element={<BouldersSummary />} />
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