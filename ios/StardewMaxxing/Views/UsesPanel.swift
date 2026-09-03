import SwiftUI

/// "Other uses" — what an item is good for besides selling or processing it.
///
/// This exists because the ranked routes alone give bad advice for items with no profitable
/// route: a Daffodil's only route is "sell raw, 30g", which hides that it's a Spring Foraging
/// Bundle item and Sandy's loved gift. Data comes from the wiki via `npm run build:data`.
struct UsesPanel: View {
    let item: Item
    let strings: UIStrings

    private var uses: ItemUses? {
        guard let u = item.uses, !u.isEmpty else { return nil }
        return u
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(strings.otherUses)
                .font(.pixel(15)).foregroundStyle(Palette.ink)

            if let uses {
                if !uses.bundles.isEmpty {
                    row(strings.usesBundle) {
                        ForEach(uses.bundles, id: \.self) { b in
                            chip(tone: Palette.leafLight) {
                                Text(strings.name(b.bundle))
                                + Text(" · \(strings.name(b.room))").foregroundColor(Palette.inkSoft)
                            }
                        }
                    }
                }
                if !uses.lovedBy.isEmpty {
                    row(strings.usesLovedBy, hint: strings.usesLovedHint) {
                        ForEach(uses.lovedBy, id: \.self) { v in
                            chip(tone: Palette.coin.opacity(0.6)) { Text("♥ \(strings.name(v))") }
                        }
                    }
                }
                if !uses.recipes.isEmpty {
                    row(strings.usesRecipes) {
                        ForEach(uses.recipes, id: \.self) { r in
                            chip(tone: Palette.parchmentDark) { Text(strings.name(r)) }
                        }
                    }
                }
                if let quest = uses.quest {
                    row(strings.usesQuest) {
                        Text(strings.usesQuestText(quest.reward))
                            .font(.pixel(11)).foregroundStyle(Palette.inkSoft)
                    }
                }
            } else {
                Text(strings.usesNone)
                    .font(.pixel(11)).foregroundStyle(Palette.inkSoft)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .svPanel()
    }

    @ViewBuilder
    private func row(
        _ label: String,
        hint: String? = nil,
        @ViewBuilder content: () -> some View
    ) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.pixel(12)).foregroundStyle(Palette.inkSoft)
            // Chips wrap naturally at phone width rather than scrolling sideways.
            FlowLayout(spacing: 4) { content() }
            if let hint {
                Text(hint).font(.pixel(10)).foregroundStyle(Palette.inkSoft.opacity(0.75))
            }
        }
    }

    private func chip(tone: Color, @ViewBuilder content: () -> some View) -> some View {
        content()
            .font(.pixel(12))
            .foregroundStyle(Palette.ink)
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(tone)
            .overlay(Rectangle().strokeBorder(Palette.wood.opacity(0.5), lineWidth: 2))
    }
}

/// Wrapping horizontal stack — SwiftUI has no built-in flow layout, and chip rows here are
/// variable-width (villager names, bundle names, dish names) so they must wrap.
struct FlowLayout: Layout {
    var spacing: CGFloat = 4

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: maxWidth, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, rowHeight: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
