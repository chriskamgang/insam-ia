<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Certification;
use App\Models\Debouche;
use App\Models\HeroMedia;
use App\Models\Exam;
use App\Models\RoadmapStep;
use App\Models\KnowledgeDocument;
use App\Models\User;
use App\Models\Specialite;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class PublicController extends Controller
{
    public function stats()
    {
        return response()->json([
            'users'      => User::count(),
            'categories' => Category::count(),
            'videos'     => Video::count(),
        ]);
    }

    public function categories()
    {
        $categories = Category::withCount(['videos', 'knowledgeDocuments as courses_count'])
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function recentVideos()
    {
        $videos = Video::with('category:id,name')
            ->latest()
            ->limit(6)
            ->get();

        return response()->json(['data' => $videos]);
    }

    public function categoryShow($id)
    {
        $category = Category::withCount([
            'debouches',
            'videos',
            'roadmapSteps',
            'certifications',
        ])->findOrFail($id);

        return response()->json(['category' => $category]);
    }

    public function categoryVideos($id)
    {
        $category = Category::findOrFail($id);

        $videos = $category->videos()->latest()->get();

        return response()->json(['data' => $videos]);
    }

    public function categoryRoadmap($id)
    {
        $category = Category::findOrFail($id);

        $steps = $category->roadmapSteps()->orderBy('step_number')->get();

        // Auto-generate roadmap via AI if no steps exist
        if ($steps->isEmpty()) {
            try {
                $systemPrompt = "Tu es un expert en formation professionnelle et en pedagogie. Tu crees des parcours de formation structures pour des etudiants en Afrique francophone.";

                $userMessage = <<<PROMPT
Genere un parcours de formation complet pour la specialite "{$category->name}".
Description: {$category->description}

Reponds en JSON strict: un tableau de 6 a 10 etapes, chaque etape est un objet avec:
- "title": titre de l'etape (court et clair)
- "description": description en 2-3 phrases
- "level": un parmi "Debutant", "Intermediaire", "Avance", "Expert"
- "duration": duree estimee (ex: "2 semaines", "1 mois")
- "icon": classe FontAwesome (ex: "fas fa-code")
- "skills": tableau de 3-5 competences cles (chaines de caracteres)

Les etapes doivent aller du debutant a l'expert progressivement.
Reponds UNIQUEMENT avec le JSON (un tableau), sans texte avant ou apres.
PROMPT;

                $response = \App\Services\AiService::chat($systemPrompt, $userMessage, [], 3000);

                $json = $response;
                if (preg_match('/\[[\s\S]*\]/', $response, $matches)) {
                    $json = $matches[0];
                }

                $generated = json_decode($json, true);

                if (is_array($generated) && count($generated) > 0) {
                    foreach ($generated as $i => $step) {
                        $category->roadmapSteps()->create([
                            'title' => $step['title'] ?? "Etape " . ($i + 1),
                            'description' => $step['description'] ?? '',
                            'level' => $step['level'] ?? 'Debutant',
                            'duration' => $step['duration'] ?? '',
                            'icon' => $step['icon'] ?? 'fas fa-book',
                            'skills' => is_array($step['skills'] ?? null) ? implode(', ', $step['skills']) : ($step['skills'] ?? ''),
                            'step_number' => $i + 1,
                        ]);
                    }

                    $steps = $category->roadmapSteps()->orderBy('step_number')->get();
                }
            } catch (\Throwable $e) {
                // Silently fail - show empty state
            }
        }

        return response()->json(['roadmap' => $steps]);
    }

    public function roadmapStepShow($id)
    {
        $step = \App\Models\RoadmapStep::with('category')->findOrFail($id);

        if (empty($step->ai_details)) {
            try {
                $categoryName = $step->category->name ?? 'Formation';

                $systemPrompt = "Tu es un expert en formation professionnelle et en pedagogie. Tu rediges des fiches d'etapes de parcours de formation detaillees et pratiques pour des etudiants en Afrique francophone.";

                $userMessage = <<<PROMPT
Genere une fiche detaillee pour l'etape de parcours "{$step->title}" (Niveau: {$step->level}, Duree: {$step->duration}) dans le domaine "{$categoryName}".

Reponds en JSON strict avec les champs suivants:
- "resume": un resume de cette etape en 2-3 phrases
- "objectifs": un tableau de 4-6 objectifs d'apprentissage (chaines de caracteres)
- "competences_acquises": un tableau de 5-8 competences que l'etudiant va acquerir
- "contenu_detaille": un tableau de 4-6 modules/chapitres avec chacun un objet {"titre": "...", "description": "..."}
- "ressources": un tableau de 3-5 types de ressources recommandees (livres, sites, outils)
- "projets_pratiques": un tableau de 2-4 projets pratiques a realiser pour valider cette etape
- "prerequis": un tableau de 2-4 prerequis necessaires avant de commencer cette etape
- "evaluation": comment evaluer la maitrise de cette etape (2-3 phrases)
- "conseil": un conseil pratique pour reussir cette etape (2-3 phrases)

Reponds UNIQUEMENT avec le JSON, sans texte avant ou apres.
PROMPT;

                $response = \App\Services\AiService::chat($systemPrompt, $userMessage, [], 3000);

                $json = $response;
                if (preg_match('/\{[\s\S]*\}/', $response, $matches)) {
                    $json = $matches[0];
                }

                $details = json_decode($json, true);

                if (is_array($details) && !empty($details)) {
                    $step->ai_details = $details;
                    $step->save();
                    $step->refresh();
                }
            } catch (\Throwable $e) {
                // Silently fail
            }
        }

        return response()->json(['step' => $step]);
    }

    public function categoryDebouches($id)
    {
        $category = Category::findOrFail($id);

        $debouches = $category->debouches()->get();

        return response()->json(['debouches' => $debouches]);
    }

    public function deboucheShow($id)
    {
        $debouche = \App\Models\Debouche::with('category')->findOrFail($id);

        // Auto-generate AI details if not yet generated
        if (empty($debouche->ai_details)) {
            try {
                $categoryName = $debouche->category->name ?? 'Formation';

                $systemPrompt = "Tu es un expert en orientation professionnelle et en marche de l'emploi en Afrique francophone. Tu rediges des fiches metiers detaillees et realistes.";

                $userMessage = <<<PROMPT
Genere une fiche metier detaillee pour le debouche "{$debouche->title}" dans le domaine "{$categoryName}".

Reponds en JSON strict avec les champs suivants:
- "resume": un resume du metier en 2-3 phrases
- "missions": un tableau de 5-6 missions principales (chaines de caracteres)
- "competences": un tableau de 5-8 competences requises (chaines de caracteres)
- "formations_requises": un tableau de 2-4 formations ou diplomes recommandes
- "salaire_debutant": fourchette de salaire debutant au Cameroun/Afrique (ex: "150 000 - 300 000 FCFA/mois")
- "salaire_senior": fourchette de salaire senior (ex: "500 000 - 1 200 000 FCFA/mois")
- "secteurs": un tableau de 3-5 secteurs d'activite ou exercer ce metier
- "evolution": un tableau de 2-3 postes/evolutions de carriere possibles
- "outils": un tableau de 4-6 outils/logiciels/technologies utilises dans ce metier
- "conseil": un conseil pratique pour quelqu'un qui veut se lancer dans ce metier (2-3 phrases)

Reponds UNIQUEMENT avec le JSON, sans texte avant ou apres.
PROMPT;

                $response = \App\Services\AiService::chat($systemPrompt, $userMessage, [], 3000);

                $json = $response;
                if (preg_match('/\{[\s\S]*\}/', $response, $matches)) {
                    $json = $matches[0];
                }

                $details = json_decode($json, true);

                if (is_array($details) && !empty($details)) {
                    $debouche->ai_details = $details;
                    $debouche->save();
                    $debouche->refresh();
                }
            } catch (\Throwable $e) {
                // Silently fail - page will show without AI details
            }
        }

        return response()->json(['debouche' => $debouche]);
    }

    public function categoryCertifications($id)
    {
        $category = Category::findOrFail($id);

        $local = $category->certifications()->get();

        $remote = [];

        if ($category->api_slug) {
            $slugs = is_array($category->api_slug)
                ? $category->api_slug
                : explode(',', $category->api_slug);

            foreach ($slugs as $slug) {
                $slug = trim($slug);
                if ($slug === '') {
                    continue;
                }

                try {
                    $response = Http::timeout(5)->get("https://insamtechs.com/api/certifications/{$slug}");

                    if ($response->successful()) {
                        $data = $response->json();
                        $items = $data['certifications'] ?? $data['data'] ?? $data;
                        if (is_array($items)) {
                            $remote = array_merge($remote, $items);
                        }
                    }
                } catch (\Throwable $e) {
                    // silently skip failed remote calls
                }
            }
        }

        return response()->json([
            'certifications' => $local,
            'remote'         => $remote,
        ]);
    }

    public function allVideos(Request $request)
    {
        $query = Video::with('category:id,name');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
        }

        return response()->json(['data' => $query->latest()->get()]);
    }

    public function documents(Request $request)
    {
        $query = KnowledgeDocument::with('category:id,name')
            ->where('type', '!=', 'exam');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where('title', 'like', "%{$s}%");
        }

        return response()->json(['data' => $query->latest()->get()]);
    }

    /**
     * Fetch formations from InsamTechs local DB for a given category.
     */
    public function insamtechsFormations(Request $request, $categoryId)
    {
        $category = Category::findOrFail($categoryId);

        if (!$category->api_slug) {
            return response()->json(['formations' => [], 'message' => 'Aucun lien API pour cette filiere.']);
        }

        $slugs = is_array($category->api_slug)
            ? $category->api_slug
            : explode(',', $category->api_slug);

        $formations = $this->fetchInsamtechsFormations($slugs);

        return response()->json(['formations' => $formations]);
    }

    /**
     * Fetch formations from InsamTechs, optionally filtered by filiere keywords.
     */
    public function recentFormations(Request $request)
    {
        $filiere = $request->query('filiere', '');

        // Load full cache
        $cached = DB::table('formation_cache')->where('api_slug', '_all_formations')->first();

        if (!$cached) {
            // Fallback: fetch first 3 pages
            $formations = $this->fetchFromApi('*') ?? [];
            return response()->json(['formations' => array_slice($formations, 0, 20)]);
        }

        $allFormations = json_decode($cached->data, true) ?: [];

        // If filiere specified, filter by keywords
        if ($filiere) {
            $keywords = $this->getFiliereKeywords($filiere);
            if (!empty($keywords)) {
                $filtered = [];
                foreach ($allFormations as $f) {
                    $text = strtolower(($f['intitule'] ?? '') . ' ' . ($f['description'] ?? ''));
                    foreach ($keywords as $kw) {
                        if (str_contains($text, strtolower($kw))) {
                            $filtered[] = $f;
                            break;
                        }
                    }
                }
                // Sort by videos_count desc
                usort($filtered, fn($a, $b) => ($b['videos_count'] ?? 0) - ($a['videos_count'] ?? 0));
                return response()->json(['formations' => $filtered]);
            }
        }

        // No filter: return first 20 sorted by videos
        usort($allFormations, fn($a, $b) => ($b['videos_count'] ?? 0) - ($a['videos_count'] ?? 0));
        return response()->json(['formations' => array_slice($allFormations, 0, 20)]);
    }

    private function getFiliereKeywords(string $filiere): array
    {
        $map = [
            'Informatique & Reseaux' => ['programm', 'java', 'python', 'web', 'php', 'react', 'html', 'css', 'javascript', 'sql', 'linux', 'reseau', 'network', 'cisco', 'c++', 'android', 'mobile', 'flutter', 'angular', 'node', 'laravel', 'docker', 'git', 'algorithm', 'algo', 'code', 'develop', 'fullstack', 'devops', 'api', 'base de donn', 'database', 'informatique', 'logiciel', 'spring', 'typescript', 'vue.js', 'mongo', '.net', 'kotlin', 'swift', 'django', 'ruby', 'arduino', 'cyber', 'secur', 'hacking', 'kali'],
            'Genie Logiciel' => ['programm', 'java', 'python', 'web', 'php', 'react', 'html', 'css', 'javascript', 'sql', 'linux', 'c++', 'android', 'mobile', 'flutter', 'angular', 'node', 'laravel', 'docker', 'git', 'algorithm', 'algo', 'code', 'develop', 'fullstack', 'devops', 'api', 'base de donn', 'database', 'informatique', 'logiciel', 'spring', 'typescript', 'vue.js', 'mongo', '.net', 'kotlin', 'swift', 'django', 'ruby', 'uml', 'design pattern', 'agile', 'scrum'],
            'Genie Civil' => ['genie civil', 'construction', 'beton', 'bâtiment', 'batiment', 'autocad', 'dessin industriel', 'topograph', 'archicad', 'revit', 'structure', 'chantier', 'ouvrage', 'route', 'pont', 'fondation', 'geotechnique', 'hydraul', 'btp', 'coffrage', 'ferraillage', 'materiaux'],
            'Comptabilite & Gestion' => ['comptab', 'finance', 'gestion', 'audit', 'fiscal', 'budget', 'tresor', 'banque', 'excel', 'sage', 'paie', 'bilan', 'accounting', 'business', 'management', 'commerce', 'marketing', 'entrepreneur', 'economie', 'droit', 'ressource humaine'],
            'Sante' => ['sante', 'medical', 'infirm', 'anatom', 'physiolog', 'pharmacol', 'biolog', 'chimie', 'biochim', 'microbiolog', 'patholog', 'diagnos', 'soins', 'nursing', 'health', 'clinic'],
            'Electrotechnique' => ['electr', 'automat', 'arduino', 'plc', 'circuit', 'electronique', 'tension', 'courant', 'moteur', 'transform', 'energie', 'solaire', 'photovolta', 'regulation', 'capteur', 'sensor', 'embedded', 'microcontrol', 'freertos'],
        ];

        // Direct match
        if (isset($map[$filiere])) return $map[$filiere];

        // Partial match
        $filiereLower = strtolower($filiere);
        foreach ($map as $key => $keywords) {
            if (str_contains(strtolower($key), $filiereLower) || str_contains($filiereLower, strtolower($key))) {
                return $keywords;
            }
        }

        // Keyword-based fallback
        foreach ($map as $key => $keywords) {
            $keyWords = explode(' ', strtolower($key));
            foreach ($keyWords as $w) {
                if (strlen($w) > 3 && str_contains($filiereLower, $w)) {
                    return $keywords;
                }
            }
        }

        return [];
    }

    /**
     * Fetch formations: try remote API first, fallback to local DB.
     */
    private function fetchInsamtechsFormations(array $slugs): array
    {
        $formations = [];

        foreach ($slugs as $slug) {
            $slug = trim($slug);
            if (!$slug) continue;

            // Try local DB first (has chapters & videos)
            $items = $this->fetchFromLocalDb($slug);

            // Fallback to cache
            if ($items === null) {
                $cached = DB::table('formation_cache')->where('api_slug', $slug)->first();
                if ($cached) {
                    $items = json_decode($cached->data, true);
                }
            }

            // Fallback to remote API
            if ($items === null) {
                $items = $this->fetchFromApi($slug);

                if ($items !== null && count($items) > 0) {
                    DB::table('formation_cache')->updateOrInsert(
                        ['api_slug' => $slug],
                        ['data' => json_encode($items), 'fetched_at' => now(), 'updated_at' => now()]
                    );
                }
            }

            if ($items) {
                $formations = array_merge($formations, $items);
            }
        }

        // Sort by number of videos (most content first)
        usort($formations, function ($a, $b) {
            $countA = array_reduce($a['chapitres'] ?? [], fn($t, $ch) => $t + count($ch['videos'] ?? []), 0);
            $countB = array_reduce($b['chapitres'] ?? [], fn($t, $ch) => $t + count($ch['videos'] ?? []), 0);
            return $countB - $countA;
        });

        return $formations;
    }

    /**
     * Fetch from InsamTechs remote API.
     * Fetches formations (optionally filtered by category slug).
     */
    private function fetchFromApi(string $slug): ?array
    {
        try {
            $allItems = [];
            $pages = 3; // Fetch first 3 pages (36 formations)

            for ($page = 1; $page <= $pages; $page++) {
                $response = Http::timeout(10)->get("https://admin.insamtechs.com/api/formations", [
                    'page' => $page,
                ]);

                if (!$response->successful()) break;

                $data = $response->json();
                if (!is_array($data) || empty($data['data'])) break;

                foreach ($data['data'] as $f) {
                    $catSlug = $f['categorie']['slug'] ?? '';
                    // If slug matches category OR slug is '*' (fetch all)
                    if ($slug === '*' || $catSlug === $slug) {
                        $allItems[] = $this->normalizeFormation($f);
                    }
                }

                if ($page >= ($data['last_page'] ?? 1)) break;
            }

            return count($allItems) > 0 ? $allItems : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Fetch from local InsamTechs database (dev fallback).
     */
    private function fetchFromLocalDb(string $slug): ?array
    {
        try {
            $itCat = DB::connection('insamtechs')
                ->table('categories')
                ->where('slug', $slug)
                ->where('type', 1)
                ->first();

            if (!$itCat) return null;

            $itFormations = DB::connection('insamtechs')
                ->table('formations')
                ->where('categorie_id', $itCat->id)
                ->where('type_formation_id', 1)
                ->get();

            $result = [];

            foreach ($itFormations as $f) {
                $chapitres = DB::connection('insamtechs')
                    ->table('chapitres')
                    ->where('formation_id', $f->id)
                    ->orderBy('id')
                    ->get();

                $chapitreData = [];
                foreach ($chapitres as $ch) {
                    $videos = DB::connection('insamtechs')
                        ->table('videos')
                        ->where('chapitre_id', $ch->id)
                        ->get();

                    $videoData = [];
                    foreach ($videos as $v) {
                        if (!$v->lien || $v->lien === 'null') continue;

                        $videoData[] = [
                            'id' => $v->id,
                            'intitule' => $this->extractTranslation($v->intitule),
                            'lien' => $v->lien,
                        ];
                    }

                    if (empty($videoData)) continue;

                    $chapitreData[] = [
                        'id' => $ch->id,
                        'intitule' => $this->extractTranslation($ch->intitule),
                        'videos' => $videoData,
                    ];
                }

                if (empty($chapitreData)) continue;

                $result[] = [
                    'id' => $f->id,
                    'intitule' => $this->extractTranslation($f->intitule),
                    'img' => $f->img ? 'https://admin.insamtechs.com/storage/' . $f->img : null,
                    'slug' => $f->slug,
                    'chapitres' => $chapitreData,
                ];
            }

            return $result;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Normalize an API formation response to a consistent format.
     */
    private function normalizeFormation(array $f): array
    {
        $chapitres = [];
        foreach ($f['chapitres'] ?? [] as $ch) {
            $videos = [];
            foreach ($ch['videos'] ?? [] as $v) {
                if (empty($v['lien']) || $v['lien'] === 'null') continue;
                $videos[] = [
                    'id' => $v['id'],
                    'intitule' => $this->extractTranslation($v['intitule'] ?? ''),
                    'lien' => $v['lien'],
                ];
            }
            if (empty($videos)) continue;
            $chapitres[] = [
                'id' => $ch['id'],
                'intitule' => $this->extractTranslation($ch['intitule'] ?? ''),
                'videos' => $videos,
            ];
        }

        $img = $f['img'] ?? null;
        if ($img && !str_starts_with($img, 'http')) {
            $img = 'https://admin.insamtechs.com/storage/' . $img;
        }

        return [
            'id' => $f['id'],
            'intitule' => $this->extractTranslation($f['intitule'] ?? ''),
            'description' => $this->extractTranslation($f['description'] ?? ''),
            'img' => $img,
            'slug' => $f['slug'] ?? null,
            'chapitres_count' => $f['chapitres_count'] ?? count($chapitres),
            'videos_count' => $f['videos_count'] ?? 0,
            'categorie' => $this->extractTranslation($f['categorie']['intitule'] ?? ''),
            'chapitres' => $chapitres,
        ];
    }

    /**
     * Extract French text from a translatable field (JSON or string).
     */
    private function extractTranslation($value): string
    {
        if (is_array($value)) {
            return $value['fr'] ?? $value['en'] ?? reset($value) ?: '';
        }
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                return $decoded['fr'] ?? $decoded['en'] ?? reset($decoded) ?: '';
            }
            return $value;
        }
        return (string) $value;
    }

    /**
     * Get formations for the authenticated user's filiere.
     */
    public function myFormations(Request $request)
    {
        $user = $request->user();

        // Direct lookup via category_id (set at registration)
        $category = null;
        if ($user->category_id) {
            $category = Category::find($user->category_id);
        }

        // Fallback: match filiere name to category
        if (!$category && $user->filiere) {
            $filiere = $user->filiere;
            $category = Category::where('name', $filiere)->first();

            if (!$category) {
                $category = Category::where('name', 'like', "%{$filiere}%")->first();
            }

            if (!$category) {
                $categories = Category::whereNotNull('api_slug')->get();
                foreach ($categories as $cat) {
                    $catWords = explode(' ', strtolower($cat->name));
                    $filiereWords = explode(' ', strtolower($filiere));
                    foreach ($filiereWords as $word) {
                        if (strlen($word) > 3 && in_array($word, $catWords)) {
                            $category = $cat;
                            break 2;
                        }
                    }
                }
            }

            // Save category_id for future fast lookups
            if ($category) {
                $user->update(['category_id' => $category->id]);
            }
        }

        if (!$category || !$category->api_slug) {
            return response()->json([
                'formations' => [],
                'category' => null,
                'niveau' => $user->niveau,
                'message' => 'Aucune correspondance trouvee pour votre filiere.',
            ]);
        }

        $slugs = is_array($category->api_slug)
            ? $category->api_slug
            : explode(',', $category->api_slug);

        $formations = $this->fetchInsamtechsFormations($slugs);

        return response()->json([
            'formations' => $formations,
            'category' => $category,
            'niveau' => $user->niveau,
            'filiere' => $user->filiere,
        ]);
    }

    public function videoShow($id)
    {
        $video = Video::with('category:id,name')->findOrFail($id);

        $video->increment('views_count');

        return response()->json(['video' => $video]);
    }

    public function heroMedia()
    {
        $media = HeroMedia::orderBy('sort_order')->get();

        return response()->json(['data' => $media]);
    }

    public function allSpecialites()
    {
        $specialites = Specialite::orderBy('name')->get(['id', 'name']);

        return response()->json(['specialites' => $specialites]);
    }

    // ===== ORIENTATION =====

    public function orientationEcoles()
    {
        $ecoles = \App\Models\Ecole::withCount('filieres')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['ecoles' => $ecoles]);
    }

    public function orientationFiliereQuestions($ecoleId)
    {
        $ecole = \App\Models\Ecole::with('filieres')->findOrFail($ecoleId);
        $questions = \App\Models\OrientationQuestion::where('ecole_id', $ecoleId)
            ->where('level', 'filiere')
            ->orderBy('sort_order')
            ->get();

        // Auto-generate questions if none exist and ecole has filieres
        if ($questions->isEmpty() && $ecole->filieres->isNotEmpty()) {
            \App\Services\OrientationService::generateFiliereQuestions($ecole);
            $questions = \App\Models\OrientationQuestion::where('ecole_id', $ecoleId)
                ->where('level', 'filiere')
                ->orderBy('sort_order')
                ->get();
        }

        return response()->json([
            'ecole' => $ecole,
            'questions' => $questions,
            'filieres' => $ecole->filieres,
        ]);
    }

    public function orientationSpecialiteQuestions($filiereId)
    {
        $filiere = \App\Models\Filiere::with(['specialites', 'ecole'])->findOrFail($filiereId);
        $questions = \App\Models\OrientationQuestion::where('filiere_id', $filiereId)
            ->where('level', 'specialite')
            ->orderBy('sort_order')
            ->get();

        // Auto-generate questions if none exist and filiere has specialites
        if ($questions->isEmpty() && $filiere->specialites->isNotEmpty()) {
            \App\Services\OrientationService::generateSpecialiteQuestions($filiere);
            $questions = \App\Models\OrientationQuestion::where('filiere_id', $filiereId)
                ->where('level', 'specialite')
                ->orderBy('sort_order')
                ->get();
        }

        return response()->json([
            'filiere' => $filiere,
            'questions' => $questions,
            'specialites' => $filiere->specialites,
        ]);
    }

    public function orientationSpecialites($filiereId)
    {
        $filiere = \App\Models\Filiere::with('specialites')->findOrFail($filiereId);

        return response()->json([
            'filiere' => $filiere,
            'specialites' => $filiere->specialites,
        ]);
    }
}
