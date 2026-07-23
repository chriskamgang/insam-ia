<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserCourseProgress;
use App\Services\AiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CourseProgressController extends Controller
{
    /**
     * Save progress after completing a course or quiz.
     */
    public function store(Request $request)
    {
        $request->validate([
            'type'            => 'required|in:bts_exam,ue_course,ue_quiz,bts_quiz',
            'subject'         => 'required|string|max:255',
            'title'           => 'required|string|max:255',
            'score'           => 'required|numeric|min:0|max:100',
            'total_questions'  => 'nullable|integer',
            'correct_answers'  => 'nullable|integer',
            'course_completed' => 'nullable|boolean',
            'quiz_completed'   => 'nullable|boolean',
            'details'         => 'nullable|array',
        ]);

        $progress = UserCourseProgress::create([
            'user_id'          => $request->user()->id,
            'type'             => $request->type,
            'subject'          => $request->subject,
            'title'            => $request->title,
            'score'            => $request->score,
            'total_questions'  => $request->total_questions,
            'correct_answers'  => $request->correct_answers,
            'course_completed' => $request->course_completed ?? false,
            'quiz_completed'   => $request->quiz_completed ?? false,
            'details'          => $request->details,
        ]);

        return response()->json(['progress' => $progress], 201);
    }

    /**
     * Mark a course as completed ("Terminé").
     */
    public function markCompleted(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'title'   => 'required|string|max:255',
        ]);

        $progress = UserCourseProgress::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'type'    => 'ue_course',
                'subject' => $request->subject,
                'title'   => $request->title,
            ],
            ['course_completed' => true]
        );

        return response()->json(['progress' => $progress]);
    }

    /**
     * Check if a course is completed (for enabling revision quiz).
     */
    public function checkCompleted(Request $request)
    {
        $completed = UserCourseProgress::where('user_id', $request->user()->id)
            ->where('type', 'ue_course')
            ->where('subject', $request->subject)
            ->where('title', $request->title)
            ->where('course_completed', true)
            ->exists();

        return response()->json(['completed' => $completed]);
    }

    /**
     * BTS exam progression: histogram data per UE.
     */
    public function btsProgression(Request $request)
    {
        $userId = $request->user()->id;

        // Get BTS quiz scores grouped by subject (only entries with actual scores)
        $examScores = UserCourseProgress::where('user_id', $userId)
            ->whereIn('type', ['bts_exam', 'bts_quiz'])
            ->where('score', '>', 0)
            ->select('subject')
            ->selectRaw('AVG(score) as avg_score')
            ->selectRaw('MAX(score) as best_score')
            ->selectRaw('COUNT(*) as attempts')
            ->selectRaw('SUM(CASE WHEN quiz_completed = 1 THEN 1 ELSE 0 END) as quizzes_done')
            ->groupBy('subject')
            ->orderBy('subject')
            ->get();

        // Timeline: last 10 BTS attempts with actual scores
        $timeline = UserCourseProgress::where('user_id', $userId)
            ->whereIn('type', ['bts_exam', 'bts_quiz'])
            ->where('score', '>', 0)
            ->select('subject', 'title', 'score', 'type', 'created_at')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Overall BTS stats (only scored entries)
        $overall = UserCourseProgress::where('user_id', $userId)
            ->whereIn('type', ['bts_exam', 'bts_quiz'])
            ->where('score', '>', 0)
            ->selectRaw('AVG(score) as avg_score, COUNT(*) as total, MAX(score) as best')
            ->first();

        // Count of exams studied (course_completed)
        $examsStudied = UserCourseProgress::where('user_id', $userId)
            ->where('type', 'bts_exam')
            ->where('course_completed', true)
            ->count();

        return response()->json([
            'subjects' => $examScores,
            'timeline' => $timeline,
            'exams_studied' => $examsStudied,
            'overall'  => [
                'avg_score' => round($overall->avg_score ?? 0, 1),
                'total'     => (int) ($overall->total ?? 0),
                'best'      => round($overall->best ?? 0, 1),
            ],
        ]);
    }

    /**
     * UE progression: histogram data per UE/course.
     */
    public function ueProgression(Request $request)
    {
        $userId = $request->user()->id;

        // Get UE quiz scores grouped by subject (only entries with actual scores)
        $ueScores = UserCourseProgress::where('user_id', $userId)
            ->whereIn('type', ['ue_course', 'ue_quiz'])
            ->where('score', '>', 0)
            ->select('subject')
            ->selectRaw('AVG(score) as avg_score')
            ->selectRaw('MAX(score) as best_score')
            ->selectRaw('COUNT(*) as attempts')
            ->selectRaw('SUM(CASE WHEN course_completed = 1 THEN 1 ELSE 0 END) as courses_completed')
            ->selectRaw('SUM(CASE WHEN quiz_completed = 1 THEN 1 ELSE 0 END) as quizzes_done')
            ->groupBy('subject')
            ->orderBy('subject')
            ->get();

        // Timeline: last 10 UE attempts with scores
        $timeline = UserCourseProgress::where('user_id', $userId)
            ->whereIn('type', ['ue_course', 'ue_quiz'])
            ->where('score', '>', 0)
            ->select('subject', 'title', 'score', 'type', 'course_completed', 'quiz_completed', 'created_at')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Overall UE stats (only scored entries)
        $overall = UserCourseProgress::where('user_id', $userId)
            ->whereIn('type', ['ue_course', 'ue_quiz'])
            ->where('score', '>', 0)
            ->selectRaw('AVG(score) as avg_score, COUNT(*) as total, MAX(score) as best')
            ->first();

        // Count of courses completed
        $coursesCompleted = UserCourseProgress::where('user_id', $userId)
            ->where('type', 'ue_course')
            ->where('course_completed', true)
            ->count();

        return response()->json([
            'subjects' => $ueScores,
            'timeline' => $timeline,
            'courses_completed' => $coursesCompleted,
            'overall'  => [
                'avg_score' => round($overall->avg_score ?? 0, 1),
                'total'     => (int) ($overall->total ?? 0),
                'best'      => round($overall->best ?? 0, 1),
            ],
        ]);
    }

    /**
     * Generate a revision quiz for a subject (only if course completed).
     */
    public function revisionQuiz(Request $request)
    {
        $request->validate([
            'subject'        => 'required|string',
            'title'          => 'required|string',
            'num_questions'  => 'nullable|integer|min:3|max:20',
        ]);

        $userId = $request->user()->id;

        // Check if the course is completed
        $completed = UserCourseProgress::where('user_id', $userId)
            ->where('type', 'ue_course')
            ->where('subject', $request->subject)
            ->where('title', $request->title)
            ->where('course_completed', true)
            ->exists();

        if (!$completed) {
            return response()->json([
                'error' => 'Vous devez terminer le cours avant de passer au quiz de revision.',
                'course_completed' => false,
            ], 422);
        }

        $numQ = $request->num_questions ?? 10;

        $systemPrompt = "Tu es un professeur universitaire expert. Tu generes des QCM de revision pour evaluer les acquis d'un cours. Reponds en JSON strict.";

        $userMessage = <<<PROMPT
Genere {$numQ} questions QCM de revision pour le cours "{$request->title}" de la matiere/UE "{$request->subject}".

Les questions doivent couvrir les points essentiels du cours et evaluer la comprehension.

Reponds UNIQUEMENT avec un JSON: un tableau de questions. Chaque question:
- "question": la question
- "options": tableau de 4 propositions
- "correct": index de la bonne reponse (0-3)
- "explanation": explication de la bonne reponse

Reponds UNIQUEMENT avec le JSON, sans texte avant ou apres.
PROMPT;

        $response = AiService::chat($systemPrompt, $userMessage, [], 4000);

        $json = $response;
        if (preg_match('/\[[\s\S]*\]/', $response, $matches)) {
            $json = $matches[0];
        }
        $questions = json_decode($json, true);

        if (!is_array($questions) || empty($questions)) {
            return response()->json(['error' => 'Impossible de generer le quiz. Reessayez.'], 422);
        }

        return response()->json([
            'questions' => $questions,
            'course_completed' => true,
        ]);
    }
}
