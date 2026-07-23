<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\KnowledgeDocument;
use App\Services\AiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ExamController extends Controller
{
    public function index(Request $request)
    {
        $query = Exam::with('category:id,name');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('filiere')) {
            $query->where('filiere', $request->filiere);
        }

        if ($request->filled('matiere')) {
            $query->where('matiere', $request->matiere);
        }

        if ($request->filled('niveau')) {
            $query->where('niveau', $request->niveau);
        }

        if ($request->filled('annee')) {
            $query->where('annee', $request->annee);
        }

        $exams = $query->latest()->get();

        return response()->json(['exams' => $exams]);
    }

    public function show($id)
    {
        $exam = Exam::with('category:id,name')->findOrFail($id);

        return response()->json(['exam' => $exam]);
    }

    public function download($id)
    {
        $exam = Exam::findOrFail($id);

        if (!$exam->file_path || !Storage::exists($exam->file_path)) {
            return response()->json(['message' => 'Fichier introuvable.'], 404);
        }

        $exam->increment('downloads_count');

        return Storage::download($exam->file_path, $exam->title . '.pdf');
    }

    /**
     * Serve a file as PDF (convert doc/docx via LibreOffice if needed).
     */
    public function viewPdf(Request $request)
    {
        $path = $request->query('path');
        if (!$path || !Storage::disk('public')->exists($path)) {
            abort(404, 'Fichier introuvable.');
        }

        $fullPath = Storage::disk('public')->path($path);
        $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));

        if ($ext === 'pdf') {
            return response()->file($fullPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline',
            ]);
        }

        // Convert doc/docx to PDF via LibreOffice
        $cacheDir = storage_path('app/pdf-cache');
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }

        $hash = md5($path . filemtime($fullPath));
        $pdfPath = $cacheDir . '/' . $hash . '.pdf';

        if (!file_exists($pdfPath)) {
            $tmpDir = sys_get_temp_dir() . '/lo_convert_' . $hash;
            mkdir($tmpDir, 0755, true);
            $cmd = sprintf(
                'HOME=/var/www libreoffice --headless --convert-to pdf --outdir %s %s 2>&1',
                escapeshellarg($tmpDir),
                escapeshellarg($fullPath)
            );
            exec($cmd, $output, $returnCode);

            $baseName = pathinfo($fullPath, PATHINFO_FILENAME) . '.pdf';
            $convertedFile = $tmpDir . '/' . $baseName;

            if ($returnCode !== 0 || !file_exists($convertedFile)) {
                // Cleanup
                @array_map('unlink', glob("$tmpDir/*"));
                @rmdir($tmpDir);
                abort(500, 'Conversion echouee.');
            }

            rename($convertedFile, $pdfPath);
            @array_map('unlink', glob("$tmpDir/*"));
            @rmdir($tmpDir);
        }

        return response()->file($pdfPath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline',
        ]);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'matiere'     => 'required|string|max:255',
            'filiere'     => 'required|string|max:255',
            'niveau'      => 'required|string|max:255',
            'annee'       => 'required|string|max:10',
            'category_id' => 'nullable|exists:categories,id',
            'file'        => 'required|file|mimes:pdf,doc,docx|max:20480',
        ]);

        $file = $request->file('file');
        $path = $file->store('exams', 'public');

        // Extract text content for knowledge base
        $content = null;
        if ($file->getClientOriginalExtension() === 'pdf') {
            // Basic text extraction attempt; parsers may not be installed
            try {
                $content = file_get_contents($file->getRealPath());
            } catch (\Throwable $e) {
                $content = null;
            }
        }

        $exam = Exam::create([
            'title'       => $request->title,
            'category_id' => $request->category_id,
            'filiere'     => $request->filiere,
            'matiere'     => $request->matiere,
            'niveau'      => $request->niveau,
            'annee'       => $request->annee,
            'file_path'   => $path,
            'uploaded_by' => $request->user()->id,
            'source'      => 'student',
        ]);

        // Store in knowledge documents so the AI can reference this exam
        KnowledgeDocument::create([
            'title'       => "Examen : {$request->title} ({$request->matiere} - {$request->annee})",
            'filename'    => $file->getClientOriginalName(),
            'content'     => $content ?? "Examen de {$request->matiere} pour la filiere {$request->filiere}, niveau {$request->niveau}, annee {$request->annee}.",
            'type'        => 'exam',
            'category_id' => $request->category_id,
        ]);

        return response()->json(['exam' => $exam], 201);
    }

    /**
     * Generate AI correction/solution for an exam.
     */
    public function aiCorrection($id)
    {
        $exam = Exam::with('category:id,name')->findOrFail($id);

        // Check if we already have a cached correction
        if ($exam->correction_path && Storage::exists($exam->correction_path)) {
            return response()->json([
                'correction' => Storage::get($exam->correction_path),
                'cached' => true,
            ]);
        }

        $categoryName = $exam->category?->name ?? 'General';

        $systemPrompt = "Tu es un professeur universitaire expert. Tu produis des corriges types detailles et pedagogiques pour les epreuves d'examen. Reponds en francais.";

        $userMessage = <<<PROMPT
Genere un corrige type detaille pour cette epreuve d'examen.

Titre: {$exam->title}
Matiere: {$exam->matiere}
Filiere: {$exam->filiere}
Niveau: {$exam->niveau}
Annee: {$exam->annee}
Categorie: {$categoryName}

Donne un corrige complet avec:
1. **Rappel du sujet** (resume les questions probables basees sur le titre et la matiere)
2. **Corrige detaille** pour chaque partie/question probable
3. **Methodologie** - comment aborder ce type d'examen
4. **Points cles** a retenir pour cette matiere
5. **Bareme indicatif** suggere

Si tu ne connais pas le contenu exact du sujet, genere un corrige type base sur le titre, la matiere et le niveau. Sois le plus precis et utile possible.

Format en Markdown bien structure.
PROMPT;

        $correction = AiService::chat($systemPrompt, $userMessage, [], 4000);

        // Cache the correction
        $path = "exam-corrections/{$exam->id}.md";
        Storage::put($path, $correction);
        $exam->update(['correction_path' => $path, 'is_corrected' => true]);

        return response()->json([
            'correction' => $correction,
            'cached' => false,
        ]);
    }

    /**
     * Generate new exercises based on past exams for a given matiere/filiere.
     */
    public function generateExercises(Request $request)
    {
        $request->validate([
            'matiere'  => 'required|string',
            'filiere'  => 'nullable|string',
            'niveau'   => 'nullable|string',
        ]);

        // Find past exams matching criteria
        $query = Exam::query();
        $query->where('matiere', 'like', "%{$request->matiere}%");
        if ($request->filled('filiere')) {
            $query->where('filiere', 'like', "%{$request->filiere}%");
        }
        if ($request->filled('niveau')) {
            $query->where('niveau', $request->niveau);
        }
        $pastExams = $query->latest()->limit(10)->get();

        $examContext = '';
        foreach ($pastExams as $ex) {
            $examContext .= "- {$ex->title} ({$ex->matiere}, {$ex->niveau}, {$ex->annee})\n";
        }

        if (empty($examContext)) {
            $examContext = "Aucun ancien sujet specifique trouve. Genere des exercices standards pour cette matiere.";
        }

        $systemPrompt = "Tu es un professeur universitaire camerounais expert. Tu crees des epreuves d'examen realistes basees sur les anciens sujets. Reponds en francais.";

        $userMessage = <<<PROMPT
En te basant sur ces anciens sujets:
{$examContext}

Genere une epreuve complete pour:
- Matiere: {$request->matiere}
- Filiere: {$request->filiere}
- Niveau: {$request->niveau}

L'epreuve doit contenir:
1. **En-tete** (institution, matiere, duree, session)
2. **Exercice 1** - Questions de cours (5-8 questions)
3. **Exercice 2** - Exercice pratique/calcul
4. **Exercice 3** - Etude de cas ou probleme
5. **Bareme** detaille

Format en Markdown bien structure. Sois realiste et adapte au niveau.
PROMPT;

        $content = AiService::chat($systemPrompt, $userMessage, [], 4000);

        return response()->json(['exercise' => $content]);
    }

    /**
     * Submit an exam and get AI correction simultaneously.
     */
    public function submitAndCorrect(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'matiere'     => 'required|string|max:255',
            'filiere'     => 'required|string|max:255',
            'niveau'      => 'required|string|max:255',
            'content'     => 'required|string',
            'category_id' => 'nullable|exists:categories,id',
        ]);

        $user = $request->user();

        // Store the exam content as a file
        $filename = 'exams/generated_' . time() . '.md';
        Storage::disk('public')->put($filename, $request->content);

        $exam = Exam::withoutEvents(fn () => Exam::create([
            'title'       => $request->title,
            'category_id' => $request->category_id,
            'filiere'     => $request->filiere,
            'matiere'     => $request->matiere,
            'niveau'      => $request->niveau,
            'annee'       => date('Y'),
            'file_path'   => $filename,
            'uploaded_by' => $user->id,
            'source'      => 'student',
        ]));

        // Also store in knowledge documents
        KnowledgeDocument::create([
            'title'       => "Epreuve : {$request->title} ({$request->matiere})",
            'filename'    => basename($filename),
            'content'     => $request->content,
            'type'        => 'exam',
            'category_id' => $request->category_id,
        ]);

        // Generate correction
        $systemPrompt = "Tu es un professeur universitaire expert. Tu produis des corriges types detailles et pedagogiques. Reponds en francais.";

        $userMessage = <<<PROMPT
