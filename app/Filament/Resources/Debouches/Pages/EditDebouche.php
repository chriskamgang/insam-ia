<?php

namespace App\Filament\Resources\Debouches\Pages;

use App\Filament\Resources\Debouches\DeboucheResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditDebouche extends EditRecord
{
    protected static string $resource = DeboucheResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
