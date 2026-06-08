import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Lazy-loaded pages
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const AreaDetail = lazy(() => import('./pages/AreaDetail'));
const PatioWizard = lazy(() => import('./pages/PatioWizard'));
const PatioSummary = lazy(() => import('./pages/PatioSummary'));
const SiteManagementWizard = lazy(() => import('./pages/SiteManagementWizard'));
const SiteManagementSummary = lazy(() => import('./pages/SiteManagementSummary'));
const BedPrepWizard = lazy(() => import('./pages/BedPrepWizard'));
const BedPrepSummary = lazy(() => import('./pages/BedPrepSummary'));
const RoughGradingWizard = lazy(() => import('./pages/RoughGradingWizard'));
const RoughGradingSummary = lazy(() => import('./pages/RoughGradingSummary'));
const DemolitionWizard = lazy(() => import('./pages/DemolitionWizard'));
const DemolitionSummary = lazy(() => import('./pages/DemolitionSummary'));
const ProjectSummary = lazy(() => import('./pages/ProjectSummary'));
const BedEdgingWizard = lazy(() => import('./pages/BedEdgingWizard'));
const BedEdgingSummary = lazy(() => import('./pages/BedEdgingSummary'));
const PlantingWizard = lazy(() => import('./pages/PlantingWizard'));
const PlantingSummary = lazy(() => import('./pages/PlantingSummary'));
const MulchWizard = lazy(() => import('./pages/MulchWizard'));
const MulchSummary = lazy(() => import('./pages/MulchSummary'));
const DrainageWizard = lazy(() => import('./pages/DrainageWizard'));
const DrainageSummary = lazy(() => import('./pages/DrainageSummary'));
const EstimationSummary = lazy(() => import('./pages/EstimationSummary'));
const LawnWizard = lazy(() => import('./pages/LawnWizard'));
const LawnSummary = lazy(() => import('./pages/LawnSummary'));
const BouldersWizard = lazy(() => import('./pages/BouldersWizard'));
const BouldersSummary = lazy(() => import('./pages/BouldersSummary'));
const HardscapeRepairWizard = lazy(() => import('./pages/HardscapeRepairWizard'));
const HardscapeRepairSummary = lazy(() => import('./pages/HardscapeRepairSummary'));
const MaintenanceWizard = lazy(() => import('./pages/MaintenanceWizard'));
const MaintenanceSummary = lazy(() => import('./pages/MaintenanceSummary'));
const SteppingStoneWizard = lazy(() => import('./pages/SteppingStoneWizard'));
const SteppingStoneSummary = lazy(() => import('./pages/SteppingStoneSummary'));
const RetainingWallWizard = lazy(() => import('./pages/RetainingWallWizard'));
const RetainingWallSummary = lazy(() => import('./pages/RetainingWallSummary'));
const Settings = lazy(() => import('./pages/Settings'));

const pageVariants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.18, ease: "easeOut" } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.14, ease: "easeIn" } },
};

function PageLoader() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ width: "100%" }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
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
              <Route path="/estimation-summary/:projectId" element={<EstimationSummary />} />
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
              <Route path="/hardscape-repair-wizard/:areaId" element={<HardscapeRepairWizard />} />
              <Route path="/hardscape-repair-summary/:areaId" element={<HardscapeRepairSummary />} />
              <Route path="/maintenance-wizard/:areaId" element={<MaintenanceWizard />} />
              <Route path="/maintenance-summary/:areaId" element={<MaintenanceSummary />} />
              <Route path="/stepping-stone-wizard/:areaId" element={<SteppingStoneWizard />} />
              <Route path="/stepping-stone-summary/:areaId" element={<SteppingStoneSummary />} />
              <Route path="/retaining-wall-wizard/:areaId" element={<RetainingWallWizard />} />
              <Route path="/retaining-wall-summary/:areaId" element={<RetainingWallSummary />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<PageNotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return <AnimatedRoutes />;
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