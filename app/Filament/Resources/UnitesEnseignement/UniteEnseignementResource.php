<?php

namespace App\Filament\Resources\UnitesEnseignement;

use App\Filament\Resources\UnitesEnseignement\Pages\CreateUniteEnseignement;
use App\Filament\Resources\UnitesEnseignement\Pages\EditUniteEnseignement;
use App\Filament\Resources\UnitesEnseignement\Pages\ListUnitesEnseignement;
use App\Models\UniteEnseignement;
use BackedEnum;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Repeater;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class UniteEnseignementResource extends Resource
{
    protected static ?string $model = UniteEnseignement::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedAcademicCap;

    protected static ?string $navigationLabel = 'Unites d\'Enseignement';

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Informations de l\'UE')->schema([
                TextInput::make('nom')->required()->label('Nom de l\'UE'),
                TextInput::make('code')->label('Code (ex: UE101)'),
                Select::make('filiere')->nullable()->options([
                    'Informatique & Reseaux' => 'Informatique & Reseaux',
                    'Genie Civil' => 'Genie Civil',
                    'Comptabilite & Gestion' => 'Comptabilite & Gestion',
                    'Marketing & Commerce' => 'Marketing & Commerce',
                    'Logistique & Transport' => 'Logistique & Transport',
                    'Secretariat de Direction' => 'Secretariat de Direction',
                    'Genie Logiciel' => 'Genie Logiciel',
                    'Sante' => 'Sante',
                ])->label('Filiere')->searchable(),
                Select::make('annee')->required()->options([
                    1 => '1ere annee',
                    2 => '2eme annee',
                    3 => '3eme annee',
                ])->label('Annee'),
                Select::make('semestre')->required()->options([
                    1 => 'Semestre 1',
                    2 => 'Semestre 2',
                ])->label('Semestre'),
                Select::make('category_id')
                    ->relationship('category', 'name')
                    ->label('Specialite')
                    ->searchable()
                    ->preload()
                    ->nullable(),
                TextInput::make('coefficient')->numeric()->default(1)->label('Coefficient'),
                TextInput::make('sort_order')->numeric()->default(0)->label('Ordre'),
            ])->columns(2),

            Section::make('Contenu / Documents')->schema([
                Repeater::make('knowledgeDocuments')
                    ->relationship()
                    ->label('Documents de cours')
                    ->schema([
                        TextInput::make('title')->required()->label('Titre du document'),
                        TextInput::make('filename')->label('Nom du fichier')->default(fn () => 'doc-' . time()),
                        Select::make('type')
                            ->options(['course' => 'Cours', 'text' => 'Notes', 'pdf' => 'PDF / Fichier'])
                            ->default('course')
                            ->required()
                            ->reactive(),
                        FileUpload::make('file_path')
                            ->label('Fichier (PDF, Word, etc.)')
                            ->directory('knowledge-documents')
                            ->acceptedFileTypes(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/*'])
                            ->maxSize(10240)
                            ->columnSpanFull(),
                        Textarea::make('content')
                            ->label('Contenu texte (ou resume)')
                            ->helperText('Saisissez le contenu du cours ou un resume. Optionnel si un fichier est uploade.')
                            ->rows(4)
                            ->columnSpanFull(),
                    ])
                    ->columns(3)
                    ->defaultItems(0)
                    ->addActionLabel('Ajouter un document')
                    ->collapsible()
                    ->itemLabel(fn (array $state): ?string => $state['title'] ?? null),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('nom')->searchable()->sortable(),
            TextColumn::make('code')->sortable(),
            TextColumn::make('filiere')->sortable(),
            TextColumn::make('annee')->label('Année')->sortable(),
            TextColumn::make('semestre')->label('Sem.')->sortable(),
            TextColumn::make('coefficient')->label('Coef.'),
            TextColumn::make('knowledge_documents_count')->counts('knowledgeDocuments')->label('Docs'),
            TextColumn::make('category.name')->label('Specialite'),
        ])->filters([
            SelectFilter::make('filiere')->options([
                'Informatique & Reseaux' => 'Informatique & Reseaux',
                'Genie Civil' => 'Genie Civil',
                'Comptabilite & Gestion' => 'Comptabilite & Gestion',
                'Marketing & Commerce' => 'Marketing & Commerce',
                'Logistique & Transport' => 'Logistique & Transport',
                'Secretariat de Direction' => 'Secretariat de Direction',
                'Genie Logiciel' => 'Genie Logiciel',
                'Sante' => 'Sante',
            ]),
            SelectFilter::make('annee')->options([
                1 => '1ère année',
                2 => '2ème année',
                3 => '3ème année',
            ]),
            SelectFilter::make('semestre')->options([
                1 => 'Semestre 1',
                2 => 'Semestre 2',
            ]),
        ])->defaultSort('filiere');
    }

    public static function getPages(): array
    {
        return [
            'index' => ListUnitesEnseignement::route('/'),
            'create' => CreateUniteEnseignement::route('/create'),
            'edit' => EditUniteEnseignement::route('/{record}/edit'),
        ];
    }
}
