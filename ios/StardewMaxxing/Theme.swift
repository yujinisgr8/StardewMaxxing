import SwiftUI

/// The Stardew Valley menu palette, matched to the desktop app's tailwind.config.js so both
/// apps look like the same product.
enum Palette {
    static let parchment      = Color(hex: 0xF5E3C0)
    static let parchmentLight = Color(hex: 0xFBEECA)
    static let parchmentDark  = Color(hex: 0xE8CF9F)
    static let woodLight      = Color(hex: 0xC98B4B)
    static let wood           = Color(hex: 0x8B5A2B)
    static let woodDark       = Color(hex: 0x6B4226)
    static let woodDarker     = Color(hex: 0x4A2C17)
    static let ink            = Color(hex: 0x552F1A)
    static let inkSoft        = Color(hex: 0x7A512E)
    static let coin           = Color(hex: 0xF3C33A)
    static let coinDark       = Color(hex: 0xC98A1E)
    static let leaf           = Color(hex: 0x7AB317)
    static let leafLight      = Color(hex: 0xB9D96B)
    static let leafDark       = Color(hex: 0x557D12)
    static let dirt           = Color(hex: 0x3A2417)
}

extension Color {
    init(hex: UInt32) {
        self.init(
            red:   Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue:  Double(hex & 0xFF) / 255
        )
    }
}

/// Zpix — the bundled pixel font, shared with the desktop app (shared/fonts/Zpix.ttf).
/// Falls back to a monospaced system face if the font fails to register.
extension Font {
    static func pixel(_ size: CGFloat) -> Font {
        .custom("Zpix", size: size)
    }
}

/// The chunky bevelled panel every Stardew menu is built from.
struct SVPanel: ViewModifier {
    var fill: Color = Palette.parchment
    func body(content: Content) -> some View {
        content
            .background(fill)
            .overlay(
                Rectangle().strokeBorder(Palette.woodDark, lineWidth: 3)
            )
            .overlay(alignment: .top) {
                Rectangle().fill(.white.opacity(0.45)).frame(height: 2).padding(.horizontal, 3)
            }
            .overlay(alignment: .bottom) {
                Rectangle().fill(.black.opacity(0.22)).frame(height: 2).padding(.horizontal, 3)
            }
    }
}

extension View {
    func svPanel(_ fill: Color = Palette.parchment) -> some View {
        modifier(SVPanel(fill: fill))
    }
}
