<?php

namespace App\Filament\Resources\HeroMedia\Pages;

use App\Filament\Resources\HeroMedia\HeroMediaResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditHeroMedia extends EditRecord
{
    protected static string $resource = HeroMediaResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
