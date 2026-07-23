<?php

namespace App\Filament\Resources\Specialites\Pages;

use App\Filament\Resources\Specialites\SpecialiteResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditSpecialite extends EditRecord
{
    protected static string $resource = SpecialiteResource::class;

    protected function getHeaderActions(): array
    {
        return [DeleteAction::make()];
    }
}
