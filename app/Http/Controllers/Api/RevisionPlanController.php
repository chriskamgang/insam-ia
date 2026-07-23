<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UniteEnseignement;
use App\Models\UserCourseProgress;
use App\Models\Exam;
use Illuminate\Http\Request;

class RevisionPlanController extends Controller
{
    /**
     * Get available semesters/years for the user's filiere.
     */
    public function options(Request $request)
    {
        $user = $request->user();
        $filiere = $user->filiere ?? '';

        $ues = UniteEnseignement::where('filiere', $filiere)
            ->select('annee', 'semestre')
            ->distinct()
            ->orderBy('annee')
            ->orderBy('semestre')
            ->get();

        return response()->json([
            'filiere' => $filiere,
            'options' => $ues,
        ]);
    }

    /**
     * Generate a revision plan for BTS exams.
     *
     * Logic:
     * - Get ALL BTS exams for the user's filiere (e.g. 10 exams)
     * - Check which ones the user has been evaluated on (e.g. 2 out of 10)
     * - For evaluated exams with low scores: "Reviser les chapitres de cette UE"
     * - For non-evaluated exams: "Aller lire les cours de cette UE"
     * - Each exam is linked to a UE, so the plan directs to the UE's courses
     */
    public function btsPlan(Request $request)
    {
        $user = $request->user();
        $filiere = $user->filiere ?? '';

        // Get ALL BTS exams for this filiere (with their UE)
        $allExams = Exam::where('filiere', $filiere)
            ->where(function ($q) {
                $q->where('niveau', 'like', '%BTS%')
                    ->orWhereNull('niveau');
            })
            ->with('ue:id,nom,code,annee,semestre')
            ->orderBy('matiere')
            ->get();

        // Get user's evaluations (scores > 0 means actually evaluated)
        $progress = UserCourseProgress::where('user_id', $user->id)
            ->whereIn('type', ['bts_exam', 'bts_quiz'])
            ->where('score', '>', 0)
            ->get();

        // Group exams by UE (or by matiere if no UE linked)
        $grouped = [];
        foreach ($allExams as $exam) {
            $key = $exam->ue_id ? 'ue_' . $exam->ue_id : 'matiere_' . $exam->matiere;
            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'ue' => $exam->ue ? [
                        'id' => $exam->ue->id,
                        'nom' => $exam->ue->nom,
                        'code' => $exam->ue->code,
                        'annee' => $exam->ue->annee,
                        'semestre' => $exam->ue->semestre,
                    ] : [
                        'id' => null,
                        'nom' => $exam->matiere ?? $exam->title,
                        'code' => null,
                        'annee' => null,
                        'semestre' => null,
                    ],
                    'exams' => [],
                ];
            }

            // Check if student was evaluated on this specific exam
            $evaluation = $progress->filter(function ($p) use ($exam) {
                return $p->title === $exam->title
                    || $p->subject === $exam->matiere
                    || ($p->ue_id && $p->ue_id == $exam->ue_id);
            });

            $evaluated = $evaluation->count() > 0;
            $score = $evaluated ? round($evaluation->avg('score'), 1) : null;

