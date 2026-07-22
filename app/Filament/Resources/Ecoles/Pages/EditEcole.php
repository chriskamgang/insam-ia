<?php

namespace App\Filament\Resources\Ecoles\Pages;

use App\Filament\Resources\Ecoles\EcoleResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditEcole extends EditRecord
{
    protected static string $resource = EcoleResource::class;

    protected function getHeaderActions(): array
    {
        return [DeleteAction::make()];
    }
}
