<x-filament-panels::page>
    <div class="space-y-6">
        {{-- Selection --}}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {{-- Left: Syllabus --}}
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <x-heroicon-o-academic-cap class="w-5 h-5 text-primary-500" />
                    Syllabus Ministeriel
                </h3>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categorie / Filiere</label>
                    <select wire:model.live="selectedCategory" class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                        <option value="">-- Choisir une categorie --</option>
                        @foreach(\App\Models\Category::pluck('name', 'id') as $id => $name)
                            <option value="{{ $id }}">{{ $name }}</option>
                        @endforeach
                    </select>
                </div>

                @if($selectedCategory)
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UE / Document</label>
                    <select wire:model.live="selectedDocument" class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                        <option value="">-- Choisir un document --</option>
                        @foreach($this->documents as $id => $title)
                            <option value="{{ $id }}">{{ $title }}</option>
                        @endforeach
                    </select>
                </div>
                @endif

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre du cours</label>
                    <input type="text" wire:model="courseTitle" placeholder="Ex: Thermodynamique" class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenu du syllabus</label>
                    <textarea wire:model="syllabus" rows="12" placeholder="Collez ou modifiez le syllabus ministeriel ici..." class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm font-mono"></textarea>
                </div>
            </div>

            {{-- Right: Support --}}
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <x-heroicon-o-book-open class="w-5 h-5 text-warning-500" />
                    Support de Cours
                </h3>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenu du support de cours</label>
                    <textarea wire:model="support" rows="20" placeholder="Collez le contenu du support de cours ici..." class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm font-mono"></textarea>
                </div>
            </div>
        </div>

        {{-- Action button --}}
        <div class="flex justify-center">
            <button
                wire:click="verify"
                wire:loading.attr="disabled"
                class="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 disabled:cursor-wait text-base"
            >
                <span wire:loading.remove wire:target="verify">
                    <x-heroicon-o-clipboard-document-check class="w-5 h-5" />
                </span>
                <span wire:loading wire:target="verify">
                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                </span>
                <span wire:loading.remove wire:target="verify">Verifier la conformite</span>
                <span wire:loading wire:target="verify">Analyse en cours...</span>
            </button>
        </div>

        {{-- Result --}}
        @if($result)
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <x-heroicon-o-document-chart-bar class="w-5 h-5 text-success-500" />
                Resultat de l'analyse
            </h3>
            <div class="prose dark:prose-invert max-w-none">
                {!! \Illuminate\Support\Str::markdown($result) !!}
            </div>
        </div>
        @endif
    </div>
</x-filament-panels::page>
