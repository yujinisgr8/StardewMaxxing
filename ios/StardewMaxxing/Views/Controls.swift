import SwiftUI

/// The chunky bevelled Stardew menu button, used for every toggle in the app.
struct SVButton: View {
    let title: String
    var selected: Bool
    var enabled: Bool = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.pixel(13))
                .foregroundStyle(enabled ? (selected ? Palette.woodDarker : Palette.ink)
                                         : Palette.inkSoft.opacity(0.6))
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .frame(maxWidth: .infinity)
                .background(selected ? Palette.leafLight : Palette.parchmentDark)
                .overlay(Rectangle().strokeBorder(selected ? Palette.leafDark : Palette.wood, lineWidth: 2))
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
    }
}

/// A labelled row of mutually-exclusive choices — the phone equivalent of the desktop
/// app's profession dropdowns.
struct SVPicker<T: Identifiable & Equatable>: View {
    let label: String
    let options: [T]
    let title: (T) -> String
    let hint: (T) -> String?
    @Binding var selection: T

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.pixel(13)).foregroundStyle(Palette.ink)
            // Two columns keeps five-option profession trees readable at phone width.
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 6) {
                ForEach(options) { option in
                    SVButton(title: title(option), selected: selection == option) {
                        selection = option
                    }
                }
            }
            if let hint = hint(selection) {
                Text(hint).font(.pixel(11)).foregroundStyle(Palette.inkSoft)
            }
        }
    }
}
