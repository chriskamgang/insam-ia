<?php

namespace App\Filament\Resources\OrientationQuestions\Pages;

use App\Filament\Resources\OrientationQuestions\OrientationQuestionResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditOrientationQuestion extends EditRecord
{
    protected static string $resource = OrientationQuestionResource::class;

    protected function getHeaderActions(): array
    {
        return [DeleteAction::make()];
    }
}
