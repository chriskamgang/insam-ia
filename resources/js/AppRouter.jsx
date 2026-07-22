import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
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
import DeboucheDetail from './pages/DeboucheDetail';
import RoadmapStepDetail from './pages/RoadmapStepDetail';
import RevisionProgram from './pages/RevisionProgram';
import Orientation from './pages/Orientation';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Chargement...</div>;
    return user ? children : <Navigate to="/login" />;
}

function ForumFab() {
    const { user } = useAuth();
    const location = useLocation();
    if (!user || location.pathname === '/communaute') return null;
    return (
        <Link to="/communaute" style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 90,
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, #5BBCB4, #1B2A4A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 20, textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(91,188,180,0.4)',
            transition: 'transform .2s, box-shadow .2s',
        }}
            title="Forum Communautaire"
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(91,188,180,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(91,188,180,0.4)'; }}
        >
            <i className="fas fa-comments"></i>
        </Link>
    );
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
                    <Route path="/debouche/:id" element={<DeboucheDetail />} />
                    <Route path="/roadmap/:id" element={<RoadmapStepDetail />} />
                    <Route path="/video/:id" element={<VideoPlayer />} />
                    <Route path="/recherche" element={<Search />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/assistant" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                    <Route path="/evaluations" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
                    <Route path="/evaluations/:id" element={<ProtectedRoute><QuizPlay /></ProtectedRoute>} />
                    <Route path="/sujets" element={<Navigate to="/bibliotheque" />} />
                    <Route path="/fiches" element={<ProtectedRoute><RevisionCards /></ProtectedRoute>} />
                    <Route path="/simulation" element={<ProtectedRoute><ExamSimulation /></ProtectedRoute>} />
                    <Route path="/progression" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                    <Route path="/planification" element={<ProtectedRoute><StudyPlanner /></ProtectedRoute>} />
                    <Route path="/predictions" element={<ProtectedRoute><ExamPrediction /></ProtectedRoute>} />
                    <Route path="/orientation" element={<Orientation />} />
                    <Route path="/tarifs" element={<Pricing />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/bibliotheque" element={<ProtectedRoute><Library /></ProtectedRoute>} />
                    <Route path="/communaute" element={<ProtectedRoute><Community /></ProtectedRoute>} />
                    <Route path="/revision" element={<ProtectedRoute><RevisionProgram /></ProtectedRoute>} />
                    <Route path="/profil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                </Routes>
            </main>
            <ForumFab />
        </>
    );
}
