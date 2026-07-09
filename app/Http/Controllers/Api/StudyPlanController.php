<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\ExamSimulation;
use App\Models\QuizResult;
use App\Models\StudyPlan;
use App\Models\StudyTask;
use App\Services\AiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudyPlanController extends Controller
{
    /**
     * List the authenticated user's study plans with task counts.
     */
    public function index(Request $request)
    {
        $query = StudyPlan::where('user_id', Auth::id())
            ->with('category')
            ->withCount([
                'tasks',
                'tasks as completed_tasks_count' => fn ($q) => $q->where('completed', true),
            ])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    /**
     * Show a single plan with all tasks ordered by due_date, sort_order.
     */
    public function show($id)
    {
        $plan = StudyPlan::where('id', $id)
            ->where('user_id', Auth::id())
            ->with(['category', 'tasks' => fn ($q) => $q->orderBy('due_date')->orderBy('sort_order')])
            ->firstOrFail();

        return response()->json($plan);
    }

    /**
     * AI-generate a study plan based on category and exam date.
     */
    public function generate(Request $request)
    {
        $request->validate([
            'category_id'   => 'required|exists:categories,id',
            'exam_date'     => 'required|date|after:today',
            'hours_per_day' => 'nullable|integer|min:1|max:12',
        ]);

        $hoursPerDay = $request->input('hours_per_day', 2);
        $examDate    = $request->input('exam_date');
        $today       = now()->toDateString();

        $category = Category::with(['roadmapSteps', 'knowledgeDocuments'])
            ->findOrFail($request->category_id);

        // Collect user's quiz scores for this category to identify weak areas
        $quizResults = QuizResult::where('user_id', Auth::id())
            ->whereHas('quiz', fn ($q) => $q->where('category_id', $category->id))
            ->with('quiz')
            ->orderByDesc('created_at')
            ->take(10)
            ->get();

        $simulationResults = ExamSimulation::where('user_id', Auth::id())
            ->where('category_id', $category->id)
            ->whereNotNull('score')
            ->orderByDesc('created_at')
            ->take(5)
            ->get();

        // Build context for the prompt
        $roadmapContext = '';
        if ($category->roadmapSteps->isNotEmpty()) {
            $steps = $category->roadmapSteps->map(fn ($s) => "- {$s->title}");
            $roadmapContext = "Étapes du programme:\n" . $steps->implode("\n");
        }

        $weakAreasContext = '';
        if ($quizResults->isNotEmpty()) {
            $weakAreas = $quizResults->map(function ($r) {
                $pct = $r->total > 0 ? round(($r->score / $r->total) * 100) : 0;
                return "- {$r->quiz->title}: {$r->score}/{$r->total} ({$pct}%)";
            });
            $weakAreasContext = "\nRésultats quiz récents de l'étudiant:\n" . $weakAreas->implode("\n");
        }

        if ($simulationResults->isNotEmpty()) {
            $simLines = $simulationResults->map(fn ($s) => "- {$s->title}: {$s->score}/100");
            $weakAreasContext .= "\nSimulations d'examen récentes:\n" . $simLines->implode("\n");
        }

        $systemPrompt = 'Tu es un assistant pédagogique expert en planification d\'études. Tu génères des plans de révision structurés et adaptés aux besoins de l\'étudiant. Tu réponds uniquement en JSON valide.';

        $userMessage = <<<PROMPT
Crée un plan de révision détaillé pour un étudiant préparant un examen en {$category->name}.

Informations:
- Date d'aujourd'hui: {$today}
- Date de l'examen: {$examDate}
- Heures de travail par jour: {$hoursPerDay}h

{$roadmapContext}
{$weakAreasContext}

Génère un plan de révision avec des tâches quotidiennes réparties entre aujourd'hui et la date d'examen.
Les types de tâches disponibles sont: revision, quiz, exercise, exam_prep, video, other.
Les priorités disponibles sont: low, medium, high.

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans blocs de code) au format suivant:
{
  "title": "Plan de révision - {$category->name}",
  "description": "...",
  "tasks": [
    {"title": "...", "description": "...", "due_date": "YYYY-MM-DD", "type": "revision", "priority": "medium"}
  ]
}
PROMPT;

        $aiResponse = AiService::chat($systemPrompt, $userMessage, [], 4000);

        // Extract JSON from the AI response
        $jsonString = $aiResponse;
        if (preg_match('/```(?:json)?\s*([\s\S]+?)\s*```/i', $aiResponse, $matches)) {
            $jsonString = $matches[1];
        } elseif (preg_match('/(\{[\s\S]+\})/s', $aiResponse, $matches)) {
            $jsonString = $matches[1];
        }

        $data = json_decode($jsonString, true);

        if (!$data || !isset($data['tasks']) || !is_array($data['tasks'])) {
            return response()->json([
                'message' => 'L\'IA n\'a pas pu générer un plan valide. Veuillez réessayer.',
                'raw'     => $aiResponse,
            ], 422);
        }

        // Create the study plan
        $plan = StudyPlan::create([
            'user_id'     => Auth::id(),
            'category_id' => $category->id,
            'title'       => $data['title'] ?? "Plan de révision - {$category->name}",
            'description' => $data['description'] ?? null,
            'start_date'  => $today,
            'end_date'    => $examDate,
            'status'      => 'active',
        ]);

        // Create the tasks
        $allowedTypes      = ['revision', 'quiz', 'exercise', 'exam_prep', 'video', 'other'];
        $allowedPriorities = ['low', 'medium', 'high'];

        foreach ($data['tasks'] as $index => $taskData) {
            if (empty($taskData['title']) || empty($taskData['due_date'])) {
                continue;
            }

            StudyTask::create([
                'study_plan_id' => $plan->id,
                'title'         => $taskData['title'],
                'description'   => $taskData['description'] ?? null,
                'due_date'      => $taskData['due_date'],
                'type'          => in_array($taskData['type'] ?? '', $allowedTypes) ? $taskData['type'] : 'revision',
                'priority'      => in_array($taskData['priority'] ?? '', $allowedPriorities) ? $taskData['priority'] : 'medium',
                'sort_order'    => $index,
            ]);
        }

        $plan->load(['category', 'tasks' => fn ($q) => $q->orderBy('due_date')->orderBy('sort_order')]);

        return response()->json($plan, 201);
    }

    /**
     * Manually create a study plan with optional tasks.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title'              => 'required|string|max:255',
            'description'        => 'nullable|string',
            'category_id'        => 'nullable|exists:categories,id',
            'start_date'         => 'required|date',
            'end_date'           => 'required|date|after_or_equal:start_date',
            'tasks'              => 'nullable|array',
            'tasks.*.title'      => 'required|string|max:255',
            'tasks.*.description'=> 'nullable|string',
            'tasks.*.due_date'   => 'required|date',
            'tasks.*.type'       => 'nullable|in:revision,quiz,exercise,exam_prep,video,other',
            'tasks.*.priority'   => 'nullable|in:low,medium,high',
        ]);

        $plan = StudyPlan::create([
            'user_id'     => Auth::id(),
            'category_id' => $request->category_id,
            'title'       => $request->title,
            'description' => $request->description,
            'start_date'  => $request->start_date,
            'end_date'    => $request->end_date,
            'status'      => 'active',
        ]);

        if ($request->filled('tasks')) {
            foreach ($request->tasks as $index => $taskData) {
                StudyTask::create([
                    'study_plan_id' => $plan->id,
                    'title'         => $taskData['title'],
                    'description'   => $taskData['description'] ?? null,
                    'due_date'      => $taskData['due_date'],
                    'type'          => $taskData['type'] ?? 'revision',
                    'priority'      => $taskData['priority'] ?? 'medium',
                    'sort_order'    => $index,
                ]);
            }
        }

        $plan->load(['category', 'tasks' => fn ($q) => $q->orderBy('due_date')->orderBy('sort_order')]);

        return response()->json($plan, 201);
    }

    /**
     * Toggle a task's completed status.
     */
    public function toggleTask(Request $request, $planId, $taskId)
    {
        $plan = StudyPlan::where('id', $planId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $task = StudyTask::where('id', $taskId)
            ->where('study_plan_id', $plan->id)
            ->firstOrFail();

        $nowCompleted = !$task->completed;

        $task->update([
            'completed'    => $nowCompleted,
            'completed_at' => $nowCompleted ? now() : null,
        ]);

        return response()->json($task->fresh());
    }

    /**
     * Add a task to an existing plan.
     */
    public function addTask(Request $request, $planId)
    {
        $plan = StudyPlan::where('id', $planId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date'    => 'required|date',
            'due_time'    => 'nullable|date_format:H:i',
            'type'        => 'nullable|in:revision,quiz,exercise,exam_prep,video,other',
            'priority'    => 'nullable|in:low,medium,high',
        ]);

        $maxOrder = StudyTask::where('study_plan_id', $plan->id)->max('sort_order') ?? -1;

        $task = StudyTask::create([
            'study_plan_id' => $plan->id,
            'title'         => $request->title,
            'description'   => $request->description,
            'due_date'      => $request->due_date,
            'due_time'      => $request->due_time,
            'type'          => $request->input('type', 'revision'),
            'priority'      => $request->input('priority', 'medium'),
            'sort_order'    => $maxOrder + 1,
        ]);

        return response()->json($task, 201);
    }

    /**
     * Delete a plan and its tasks.
     */
    public function destroy($id)
    {
        $plan = StudyPlan::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $plan->delete();

        return response()->json(['message' => 'Plan supprimé avec succès.']);
    }

    /**
     * Get all tasks due today across all active plans.
     */
    public function todayTasks(Request $request)
    {
        $today = now()->toDateString();

        $tasks = StudyTask::whereHas('plan', function ($q) {
                $q->where('user_id', Auth::id())->where('status', 'active');
            })
            ->with(['plan:id,title,category_id', 'plan.category:id,name'])
            ->where('due_date', $today)
            ->orderBy('completed')
            ->orderByRaw("FIELD(priority, 'high', 'medium', 'low')")
            ->orderBy('sort_order')
            ->get();

        return response()->json($tasks);
    }
}
