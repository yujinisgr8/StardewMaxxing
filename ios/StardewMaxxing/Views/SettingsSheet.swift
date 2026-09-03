import SwiftUI

/// Professions, input quality and ranking metric.
///
/// Professions are the in-game skill TREES, not free toggles: Level 5 is one mutually-exclusive
/// pick and Level 10 branches off it, so the Level 10 options shown depend on the Level 5 choice.
/// Only Tiller/Rancher/Artisan/Fisher/Angler change sell value; the rest are shown but labelled
/// informational, exactly as on the desktop.
struct SettingsSheet: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        @Bindable var model = model
        let s = model.strings

        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    group(s.professions) {
                        SVPicker(
                            label: s.level5,
                            options: Level5Prof.allCases,
                            title: { s.prof[$0.rawValue] ?? $0.rawValue },
                            hint: { s.profHint[$0.rawValue] },
                            selection: $model.settings.level5
                        )
                        SVPicker(
                            label: s.level10,
                            options: level10Options(for: model.settings.level5),
                            title: { s.prof[$0.rawValue] ?? $0.rawValue },
                            hint: { s.profHint[$0.rawValue] },
                            selection: $model.settings.level10
                        )
                    }

                    group(s.fishingProfessions) {
                        SVPicker(
                            label: s.level5,
                            options: FishL5.allCases,
                            title: { s.prof[$0.rawValue] ?? $0.rawValue },
                            hint: { s.profHint[$0.rawValue] },
                            selection: $model.settings.fishingLevel5
                        )
                        SVPicker(
                            label: s.level10,
                            options: fishL10Options(for: model.settings.fishingLevel5),
                            title: { s.prof[$0.rawValue] ?? $0.rawValue },
                            hint: { s.profHint[$0.rawValue] },
                            selection: $model.settings.fishingLevel10
                        )
                    }

                    group(s.quality) {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 6) {
                            ForEach(Quality.allCases) { q in
                                SVButton(title: s.qualityName[q] ?? q.rawValue,
                                         selected: model.settings.quality == q) {
                                    model.settings.quality = q
                                }
                            }
                        }
                    }
                }
                .padding(12)
            }
            .background(Palette.dirt)
            .navigationTitle(s.settings)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(s.done) { dismiss() }.font(.pixel(15))
                }
            }
        }
        // Keep the tree valid: changing the Level 5 pick invalidates a Level 10 branch
        // that no longer descends from it.
        .onChange(of: model.settings.level5) { _, new in
            if !level10Options(for: new).contains(model.settings.level10) {
                model.settings.level10 = .none
            }
        }
        .onChange(of: model.settings.fishingLevel5) { _, new in
            if !fishL10Options(for: new).contains(model.settings.fishingLevel10) {
                model.settings.fishingLevel10 = .none
            }
        }
    }

    /// Level 10 farming professions branch off the Level 5 pick (wiki: Skills/Farming).
    private func level10Options(for l5: Level5Prof) -> [Level10Prof] {
        switch l5 {
        case .none: [.none]
        case .tiller: [.none, .artisan, .agriculturist]
        case .rancher: [.none, .coopmaster, .shepherd]
        }
    }

    /// Level 10 fishing professions branch off Fisher/Trapper (wiki: Skills/Fishing).
    private func fishL10Options(for l5: FishL5) -> [FishL10] {
        switch l5 {
        case .none: [.none]
        case .fisher: [.none, .angler, .pirate]
        case .trapper: [.none, .mariner, .luremaster]
        }
    }

    @ViewBuilder
    private func group(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title).font(.pixel(15)).foregroundStyle(Palette.ink)
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .svPanel()
    }
}
