<?php

namespace App\Filament\Resources\Specialites\Pages;

use App\Filament\Resources\Specialites\SpecialiteResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListSpecialites extends ListRecords
{
    protected static string $resource = SpecialiteResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}
