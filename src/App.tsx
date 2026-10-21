import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthPromptModal } from './components/AuthPromptModal';

import { LandingPage } from './pages/LandingPage';
import { SignUpPage } from './pages/SignUpPage';
import { SignInPage } from './pages/SignInPage';
import { SolverProfilePage } from './pages/SolverProfilePage';
import { WelcomePage } from './pages/WelcomePage';
import { CommunityFeedPage } from './pages/CommunityFeedPage';
import { QuestionDetailPage } from './pages/QuestionDetailPage';
import { AskQuestionPage } from './pages/AskQuestionPage';
import { ProblemsListPage } from './pages/ProblemsListPage';
import { ProblemDetailPage } from './pages/ProblemDetailPage';
import { ProblemSubmitPage } from './pages/ProblemSubmitPage';
import { AboutPage } from './pages/AboutPage';
import { RequireAuth } from './components/RequireAuth';
import { CompanyProblemFormPage } from './pages/CompanyProblemFormPage';
import { CompanyProblemsPage } from './pages/CompanyProblemsPage';
import { CompanyApplicationsPage } from './pages/CompanyApplicationsPage';
import { MyApplicationsPage } from './pages/MyApplicationsPage';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#F8F1E1] text-[#12122B]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/profile/solver" element={<RequireAuth account="TALENT"><SolverProfilePage /></RequireAuth>} />
              <Route path="/welcome" element={<RequireAuth><WelcomePage /></RequireAuth>} />
              <Route path="/community" element={<CommunityFeedPage />} />
              <Route path="/community/:id" element={<QuestionDetailPage />} />
              <Route path="/community/ask" element={<RequireAuth><AskQuestionPage /></RequireAuth>} />
              <Route path="/problems" element={<ProblemsListPage />} />
              <Route path="/problems/:id" element={<ProblemDetailPage />} />
              <Route path="/problems/:id/submit" element={<RequireAuth account="TALENT"><ProblemSubmitPage /></RequireAuth>} />
              <Route path="/my-applications" element={<RequireAuth account="TALENT"><MyApplicationsPage /></RequireAuth>} />
              <Route path="/company/problems" element={<RequireAuth account="COMPANY"><CompanyProblemsPage /></RequireAuth>} />
              <Route path="/company/problems/new" element={<RequireAuth account="COMPANY"><CompanyProblemFormPage /></RequireAuth>} />
              <Route path="/company/problems/:id/edit" element={<RequireAuth account="COMPANY"><CompanyProblemFormPage /></RequireAuth>} />
              <Route path="/company/problems/:id/applications" element={<RequireAuth account="COMPANY"><CompanyApplicationsPage /></RequireAuth>} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <AuthPromptModal />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
