<?php

namespace App\Filament\Resources\Ecoles;

use App\Filament\Resources\Ecoles\Pages\CreateEcole;
use App\Filament\Resources\Ecoles\Pages\EditEcole;
use App\Filament\Resources\Ecoles\Pages\ListEcoles;
use App\Models\Ecole;
use App\Services\OrientationService;
use BackedEnum;
use Filament\Forms\Components\FileUpload;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Actions\Action;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class EcoleResource extends Resource
{
    protected static ?string $model = Ecole::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBuildingOffice;

    protected static string|\UnitEnum|null $navigationGroup = 'Orientation';

    protected static ?string $navigationLabel = 'Ecoles';

    protected static ?int $navigationSort = 1;

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Informations')->schema([
                TextInput::make('name')->required()->label('Nom de l\'ecole'),
                Textarea::make('description')->label('Description')->columnSpanFull(),
                FileUpload::make('logo')->image()->directory('ecoles')->label('Logo'),
            ])->columns(2),
            Section::make('Contact')->schema([
                TextInput::make('ville')->label('Ville'),
                TextInput::make('telephone')->label('Telephone'),
                TextInput::make('email')->email()->label('Email'),
                TextInput::make('site_web')->label('Site web'),
                TextInput::make('sort_order')->numeric()->default(0)->label('Ordre'),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            ImageColumn::make('logo')->circular()->size(40),
            TextColumn::make('name')->searchable()->sortable()->label('Ecole'),
            TextColumn::make('ville')->sortable(),
            TextColumn::make('filieres_count')->counts('filieres')->label('Filieres'),
            TextColumn::make('sort_order')->label('Ordre')->sortable(),
        ])
        ->defaultSort('sort_order')
        ->actions([
            Action::make('generate_questions')
                ->label('Generer Questions IA')
                ->icon('heroicon-o-sparkles')
                ->color('warning')
                ->requiresConfirmation()
                ->modalHeading('Generer les questions d\'orientation')
                ->modalDescription('L\'IA va generer automatiquement des questions pour orienter les etudiants vers les filieres de cette ecole. Les anciennes questions seront supprimees.')
                ->action(function (Ecole $record) {
                    $record->orientationQuestions()->where('level', 'filiere')->delete();
                    $count = OrientationService::generateFiliereQuestions($record);

                    foreach ($record->filieres()->has('specialites')->get() as $filiere) {
                        $filiere->orientationQuestions()->where('level', 'specialite')->delete();
                        $count += OrientationService::generateSpecialiteQuestions($filiere);
                    }

                    Notification::make()
                        ->title("{$count} questions generees avec succes")
                        ->success()
                        ->send();
                }),
            EditAction::make(),
        ])
        ->bulkActions([DeleteBulkAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListEcoles::route('/'),
            'create' => CreateEcole::route('/create'),
            'edit' => EditEcole::route('/{record}/edit'),
        ];
    }
}