            $grouped[$key]['exams'][] = [
                'id' => $exam->id,
                'title' => $exam->title,
                'matiere' => $exam->matiere,
                'evaluated' => $evaluated,
                'score' => $score,
            ];
        }

        // Build the plan per UE group
        $plan = [];
        foreach ($grouped as $group) {
            $exams = $group['exams'];
            $totalExams = count($exams);
            $evaluatedExams = array_filter($exams, fn($e) => $e['evaluated']);
            $evaluatedCount = count($evaluatedExams);
            $notEvaluatedCount = $totalExams - $evaluatedCount;

            // Calculate average score of evaluated exams
            $scores = array_column($evaluatedExams, 'score');
            $avgScore = count($scores) > 0 ? round(array_sum($scores) / count($scores), 1) : null;

            // Determine status and action
            $status = 'not_evaluated';
            $priority = 'normal';
            $action = 'read_course';

            if ($evaluatedCount > 0) {
                if ($avgScore < 50) {
                    $status = 'weak';
                    $priority = 'high';
                    $action = 'revise_chapters';
                } elseif ($avgScore < 70) {
                    $status = 'average';
                    $priority = 'medium';
                    $action = 'revise_chapters';
                } else {
                    $status = 'strong';
                    $priority = 'low';
                    $action = 'maintain';
                }
            }

            $plan[] = [
                'ue' => $group['ue'],
                'total_exams' => $totalExams,
                'evaluated_count' => $evaluatedCount,
                'not_evaluated_count' => $notEvaluatedCount,
                'avg_score' => $avgScore,
                'status' => $status,
                'priority' => $priority,
                'action' => $action,
                'exams' => $exams, // individual exams with their scores
            ];
        }

        // Sort: high priority first (weak evaluated), then not_evaluated, then low
        $priorityOrder = ['high' => 0, 'medium' => 1, 'normal' => 2, 'low' => 3];
        usort($plan, fn($a, $b) => ($priorityOrder[$a['priority']] ?? 9) - ($priorityOrder[$b['priority']] ?? 9));

        // Also get UEs with NO exams at all (student should still read their courses)
        $uesWithoutExams = UniteEnseignement::where('filiere', $filiere)
            ->doesntHave('exams')
            ->get();

        $noExamPlan = [];
        foreach ($uesWithoutExams as $ue) {
            $noExamPlan[] = [
                'ue' => [
                    'id' => $ue->id,
                    'nom' => $ue->nom,
                    'code' => $ue->code,
                    'annee' => $ue->annee,
                    'semestre' => $ue->semestre,
                ],
                'total_exams' => 0,
                'evaluated_count' => 0,
                'not_evaluated_count' => 0,
                'avg_score' => null,
                'status' => 'not_evaluated',
                'priority' => 'normal',
                'action' => 'read_course',
                'exams' => [],
            ];
        }

        $totalExamsAll = array_sum(array_column($plan, 'total_exams'));
        $totalEvaluated = array_sum(array_column($plan, 'evaluated_count'));

        return response()->json([
            'filiere' => $filiere,
            'plan' => $plan,
            'ues_without_exams' => $noExamPlan,
            'summary' => [
                'total_exams' => $totalExamsAll,
                'evaluated' => $totalEvaluated,
                'not_evaluated' => $totalExamsAll - $totalEvaluated,
                'total_ues' => count($plan) + count($noExamPlan),
                'weak' => count(array_filter($plan, fn($p) => $p['status'] === 'weak')),
                'strong' => count(array_filter($plan, fn($p) => $p['status'] === 'strong')),
            ],
        ]);
    }

    /**
     * Generate a revision plan for UE courses by semester.
     * User chooses: année + semestre
     */
    public function semesterPlan(Request $request)
    {
        $request->validate([
            'annee' => 'required|integer|min:1|max:3',
            'semestre' => 'required|integer|in:1,2',
        ]);

        $user = $request->user();
        $filiere = $user->filiere ?? '';

        // Get UEs for this filiere/annee/semestre
        $ues = UniteEnseignement::where('filiere', $filiere)
            ->where('annee', $request->annee)
            ->where('semestre', $request->semestre)
            ->orderBy('sort_order')
            ->get();

        // Get user's UE progress
        $progress = UserCourseProgress::where('user_id', $user->id)
            ->whereIn('type', ['ue_course', 'ue_quiz'])
            ->get();

        $plan = [];

        foreach ($ues as $ue) {
            $evaluations = $progress->filter(function ($p) use ($ue) {
                return $p->ue_id == $ue->id || $p->subject === $ue->nom;
            });

            $courseCompleted = $evaluations->where('course_completed', true)->count() > 0;
            $quizzes = $evaluations->where('quiz_completed', true)->where('score', '>', 0);
            $avgScore = $quizzes->count() > 0 ? round($quizzes->avg('score'), 1) : null;

            $status = 'not_started';
            $action = 'read_course';
            $priority = 'normal';

            if ($courseCompleted && $quizzes->count() > 0) {
                if ($avgScore < 50) {
                    $status = 'weak';
                    $priority = 'high';
                    $action = 'revise';
                } elseif ($avgScore < 70) {
                    $status = 'average';
                    $priority = 'medium';
                    $action = 'practice';
                } else {
                    $status = 'strong';
                    $priority = 'low';
                    $action = 'maintain';
                }
            } elseif ($courseCompleted) {
                $status = 'course_done';
                $priority = 'medium';
                $action = 'take_quiz';
            }

            $plan[] = [
                'ue' => [
                    'id' => $ue->id,
                    'nom' => $ue->nom,
                    'code' => $ue->code,
                    'coefficient' => $ue->coefficient,
                ],
                'course_completed' => $courseCompleted,
                'quizzes_done' => $quizzes->count(),
                'avg_score' => $avgScore,
                'status' => $status,
                'priority' => $priority,
                'action' => $action,
            ];
        }

        $priorityOrder = ['high' => 0, 'medium' => 1, 'normal' => 2, 'low' => 3];
        usort($plan, fn($a, $b) => ($priorityOrder[$a['priority']] ?? 9) - ($priorityOrder[$b['priority']] ?? 9));

        return response()->json([
            'filiere' => $filiere,
            'annee' => $request->annee,
            'semestre' => $request->semestre,
            'plan' => $plan,
            'summary' => [
                'total_ues' => $ues->count(),
                'courses_completed' => collect($plan)->where('course_completed', true)->count(),
                'weak' => collect($plan)->where('status', 'weak')->count(),
                'not_started' => collect($plan)->where('status', 'not_started')->count(),
            ],
        ]);
    }

    /**
     * List all UEs (for admin or reference).
     */
    public function ues(Request $request)
    {
        $filiere = $request->query('filiere', $request->user()->filiere ?? '');

        $ues = UniteEnseignement::where('filiere', $filiere)
            ->orderBy('annee')
            ->orderBy('semestre')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['ues' => $ues]);
    }
}
