import SwiftUI

@main
struct StardewMaxxingApp: App {
    @State private var model = AppModel()

    init() {
        // Machine display names come from the shared rule file, so iOS shows the same
        // (wiki-official) EN/zh machine names as the desktop app.
        if let data = try? GameData.loadFromBundle() {
            MachineNames.lookup = Dictionary(
                uniqueKeysWithValues: data.engine.machines.map { ($0.id, ($0.nameEn, $0.nameZh)) }
            )
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(model)
                .tint(Palette.leafDark)
        }
    }
}
