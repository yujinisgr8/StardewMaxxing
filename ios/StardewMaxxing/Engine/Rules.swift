import Foundation

// Decoders for shared/machines.json — the SHARED rule file the Electron app also reads.
// This mirrors the TypeScript schema in src/engine/machines.ts; keep the two in step.

/// A predicate over an Item. Encoded either as a bare `true` or as an object of clauses,
/// ALL of which must hold (matching the TypeScript interpreter's semantics).
indirect enum Predicate: Decodable {
    case always(Bool)
    case clauses(Clauses)

    struct Clauses: Decodable {
        var category: String?
        var categoryIn: [String]?
        var tag: String?
        var notTag: String?
        var id: String?
        var idPrefix: String?
        var allOf: [Predicate]?
        var anyOf: [Predicate]?
    }

    init(from decoder: Decoder) throws {
        let single = try decoder.singleValueContainer()
        if let bool = try? single.decode(Bool.self) {
            self = .always(bool)
        } else {
            self = .clauses(try single.decode(Clauses.self))
        }
    }

    func matches(_ item: Item) -> Bool {
        switch self {
        case .always(let value):
            return value
        case .clauses(let c):
            if let v = c.category, item.category.rawValue != v { return false }
            if let v = c.categoryIn, !v.contains(item.category.rawValue) { return false }
            if let v = c.tag, !item.has(v) { return false }
            if let v = c.notTag, item.has(v) { return false }
            if let v = c.id, item.id != v { return false }
            if let v = c.idPrefix, !item.id.hasPrefix(v) { return false }
            if let v = c.allOf, !v.allSatisfy({ $0.matches(item) }) { return false }
            if let v = c.anyOf, !v.contains(where: { $0.matches(item) }) { return false }
            return true
        }
    }
}

/// Flags are either a literal boolean or a predicate evaluated against the item.
enum FlagSpec: Decodable {
    case literal(Bool)
    case predicate(Predicate)

    init(from decoder: Decoder) throws {
        let single = try decoder.singleValueContainer()
        if let bool = try? single.decode(Bool.self) {
            self = .literal(bool)
        } else {
            self = .predicate(try single.decode(Predicate.self))
        }
    }

    func value(for item: Item) -> Bool {
        switch self {
        case .literal(let b): b
        case .predicate(let p): p.matches(item)
        }
    }
}

/// value = round(mult * basePrice + offset), or a flat `const`.
struct ValueSpec: Decodable {
    struct Variant: Decodable {
        var mult: Double?
        var offset: Double?
    }
    var `const`: Double?
    var mult: Double?
    var offset: Double?
    var inedible: Variant?

    func value(for item: Item) -> Int {
        if let c = `const` { return Int(c) }
        // Items tagged 'inedible' use the wiki's reduced-value variant, which overrides BOTH
        // mult and offset (an absent offset there means 0, not the default offset).
        let alt = item.isEdible ? nil : inedible
        let m = alt?.mult ?? (alt != nil ? 0 : mult) ?? 0
        let o = alt != nil ? (alt?.offset ?? 0) : (offset ?? 0)
        return jsRound(Double(item.basePrice) * m + o)
    }
}

struct RuleSpec: Decodable {
    var when: Predicate
    var outputId: String
    var nameEn: String
    var nameZh: String
    var value: ValueSpec
    var inputCount: Int?
    var outputCount: Int?
    var minutes: Double?
    var agingDays: Double?
    var extraInputs: [String]?
    var note: String?
    var artisanGood: FlagSpec?
    var tillerEligible: FlagSpec?
    var rancherEligible: FlagSpec?
    var fishEligible: FlagSpec?
    var qualitySensitive: FlagSpec?
}

/// Machine-level defaults share RuleSpec's optional fields, minus the required ones.
struct MachineDefaults: Decodable {
    var inputCount: Int?
    var outputCount: Int?
    var minutes: Double?
    var agingDays: Double?
    var extraInputs: [String]?
    var note: String?
    var artisanGood: FlagSpec?
    var tillerEligible: FlagSpec?
    var rancherEligible: FlagSpec?
    var fishEligible: FlagSpec?
    var qualitySensitive: FlagSpec?
}

struct MachineSpec: Decodable, Identifiable {
    var id: String
    var nameEn: String
    var nameZh: String
    var accepts: Predicate?
    var defaults: MachineDefaults?
    var rules: [RuleSpec]
}

struct RulesFile: Decodable {
    var minutesPerDay: Double
    var extraInputCost: [String: Int]
    var machines: [MachineSpec]
}

/// JavaScript's `Math.round` rounds halves toward +Infinity; Swift's `rounded()` rounds them
/// away from zero. Matching JS exactly keeps the two engines bit-identical on .5 cases.
func jsRound(_ x: Double) -> Int { Int((x + 0.5).rounded(.down)) }
