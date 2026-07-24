<x-filament-panels::page>
    <style>
        .sv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .sv-card { background: rgb(var(--gray-900)); border: 1px solid rgb(var(--gray-700)); border-radius: 12px; padding: 1.5rem; }
        .sv-label { display: block; font-size: 0.8rem; font-weight: 600; color: rgb(var(--gray-400)); margin-bottom: 6px; }
        .sv-select, .sv-input, .sv-textarea {
            width: 100%; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem;
            background: rgb(var(--gray-800)); border: 1px solid rgb(var(--gray-600));
            color: rgb(var(--gray-200));
        }
        .sv-textarea { font-family: monospace; resize: vertical; }
        .sv-title { font-size: 1.1rem; font-weight: 700; color: white; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px; }
        .sv-title span { font-size: 1.2rem; }
        .sv-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 28px; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; border: none; transition: all .2s; }
        .sv-btn-primary { background: rgb(var(--primary-500)); color: white; }
        .sv-btn-primary:hover { background: rgb(var(--primary-600)); }
        .sv-btn-primary:disabled { opacity: .5; cursor: wait; }
        .sv-result { background: rgb(var(--gray-900)); border: 1px solid rgb(var(--gray-700)); border-radius: 12px; padding: 1.5rem; margin-top: 1.5rem; }
        .sv-history { margin-top: 1.5rem; }
        .sv-history-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 8px; border: 1px solid rgb(var(--gray-700)); margin-bottom: 6px; cursor: pointer; transition: all .15s; }
        .sv-history-item:hover { background: rgb(var(--gray-800)); }
        .sv-history-item.active { background: rgb(var(--primary-500) / .15); border-color: rgb(var(--primary-500)); }
        .sv-score { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
        .sv-score-good { background: #065f46; color: #6ee7b7; }
        .sv-score-mid { background: #78350f; color: #fbbf24; }
        .sv-score-low { background: #7f1d1d; color: #fca5a5; }
        @media (max-width: 768px) { .sv-grid { grid-template-columns: 1fr; } }
    </style>

    <div>
        {{-- Main form --}}
        <div class="sv-grid">
            {{-- Left: Syllabus --}}
            <div class="sv-card">
                <div class="sv-title"><span>📋</span> Syllabus Ministeriel</div>

                <div style="margin-bottom: 12px;">
                    <label class="sv-label">Categorie / Filiere</label>
                    <select wire:model.live="selectedCategory" class="sv-select">
                        <option value="">-- Choisir une categorie --</option>
                        @foreach(\App\Models\Category::pluck('name', 'id') as $id => $name)
                            <option value="{{ $id }}">{{ $name }}</option>
                        @endforeach
                    </select>
                </div>

                @if($selectedCategory)
                <div style="margin-bottom: 12px;">
                    <label class="sv-label">UE / Document</label>
                    <select wire:model.live="selectedDocument" class="sv-select">
                        <option value="">-- Choisir un document --</option>
                        @foreach($this->documents as $id => $title)
                            <option value="{{ $id }}">{{ $title }}</option>
                        @endforeach
                    </select>
                </div>
                @endif

                <div style="margin-bottom: 12px;">
                    <label class="sv-label">Titre du cours</label>
                    <input type="text" wire:model="courseTitle" placeholder="Ex: Thermodynamique" class="sv-input" />
                </div>

                <div>
                    <label class="sv-label">Contenu du syllabus</label>
                    <textarea wire:model="syllabus" rows="12" placeholder="Collez ou modifiez le syllabus ministeriel ici..." class="sv-textarea"></textarea>
                </div>
            </div>

            {{-- Right: Support --}}
            <div class="sv-card">
                <div class="sv-title"><span>📖</span> Support de Cours</div>

                {{-- File upload --}}
                <div style="margin-bottom: 12px;">
                    <label class="sv-label">Importer un fichier (PDF, DOC, DOCX, TXT)</label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <label style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; background: rgb(var(--primary-500) / .15); border: 1px dashed rgb(var(--primary-500)); color: rgb(var(--primary-400)); cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all .2s;">
                            📄 Choisir un fichier
                            <input type="file" wire:model="supportFile" accept=".pdf,.doc,.docx,.txt" style="display: none;" />
                        </label>
                        <span wire:loading wire:target="supportFile" style="font-size: 0.8rem; color: rgb(var(--gray-400));">
                            <svg class="animate-spin" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:4px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Extraction du texte...
                        </span>
                    </div>
                </div>

                <div>
                    <label class="sv-label">Contenu du support de cours</label>
                    <textarea wire:model="support" rows="18" placeholder="Collez le contenu du support de cours ici ou importez un fichier ci-dessus..." class="sv-textarea"></textarea>
                </div>
            </div>
        </div>

        {{-- Action button --}}
        <div style="display: flex; justify-content: center; margin-top: 1.5rem;">
            <button
                wire:click="verify"
                wire:loading.attr="disabled"
                wire:target="verify"
                class="sv-btn sv-btn-primary"
            >
                <span wire:loading.remove wire:target="verify">✅ Verifier la conformite</span>
                <span wire:loading wire:target="verify">
                    <svg class="animate-spin" style="width:18px;height:18px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Analyse en cours...
                </span>
            </button>
        </div>

        {{-- Result --}}
        @if($result)
        <div class="sv-result">
            <div class="sv-title"><span>📊</span> Resultat de l'analyse</div>
            <div class="prose prose-invert prose-sm max-w-none">
                {!! \Illuminate\Support\Str::markdown($result) !!}
            </div>
        </div>
        @endif

        {{-- History --}}
        <div class="sv-history">
            <div class="sv-title" style="margin-top: 1rem;"><span>🕓</span> Historique des verifications</div>

            @forelse($this->history as $item)
                <div class="sv-history-item {{ $viewingHistoryId === $item->id ? 'active' : '' }}">
                    <div wire:click="loadHistory({{ $item->id }})" style="flex: 1; cursor: pointer;">
                        <div style="font-weight: 600; color: rgb(var(--gray-200)); font-size: 0.9rem;">
                            {{ $item->course_title }}
                        </div>
                        <div style="font-size: 0.75rem; color: rgb(var(--gray-400)); margin-top: 2px;">
                            {{ $item->category?->name ?? 'Sans categorie' }} &middot; {{ $item->created_at->format('d/m/Y H:i') }}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        @if($item->score)
                            <span class="sv-score {{ $item->score >= 70 ? 'sv-score-good' : ($item->score >= 40 ? 'sv-score-mid' : 'sv-score-low') }}">
                                {{ $item->score }}%
                            </span>
                        @endif
                        <button wire:click="deleteHistory({{ $item->id }})" wire:confirm="Supprimer cette verification ?" style="background: none; border: none; color: rgb(var(--gray-500)); cursor: pointer; font-size: 0.85rem; padding: 4px;" title="Supprimer">
                            🗑️
                        </button>
                    </div>
                </div>
            @empty
                <div style="text-align: center; color: rgb(var(--gray-500)); padding: 20px; font-size: 0.9rem;">
                    Aucune verification effectuee pour le moment.
                </div>
            @endforelse
        </div>
    </div>
</x-filament-panels::page>
