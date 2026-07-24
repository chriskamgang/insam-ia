<?php

namespace App\Filament\Widgets;

use App\Models\Category;
use Filament\Widgets\ChartWidget;

class CoursesBySpecialtyChart extends ChartWidget
{
    protected static ?int $sort = 3;
    protected int | string | array $columnSpan = 1;

    public function getHeading(): ?string
    {
        return 'Cours par specialite';
    }

    public function getMaxHeight(): ?string
    {
        return '280px';
    }

    protected function getData(): array
    {
        $categories = Category::withCount('knowledgeDocuments')
            ->having('knowledge_documents_count', '>', 0)
            ->orderByDesc('knowledge_documents_count')
            ->limit(6)
            ->get();

        $colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E', '#6366F1'];

        return [
            'datasets' => [
                [
                    'label' => 'Cours',
                    'data' => $categories->pluck('knowledge_documents_count')->toArray(),
                    'backgroundColor' => array_slice($colors, 0, $categories->count()),
                    'borderWidth' => 0,
                    'borderRadius' => 6,
                ],
            ],
            'labels' => $categories->pluck('name')->map(fn ($n) => mb_substr($n, 0, 20))->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }
}
