<?php

namespace App\Filament\Resources\RoadmapSteps;

use App\Filament\Resources\RoadmapSteps\Pages\CreateRoadmapStep;
use App\Filament\Resources\RoadmapSteps\Pages\EditRoadmapStep;
use App\Filament\Resources\RoadmapSteps\Pages\ListRoadmapSteps;
use App\Filament\Resources\RoadmapSteps\Schemas\RoadmapStepForm;
use App\Filament\Resources\RoadmapSteps\Tables\RoadmapStepsTable;
use App\Models\RoadmapStep;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class RoadmapStepResource extends Resource
{
    protected static ?string $model = RoadmapStep::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return RoadmapStepForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return RoadmapStepsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListRoadmapSteps::route('/'),
            'create' => CreateRoadmapStep::route('/create'),
            'edit' => EditRoadmapStep::route('/{record}/edit'),
        ];
    }
}
