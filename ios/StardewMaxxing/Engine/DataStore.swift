import Foundation

/// Loads the shared core: shared/items.json + shared/machines.json, bundled into the app
/// (see the Xcode "Copy Bundle Resources" phase). Both files are generated on the desktop
/// side by `npm run build:data`, so the two apps always agree on prices and formulas.
struct GameData {
    let items: [Item]
    let engine: Engine

    init(itemsURL: URL, machinesURL: URL) throws {
        let decoder = JSONDecoder()
        self.items = try decoder.decode([Item].self, from: Data(contentsOf: itemsURL))
        self.engine = Engine(rules: try decoder.decode(RulesFile.self, from: Data(contentsOf: machinesURL)))
    }

    /// Load from the app bundle. A failure here means the shared files were not copied in,
    /// which is a build configuration error rather than something to recover from at runtime.
    static func loadFromBundle(_ bundle: Bundle = .main) throws -> GameData {
        guard let items = bundle.url(forResource: "items", withExtension: "json"),
              let machines = bundle.url(forResource: "machines", withExtension: "json") else {
            throw CocoaError(.fileNoSuchFile)
        }
        return try GameData(itemsURL: items, machinesURL: machines)
    }

    func item(id: String) -> Item? { items.first { $0.id == id } }
}
