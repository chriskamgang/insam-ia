<?php

namespace App\Filament\Resources\Ecoles\Pages;

use App\Filament\Resources\Ecoles\EcoleResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListEcoles extends ListRecords
{
    protected static string $resource = EcoleResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}
