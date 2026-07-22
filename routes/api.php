<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\RevisionCardController;
use App\Http\Controllers\Api\ExamSimulationController;
use App\Http\Controllers\Api\StudyPlanController;
use App\Http\Controllers\Api\WhatsAppController;
use App\Http\Controllers\Api\WhatsappWebhookController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\Api\ExamPredictionController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\MarketplaceController;
use App\Http\Controllers\Api\CommunityController;
use App\Http\Controllers\Api\CourseProgressController;
use App\Http\Controllers\Api\RevisionPlanController;
use Illuminate\Support\Facades\Route;

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public
Route::prefix('public')->group(function () {
    Route::get('/stats', [PublicController::class, 'stats']);
    Route::get('/categories', [PublicController::class, 'categories']);
    Route::get('/recent-videos', [PublicController::class, 'recentVideos']);
    Route::get('/categories/{id}', [PublicController::class, 'categoryShow']);
    Route::get('/categories/{id}/videos', [PublicController::class, 'categoryVideos']);
    Route::get('/categories/{id}/roadmap', [PublicController::class, 'categoryRoadmap']);
    Route::get('/categories/{id}/debouches', [PublicController::class, 'categoryDebouches']);
    Route::get('/debouches/{id}', [PublicController::class, 'deboucheShow']);
    Route::get('/roadmap-steps/{id}', [PublicController::class, 'roadmapStepShow']);
    Route::get('/categories/{id}/certifications', [PublicController::class, 'categoryCertifications']);
    Route::get('/videos', [PublicController::class, 'allVideos']);
    Route::get('/videos/{id}', [PublicController::class, 'videoShow']);
    Route::get('/documents', [PublicController::class, 'documents']);
    Route::get('/categories/{id}/formations', [PublicController::class, 'insamtechsFormations']);
    Route::get('/recent-formations', [PublicController::class, 'recentFormations']);
    Route::get('/hero-media', [PublicController::class, 'heroMedia']);
    Route::get('/specialites', [PublicController::class, 'allSpecialites']);

    // Orientation
    Route::get('/orientation/ecoles', [PublicController::class, 'orientationEcoles']);
    Route::get('/orientation/ecoles/{id}/questions', [PublicController::class, 'orientationFiliereQuestions']);
    Route::get('/orientation/filieres/{id}/questions', [PublicController::class, 'orientationSpecialiteQuestions']);
    Route::get('/orientation/filieres/{id}/specialites', [PublicController::class, 'orientationSpecialites']);
});

// View file as PDF (converts doc/docx via LibreOffice)
Route::get('/exams/view-pdf', [ExamController::class, 'viewPdf']);

// Plans (public)
Route::get('/plans', [SubscriptionController::class, 'plans']);

// Marketplace (public listing)
Route::get('/marketplace', [MarketplaceController::class, 'index']);
Route::get('/marketplace/{id}', [MarketplaceController::class, 'show']);

