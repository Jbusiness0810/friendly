import Foundation
import FirebaseFirestore

class GamificationService {
    static let shared = GamificationService()
    private let db = Firestore.firestore()

    private init() {}

    // MARK: - Points

    struct PointValues {
        static let joinCircle = 10
        static let createCircle = 25
        static let attendEvent = 15
        static let hostEvent = 30
        static let acceptMatch = 10
        static let dailyLogin = 5
        static let completeProfile = 20
    }

    func awardPoints(userId: String, points: Int, reason: String) async throws {
        try await db.collection("users").document(userId).updateData([
            "points": FieldValue.increment(Int64(points)),
            "lastActiveAt": Timestamp(date: Date())
        ])

        // Check for level up
        if let user = try await FirebaseService.shared.getUser(userId: userId) {
            let newLevel = calculateLevel(points: user.points + points)
            if newLevel > user.level {
                try await db.collection("users").document(userId).updateData([
                    "level": newLevel
                ])
            }
        }
    }

    func calculateLevel(points: Int) -> Int {
        // Levels require increasingly more points
        // Level 1: 0, Level 2: 100, Level 3: 250, Level 4: 500, etc.
        let thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000]
        for (index, threshold) in thresholds.enumerated().reversed() {
            if points >= threshold {
                return index + 1
            }
        }
        return 1
    }

    // MARK: - Badge Checking

    func checkAndAwardBadges(userId: String) async {
        guard let user = try? await FirebaseService.shared.getUser(userId: userId) else { return }

        let earnedBadgeIds = Set(user.badges)

        for badge in Badge.allBadges where !earnedBadgeIds.contains(badge.id) {
            if await checkBadgeRequirement(badge.requirement, userId: userId) {
                try? await FirebaseService.shared.awardBadge(userId: userId, badgeId: badge.id)
                try? await awardPoints(userId: userId, points: badgePoints(for: badge.tier), reason: "Earned badge: \(badge.name)")
            }
        }
    }

    private func checkBadgeRequirement(_ requirement: BadgeRequirement, userId: String) async -> Bool {
        switch requirement {
        case .joinCircles(let count):
            let snapshot = try? await db.collection("circles")
                .whereField("memberIds", arrayContains: userId)
                .getDocuments()
            return (snapshot?.documents.count ?? 0) >= count

        case .attendEvents(let count):
            let snapshot = try? await db.collection("events")
                .whereField("attendeeIds", arrayContains: userId)
                .getDocuments()
            return (snapshot?.documents.count ?? 0) >= count

        case .hostEvents(let count):
            let snapshot = try? await db.collection("events")
                .whereField("hostId", isEqualTo: userId)
                .getDocuments()
            return (snapshot?.documents.count ?? 0) >= count

        case .acceptMatches(let count):
            let snapshot = try? await db.collection("matches")
                .whereField("userIds", arrayContains: userId)
                .whereField("status", isEqualTo: MatchStatus.accepted.rawValue)
                .getDocuments()
            return (snapshot?.documents.count ?? 0) >= count

        case .seasonalEvent(let season):
            // Simplified: check if user attended any event in the given season
            return false // Would need date-based logic

        case .activityStreak(let days):
            // Would need activity tracking implementation
            return false
        }
    }

    private func badgePoints(for tier: BadgeTier) -> Int {
        switch tier {
        case .bronze: return 25
        case .silver: return 50
        case .gold: return 100
        case .special: return 75
        }
    }

    // MARK: - Seasonal

    func currentSeason() -> String {
        let month = Calendar.current.component(.month, from: Date())
        switch month {
        case 3...5: return "spring"
        case 6...8: return "summer"
        case 9...11: return "fall"
        default: return "winter"
        }
    }

    func seasonalActivities() -> [String] {
        switch currentSeason() {
        case "spring": return ["Cherry blossom walk", "Community garden planting", "Outdoor yoga", "Farmers market"]
        case "summer": return ["Rooftop hangout", "Beach volleyball", "Ice cream social", "Sunset picnic"]
        case "fall": return ["Apple picking", "Fall foliage hike", "Pumpkin carving", "Book club by the fire"]
        case "winter": return ["Hot cocoa meetup", "Ice skating", "Holiday cookie swap", "Board game night"]
        default: return []
        }
    }
}
