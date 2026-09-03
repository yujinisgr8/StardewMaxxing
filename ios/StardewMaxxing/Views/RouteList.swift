import SwiftUI

/// The ranked processing routes for one item — the heart of the app, matching the desktop
/// ResultsTable but laid out as cards for a phone-width screen.
struct RouteListView: View {
    let item: Item
    @Environment(AppModel.self) private var model

    var body: some View {
        @Bindable var model = model
        let s = model.strings
        let routes = model.data?.engine.computeRoutes(item, model.settings) ?? []

        ScrollView {
            VStack(spacing: 10) {
                header(s)
                rankToggle(s, $model.settings)

                ForEach(Array(routes.enumerated()), id: \.element.id) { _, route in
                    RouteCard(route: route, rankBy: model.settings.rankBy, strings: s)
                }

                UsesPanel(item: item, strings: s)
                legend(s)
            }
            .padding(12)
        }
        .background(Palette.dirt)
        .navigationTitle(s.name(item.nameEn, item.nameZh))
        .navigationBarTitleDisplayMode(.inline)
    }

    private func header(_ s: UIStrings) -> some View {
        HStack(spacing: 10) {
            ItemIcon(item: item, size: 40)
            VStack(alignment: .leading, spacing: 2) {
                Text(s.name(item.nameEn, item.nameZh))
                    .font(.pixel(19)).foregroundStyle(Palette.ink)
                Text("\(item.nameEn) · \(item.nameZh)")
                    .font(.pixel(12)).foregroundStyle(Palette.inkSoft)
                Text("\(item.basePrice)g \(s.rawValueNote)")
                    .font(.pixel(12)).foregroundStyle(Palette.inkSoft)
            }
            Spacer()
        }
        .padding(10)
        .svPanel()
    }

    private func rankToggle(_ s: UIStrings, _ settings: Binding<Settings>) -> some View {
        HStack(spacing: 6) {
            Text(s.rankBy).font(.pixel(13)).foregroundStyle(Palette.ink)
            Spacer()
            ForEach(RankBy.allCases) { metric in
                SVButton(
                    title: metric == .total ? s.rankTotal : s.rankPerDay,
                    selected: settings.wrappedValue.rankBy == metric
                ) { settings.wrappedValue.rankBy = metric }
            }
        }
        .padding(8)
        .svPanel(Palette.parchmentDark)
    }

    private func legend(_ s: UIStrings) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(s.explainTotal)
            Text(s.explainPerDay)
        }
        .font(.pixel(11))
        .foregroundStyle(Palette.inkSoft)
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .svPanel(Palette.parchmentDark)
    }
}

/// One ranked route. The active ranking metric is emphasised so the column you sorted by
/// is the one your eye lands on, mirroring the desktop table's ▼ marker.
struct RouteCard: View {
    let route: ProcessRoute
    let rankBy: RankBy
    let strings: UIStrings

    var body: some View {
        let r = route.result
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 6) {
                        if route.best {
                            Text(strings.best)
                                .font(.pixel(10)).foregroundStyle(Palette.woodDarker)
                                .padding(.horizontal, 5).padding(.vertical, 2)
                                .background(Palette.coin)
                        }
                        Text(strings.name(machineName.en, machineName.zh))
                            .font(.pixel(14)).foregroundStyle(Palette.ink)
                    }
                    Text(strings.name(r.outputNameEn, r.outputNameZh))
                        .font(.pixel(13)).foregroundStyle(Palette.inkSoft)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 3) {
                    value(
                        "\(Int(route.perInputValue.rounded()))g",
                        emphasised: rankBy == .total
                    )
                    if let gpd = route.goldPerDay {
                        value("\(Int(gpd.rounded()))g/d", emphasised: rankBy == .perDay)
                    } else {
                        value(strings.instant, emphasised: rankBy == .perDay)
                    }
                }
            }
            details
        }
        .padding(10)
        .svPanel(route.best ? Palette.parchmentLight : Palette.parchment)
        .overlay(alignment: .leading) {
            if route.best { Rectangle().fill(Palette.leaf).frame(width: 4) }
        }
    }

    private func value(_ text: String, emphasised: Bool) -> some View {
        Text(text)
            .font(.pixel(emphasised ? 17 : 12))
            .foregroundStyle(emphasised ? Palette.ink : Palette.inkSoft)
    }

    /// Batch size, machine time, consumables and any stacked profession bonuses.
    private var details: some View {
        let r = route.result
        var parts: [String] = []
        if r.inputCount > 1 { parts.append("\(strings.batch(r.inputCount)) → \(r.outputCount)") }
        if route.effectiveDays > 0 { parts.append(strings.days(route.effectiveDays)) }
        if route.extraCost > 0 { parts.append("−\(route.extraCost)g \(strings.coal)") }
        let bonuses = route.appliedBonuses.compactMap { strings.bonusName[$0.key] }
        if bonuses.count > 1 {
            parts.append("\(bonuses.joined(separator: " + ")) \(strings.stacks)")
        } else if let only = bonuses.first {
            parts.append(only)
        }
        return Group {
            if !parts.isEmpty {
                Text(parts.joined(separator: " · "))
                    .font(.pixel(11)).foregroundStyle(Palette.inkSoft)
            }
        }
    }

    private var machineName: (en: String, zh: String) {
        MachineNames.lookup[route.result.machineId] ?? (route.result.machineId, route.result.machineId)
    }
}

/// Machine display names, filled in from the shared rule file at launch.
enum MachineNames {
    static var lookup: [String: (en: String, zh: String)] = [:]
}
