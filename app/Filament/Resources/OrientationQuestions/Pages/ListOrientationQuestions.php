<?php

namespace App\Filament\Resources\OrientationQuestions\Pages;

use App\Filament\Resources\OrientationQuestions\OrientationQuestionResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListOrientationQuestions extends ListRecords
{
    protected static string $resource = OrientationQuestionResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}
