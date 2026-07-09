<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\ChatMessage;
use App\Models\RevisionCard;
use App\Models\ExamSimulation;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    // Public: list all active plans
    public function plans()
    {
        $plans = Plan::where('is_active', true)->orderBy('sort_order')->get();
        return response()->json($plans);
    }

    // Auth: current subscription info
    public function mySubscription(Request $request)
    {
        $user = $request->user();
        $subscription = $user->activeSubscription();

        if ($subscription) {
            return response()->json([
                'has_subscription' => true,
                'subscription' => $subscription->load('plan'),
            ]);
        }

        $freePlan = Plan::where('slug', 'free')->first();
        return response()->json([
            'has_subscription' => false,
            'subscription' => null,
            'plan' => $freePlan,
        ]);
    }

    // Auth: subscribe to a plan
    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'plan_id'           => 'required|exists:plans,id',
            'payment_method'    => 'nullable|string|in:momo,om,card,free',
            'payment_reference' => 'nullable|string|max:255',
        ]);

        $plan = Plan::where('id', $validated['plan_id'])->where('is_active', true)->firstOrFail();
        $user = $request->user();

        // Cancel any existing active subscription
        $user->subscriptions()->where('status', 'active')->update(['status' => 'cancelled']);

        // Compute expiry based on billing cycle
        $expiresAt = match ($plan->billing_cycle) {
            'monthly'  => now()->addMonth(),
            'yearly'   => now()->addYear(),
            'lifetime' => null,
            default    => now()->addMonth(),
        };

        $subscription = Subscription::create([
            'user_id'           => $user->id,
            'plan_id'           => $plan->id,
            'status'            => 'active',
            'starts_at'         => now(),
            'expires_at'        => $expiresAt,
            'payment_method'    => $validated['payment_method'] ?? null,
            'payment_reference' => $validated['payment_reference'] ?? null,
            'amount_paid'       => $plan->price,
        ]);

        return response()->json([
            'message'      => 'Abonnement activé avec succès.',
            'subscription' => $subscription->load('plan'),
        ], 201);
    }

    // Auth: cancel current subscription
    public function cancel(Request $request)
    {
        $user = $request->user();
        $subscription = $user->activeSubscription();

        if (!$subscription) {
            return response()->json(['message' => 'Aucun abonnement actif trouvé.'], 404);
        }

        $subscription->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Abonnement annulé. Vous repassez au plan Gratuit.']);
    }

    // Auth: current usage vs plan limits
    public function usage(Request $request)
    {
        $user = $request->user();
        $plan = $user->currentPlan();
        $limits = $plan ? ($plan->limits ?? []) : [];

        // Count today's AI chats (user messages only)
        $aiChatsToday = ChatMessage::where('user_id', $user->id)
            ->where('role', 'user')
            ->whereDate('created_at', today())
            ->count();

        // Count this month's revision cards
        $revisionCardsMonth = RevisionCard::where('user_id', $user->id)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        // Count this month's simulations
        $simulationsMonth = ExamSimulation::where('user_id', $user->id)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return response()->json([
            'plan'   => $plan,
            'limits' => $limits,
            'usage'  => [
                'ai_chats_per_day'          => $aiChatsToday,
                'revision_cards_per_month'  => $revisionCardsMonth,
                'simulations_per_month'     => $simulationsMonth,
            ],
            'remaining' => [
                'ai_chats_per_day'         => isset($limits['ai_chats_per_day'])
                    ? max(0, $limits['ai_chats_per_day'] - $aiChatsToday) : null,
                'revision_cards_per_month' => isset($limits['revision_cards_per_month'])
                    ? max(0, $limits['revision_cards_per_month'] - $revisionCardsMonth) : null,
                'simulations_per_month'    => isset($limits['simulations_per_month'])
                    ? max(0, $limits['simulations_per_month'] - $simulationsMonth) : null,
            ],
        ]);
    }
}
