<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class CacheInsamtechsFormations extends Command
{
    protected $signature = 'insamtechs:cache {--source=local : Source to cache from (local or api)}';
    protected $description = 'Cache all InsamTechs formations with chapters and videos';

    public function handle()
    {
        $source = $this->option('source');

        if ($source === 'local') {
            return $this->cacheFromLocalDb();
        }

        return $this->cacheFromApi();
    }

    private function cacheFromLocalDb(): int
    {
        $this->info('Caching formations from local InsamTechs database...');

        try {
            $categories = DB::connection('insamtechs')
                ->table('categories')
                ->where('type', 1)
                ->get();
        } catch (\Throwable $e) {
            $this->error('Cannot connect to insamtechs database: ' . $e->getMessage());
            return 1;
        }

        $totalFormations = 0;

        foreach ($categories as $cat) {
            $slug = $cat->slug;
            if (!$slug) continue;

            $formations = DB::connection('insamtechs')
                ->table('formations')
                ->where('categorie_id', $cat->id)
                ->where('type_formation_id', 1)
                ->get();

            $result = [];

            foreach ($formations as $f) {
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

            if (empty($result)) continue;

            DB::table('formation_cache')->updateOrInsert(
                ['api_slug' => $slug],
                ['data' => json_encode($result), 'fetched_at' => now(), 'updated_at' => now()]
            );

            $totalFormations += count($result);
            $this->info("  [{$slug}] " . count($result) . " formations cached");
        }

        $this->info("Done! Cached {$totalFormations} formations with chapters & videos.");
        return 0;
    }

    private function cacheFromApi(): int
    {
        $this->info('Fetching all InsamTechs formations from API...');

        $allFormations = [];
        $page = 1;
        $lastPage = 1;

        do {
            $response = Http::timeout(15)->get("https://admin.insamtechs.com/api/formations", [
                'page' => $page,
            ]);

            if (!$response->successful()) {
                $this->error("Failed at page {$page}");
                break;
            }

            $data = $response->json();
            $lastPage = $data['last_page'] ?? 1;

            foreach ($data['data'] ?? [] as $f) {
                $intitule = is_array($f['intitule'] ?? '') ? ($f['intitule']['fr'] ?? '') : ($f['intitule'] ?? '');
                $description = is_array($f['description'] ?? '') ? ($f['description']['fr'] ?? '') : ($f['description'] ?? '');
                $img = $f['img'] ?? null;
                if ($img && !str_starts_with($img, 'http')) {
                    $img = 'https://admin.insamtechs.com/storage/' . $img;
                }

                $allFormations[] = [
                    'id' => $f['id'],
                    'intitule' => $intitule,
                    'description' => $description,
                    'slug' => $f['slug'] ?? null,
                    'img' => $img,
                    'videos_count' => $f['videos_count'] ?? 0,
                    'chapitres_count' => $f['chapitres_count'] ?? 0,
                    'categorie' => is_array($f['categorie']['intitule'] ?? '') ? ($f['categorie']['intitule']['fr'] ?? '') : '',
                ];
            }

            $this->info("Page {$page}/{$lastPage} - Total: " . count($allFormations));
            $page++;
        } while ($page <= $lastPage);

        DB::table('formation_cache')->updateOrInsert(
            ['api_slug' => '_all_formations'],
            ['data' => json_encode($allFormations), 'fetched_at' => now(), 'updated_at' => now()]
        );

        $this->info("Cached " . count($allFormations) . " formations.");
        return 0;
    }

    private function extractTranslation($value): string
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                return $decoded['fr'] ?? $decoded['en'] ?? array_values($decoded)[0] ?? '';
            }
            return $value;
        }
        if (is_array($value)) {
            return $value['fr'] ?? $value['en'] ?? array_values($value)[0] ?? '';
        }
        return (string) ($value ?? '');
    }
}
