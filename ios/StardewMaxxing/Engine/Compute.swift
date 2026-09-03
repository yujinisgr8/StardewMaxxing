import Foundation

// The interpreter + pricing engine. Mirrors src/engine/machines.ts and src/engine/compute.ts;
// shared/fixtures/parity.json pins the two to identical output (see ParityTests).

private let artisanMult = 1.4   // Artisan profession: +40%
private let tillerMult  = 1.1   // Tiller: +10%
private let rancherMult = 1.2   // Rancher: +20%
private let fisherMult  = 1.25  // Fisher: +25% (fish)
private let anglerMult  = 1.5   // Angler: +50% (fish); supersedes Fisher (no stacking)

struct Engine {
    let machines: [MachineSpec]
    let extraInputCost: [String: Int]

    init(rules: RulesFile) {
        self.machines = rules.machines
        self.extraInputCost = rules.extraInputCost
    }

    // MARK: - Rule interpretation

    private func transform(_ machine: MachineSpec, _ item: Item) -> RouteResult? {
        if let accepts = machine.accepts, !accepts.matches(item) { return nil }
        guard let rule = machine.rules.first(where: { $0.when.matches(item) }) else { return nil }

        let d = machine.defaults
        let minutes = rule.minutes ?? d?.minutes ?? 0
        let agingDays = rule.agingDays ?? d?.agingDays ?? 0
        let flag = { (r: FlagSpec?, def: FlagSpec?) -> Bool in
            (r ?? def)?.value(for: item) ?? false
        }
        let fill = { (tpl: String, name: String) -> String in
            tpl.replacingOccurrences(of: "{id}", with: item.id)
               .replacingOccurrences(of: "{n}", with: name)
        }

        return RouteResult(
            machineId: machine.id,
            outputId: fill(rule.outputId, item.nameEn),
            outputNameEn: fill(rule.nameEn, item.nameEn),
            outputNameZh: fill(rule.nameZh, item.nameZh),
            inputCount: rule.inputCount ?? d?.inputCount ?? 1,
            outputCount: rule.outputCount ?? d?.outputCount ?? 1,
            baseValue: rule.value.value(for: item),
            artisanGood: flag(rule.artisanGood, d?.artisanGood),
            tillerEligible: flag(rule.tillerEligible, d?.tillerEligible),
            rancherEligible: flag(rule.rancherEligible, d?.rancherEligible),
            fishEligible: flag(rule.fishEligible, d?.fishEligible),
            qualitySensitive: flag(rule.qualitySensitive, d?.qualitySensitive),
            days: minutes / minutesPerDay + agingDays,
            extraInputs: rule.extraInputs ?? d?.extraInputs ?? [],
            note: rule.note ?? d?.note
        )
    }

    // MARK: - Pricing

    /// Apply Settings (professions + input quality) to a machine's raw RouteResult.
    private func price(_ r: RouteResult, _ s: Settings) -> ProcessRoute {
        // The tree guarantees Artisan ⇒ Tiller branch, so Tiller's bonus stacks with it.
        var applied: [AppliedBonus] = []
        if r.artisanGood && s.level10 == .artisan { applied.append(.init(key: .artisan, mult: artisanMult)) }
        if r.tillerEligible && s.level5 == .tiller { applied.append(.init(key: .tiller, mult: tillerMult)) }
        if r.rancherEligible && s.level5 == .rancher { applied.append(.init(key: .rancher, mult: rancherMult)) }
        // Fishing professions don't stack with each other: Angler (+50%) supersedes Fisher (+25%).
        if r.fishEligible && s.fishingLevel10 == .angler {
            applied.append(.init(key: .angler, mult: anglerMult))
        } else if r.fishEligible && s.fishingLevel5 == .fisher {
            applied.append(.init(key: .fisher, mult: fisherMult))
        }

        var mult = applied.reduce(1.0) { $0 * $1.mult }
        if r.qualitySensitive { mult *= s.quality.multiplier }

        let value = jsRound(Double(r.baseValue) * mult)
        // Subtract consumable cost (e.g. the Fish Smoker's coal) so routes compare on NET gold.
        let extraCost = r.extraInputs.reduce(0) { $0 + (extraInputCost[$1] ?? 0) }
        let perInputValue = Double(value - extraCost) / Double(r.inputCount)
        // Whole-day collection model: a machine is emptied/refilled once each morning, so a
        // job ties it up for ⌈days⌉ whole "collect next morning" slots (Wine 6.25 → 7).
        let effectiveDays = r.days > 0 ? Int(r.days.rounded(.up)) : 0
        let goldPerDay = effectiveDays > 0 ? perInputValue / Double(effectiveDays) : nil

        return ProcessRoute(
            result: r, value: value, extraCost: extraCost, perInputValue: perInputValue,
            effectiveDays: effectiveDays, goldPerDay: goldPerDay,
            appliedBonuses: applied, best: false
        )
    }

    /// Rank every processing route for `item` under `settings`.
    /// - `.total`  → by gold per single input item (fair across batch sizes).
    /// - `.perDay` → by gold/day. Instant "sell raw" banks its full value immediately, so it is
    ///   compared at its per-input value; this stops a slower route that nets LESS than selling
    ///   raw from ranking above it.
    func computeRoutes(_ item: Item, _ settings: Settings) -> [ProcessRoute] {
        var routes = machines.compactMap { transform($0, item) }.map { price($0, settings) }

        let rate = { (r: ProcessRoute) in r.goldPerDay ?? r.perInputValue }
        let key = { (r: ProcessRoute) in settings.rankBy == .perDay ? rate(r) : r.perInputValue }
        // JavaScript's Array.sort is stable and Swift's is not, so ties are broken by the
        // original machine order to keep ranking identical across the two engines.
        routes = routes.enumerated()
            .sorted { a, b in
                let ka = key(a.element), kb = key(b.element)
                return ka == kb ? a.offset < b.offset : ka > kb
            }
            .map(\.element)

        if !routes.isEmpty { routes[0].best = true }
        return routes
    }

    /// Which profession trees can change ANY route's value for this item — drives which
    /// profession selectors the Settings screen shows. A fish is BOTH fishing- and
    /// farming-relevant, because Artisan boosts Smoked Fish & Caviar.
    func relevance(_ item: Item) -> (farming: Bool, fishing: Bool) {
        let results = machines.compactMap { transform($0, item) }
        return (
            farming: results.contains { $0.tillerEligible || $0.rancherEligible || $0.artisanGood },
            fishing: results.contains { $0.fishEligible }
        )
    }
}
