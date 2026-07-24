<x-filament-panels::page>
    <div class="space-y-6">
        {{-- Selection --}}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {{-- Left: Syllabus --}}
            <div class="fi-section rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10 p-6 space-y-4">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                    Syllabus Ministeriel
                </h3>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categorie / Filiere</label>
                    <select wire:model.live="selectedCategory" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white py-2 px-3 text-sm">
                        <option value="">-- Choisir une categorie --</option>
                        @foreach(\App\Models\Category::pluck('name', 'id') as $id => $name)
                            <option value="{{ $id }}">{{ $name }}</option>
                        @endforeach
                    </select>
                </div>

                @if($selectedCategory)
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UE / Document</label>
                    <select wire:model.live="selectedDocument" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white py-2 px-3 text-sm">
                        <option value="">-- Choisir un document --</option>
                        @foreach($this->documents as $id => $title)
                            <option value="{{ $id }}">{{ $title }}</option>
                        @endforeach
                    </select>
                </div>
                @endif

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre du cours</label>
                    <input type="text" wire:model="courseTitle" placeholder="Ex: Thermodynamique" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white py-2 px-3 text-sm" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenu du syllabus</label>
                    <textarea wire:model="syllabus" rows="14" placeholder="Collez ou modifiez le syllabus ministeriel ici..." class="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm font-mono py-2 px-3"></textarea>
                </div>
            </div>

            {{-- Right: Support --}}
            <div class="fi-section rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10 p-6 space-y-4">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                    Support de Cours
                </h3>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenu du support de cours</label>
                    <textarea wire:model="support" rows="24" placeholder="Collez le contenu du support de cours ici..." class="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm font-mono py-2 px-3"></textarea>
                </div>
            </div>
        </div>

        {{-- Action button --}}
        <div class="flex justify-center">
            <x-filament::button
                wire:click="verify"
                wire:loading.attr="disabled"
                size="lg"
                icon="heroicon-o-clipboard-document-check"
            >
                <span wire:loading.remove wire:target="verify">Verifier la conformite</span>
                <span wire:loading wire:target="verify">Analyse en cours...</span>
            </x-filament::button>
        </div>

        {{-- Result --}}
        @if($result)
        <div class="fi-section rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10 p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Resultat de l'analyse
            </h3>
            <div class="prose dark:prose-invert max-w-none text-sm">
                {!! \Illuminate\Support\Str::markdown($result) !!}
            </div>
        </div>
        @endif
    </div>
</x-filament-panels::page>
