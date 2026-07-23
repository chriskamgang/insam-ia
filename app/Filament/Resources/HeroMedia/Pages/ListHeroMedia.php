<?php

namespace App\Filament\Resources\HeroMedia\Pages;

use App\Filament\Resources\HeroMedia\HeroMediaResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListHeroMedia extends ListRecords
{
    protected static string $resource = HeroMediaResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
