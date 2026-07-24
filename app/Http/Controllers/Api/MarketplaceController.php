<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MarketplaceItem;
use App\Models\MarketplacePurchase;
use App\Models\MarketplaceReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MarketplaceController extends Controller
{
    public function index(Request $request)
    {
        $query = MarketplaceItem::approved()
            ->with(['seller:id,name,prenom,nom', 'category:id,name']);

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('matiere')) {
            $query->where('matiere', $request->matiere);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('price')) {
            if ($request->price === 'free') {
                $query->where('price', 0);
            } elseif ($request->price === 'paid') {
                $query->where('price', '>', 0);
            }
        }

        $sort = $request->input('sort', 'newest');
        if ($sort === 'popular') {
            $query->orderByDesc('downloads_count');
        } elseif ($sort === 'rating') {
            $query->orderByDesc('rating');
        } else {
            $query->latest();
        }

        $items = $query->paginate(15);

        return response()->json($items);
    }

    public function show($id)
    {
        $item = MarketplaceItem::with([
            'seller:id,name,prenom,nom',
            'category:id,name',
            'reviews.user:id,name,prenom,nom',
        ])->findOrFail($id);

        $hasPurchased = false;
        if ($user = request()->user()) {
            $hasPurchased = MarketplacePurchase::where('buyer_id', $user->id)
                ->where('item_id', $item->id)
                ->exists();
        }

        return response()->json([
            'item' => $item,
            'has_purchased' => $hasPurchased,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'type'        => 'required|in:course,notes,exercises,exam_prep,tutorial,other',
            'category_id' => 'nullable|exists:categories,id',
            'matiere'     => 'nullable|string|max:255',
            'niveau'      => 'nullable|string|max:255',
            'price'       => 'nullable|integer|min:0',
            'file'        => 'required|file|max:20480',
            'preview'     => 'nullable|file|max:20480',
        ]);

        $filePath = $request->file('file')->store('marketplace/files', 'public');

        $previewPath = null;
        if ($request->hasFile('preview')) {
            $previewPath = $request->file('preview')->store('marketplace/previews', 'public');
        }

        $item = MarketplaceItem::create([
            'seller_id'   => $request->user()->id,
            'category_id' => $request->category_id,
            'title'       => $request->title,
            'description' => $request->description,
            'type'        => $request->type,
            'matiere'     => $request->matiere,
            'niveau'      => $request->niveau,
            'price'       => $request->input('price', 0),
            'file_path'   => $filePath,
            'preview_path' => $previewPath,
            'status'      => 'pending',
        ]);

        return response()->json(['item' => $item], 201);
    }

    public function myListings(Request $request)
    {
        $items = MarketplaceItem::where('seller_id', $request->user()->id)
            ->withCount('purchases')
            ->with('category:id,name')
            ->latest()
            ->get();

        return response()->json(['items' => $items]);
    }

    public function purchase(Request $request, $id)
    {
        $item = MarketplaceItem::approved()->findOrFail($id);
        $user = $request->user();

        $alreadyPurchased = MarketplacePurchase::where('buyer_id', $user->id)
            ->where('item_id', $item->id)
            ->exists();

        if ($alreadyPurchased) {
            return response()->json(['message' => 'Vous avez déjà acheté cet article.'], 409);
        }

        $data = [
            'buyer_id'   => $user->id,
            'item_id'    => $item->id,
            'amount_paid' => $item->price,
        ];

        if (!$item->isFree()) {
            $request->validate([
                'payment_method'    => 'required|string|max:100',
                'payment_reference' => 'required|string|max:255',
            ]);
            $data['payment_method']    = $request->payment_method;
            $data['payment_reference'] = $request->payment_reference;
        }

        $purchase = MarketplacePurchase::create($data);
        $item->increment('downloads_count');

        return response()->json([
            'purchase' => $purchase,
            'download_url' => url("/api/marketplace/{$item->id}/download"),
        ], 201);
    }

    public function download($id)
    {
        $item = MarketplaceItem::findOrFail($id);
        $user = request()->user();

        $isSeller = $item->seller_id === $user->id;
        $hasPurchased = MarketplacePurchase::where('buyer_id', $user->id)
            ->where('item_id', $item->id)
            ->exists();

        if (!$isSeller && !$hasPurchased) {
            return response()->json(['message' => 'Accès refusé. Vous devez acheter cet article pour le télécharger.'], 403);
        }

        if (!$item->file_path || !Storage::disk('public')->exists($item->file_path)) {
            return response()->json(['message' => 'Fichier introuvable.'], 404);
        }

        // Serve inline only (no download)
        $fullPath = Storage::disk('public')->path($item->file_path);
        return response()->file($fullPath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline',
        ]);
    }

    public function review(Request $request, $id)
    {
        $item = MarketplaceItem::findOrFail($id);
        $user = $request->user();

        $hasPurchased = MarketplacePurchase::where('buyer_id', $user->id)
            ->where('item_id', $item->id)
            ->exists();

        if (!$hasPurchased) {
            return response()->json(['message' => 'Vous devez acheter cet article avant de laisser un avis.'], 403);
        }

        $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]);

        $review = MarketplaceReview::updateOrCreate(
            ['user_id' => $user->id, 'item_id' => $item->id],
            ['rating' => $request->rating, 'comment' => $request->comment]
        );

        // Recalculate average rating and reviews_count
        $avg = MarketplaceReview::where('item_id', $item->id)->avg('rating');
        $count = MarketplaceReview::where('item_id', $item->id)->count();

        $item->update([
            'rating'        => round($avg, 2),
            'reviews_count' => $count,
        ]);

        return response()->json(['review' => $review], 201);
    }

    public function myPurchases(Request $request)
    {
        $purchases = MarketplacePurchase::where('buyer_id', $request->user()->id)
            ->with(['item' => function ($q) {
                $q->with('seller:id,name,prenom,nom', 'category:id,name');
            }])
            ->latest()
            ->get();

        return response()->json(['purchases' => $purchases]);
    }
}
