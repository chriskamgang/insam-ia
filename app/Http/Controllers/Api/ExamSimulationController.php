<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamSimulation;
use App\Services\AiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ExamSimulationController extends Controller
{
    /**
     * List the authenticated user's simulations with optional filters.
     */
    public function index(Request $request)
    {
        $query = ExamSimulation::where('user_id', Auth::id())
            ->with(['exam', 'category'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Start a new exam simulation.
     */
    public function start(Request $request)
    {
        $request->validate([
            'exam_id' => 'required|exists:exams,id',
            'duration_minutes' => 'nullable|integer|min:5|max:480',
        ]);

        $exam = Exam::with('category')->findOrFail($request->exam_id);

        $duration = $request->input('duration_minutes', 60);

        $simulation = ExamSimulation::create([
            'user_id'          => Auth::id(),
            'exam_id'          => $exam->id,
            'category_id'      => $exam->category_id,
            'title'            => $exam->title,
            'duration_minutes' => $duration,
            'started_at'       => now(),
            'status'           => 'in_progress',
        ]);

        return response()->json([
            'simulation' => $simulation,
            'exam'       => [
                'id'        => $exam->id,
                'title'     => $exam->title,
                'filiere'   => $exam->filiere,
                'matiere'   => $exam->matiere,
                'niveau'    => $exam->niveau,
                'annee'     => $exam->annee,
                'file_path' => $exam->file_path,
                'category'  => $exam->category,
            ],
        ], 201);
    }

    /**
     * Submit answers for a simulation and trigger AI evaluation.
     */
    public function submit(Request $request, $id)
    {
        $request->validate([
            'answers' => 'required|string',
        ]);

        $simulation = ExamSimulation::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        if ($simulation->status !== 'in_progress') {
            return response()->json([
                'message' => 'Cette simulation ne peut plus recevoir de réponses (statut: ' . $simulation->status . ').',
            ], 422);
        }

        // Check if time expired
        $deadline = $simulation->started_at->addMinutes($simulation->duration_minutes);
        $isLate   = now()->greaterThan($deadline);

        // Save the answers and mark as completed
        $simulation->update([
            'answers'     => $request->answers,
            'finished_at' => now(),
            'status'      => 'completed',
        ]);

        // Load exam for AI evaluation
        $exam     = Exam::with('category')->find($simulation->exam_id);
        $category = $exam?->category;

        $examTitle    = $exam?->title ?? $simulation->title;
        $categoryName = $category?->name ?? 'Non précisée';
        $examContent  = $exam
            ? "Titre: {$exam->title}\nFilière: {$exam->filiere}\nMatière: {$exam->matiere}\nNiveau: {$exam->niveau}\nAnnée: {$exam->annee}"
            : 'Contenu non disponible.';

        $systemPrompt = 'Tu es un correcteur d\'examen expert et bienveillant. Tu évalues les réponses des étudiants de manière juste, constructive et détaillée.';

        $userMessage = <<<PROMPT
Tu es un correcteur d'examen expert et bienveillant. Évalue les réponses de l'étudiant.

Sujet d'examen: {$examTitle}
Matière: {$categoryName}
Contenu du sujet: {$examContent}

Réponses de l'étudiant:
{$request->answers}

Évalue en donnant:
1. **Note globale**: /100
2. **Évaluation par question**: Pour chaque question identifiable, donne une note et un commentaire
3. **Points forts**: Ce que l'étudiant a bien fait
4. **Points faibles**: Ce qui doit être amélioré
5. **Recommandations**: Conseils pour progresser

Commence ta réponse par "Note: XX/100" sur la première ligne.
Format en Markdown.
PROMPT;

        $aiFeedback = AiService::chat($systemPrompt, $userMessage, [], 3000);

        // Extract numeric score from "Note: XX/100"
        $score = null;
        if (preg_match('/Note\s*:\s*(\d+)\s*\/\s*100/i', $aiFeedback, $matches)) {
            $score = (int) $matches[1];
        }

        $simulation->update([
            'ai_feedback' => $aiFeedback,
            'score'       => $score,
            'status'      => 'evaluated',
        ]);

        $simulation->refresh();

        return response()->json([
            'simulation' => $simulation->load(['exam', 'category']),
            'submitted_late' => $isLate,
        ]);
    }

    /**
     * Show a single simulation (must belong to authenticated user).
     */
    public function show($id)
    {
        $simulation = ExamSimulation::where('id', $id)
            ->where('user_id', Auth::id())
            ->with(['exam', 'category'])
            ->firstOrFail();

        return response()->json($simulation);
    }

    /**
     * Return statistics for the authenticated user.
     */
    public function myStats(Request $request)
    {
        $userId = Auth::id();

        $simulations = ExamSimulation::where('user_id', $userId)->get();

        $total     = $simulations->count();
        $completed = $simulations->whereIn('status', ['completed', 'evaluated'])->count();
        $evaluated = $simulations->where('status', 'evaluated');

        $scores    = $evaluated->pluck('score')->filter()->values();
        $avgScore  = $scores->isNotEmpty() ? round($scores->average(), 1) : null;
        $bestScore = $scores->isNotEmpty() ? $scores->max() : null;

        // Breakdown by category
        $byCategory = $simulations
            ->groupBy('category_id')
            ->map(function ($group) {
                $evalGroup = $group->where('status', 'evaluated');
                $scores    = $evalGroup->pluck('score')->filter()->values();
                return [
                    'category_id'  => $group->first()->category_id,
                    'total'        => $group->count(),
                    'evaluated'    => $evalGroup->count(),
                    'average_score' => $scores->isNotEmpty() ? round($scores->average(), 1) : null,
                    'best_score'   => $scores->isNotEmpty() ? $scores->max() : null,
                ];
            })
            ->values();

        return response()->json([
            'total_simulations' => $total,
            'completed_count'   => $completed,
            'evaluated_count'   => $evaluated->count(),
            'average_score'     => $avgScore,
            'best_score'        => $bestScore,
            'by_category'       => $byCategory,
        ]);
    }
}
