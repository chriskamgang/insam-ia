<?php

namespace App\Filament\Pages;

use App\Models\Setting;
use App\Models\WhatsappConversation;
use App\Models\WhatsappMessage;
use BackedEnum;
use Filament\Pages\Page;
use Filament\Support\Icons\Heroicon;
use Illuminate\Support\Facades\Http;

class WhatsappDashboard extends Page
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedChatBubbleLeftRight;
    protected static ?string $navigationLabel = 'WhatsApp';
    protected static ?string $title = 'WhatsApp Bot';
    protected static ?int $navigationSort = 99;

    protected string $view = 'filament.pages.whatsapp-dashboard';

    public string $connectionStatus = 'checking';
    public ?string $connectedPhone = null;
    public ?string $qrImage = null;
    public $conversations = [];
    public ?int $selectedConversationId = null;
    public $selectedMessages = [];
    public string $replyText = '';

    public function mount(): void
    {
        $this->refreshStatus();
        $this->loadConversations();
    }

    public function refreshStatus(): void
    {
        $baileysUrl = Setting::get('baileys_url', 'http://localhost:3001');
        try {
            $statusResp = Http::timeout(3)->get("{$baileysUrl}/status");
            $statusData = $statusResp->json();
            $this->connectionStatus = $statusData['status'] ?? 'offline';
            $this->connectedPhone = $statusData['phone'] ?? null;

            if ($this->connectionStatus === 'qr') {
                $qrResp = Http::timeout(3)->get("{$baileysUrl}/qr");
                $qrData = $qrResp->json();
                $this->qrImage = $qrData['qr_image'] ?? null;
            } else {
                $this->qrImage = null;
            }
        } catch (\Throwable $e) {
            $this->connectionStatus = 'offline';
            $this->qrImage = null;
        }
    }

    public function loadConversations(): void
    {
        $this->conversations = WhatsappConversation::withCount('messages')
            ->orderByDesc('last_message_at')
            ->take(50)
            ->get()
            ->toArray();
    }

    public function selectConversation(int $id): void
    {
        $this->selectedConversationId = $id;
        $this->selectedMessages = WhatsappMessage::where('conversation_id', $id)
            ->orderBy('created_at')
            ->get()
            ->toArray();
        $this->replyText = '';
    }

    public function sendReply(): void
    {
        if (!$this->replyText || !$this->selectedConversationId) return;

        $conversation = WhatsappConversation::find($this->selectedConversationId);
        if (!$conversation) return;

        WhatsappMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $this->replyText,
        ]);

        $baileysUrl = Setting::get('baileys_url', 'http://localhost:3001');
        try {
            Http::timeout(10)->post("{$baileysUrl}/send/text", [
                'phone' => $conversation->phone,
                'message' => $this->replyText,
            ]);
        } catch (\Throwable $e) {
            // Silently fail, message is saved in DB
        }

        $this->replyText = '';
        $this->selectConversation($this->selectedConversationId);
    }

    public function toggleTransfer(int $id): void
    {
        $conversation = WhatsappConversation::find($id);
        if ($conversation) {
            $conversation->update([
                'transferred' => !$conversation->transferred,
                'transferred_at' => $conversation->transferred ? null : now(),
            ]);
            $this->loadConversations();
            if ($this->selectedConversationId === $id) {
                $this->selectConversation($id);
            }
        }
    }
}
