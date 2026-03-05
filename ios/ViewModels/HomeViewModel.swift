import Foundation
import FirebaseFirestore
import Combine

@MainActor
class HomeViewModel: ObservableObject {
    @Published var neighborhood: Neighborhood?
    @Published var featuredEvents: [Event] = []
    @Published var activeCircles: [Circle] = []
    @Published var recentMatches: [Match] = []
    @Published var pendingBadges: [Badge] = []
    @Published var activityFeed: [ActivityItem] = []
    @Published var isLoading = false

    private let db = Firestore.firestore()

    func loadHomeData(userId: String, neighborhoodId: String) async {
        isLoading = true
        defer { isLoading = false }

        async let neighborhoodTask: () = fetchNeighborhood(neighborhoodId)
        async let eventsTask: () = fetchFeaturedEvents(neighborhoodId)
        async let circlesTask: () = fetchActiveCircles(neighborhoodId)
        async let matchesTask: () = fetchRecentMatches(userId)

        _ = await (neighborhoodTask, eventsTask, circlesTask, matchesTask)
    }

    private func fetchNeighborhood(_ neighborhoodId: String) async {
        do {
            let doc = try await db.collection("neighborhoods").document(neighborhoodId).getDocument()
            neighborhood = try doc.data(as: Neighborhood.self)
        } catch {
            print("Failed to fetch neighborhood: \(error)")
        }
    }

    private func fetchFeaturedEvents(_ neighborhoodId: String) async {
        do {
            let snapshot = try await db.collection("events")
                .whereField("startDate", isGreaterThan: Timestamp(date: Date()))
                .whereField("isCancelled", isEqualTo: false)
                .order(by: "startDate")
                .limit(to: 5)
                .getDocuments()

            featuredEvents = snapshot.documents.compactMap {
                try? $0.data(as: Event.self)
            }
        } catch {
            print("Failed to fetch events: \(error)")
        }
    }

    private func fetchActiveCircles(_ neighborhoodId: String) async {
        do {
            let snapshot = try await db.collection("circles")
                .whereField("neighborhoodId", isEqualTo: neighborhoodId)
                .order(by: "createdAt", descending: true)
                .limit(to: 6)
                .getDocuments()

            activeCircles = snapshot.documents.compactMap {
                try? $0.data(as: Circle.self)
            }
        } catch {
            print("Failed to fetch circles: \(error)")
        }
    }

    private func fetchRecentMatches(_ userId: String) async {
        do {
            let snapshot = try await db.collection("matches")
                .whereField("userIds", arrayContains: userId)
                .whereField("status", isEqualTo: MatchStatus.pending.rawValue)
                .order(by: "createdAt", descending: true)
                .limit(to: 3)
                .getDocuments()

            recentMatches = snapshot.documents.compactMap {
                try? $0.data(as: Match.self)
            }
        } catch {
            print("Failed to fetch matches: \(error)")
        }
    }
}

struct ActivityItem: Identifiable, Codable {
    var id: String
    var type: ActivityType
    var title: String
    var subtitle: String
    var timestamp: Date
    var iconName: String
}

enum ActivityType: String, Codable {
    case newMember
    case newCircle
    case newEvent
    case badgeEarned
    case matchMade
}
