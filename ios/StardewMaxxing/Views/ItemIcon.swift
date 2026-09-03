import SwiftUI

/// Real game sprites from shared/sprites/<id>.png — the very same files the desktop app
/// bundles. Falls back to a coloured tile + category glyph when an item has no sprite.
struct ItemIcon: View {
    let item: Item
    var size: CGFloat = 28

    private static var cache: [String: UIImage] = [:]

    private var sprite: UIImage? {
        if let hit = Self.cache[item.id] { return hit }
        guard let url = Bundle.main.url(forResource: item.id, withExtension: "png", subdirectory: "sprites"),
              let image = UIImage(contentsOfFile: url.path) else { return nil }
        Self.cache[item.id] = image
        return image
    }

    var body: some View {
        Group {
            if let sprite {
                Image(uiImage: sprite)
                    .interpolation(.none)   // keep pixel art crisp
                    .resizable()
                    .scaledToFit()
            } else {
                let f = Self.fallback[item.category] ?? (Palette.woodLight, "◆")
                ZStack {
                    Rectangle().fill(f.0)
                    Text(f.1).font(.system(size: size * 0.55))
                }
            }
        }
        .frame(width: size, height: size)
    }

    private static let fallback: [Category: (Color, String)] = [
        .fruit: (Color(hex: 0xE06C75), "🍎"), .vegetable: (Color(hex: 0x98C379), "🥕"),
        .flower: (Color(hex: 0xD98CC4), "🌸"), .forage: (Color(hex: 0x9BB36A), "🍃"),
        .fish: (Color(hex: 0x61AFEF), "🐟"), .roe: (Color(hex: 0xE5A94E), "🥚"),
        .milk: (Color(hex: 0xF2F2F2), "🥛"), .egg: (Color(hex: 0xF6E7B4), "🥚"),
        .wool: (Color(hex: 0xEDE3D2), "🧶"), .mushroom: (Color(hex: 0xB08968), "🍄"),
        .other: (Palette.woodLight, "◆"),
    ]
}
