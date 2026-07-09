<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\ChatMessage;
use App\Models\ExamSimulation;
use App\Models\QuizResult;
use App\Models\RevisionCard;
use App\Services\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgressController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // --- Quiz stats ---
        $quizStats = QuizResult::where('user_id', $userId)
            ->selectRaw('COUNT(*) as total, AVG(score * 100.0 / NULLIF(total, 0)) as avg_score')
            ->first();

        // --- Exam simulation stats ---
        $simStats = ExamSimulation::where('user_id', $userId)
            ->where('status', 'completed')
            ->selectRaw('COUNT(*) as total, AVG(score) as avg_score')
            ->first();

        // --- Revision cards count ---
        $revisionCount = RevisionCard::where('user_id', $userId)->count();

        // --- Chat messages sent by user ---
        $chatCount = ChatMessage::where('user_id', $userId)
            ->where('role', 'user')
            ->count();

        // --- Activity streak: distinct active dates in last 30 days ---
        $now = now();
        $thirtyDaysAgo = $now->copy()->subDays(30);

        $quizDates = QuizResult::where('user_id', $userId)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->selectRaw("DATE(created_at) as activity_date")
            ->pluck('activity_date');

        $simDates = ExamSimulation::where('user_id', $userId)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->selectRaw("DATE(created_at) as activity_date")
            ->pluck('activity_date');

        $revDates = RevisionCard::where('user_id', $userId)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->selectRaw("DATE(created_at) as activity_date")
            ->pluck('activity_date');

        $activeDates = $quizDates->merge($simDates)->merge($revDates)->unique()->count();

        // --- Weekly activity: last 7 days count per day ---
        $sevenDaysAgo = $now->copy()->subDays(6)->startOfDay();

        $weeklyQuiz = QuizResult::where('user_id', $userId)
            ->where('created_at', '>=', $sevenDaysAgo)
            ->selectRaw("DATE(created_at) as day, COUNT(*) as cnt")
            ->groupBy('day')
            ->pluck('cnt', 'day');

        $weeklySim = ExamSimulation::where('user_id', $userId)
            ->where('created_at', '>=', $sevenDaysAgo)
            ->selectRaw("DATE(created_at) as day, COUNT(*) as cnt")
            ->groupBy('day')
            ->pluck('cnt', 'day');

        $weeklyRev = RevisionCard::where('user_id', $userId)
            ->where('created_at', '>=', $sevenDaysAgo)
            ->selectRaw("DATE(created_at) as day, COUNT(*) as cnt")
            ->groupBy('day')
            ->pluck('cnt', 'day');

        $weeklyActivity = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = $now->copy()->subDays($i)->format('Y-m-d');
            $weeklyActivity[] = [
                'date'  => $day,
                'count' => ($weeklyQuiz[$day] ?? 0) + ($weeklySim[$day] ?? 0) + ($weeklyRev[$day] ?? 0),
            ];
        }

        // --- Monthly scores: last 6 months avg quiz + simulation scores ---
        $sixMonthsAgo = $now->copy()->subMonths(6)->startOfMonth();

        $monthlyQuizScores = QuizResult::where('user_id', $userId)
            ->where('created_at', '>=', $sixMonthsAgo)
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, AVG(score * 100.0 / NULLIF(total, 0)) as avg_score")
            ->groupBy('month')
            ->pluck('avg_score', 'month');

        $monthlySimScores = ExamSimulation::where('user_id', $userId)
            ->where('status', 'completed')
            ->where('created_at', '>=', $sixMonthsAgo)
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, AVG(score) as avg_score")
            ->groupBy('month')
            ->pluck('avg_score', 'month');

        $monthlyScores = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i)->format('Y-m');
            $monthlyScores[] = [
                'month'           => $month,
                'quiz_avg'        => round($monthlyQuizScores[$month] ?? 0, 1),
                'simulation_avg'  => round($monthlySimScores[$month] ?? 0, 1),
            ];
        }

        // --- Strongest / Weakest category by average quiz score ---
        $categoryScores = QuizResult::where('quiz_results.user_id', $userId)
            ->join('quizzes', 'quiz_results.quiz_id', '=', 'quizzes.id')
            ->join('categories', 'quizzes.category_id', '=', 'categories.id')
            ->selectRaw('categories.id, categories.name, categories.icon, AVG(quiz_results.score * 100.0 / NULLIF(quiz_results.total, 0)) as avg_score, COUNT(*) as quiz_count')
            ->groupBy('categories.id', 'categories.name', 'categories.icon')
            ->having('quiz_count', '>=', 1)
            ->orderBy('avg_score', 'desc')
            ->get();

        $strongest = $categoryScores->first();
        $weakest   = $categoryScores->last();

        // Avoid duplicate if only one category
        if ($strongest && $weakest && $strongest->id === $weakest->id) {
            $weakest = null;
        }

        return response()->json([
            'quiz' => [
                'total'     => (int) ($quizStats->total ?? 0),
                'avg_score' => round($quizStats->avg_score ?? 0, 1),
            ],
            'simulation' => [
                'total'     => (int) ($simStats->total ?? 0),
                'avg_score' => round($simStats->avg_score ?? 0, 1),
            ],
            'revision_cards'  => $revisionCount,
            'chat_messages'   => $chatCount,
            'activity_streak' => $activeDates,
            'weekly_activity' => $weeklyActivity,
            'monthly_scores'  => $monthlyScores,
            'strongest_category' => $strongest ? [
                'id'        => $strongest->id,
                'name'      => $strongest->name,
                'icon'      => $strongest->icon,
                'avg_score' => round($strongest->avg_score, 1),
            ] : null,
            'weakest_category' => $weakest ? [
                'id'        => $weakest->id,
                'name'      => $weakest->name,
                'icon'      => $weakest->icon,
                'avg_score' => round($weakest->avg_score, 1),
            ] : null,
        ]);
    }

    public function byCategory(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Gather all category IDs the user has interacted with
        $quizCategoryIds = QuizResult::where('quiz_results.user_id', $userId)
            ->join('quizzes', 'quiz_results.quiz_id', '=', 'quizzes.id')
            ->pluck('quizzes.category_id')
            ->unique();

        $simCategoryIds = ExamSimulation::where('user_id', $userId)
            ->whereNotNull('category_id')
            ->pluck('category_id')
            ->unique();

        $revCategoryIds = RevisionCard::where('user_id', $userId)
            ->whereNotNull('category_id')
            ->pluck('category_id')
            ->unique();

        $allCategoryIds = $quizCategoryIds
            ->merge($simCategoryIds)
            ->merge($revCategoryIds)
            ->unique()
            ->filter();

        $categories = Category::whereIn('id', $allCategoryIds)->get();

        // Quiz stats per category
        $quizStats = QuizResult::where('quiz_results.user_id', $userId)
            ->join('quizzes', 'quiz_results.quiz_id', '=', 'quizzes.id')
            ->selectRaw('quizzes.category_id, COUNT(*) as quiz_count, AVG(quiz_results.score * 100.0 / NULLIF(quiz_results.total, 0)) as avg_score')
            ->groupBy('quizzes.category_id')
            ->get()
            ->keyBy('category_id');

        // Simulation stats per category
        $simStats = ExamSimulation::where('user_id', $userId)
            ->where('status', 'completed')
            ->whereNotNull('category_id')
            ->selectRaw('category_id, COUNT(*) as sim_count, AVG(score) as avg_score')
            ->groupBy('category_id')
            ->get()
            ->keyBy('category_id');

        // Revision cards count per category
        $revStats = RevisionCard::where('user_id', $userId)
            ->whereNotNull('category_id')
            ->selectRaw('category_id, COUNT(*) as rev_count')
            ->groupBy('category_id')
            ->get()
            ->keyBy('category_id');

        $result = $categories->map(function (Category $cat) use ($quizStats, $simStats, $revStats) {
            $quiz = $quizStats->get($cat->id);
            $sim  = $simStats->get($cat->id);
            $rev  = $revStats->get($cat->id);

            $quizAvg = $quiz ? round($quiz->avg_score, 1) : 0;
            $simAvg  = $sim  ? round($sim->avg_score, 1)  : 0;

            // Overall progress: weighted average of available scores
            $scoreCount = ($quiz ? 1 : 0) + ($sim ? 1 : 0);
            $overallProgress = $scoreCount > 0
                ? round(($quizAvg + $simAvg) / $scoreCount, 1)
                : 0;

            return [
                'id'              => $cat->id,
                'name'            => $cat->name,
                'icon'            => $cat->icon,
                'quiz_count'      => (int) ($quiz->quiz_count ?? 0),
                'quiz_avg_score'  => $quizAvg,
                'sim_count'       => (int) ($sim->sim_count ?? 0),
                'sim_avg_score'   => $simAvg,
                'revision_cards'  => (int) ($rev->rev_count ?? 0),
                'overall_progress' => $overallProgress,
            ];
        })->values();

        return response()->json($result);
    }

    public function strengths(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Gather quiz results with category info
        $quizResults = QuizResult::where('quiz_results.user_id', $userId)
            ->join('quizzes', 'quiz_results.quiz_id', '=', 'quizzes.id')
            ->join('categories', 'quizzes.category_id', '=', 'categories.id')
            ->selectRaw('categories.name as category, quizzes.title as quiz_title, quiz_results.score, quiz_results.total, quiz_results.created_at')
            ->orderBy('quiz_results.created_at', 'desc')
            ->limit(50)
            ->get();

        // Gather simulation results
        $simResults = ExamSimulation::where('user_id', $userId)
            ->where('status', 'completed')
            ->with('category')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        // Category averages
        $categoryAverages = $quizResults->groupBy('category')->map(function ($items) {
            $avg = $items->avg(fn($i) => $i->total > 0 ? ($i->score / $i->total) * 100 : 0);
            return round($avg, 1);
        });

        // Activity pattern
        $totalQuizzes = $quizResults->count();
        $totalSims    = $simResults->count();
        $overallQuizAvg = $totalQuizzes > 0
            ? round($quizResults->avg(fn($i) => $i->total > 0 ? ($i->score / $i->total) * 100 : 0), 1)
            : 0;
        $overallSimAvg = $totalSims > 0
            ? round($simResults->avg('score'), 1)
            : 0;

        // Build AI prompt
        $systemPrompt = <<<PROMPT
Tu es un assistant pédagogique expert en analyse de performance d'étudiants.
Tu analyses les données de performance et fournis des recommandations personnalisées en français.
Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, respectant exactement ce format:
{
  "strengths": ["point fort 1", "point fort 2", "point fort 3"],
  "weaknesses": ["point faible 1", "point faible 2", "point faible 3"],
  "recommendations": ["recommandation 1", "recommandation 2", "recommandation 3", "recommandation 4", "recommandation 5"],
  "motivation": "message de motivation personnalisé"
}
PROMPT;

        $categoryLines = $categoryAverages->map(fn($avg, $cat) => "- {$cat}: {$avg}%")->implode("\n");

        $simLines = $simResults->map(function ($s) {
            $catName = $s->category ? $s->category->name : 'Non catégorisé';
            return "- {$catName}: {$s->score}%";
        })->implode("\n");

        $message = <<<MSG
Voici les données de performance de l'étudiant:

**Quiz réalisés:** {$totalQuizzes}
**Moyenne générale quiz:** {$overallQuizAvg}%

**Scores par catégorie (quiz):**
{$categoryLines}

**Simulations d'examen réalisées:** {$totalSims}
**Moyenne générale simulations:** {$overallSimAvg}%

**Scores par simulation:**
{$simLines}

Analyse ces données et fournis les 3 points forts, 3 points faibles, 5 recommandations personnalisées et un message de motivation.
MSG;

        $aiResponse = AiService::chat($systemPrompt, $message);

        // Attempt to parse JSON from AI response
        $analysis = null;
        $decoded   = json_decode($aiResponse, true);
        if (json_last_error() === JSON_ERROR_NONE && isset($decoded['strengths'])) {
            $analysis = $decoded;
        } else {
            // Fallback: try to extract JSON block from response
            if (preg_match('/\{[\s\S]*\}/m', $aiResponse, $matches)) {
                $decoded = json_decode($matches[0], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $analysis = $decoded;
                }
            }
        }

        return response()->json([
            'analysis'   => $analysis,
            'raw'        => $analysis ? null : $aiResponse,
            'data_summary' => [
                'total_quizzes'    => $totalQuizzes,
                'quiz_avg'         => $overallQuizAvg,
                'total_sims'       => $totalSims,
                'sim_avg'          => $overallSimAvg,
                'categories_count' => $categoryAverages->count(),
            ],
        ]);
    }

    public function timeline(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Quiz results
        $quizItems = QuizResult::where('quiz_results.user_id', $userId)
            ->join('quizzes', 'quiz_results.quiz_id', '=', 'quizzes.id')
            ->join('categories', 'quizzes.category_id', '=', 'categories.id')
            ->selectRaw("
                'quiz' as type,
                quizzes.title as title,
                CAST(quiz_results.score * 100.0 / NULLIF(quiz_results.total, 0) AS INTEGER) as score,
                quiz_results.created_at as date,
                categories.name as category_name
            ")
            ->orderBy('quiz_results.created_at', 'desc')
            ->limit(30)
            ->get();

        // Exam simulations
        $simItems = ExamSimulation::where('exam_simulations.user_id', $userId)
            ->where('status', 'completed')
            ->leftJoin('categories', 'exam_simulations.category_id', '=', 'categories.id')
            ->selectRaw("
                'simulation' as type,
                exam_simulations.title as title,
                CAST(exam_simulations.score AS INTEGER) as score,
                exam_simulations.created_at as date,
                categories.name as category_name
            ")
            ->orderBy('exam_simulations.created_at', 'desc')
            ->limit(30)
            ->get();

        // Revision cards
        $revItems = RevisionCard::where('revision_cards.user_id', $userId)
            ->leftJoin('categories', 'revision_cards.category_id', '=', 'categories.id')
            ->selectRaw("
                'revision' as type,
                revision_cards.title as title,
                NULL as score,
                revision_cards.created_at as date,
                categories.name as category_name
            ")
            ->orderBy('revision_cards.created_at', 'desc')
            ->limit(30)
            ->get();

        // Merge, sort by date descending, take last 30
        $timeline = $quizItems
            ->merge($simItems)
            ->merge($revItems)
            ->sortByDesc('date')
            ->take(30)
            ->values()
            ->map(fn($item) => [
                'type'          => $item->type,
                'title'         => $item->title,
                'score'         => $item->score !== null ? (int) $item->score : null,
                'date'          => $item->date,
                'category_name' => $item->category_name,
            ]);

        return response()->json($timeline);
    }
}
