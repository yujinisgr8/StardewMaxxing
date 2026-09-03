import Foundation

/// In-game day for machine timing = 1600 minutes (the wiki's convention).
let minutesPerDay = 1600.0

enum Category: String, Codable, CaseIterable {
    case fruit, vegetable, flower, forage, fish, roe, milk, egg, wool, mushroom, other
}

enum Quality: String, Codable, CaseIterable, Identifiable {
    case normal, silver, gold, iridium
    var id: String { rawValue }
    /// Quality price multipliers for RAW produce (wiki: Quality).
    var multiplier: Double {
        switch self {
        case .normal: 1.0
        case .silver: 1.25
        case .gold: 1.5
        case .iridium: 2.0
        }
    }
}

/// A name carried in both languages, like the item names themselves.
struct Named: Codable, Hashable {
    let en: String
    let zh: String
}

/// What else an item is good for besides selling/processing — scraped from the wiki so the app
/// can answer "so what DO I do with this?" for items with few or no profitable routes.
struct ItemUses: Codable, Hashable {
    struct BundleUse: Codable, Hashable {
        let bundle: Named
        let room: Named
    }
    struct Quest: Codable, Hashable {
        let reward: Int?
    }
    var bundles: [BundleUse] = []
    var lovedBy: [Named] = []   // villagers who LOVE it as a gift (8x friendship)
    var recipes: [Named] = []   // dishes/crafts it's an ingredient in
    var quest: Quest?

    var isEmpty: Bool { bundles.isEmpty && lovedBy.isEmpty && recipes.isEmpty && quest == nil }
}

struct Item: Codable, Identifiable, Hashable {
    let id: String
    let nameEn: String
    let nameZh: String   // official simplified-Chinese name from the wiki
    let basePrice: Int   // base sell price at normal quality
    let category: Category
    let tags: [String]
    let source: String?
    let uses: ItemUses?   // bundles / gifts / recipes / quests

    func has(_ tag: String) -> Bool { tags.contains(tag) }
    var isEdible: Bool { !has("inedible") }
}

// MARK: - Professions
// Modeled as the in-game skill trees (wiki: Skills). Level 5 is a single mutually-exclusive
// pick; Level 10 branches off it.

enum Level5Prof: String, Codable, CaseIterable, Identifiable {
    case none, rancher, tiller
    var id: String { rawValue }
}

enum Level10Prof: String, Codable, CaseIterable, Identifiable {
    case none, artisan, agriculturist, coopmaster, shepherd
    var id: String { rawValue }
    /// Agriculturist/Coopmaster/Shepherd change growth/production speed, not price.
    var affectsPrice: Bool { self == .artisan }
}

enum FishL5: String, Codable, CaseIterable, Identifiable {
    case none, fisher, trapper
    var id: String { rawValue }
}

enum FishL10: String, Codable, CaseIterable, Identifiable {
    case none, angler, pirate, mariner, luremaster
    var id: String { rawValue }
    var affectsPrice: Bool { self == .angler }
}

enum RankBy: String, Codable, CaseIterable, Identifiable {
    case total, perDay
    var id: String { rawValue }
}

struct Settings: Codable, Equatable {
    var level5: Level5Prof = .none
    var level10: Level10Prof = .none
    var fishingLevel5: FishL5 = .none
    var fishingLevel10: FishL10 = .none
    var quality: Quality = .normal
    var rankBy: RankBy = .total
}

// MARK: - Route output

/// Pre-modifier economic facts a machine produces for an item.
struct RouteResult {
    var machineId: String
    var outputId: String
    var outputNameEn: String
    var outputNameZh: String
    var inputCount: Int
    var outputCount: Int
    var baseValue: Int          // total batch sell value at normal quality, no professions
    var artisanGood: Bool
    var tillerEligible: Bool
    var rancherEligible: Bool
    var fishEligible: Bool
    var qualitySensitive: Bool
    var days: Double            // processing time in days (0 = instant / sell raw)
    var extraInputs: [String]
    var note: String?
}

enum BonusKey: String { case tiller, rancher, artisan, fisher, angler }

struct AppliedBonus {
    let key: BonusKey
    let mult: Double
}

/// A fully-costed route after applying Settings, ready for the UI.
struct ProcessRoute: Identifiable {
    var result: RouteResult
    var value: Int              // batch sell value after professions/quality (gross)
    var extraCost: Int          // cost of consumable extra inputs, per batch
    var perInputValue: Double   // NET gold per single raw input
    var effectiveDays: Int      // whole "collect next morning" slots (0 = instant)
    var goldPerDay: Double?     // nil when instant
    var appliedBonuses: [AppliedBonus]
    var best: Bool

    var id: String { result.machineId + "/" + result.outputId }
}
