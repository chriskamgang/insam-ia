<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizResult;
use App\Services\AiService;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function index()
    {
        $quizzes = Quiz::with('category:id,name')
            ->where('is_published', true)
            ->latest()
            ->get();

        return response()->json(['quizzes' => $quizzes]);
    }

    public function show($id)
    {
        $quiz = Quiz::with(['category:id,name', 'questions'])->findOrFail($id);

        $quiz->questions->each(function ($question) {
            $question->makeHidden('correct_answer');
        });

        return response()->json(['quiz' => $quiz]);
    }

    public function submit(Request $request, $id)
    {
        $request->validate([
            'answers' => 'required|array',
        ]);

        $quiz = Quiz::with(['questions', 'category:id,name'])->findOrFail($id);

        $answers = $request->answers;
        $score = 0;
        $total = $quiz->questions->count();
        $corrections = [];

        foreach ($quiz->questions as $question) {
            $submitted = $answers[$question->id] ?? null;
            $isCorrect = $submitted !== null && (int) $submitted === (int) $question->correct_answer;

            if ($isCorrect) {
                $score++;
            }

            $options = is_array($question->options) ? $question->options : json_decode($question->options, true);

            $corrections[] = [
                'question_id' => $question->id,
                'question' => $question->question,
                'options' => $options,
                'submitted' => $submitted !== null ? (int) $submitted : null,
                'correct_answer' => (int) $question->correct_answer,
                'is_correct' => $isCorrect,
                'explanation' => $question->explanation,
            ];
        }

        $result = QuizResult::create([
            'quiz_id'      => $quiz->id,
            'user_id'      => $request->user()->id,
            'score'        => $score,
            'total'        => $total,
            'answers'      => $answers,
            'corrections'  => $corrections,
            'completed_at' => now(),
        ]);

        // Generate AI feedback asynchronously-ish (inline for now)
        try {
            $aiFeedback = $this->generateAiFeedback($quiz, $corrections, $score, $total);
            $result->update(['ai_feedback' => $aiFeedback]);
        } catch (\Throwable $e) {
            // AI feedback is optional, don't fail the submission
        }

        $result->refresh();

        return response()->json([
            'score'       => $score,
            'total'       => $total,
            'percent'     => $total > 0 ? round(($score / $total) * 100) : 0,
            'result'      => $result,
            'corrections' => $corrections,
        ]);
    }

    private function generateAiFeedback(Quiz $quiz, array $corrections, int $score, int $total): string
    {
        $percent = $total > 0 ? round(($score / $total) * 100) : 0;
        $categoryName = $quiz->category?->name ?? 'General';

        $questionsText = '';
        foreach ($corrections as $i => $c) {
            $status = $c['is_correct'] ? 'CORRECT' : 'INCORRECT';
            $options = $c['options'] ?? [];
            $submittedText = isset($c['submitted']) && isset($options[$c['submitted']]) ? $options[$c['submitted']] : 'Pas de reponse';
            $correctText = isset($options[$c['correct_answer']]) ? $options[$c['correct_answer']] : '?';

            $questionsText .= ($i + 1) . ". [{$status}] {$c['question']}\n";
            $questionsText .= "   Reponse etudiant: {$submittedText}\n";
            $questionsText .= "   Bonne reponse: {$correctText}\n\n";
        }

        $systemPrompt = "Tu es un professeur bienveillant et pedagogique. Tu corriges les evaluations des etudiants en donnant des explications claires et encourageantes. Reponds en francais.";

        $userMessage = <<<PROMPT
Corrige cette evaluation et donne un feedback detaille.

Quiz: {$quiz->title}
Matiere: {$categoryName}
Score: {$score}/{$total} ({$percent}%)

Detail des reponses:
{$questionsText}

Donne:
1. **Appreciation generale** (2-3 phrases encourageantes)
2. **Corrections detaillees**: Pour chaque question incorrecte, explique pourquoi la bonne reponse est correcte et pourquoi la reponse de l'etudiant est fausse
3. **Conseils** pour ameliorer ses connaissances dans ce domaine

Format en Markdown. Sois pedagogique et encourageant.
PROMPT;

        return AiService::chat($systemPrompt, $userMessage, [], 2500);
    }

    public function myResults(Request $request)
    {
        $results = QuizResult::with('quiz:id,title')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['results' => $results]);
    }
}
