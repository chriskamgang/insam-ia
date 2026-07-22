<?php

namespace App\Filament\Resources\Filieres\Pages;

use App\Filament\Resources\Filieres\FiliereResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditFiliere extends EditRecord
{
    protected static string $resource = FiliereResource::class;

    protected function getHeaderActions(): array
    {
        return [DeleteAction::make()];
    }
}
