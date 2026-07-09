<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Certification;
use App\Models\Debouche;
use App\Models\Exam;
use App\Models\RoadmapStep;
use App\Models\KnowledgeDocument;
use App\Models\User;
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
        $categories = Category::withCount('videos')
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

        return response()->json(['roadmap' => $steps]);
    }

    public function categoryDebouches($id)
    {
        $category = Category::findOrFail($id);

        $debouches = $category->debouches()->get();

        return response()->json(['debouches' => $debouches]);
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
     * Fetch formations: try remote API first, fallback to local DB.
     */
    private function fetchInsamtechsFormations(array $slugs): array
    {
        $formations = [];

        foreach ($slugs as $slug) {
            $slug = trim($slug);
            if (!$slug) continue;

            // Try remote API first (production-ready)
            $items = $this->fetchFromApi($slug);

            // Fallback to local DB (dev environment)
            if ($items === null) {
                $items = $this->fetchFromLocalDb($slug);
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
     */
    private function fetchFromApi(string $slug): ?array
    {
        try {
            $response = Http::timeout(15)->get("https://admin.insamtechs.com/api/formation/{$slug}", [
                'per_page' => 200,
            ]);

            if (!$response->successful()) return null;

            $data = $response->json();
            $items = $data['data'] ?? [];
            $result = [];

            foreach ($items as $f) {
                $result[] = $this->normalizeFormation($f);
            }

            return $result;
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
                    ->orderBy('ordre')
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
            'img' => $img,
            'slug' => $f['slug'] ?? null,
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
}
