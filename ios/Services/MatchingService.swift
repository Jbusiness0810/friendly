import Foundation
import FirebaseFirestore

class MatchingService {
    static let shared = MatchingService()
    private let db = Firestore.firestore()

    private init() {}

    /// Calculate match score between two users based on shared interests, circles, and proximity
    func calculateMatchScore(user1: FriendlyUser, user2: FriendlyUser) -> MatchResult {
        var score: Double = 0
        var reasons: [String] = []

        // Interest overlap (0-40 points)
        let sharedInterests = Set(user1.interests).intersection(Set(user2.interests))
        let interestScore = min(Double(sharedInterests.count) * 10.0, 40.0)
        score += interestScore
        if !sharedInterests.isEmpty {
            reasons.append("You share \(sharedInterests.count) interest\(sharedInterests.count == 1 ? "" : "s")")
        }

        // Circle overlap (0-30 points)
        let sharedCircles = Set(user1.circleIds).intersection(Set(user2.circleIds))
        let circleScore = min(Double(sharedCircles.count) * 15.0, 30.0)
        score += circleScore
        if !sharedCircles.isEmpty {
            reasons.append("You're in \(sharedCircles.count) circle\(sharedCircles.count == 1 ? "" : "s") together")
        }

        // Availability overlap (0-20 points)
        let availabilityScore = calculateAvailabilityOverlap(user1.availability, user2.availability)
        score += availabilityScore * 20.0
        if availabilityScore > 0.5 {
            reasons.append("Your schedules align well")
        }

        // Same neighborhood bonus (0-10 points)
        if user1.neighborhoodId == user2.neighborhoodId {
            score += 10.0
            reasons.append("You're in the same neighborhood")
        }

        let normalizedScore = min(score / 100.0, 1.0)

        return MatchResult(
            score: normalizedScore,
            sharedInterests: Array(sharedInterests),
            sharedCircleIds: Array(sharedCircles),
            reason: reasons.joined(separator: " · ")
        )
    }

    private func calculateAvailabilityOverlap(_ a1: Availability, _ a2: Availability) -> Double {
        var matches = 0
        var total = 6

        if a1.weekdayMornings && a2.weekdayMornings { matches += 1 }
        if a1.weekdayAfternoons && a2.weekdayAfternoons { matches += 1 }
        if a1.weekdayEvenings && a2.weekdayEvenings { matches += 1 }
        if a1.weekendMornings && a2.weekendMornings { matches += 1 }
        if a1.weekendAfternoons && a2.weekendAfternoons { matches += 1 }
        if a1.weekendEvenings && a2.weekendEvenings { matches += 1 }

        return Double(matches) / Double(total)
    }

    /// Generate matches for a user from nearby candidates
    func generateMatches(for user: FriendlyUser, candidates: [FriendlyUser], maxMatches: Int = 5) -> [MatchResult] {
        candidates
            .filter { $0.id != user.id }
            .map { calculateMatchScore(user1: user, user2: $0) }
            .filter { $0.score >= 0.3 } // Minimum 30% match
            .sorted { $0.score > $1.score }
            .prefix(maxMatches)
            .map { $0 }
    }

    /// Create a match document in Firestore
    func createMatch(userId1: String, userId2: String, result: MatchResult) async throws {
        let match = Match(
            userIds: [userId1, userId2],
            matchScore: result.score,
            sharedInterests: result.sharedInterests,
            sharedCircles: result.sharedCircleIds,
            matchReason: result.reason,
            status: .pending,
            createdAt: Date()
        )
        try db.collection("matches").addDocument(from: match)
    }
}

struct MatchResult {
    let score: Double
    let sharedInterests: [String]
    let sharedCircleIds: [String]
    let reason: String
}
