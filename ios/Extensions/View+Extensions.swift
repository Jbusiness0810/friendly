import SwiftUI

extension View {
    func friendlyCard() -> some View {
        self
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.06), radius: 6, y: 3)
    }

    func friendlyButton() -> some View {
        self
            .font(.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color("AccentGreen"))
            .cornerRadius(12)
    }

    func friendlySecondaryButton() -> some View {
        self
            .font(.headline)
            .foregroundColor(Color("AccentGreen"))
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color("AccentGreen").opacity(0.1))
            .cornerRadius(12)
    }

    @ViewBuilder
    func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}
