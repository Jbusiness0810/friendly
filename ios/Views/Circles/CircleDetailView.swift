import SwiftUI

struct CircleDetailView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var eventViewModel = EventViewModel()
    let circle: Circle

    private var isMember: Bool {
        guard let userId = authViewModel.currentUser?.id else { return false }
        return circle.memberIds.contains(userId)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: circle.category.systemImage)
                        .font(.system(size: 48))
                        .foregroundColor(Color("AccentGreen"))
                        .frame(width: 90, height: 90)
                        .background(Color("AccentGreen").opacity(0.15))
                        .cornerRadius(20)

                    Text(circle.name)
                        .font(.title)
                        .fontWeight(.bold)

                    HStack(spacing: 16) {
                        Label("\(circle.memberCount)/\(circle.maxMembers)", systemImage: "person.2.fill")
                        Label(circle.category.rawValue, systemImage: "tag.fill")
                    }
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding()

                // Description
                VStack(alignment: .leading, spacing: 8) {
                    Text("About")
                        .font(.headline)
                    Text(circle.description)
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal)

                // Tags
                FlowLayout(spacing: 8) {
                    ForEach(circle.tags, id: \.self) { tag in
                        Text("#\(tag)")
                            .font(.caption)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                    }
                }
                .padding(.horizontal)

                // Join button
                if !isMember && !circle.isFull {
                    Button {
                        Task {
                            guard let userId = authViewModel.currentUser?.id,
                                  let circleId = circle.id else { return }
                            try? await CircleViewModel().joinCircle(circleId: circleId, userId: userId)
                        }
                    } label: {
                        Text("Join Circle")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color("AccentGreen"))
                            .cornerRadius(12)
                    }
                    .padding(.horizontal)
                }

                // Upcoming events
                if !eventViewModel.circleEvents.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Upcoming Events")
                            .font(.headline)
                            .padding(.horizontal)

                        ForEach(eventViewModel.circleEvents) { event in
                            EventRowView(event: event)
                                .padding(.horizontal)
                        }
                    }
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if let circleId = circle.id {
                eventViewModel.fetchEvents(forCircle: circleId)
            }
        }
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = arrange(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrange(proposal: proposal, subviews: subviews)
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(
                x: bounds.minX + result.positions[index].x,
                y: bounds.minY + result.positions[index].y
            ), proposal: .unspecified)
        }
    }

    private func arrange(proposal: ProposedViewSize, subviews: Subviews) -> (positions: [CGPoint], size: CGSize) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }

        return (positions, CGSize(width: maxWidth, height: y + rowHeight))
    }
}
