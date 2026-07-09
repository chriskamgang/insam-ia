<x-filament-panels::page>

    {{-- Connection Status --}}
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
        {{-- Status Card --}}
        <div style="background: white; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
                    background: {{ $connectionStatus === 'authenticated' ? '#22c55e' : ($connectionStatus === 'qr' || $connectionStatus === 'reconnecting' ? '#eab308' : '#ef4444') }};
                "></div>
                <span style="font-weight: 700; font-size: 16px; color: #111827;">
                    @switch($connectionStatus)
                        @case('authenticated') Connecte @break
                        @case('qr') En attente du QR @break
                        @case('reconnecting') Reconnexion... @break
                        @case('offline') Service hors ligne @break
                        @default Deconnecte
                    @endswitch
                </span>
            </div>
            @if($connectedPhone)
                <p style="font-size: 13px; color: #6b7280;">Telephone: <strong style="color: #374151;">+{{ $connectedPhone }}</strong></p>
            @endif
            <button wire:click="refreshStatus" style="margin-top: 12px; font-size: 13px; color: #5BBCB4; font-weight: 600; background: none; border: none; cursor: pointer;">
                &#x21bb; Actualiser
            </button>
        </div>

        {{-- QR Code --}}
        <div style="background: white; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 160px;">
            @if($qrImage)
                <p style="font-size: 13px; color: #6b7280; margin-bottom: 12px; font-weight: 600;">Scannez avec WhatsApp :</p>
                <img src="{{ $qrImage }}" alt="QR Code" style="width: 180px; height: 180px;" />
            @elseif($connectionStatus === 'authenticated')
                <div style="text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 8px;">&#10004;</div>
                    <p style="font-size: 14px; color: #16a34a; font-weight: 700;">WhatsApp connecte</p>
                </div>
            @else
                <div style="text-align: center;">
                    @if($connectionStatus === 'offline')
                        <p style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">Demarrez le bridge Baileys :</p>
                        <code style="font-size: 12px; background: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 8px; display: inline-block;">
                            cd whatsapp-bridge && npm start
                        </code>
                    @else
                        <p style="font-size: 13px; color: #9ca3af;">QR code en attente...</p>
                    @endif
                </div>
            @endif
        </div>

        {{-- Stats --}}
        <div style="background: white; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb;">
            <h3 style="font-weight: 700; color: #374151; margin-bottom: 16px; font-size: 15px;">Statistiques</h3>
            @php
                $totalConvs = count($conversations);
                $transferred = collect($conversations)->where('transferred', true)->count();
                $today = collect($conversations)->filter(fn($c) => isset($c['last_message_at']) && \Carbon\Carbon::parse($c['last_message_at'])->isToday())->count();
            @endphp
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; justify-content: space-between; font-size: 13px;">
                    <span style="color: #6b7280;">Conversations</span>
                    <span style="font-weight: 700; color: #111827;">{{ $totalConvs }}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px;">
                    <span style="color: #6b7280;">Transferees</span>
                    <span style="font-weight: 700; color: #f97316;">{{ $transferred }}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px;">
                    <span style="color: #6b7280;">Aujourd'hui</span>
                    <span style="font-weight: 700; color: #5BBCB4;">{{ $today }}</span>
                </div>
            </div>
        </div>
    </div>

    {{-- Conversations --}}
    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 16px; min-height: 500px;">
        {{-- Conversation List --}}
        <div style="background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; display: flex; flex-direction: column;">
            <div style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb;">
                <h3 style="font-weight: 700; color: #111827; font-size: 14px;">Conversations ({{ count($conversations) }})</h3>
            </div>
            <div style="overflow-y: auto; flex: 1; max-height: 460px;">
                @forelse($conversations as $conv)
                    <button
                        wire:click="selectConversation({{ $conv['id'] }})"
                        style="width: 100%; text-align: left; padding: 12px 16px; border: none; border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background .15s;
                            background: {{ $selectedConversationId === $conv['id'] ? '#f0fdfa' : 'white' }};"
                        onmouseenter="this.style.background='#f9fafb'"
                        onmouseleave="this.style.background='{{ $selectedConversationId === $conv['id'] ? '#f0fdfa' : 'white' }}'"
                    >
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 32px; height: 32px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">
                                    &#x1F464;
                                </div>
                                <div>
                                    <div style="font-weight: 600; font-size: 13px; color: #111827;">+{{ $conv['phone'] }}</div>
                                    <div style="font-size: 11px; color: #9ca3af;">{{ $conv['messages_count'] ?? 0 }} messages</div>
                                </div>
                            </div>
                            @if($conv['transferred'])
                                <span style="font-size: 10px; background: #ffedd5; color: #c2410c; padding: 2px 8px; border-radius: 20px; font-weight: 600; flex-shrink: 0;">Transfere</span>
                            @endif
                        </div>
                    </button>
                @empty
                    <div style="padding: 48px 16px; text-align: center; color: #9ca3af;">
                        <div style="font-size: 28px; margin-bottom: 8px;">&#x1F4AC;</div>
                        <p style="font-size: 13px;">Aucune conversation</p>
                    </div>
                @endforelse
            </div>
        </div>

        {{-- Messages --}}
        <div style="background: white; border-radius: 12px; border: 1px solid #e5e7eb; display: flex; flex-direction: column; overflow: hidden;">
            @if($selectedConversationId)
                @php $selConv = collect($conversations)->firstWhere('id', $selectedConversationId); @endphp
                {{-- Header --}}
                <div style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center; font-size: 14px;">
                            &#x1F464;
                        </div>
                        <span style="font-weight: 700; color: #111827;">+{{ $selConv['phone'] ?? '' }}</span>
                    </div>
                    <button wire:click="toggleTransfer({{ $selectedConversationId }})" style="
                        font-size: 12px; padding: 6px 14px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer;
                        background: {{ ($selConv['transferred'] ?? false) ? '#dcfce7' : '#ffedd5' }};
                        color: {{ ($selConv['transferred'] ?? false) ? '#16a34a' : '#c2410c' }};
                    ">
                        {{ ($selConv['transferred'] ?? false) ? 'Reactiver le bot' : 'Transferer a humain' }}
                    </button>
                </div>

                {{-- Messages --}}
                <div style="flex: 1; overflow-y: auto; padding: 16px; max-height: 380px;">
                    @foreach($selectedMessages as $msg)
                        <div style="display: flex; margin-bottom: 10px;
                            justify-content: {{ $msg['role'] === 'assistant' ? 'flex-end' : 'flex-start' }};">
                            <div style="max-width: 75%; border-radius: 16px; padding: 10px 14px; font-size: 13px;
                                {{ $msg['role'] === 'assistant'
                                    ? 'background: #5BBCB4; color: white; border-bottom-right-radius: 4px;'
                                    : 'background: #f3f4f6; color: #374151; border-bottom-left-radius: 4px;' }}
                            ">
                                <p style="white-space: pre-line; margin: 0;">{{ $msg['content'] }}</p>
                                <p style="font-size: 10px; margin: 4px 0 0; opacity: 0.7;">
                                    {{ \Carbon\Carbon::parse($msg['created_at'])->format('H:i') }}
                                </p>
                            </div>
                        </div>
                    @endforeach
                </div>

                {{-- Reply input --}}
                <div style="padding: 12px 16px; border-top: 1px solid #e5e7eb;">
                    <form wire:submit="sendReply" style="display: flex; gap: 8px;">
                        <input
                            type="text"
                            wire:model="replyText"
                            placeholder="Repondre manuellement..."
                            style="flex: 1; border-radius: 10px; border: 1px solid #d1d5db; padding: 10px 14px; font-size: 13px; outline: none; font-family: inherit;"
                        />
                        <button type="submit" style="background: #5BBCB4; color: white; border: none; border-radius: 10px; padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;">
                            Envoyer
                        </button>
                    </form>
                </div>
            @else
                <div style="flex: 1; display: flex; align-items: center; justify-content: center; min-height: 400px;">
                    <div style="text-align: center; color: #9ca3af;">
                        <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.3;">&#x1F4AC;</div>
                        <p style="font-size: 14px;">Selectionnez une conversation</p>
                    </div>
                </div>
            @endif
        </div>
    </div>

</x-filament-panels::page>
