import Foundation
import FirebaseFirestore

struct Match: Identifiable, Codable, Hashable {
    @DocumentID var id: String?
    var userIds: [String]
    var matchScore: Double
    var sharedInterests: [String]
    var sharedCircles: [String]
    var matchReason: String
    var status: MatchStatus
    var createdAt: Date
    var respondedAt: Date?
    var conversationId: String?

    var scorePercentage: Int {
        Int(matchScore * 100)
    }

    func otherUserId(currentUserId: String) -> String? {
        userIds.first { $0 != currentUserId }
    }

    static var placeholder: Match {
        Match(
            userIds: ["user1", "user2"],
            matchScore: 0.85,
            sharedInterests: ["running", "cooking", "reading"],
            sharedCircles: ["Morning Runners"],
            matchReason: "You both love running and live nearby",
            status: .pending,
            createdAt: Date()
        )
    }
}

enum MatchStatus: String, Codable, Hashable {
    case pending
    case accepted
    case declined
    case expired

    var displayText: String {
        switch self {
        case .pending: return "New Match"
        case .accepted: return "Connected"
        case .declined: return "Passed"
        case .expired: return "Expired"
        }
    }
}

struct MatchPreferences: Codable, Hashable {
    var maxDistance: Double = 2.0 // miles
    var ageRange: ClosedRange<Int> = 18...99
    var preferredCategories: [CircleCategory] = []
    var matchFrequency: MatchFrequency = .weekly
}

enum MatchFrequency: String, Codable, Hashable {
    case daily
    case weekly
    case biweekly

    var displayText: String {
        switch self {
        case .daily: return "Daily"
        case .weekly: return "Weekly"
        case .biweekly: return "Every 2 weeks"
        }
    }
}