// WhatsApp Bot webhook (called by Baileys bridge - no auth needed)
Route::post('/webhook/baileys', [WhatsappWebhookController::class, 'handleBaileys']);
Route::get('/whatsapp/status', [WhatsappWebhookController::class, 'status']);
Route::get('/whatsapp/qr', [WhatsappWebhookController::class, 'qr']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateProfile']);

    // InsamTechs formations for user's filiere
    Route::get('/my-formations', [PublicController::class, 'myFormations']);

    // Chat IA
    Route::post('/chat', [ChatController::class, 'ask']);
    Route::get('/chat/history', [ChatController::class, 'history']);

    // Quiz
    Route::get('/quizzes', [QuizController::class, 'index']);
    Route::get('/quizzes/{id}', [QuizController::class, 'show']);
    Route::post('/quizzes/{id}/submit', [QuizController::class, 'submit']);
    Route::get('/my-results', [QuizController::class, 'myResults']);

    // Exams (sujets)
    Route::get('/exams', [ExamController::class, 'index']);
    Route::get('/exams/{id}', [ExamController::class, 'show']);
    Route::get('/exams/{id}/download', [ExamController::class, 'download']);
    Route::get('/exams/{id}/ai-correction', [ExamController::class, 'aiCorrection']);
    Route::post('/exams/upload', [ExamController::class, 'upload']);
    Route::post('/exams/correct', [ExamController::class, 'correctAnswers']);
    Route::post('/exams/generate-exercises', [ExamController::class, 'generateExercises']);
    Route::post('/exams/submit-and-correct', [ExamController::class, 'submitAndCorrect']);
    Route::post('/exams/summarize-course', [ExamController::class, 'summarizeCourse']);
    Route::post('/exams/generate-quiz', [ExamController::class, 'generateQuiz']);

    // Fiches de révision IA
    Route::get('/revision-cards', [RevisionCardController::class, 'index']);
    Route::post('/revision-cards/generate', [RevisionCardController::class, 'generate']);
    Route::get('/revision-cards/{id}', [RevisionCardController::class, 'show']);
    Route::delete('/revision-cards/{id}', [RevisionCardController::class, 'destroy']);

    // Simulation d'examen
    Route::get('/exam-simulations', [ExamSimulationController::class, 'index']);
    Route::post('/exam-simulations/start', [ExamSimulationController::class, 'start']);
    Route::post('/exam-simulations/{id}/submit', [ExamSimulationController::class, 'submit']);
    Route::get('/exam-simulations/{id}', [ExamSimulationController::class, 'show']);
    Route::get('/exam-simulations-stats', [ExamSimulationController::class, 'myStats']);

    // Planification intelligente
    Route::get('/study-plans', [StudyPlanController::class, 'index']);
    Route::post('/study-plans', [StudyPlanController::class, 'store']);
    Route::post('/study-plans/generate', [StudyPlanController::class, 'generate']);
    Route::get('/study-plans/today', [StudyPlanController::class, 'todayTasks']);
    Route::get('/study-plans/{id}', [StudyPlanController::class, 'show']);
    Route::delete('/study-plans/{id}', [StudyPlanController::class, 'destroy']);
    Route::post('/study-plans/{planId}/tasks', [StudyPlanController::class, 'addTask']);
    Route::patch('/study-plans/{planId}/tasks/{taskId}/toggle', [StudyPlanController::class, 'toggleTask']);

    // Rapports de progression
    Route::get('/progress/overview', [ProgressController::class, 'overview']);
    Route::get('/progress/categories', [ProgressController::class, 'byCategory']);
    Route::get('/progress/strengths', [ProgressController::class, 'strengths']);
    Route::get('/progress/timeline', [ProgressController::class, 'timeline']);

    // Progression cours / BTS / UE
    Route::post('/course-progress', [CourseProgressController::class, 'store']);
    Route::post('/course-progress/mark-completed', [CourseProgressController::class, 'markCompleted']);
    Route::get('/course-progress/check-completed', [CourseProgressController::class, 'checkCompleted']);
    Route::get('/course-progress/bts', [CourseProgressController::class, 'btsProgression']);
    Route::get('/course-progress/ue', [CourseProgressController::class, 'ueProgression']);
    Route::post('/course-progress/revision-quiz', [CourseProgressController::class, 'revisionQuiz']);

    // Plan de révision
    Route::get('/revision-plan/options', [RevisionPlanController::class, 'options']);
    Route::get('/revision-plan/bts', [RevisionPlanController::class, 'btsPlan']);
    Route::post('/revision-plan/semester', [RevisionPlanController::class, 'semesterPlan']);
    Route::get('/revision-plan/ues', [RevisionPlanController::class, 'ues']);

    // Prédiction des sujets d'examen
    Route::get('/exam-predictions/analyze', [ExamPredictionController::class, 'analyze']);
    Route::post('/exam-predictions/predict', [ExamPredictionController::class, 'predict']);
    Route::get('/exam-predictions/overview', [ExamPredictionController::class, 'predictAll']);

    // Abonnements
    Route::get('/subscription', [SubscriptionController::class, 'mySubscription']);
    Route::post('/subscription/subscribe', [SubscriptionController::class, 'subscribe']);
    Route::post('/subscription/cancel', [SubscriptionController::class, 'cancel']);
    Route::get('/subscription/usage', [SubscriptionController::class, 'usage']);

    // WhatsApp admin
    Route::get('/whatsapp/conversations', [WhatsappWebhookController::class, 'conversations']);
    Route::get('/whatsapp/conversations/{id}', [WhatsappWebhookController::class, 'conversationMessages']);
    Route::post('/whatsapp/conversations/{id}/reply', [WhatsappWebhookController::class, 'sendReply']);
    Route::post('/whatsapp/conversations/{id}/toggle-transfer', [WhatsappWebhookController::class, 'toggleTransfer']);

    // Community Chat
    Route::get('/community/channels', [CommunityController::class, 'channels']);
    Route::get('/community/{channel}/messages', [CommunityController::class, 'messages']);
    Route::post('/community/{channel}/send', [CommunityController::class, 'send']);
    Route::delete('/community/messages/{id}', [CommunityController::class, 'destroy']);

    // Marketplace
    Route::post('/marketplace', [MarketplaceController::class, 'store']);
    Route::get('/marketplace-mine', [MarketplaceController::class, 'myListings']);
    Route::get('/marketplace-purchases', [MarketplaceController::class, 'myPurchases']);
    Route::post('/marketplace/{id}/purchase', [MarketplaceController::class, 'purchase']);
    Route::get('/marketplace/{id}/download', [MarketplaceController::class, 'download']);
    Route::post('/marketplace/{id}/review', [MarketplaceController::class, 'review']);
});
