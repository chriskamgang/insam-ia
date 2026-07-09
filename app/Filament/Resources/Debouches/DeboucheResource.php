<?php

namespace App\Filament\Resources\Debouches;

use App\Filament\Resources\Debouches\Pages\CreateDebouche;
use App\Filament\Resources\Debouches\Pages\EditDebouche;
use App\Filament\Resources\Debouches\Pages\ListDebouches;
use App\Filament\Resources\Debouches\Schemas\DeboucheForm;
use App\Filament\Resources\Debouches\Tables\DebouchesTable;
use App\Models\Debouche;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class DeboucheResource extends Resource
{
    protected static ?string $model = Debouche::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return DeboucheForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return DebouchesTable::configure($table);
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
            'index' => ListDebouches::route('/'),
            'create' => CreateDebouche::route('/create'),
            'edit' => EditDebouche::route('/{record}/edit'),
        ];
    }
}
