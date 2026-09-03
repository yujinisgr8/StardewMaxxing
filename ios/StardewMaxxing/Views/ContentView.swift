import SwiftUI

struct ContentView: View {
    @Environment(AppModel.self) private var model
    @State private var query = ""
    @State private var showSettings = false

    var body: some View {
        let s = model.strings

        NavigationStack {
            Group {
                switch model.state {
                case .failed(let message):
                    LoadFailureView(message: message)
                case .ok:
                    itemList(s)
                }
            }
            .background(Palette.dirt)
            .navigationTitle(s.appTitle)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button { model.lang = model.lang == .en ? .zh : .en } label: {
                        Text(model.lang == .en ? "中文" : "En").font(.pixel(14))
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showSettings = true } label: { Image(systemName: "gearshape.fill") }
                }
            }
            .sheet(isPresented: $showSettings) { SettingsSheet() }
        }
    }

    private func itemList(_ s: UIStrings) -> some View {
        let results = model.search(query)
        return Group {
            if results.isEmpty {
                ContentUnavailableView {
                    Text(s.noResults).font(.pixel(15))
                } description: {
                    Text(s.pickPrompt).font(.pixel(12))
                }
            } else {
                List(results) { item in
                    NavigationLink(value: item) {
                        HStack(spacing: 10) {
                            ItemIcon(item: item)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(s.name(item.nameEn, item.nameZh))
                                    .font(.pixel(15)).foregroundStyle(Palette.ink)
                                Text(s.name(item.nameZh, item.nameEn))
                                    .font(.pixel(11)).foregroundStyle(Palette.inkSoft)
                            }
                            Spacer()
                            Text("\(item.basePrice)g")
                                .font(.pixel(13)).foregroundStyle(Palette.coinDark)
                        }
                        .padding(.vertical, 2)
                    }
                    .listRowBackground(Palette.parchment)
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
        .navigationDestination(for: Item.self) { RouteListView(item: $0) }
        .searchable(text: $query, prompt: Text(s.searchPlaceholder))
    }
}

/// Shown when the shared data files were not bundled — a build configuration error, so it
/// says exactly what is wrong instead of silently showing an empty list.
struct LoadFailureView: View {
    let message: String
    var body: some View {
        VStack(spacing: 10) {
            Text("Couldn't load the game data")
                .font(.pixel(17)).foregroundStyle(Palette.ink)
            Text("shared/items.json and shared/machines.json must be copied into the app bundle.")
                .font(.pixel(12)).foregroundStyle(Palette.inkSoft)
                .multilineTextAlignment(.center)
            Text(message)
                .font(.system(size: 10, design: .monospaced))
                .foregroundStyle(Palette.inkSoft)
        }
        .padding(20)
        .svPanel()
        .padding(20)
    }
}
