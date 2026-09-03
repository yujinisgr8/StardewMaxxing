import SwiftUI

/// App-wide state: the loaded shared data, the player's settings, and the UI language.
/// Settings and language persist between launches via @AppStorage-backed raw values.
@Observable
final class AppModel {
    enum LoadState {
        case ok(GameData)
        case failed(String)
    }

    let state: LoadState
    var settings = Settings() { didSet { persistSettings() } }
    var lang: Lang { didSet { UserDefaults.standard.set(lang.rawValue, forKey: "lang") } }

    var strings: UIStrings { STRINGS[lang]! }
    var data: GameData? { if case .ok(let d) = state { return d } else { return nil } }

    init() {
        // Language: follow the device on first launch, then whatever the player picked.
        let saved = UserDefaults.standard.string(forKey: "lang").flatMap(Lang.init(rawValue:))
        let deviceIsChinese = Locale.preferredLanguages.first?.hasPrefix("zh") ?? false
        self.lang = saved ?? (deviceIsChinese ? .zh : .en)

        do {
            self.state = .ok(try GameData.loadFromBundle())
        } catch {
            // Surfaced in the UI rather than crashing, so a packaging mistake is obvious.
            self.state = .failed(String(describing: error))
        }
        if let raw = UserDefaults.standard.data(forKey: "settings"),
           let s = try? JSONDecoder().decode(Settings.self, from: raw) {
            self.settings = s
        }
    }

    private func persistSettings() {
        if let raw = try? JSONEncoder().encode(settings) {
            UserDefaults.standard.set(raw, forKey: "settings")
        }
    }

    /// Case-insensitive match on either language's name, ranked so prefix matches come first.
    func search(_ query: String) -> [Item] {
        guard let items = data?.items else { return [] }
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return items }
        return items
            .compactMap { item -> (Item, Int)? in
                let en = item.nameEn.lowercased(), zh = item.nameZh.lowercased()
                if en.hasPrefix(q) || zh.hasPrefix(q) { return (item, 0) }
                if en.contains(q) || zh.contains(q) { return (item, 1) }
                return nil
            }
            .sorted { a, b in a.1 == b.1 ? a.0.nameEn < b.0.nameEn : a.1 < b.1 }
            .map(\.0)
    }
}