Voici une epreuve d'examen a corriger:

{$request->content}

Matiere: {$request->matiere}
Filiere: {$request->filiere}
Niveau: {$request->niveau}

Donne un corrige complet et detaille avec:
1. **Corrige detaille** pour chaque exercice/question
2. **Explication** pedagogique de chaque reponse
3. **Bareme** indicatif
4. **Points cles** a retenir

Format en Markdown bien structure.
PROMPT;

        $correction = AiService::chat($systemPrompt, $userMessage, [], 4000);

        // Cache the correction
        $correctionPath = "exam-corrections/{$exam->id}.md";
        Storage::put($correctionPath, $correction);
        $exam->update(['correction_path' => $correctionPath, 'is_corrected' => true]);

        return response()->json([
            'exam' => $exam,
            'correction' => $correction,
        ]);
    }

    /**
     * Correct student answers for an exam using AI.
     */
    public function correctAnswers(Request $request)
    {
        $request->validate([
            'exam_id' => 'required|exists:exams,id',
            'answers' => 'required|string|min:10',
            'time_spent' => 'nullable|integer',
        ]);

        $exam = Exam::with('category:id,name')->findOrFail($request->exam_id);

        $systemPrompt = "Tu es un professeur universitaire expert et bienveillant. Tu corriges les copies d'etudiants de maniere detaillee et pedagogique. Tu donnes une note sur 20 et des explications claires. Reponds en francais.";

        $userMessage = <<<PROMPT
Corrige les reponses de cet etudiant pour l'epreuve suivante:

**Epreuve:** {$exam->title}
**Matiere:** {$exam->matiere}
**Filiere:** {$exam->filiere}
**Niveau:** {$exam->niveau}

**Reponses de l'etudiant:**
{$request->answers}

Donne:
1. Une **note sur 20** (sois juste mais encourageant)
2. Pour chaque reponse: ce qui est **correct**, ce qui est **incorrect**, et la **bonne reponse**
3. Des **conseils** pour s'ameliorer
4. Un **resume** des points forts et faibles

Commence ta reponse par la note au format: NOTE: XX/20
Puis donne le detail de la correction.
PROMPT;

        $correction = AiService::chat($systemPrompt, $userMessage, [], 4000);

        // Extract note
        $note = null;
        if (preg_match('/NOTE\s*:\s*(\d+(?:\.\d+)?)\s*\/\s*20/i', $correction, $m)) {
            $note = floatval($m[1]);
        }

        return response()->json([
            'correction' => [
                'note' => $note,
                'details' => $correction,
                'time_spent' => $request->time_spent,
            ],
        ]);
    }

    /**
     * Summarize a course (full or partial).
     */
    public function summarizeCourse(Request $request)
    {
        $request->validate([
            'course_title'   => 'required|string',
            'course_content' => 'nullable|string',
            'partial'        => 'nullable|string',
            'filiere'        => 'nullable|string',
        ]);

        $content = $request->course_content ?? '';
        $partial = $request->partial;

        $systemPrompt = "Tu es un professeur universitaire camerounais expert en pedagogie. Tu fais des resumes de cours clairs, structures et pedagogiques qui insistent sur les points essentiels. Reponds en francais.";

        if ($partial) {
            $userMessage = <<<PROMPT
Resume cette partie specifique du cours "{$request->course_title}":

Partie a resumer: {$partial}

Contenu du cours:
{$content}

Fais un resume condense qui:
1. Identifie les **concepts cles** de cette partie
2. Explique les points les plus importants
3. Donne des **exemples concrets** si possible
4. Termine par les **points a retenir absolument**

Format en Markdown.
PROMPT;
        } else {
            $userMessage = <<<PROMPT
Fais un resume complet du cours "{$request->course_title}" pour la filiere {$request->filiere}.

{$content}

Le resume doit:
1. Donner une **vue d'ensemble** du cours
2. Identifier les **chapitres/parties principales**
3. Pour chaque partie, donner les **points essentiels**
4. Insister sur les **notions les plus susceptibles de tomber en examen**
5. Terminer par une **fiche de revision express** (points cles en liste)

Format en Markdown bien structure.
PROMPT;
        }

        $summary = AiService::chat($systemPrompt, $userMessage, [], 4000);

        return response()->json(['summary' => $summary]);
    }

    /**
     * Generate quiz questions from a course/UE.
     */
    public function generateQuiz(Request $request)
    {
        $request->validate([
            'course_title'   => 'required|string',
            'course_content' => 'nullable|string',
            'num_questions'  => 'nullable|integer|min:3|max:20',
        ]);

        $numQuestions = $request->num_questions ?? 10;

        $systemPrompt = "Tu es un professeur universitaire expert. Tu generes des QCM (questions a choix multiples) de qualite pour evaluer les connaissances des etudiants. Reponds en JSON strict.";

        $userMessage = <<<PROMPT
Genere {$numQuestions} questions QCM pour le cours "{$request->course_title}".

{$request->course_content}

Reponds en JSON strict avec un tableau de questions. Chaque question doit avoir:
- "question": la question
- "options": tableau de 4 propositions (A, B, C, D)
- "correct": l'index de la bonne reponse (0-3)
- "explanation": explication de la bonne reponse

Exemple:
[
  {
    "question": "Quelle est la capitale du Cameroun?",
    "options": ["Douala", "Yaounde", "Bafoussam", "Garoua"],
    "correct": 1,
    "explanation": "Yaounde est la capitale politique du Cameroun."
  }
]

Reponds UNIQUEMENT avec le JSON, sans texte avant ou apres.
PROMPT;

        $response = AiService::chat($systemPrompt, $userMessage, [], 4000);

        // Parse JSON
        $json = $response;
        if (preg_match('/\[[\s\S]*\]/', $response, $matches)) {
            $json = $matches[0];
        }
        $questions = json_decode($json, true);

        if (!is_array($questions) || empty($questions)) {
            return response()->json(['error' => 'Impossible de generer le quiz. Reessayez.', 'raw' => $response], 422);
        }

        return response()->json(['questions' => $questions]);
    }
}
