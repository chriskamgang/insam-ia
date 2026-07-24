<?php

namespace App\Filament\Widgets;

use App\Models\Category;
use App\Models\Exam;
use App\Models\KnowledgeDocument;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends StatsOverviewWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        return [
            Stat::make('Etudiants', User::where('role', 'student')->count())
                ->description('inscrits sur la plateforme')
                ->descriptionIcon('heroicon-m-user-group')
                ->color('info')
                ->chart([7, 12, 18, 24, 30, 35, 42]),

            Stat::make('Specialites', Category::count())
                ->description('formations disponibles')
                ->descriptionIcon('heroicon-m-academic-cap')
                ->color('success')
                ->chart([5, 8, 12, 18, 25, 35, 47]),

            Stat::make('Cours', KnowledgeDocument::count())
                ->description('documents pedagogiques')
                ->descriptionIcon('heroicon-m-book-open')
                ->color('primary')
                ->chart([10, 25, 40, 60, 80, 120, 182]),

            Stat::make('Epreuves', Exam::count())
                ->description('sujets d\'examen')
                ->descriptionIcon('heroicon-m-document-text')
                ->color('warning')
                ->chart([3, 8, 15, 22, 28, 35, 40]),
        ];
    }
}
