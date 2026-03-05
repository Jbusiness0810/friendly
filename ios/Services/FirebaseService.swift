import Foundation
import FirebaseFirestore
import FirebaseAuth

class FirebaseService {
    static let shared = FirebaseService()
    let db = Firestore.firestore()

    private init() {}

    // MARK: - User Operations

    func getUser(userId: String) async throws -> FriendlyUser? {
        let doc = try await db.collection("users").document(userId).getDocument()
        return try doc.data(as: FriendlyUser.self)
    }

    func updateUser(userId: String, data: [String: Any]) async throws {
        try await db.collection("users").document(userId).updateData(data)
    }

    func updateLastActive(userId: String) async {
        try? await db.collection("users").document(userId).updateData([
            "lastActiveAt": Timestamp(date: Date())
        ])
    }

    // MARK: - Circle Operations

    func getCircle(circleId: String) async throws -> Circle? {
        let doc = try await db.collection("circles").document(circleId).getDocument()
        return try doc.data(as: Circle.self)
    }

    func getCircles(forNeighborhood neighborhoodId: String) async throws -> [Circle] {
        let snapshot = try await db.collection("circles")
            .whereField("neighborhoodId", isEqualTo: neighborhoodId)
            .getDocuments()
        return snapshot.documents.compactMap { try? $0.data(as: Circle.self) }
    }

    func getCircleMembers(circleId: String) async throws -> [FriendlyUser] {
        guard let circle = try await getCircle(circleId: circleId) else { return [] }
        var members: [FriendlyUser] = []
        for memberId in circle.memberIds {
            if let user = try await getUser(userId: memberId) {
                members.append(user)
            }
        }
        return members
    }

    // MARK: - Event Operations

    func getEvent(eventId: String) async throws -> Event? {
        let doc = try await db.collection("events").document(eventId).getDocument()
        return try doc.data(as: Event.self)
    }

    func getUpcomingEvents(limit: Int = 20) async throws -> [Event] {
        let snapshot = try await db.collection("events")
            .whereField("startDate", isGreaterThan: Timestamp(date: Date()))
            .whereField("isCancelled", isEqualTo: false)
            .order(by: "startDate")
            .limit(to: limit)
            .getDocuments()
        return snapshot.documents.compactMap { try? $0.data(as: Event.self) }
    }

    // MARK: - Neighborhood Operations

    func getNeighborhood(neighborhoodId: String) async throws -> Neighborhood? {
        let doc = try await db.collection("neighborhoods").document(neighborhoodId).getDocument()
        return try doc.data(as: Neighborhood.self)
    }

    func getAllNeighborhoods() async throws -> [Neighborhood] {
        let snapshot = try await db.collection("neighborhoods").getDocuments()
        return snapshot.documents.compactMap { try? $0.data(as: Neighborhood.self) }
    }

    // MARK: - Match Operations

    func getMatches(userId: String) async throws -> [Match] {
        let snapshot = try await db.collection("matches")
            .whereField("userIds", arrayContains: userId)
            .order(by: "createdAt", descending: true)
            .getDocuments()
        return snapshot.documents.compactMap { try? $0.data(as: Match.self) }
    }

    // MARK: - Badge Operations

    func awardBadge(userId: String, badgeId: String) async throws {
        try await db.collection("users").document(userId).updateData([
            "badges": FieldValue.arrayUnion([badgeId])
        ])
    }
}
