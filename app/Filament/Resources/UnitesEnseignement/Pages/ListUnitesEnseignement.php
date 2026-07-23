<?php

namespace App\Filament\Resources\UnitesEnseignement\Pages;

use App\Filament\Resources\UnitesEnseignement\UniteEnseignementResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListUnitesEnseignement extends ListRecords
{
    protected static string $resource = UniteEnseignementResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
