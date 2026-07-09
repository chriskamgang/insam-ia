<?php

namespace App\Filament\Resources\RoadmapSteps\Pages;

use App\Filament\Resources\RoadmapSteps\RoadmapStepResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditRoadmapStep extends EditRecord
{
    protected static string $resource = RoadmapStepResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
