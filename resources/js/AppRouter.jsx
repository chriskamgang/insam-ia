import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import CategoryDetail from './pages/CategoryDetail';
import CategoryVideos from './pages/CategoryVideos';
import CategoryRoadmap from './pages/CategoryRoadmap';
import VideoPlayer from './pages/VideoPlayer';
import Chat from './pages/Chat';
import Quizzes from './pages/Quizzes';
import QuizPlay from './pages/QuizPlay';
import Exams from './pages/Exams';
import Search from './pages/Search';
import Profile from './pages/Profile';
import RevisionCards from './pages/RevisionCards';
import ExamSimulation from './pages/ExamSimulation';
import Progress from './pages/Progress';
import StudyPlanner from './pages/StudyPlanner';
import ExamPrediction from './pages/ExamPrediction';
import Pricing from './pages/Pricing';
import Marketplace from './pages/Marketplace';
import Library from './pages/Library';
import Community from './pages/Community';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Chargement...</div>;
    return user ? children : <Navigate to="/login" />;
}

export default function AppRouter() {
    return (
        <>
            <Navbar />
            <main>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/formations" element={<Categories />} />
                    <Route path="/formations/:id" element={<CategoryDetail />} />
                    <Route path="/formations/:id/videos" element={<CategoryVideos />} />
                    <Route path="/formations/:id/roadmap" element={<CategoryRoadmap />} />
                    <Route path="/video/:id" element={<VideoPlayer />} />
                    <Route path="/recherche" element={<Search />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/assistant" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                    <Route path="/evaluations" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
                    <Route path="/evaluations/:id" element={<ProtectedRoute><QuizPlay /></ProtectedRoute>} />
                    <Route path="/sujets" element={<ProtectedRoute><Exams /></ProtectedRoute>} />
                    <Route path="/fiches" element={<ProtectedRoute><RevisionCards /></ProtectedRoute>} />
                    <Route path="/simulation" element={<ProtectedRoute><ExamSimulation /></ProtectedRoute>} />
                    <Route path="/progression" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                    <Route path="/planification" element={<ProtectedRoute><StudyPlanner /></ProtectedRoute>} />
                    <Route path="/predictions" element={<ProtectedRoute><ExamPrediction /></ProtectedRoute>} />
                    <Route path="/tarifs" element={<Pricing />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/bibliotheque" element={<ProtectedRoute><Library /></ProtectedRoute>} />
                    <Route path="/communaute" element={<ProtectedRoute><Community /></ProtectedRoute>} />
                    <Route path="/profil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                </Routes>
            </main>
        </>
    );
}
