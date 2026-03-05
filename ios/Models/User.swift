import Foundation
import FirebaseFirestore

struct FriendlyUser: Identifiable, Codable, Hashable {
    @DocumentID var id: String?
    var email: String
    var displayName: String
    var avatarURL: String?
    var bio: String
    var interests: [String]
    var neighborhoodId: String?
    var location: GeoPoint?
    var circleIds: [String]
    var badges: [String]
    var points: Int
    var level: Int
    var joinedAt: Date
    var lastActiveAt: Date
    var hasCompletedOnboarding: Bool
    var availability: Availability
    var notificationPreferences: NotificationPreferences

    var initials: String {
        let parts = displayName.split(separator: " ")
        let first = parts.first?.prefix(1) ?? ""
        let last = parts.count > 1 ? parts.last!.prefix(1) : ""
        return "\(first)\(last)".uppercased()
    }

    static var placeholder: FriendlyUser {
        FriendlyUser(
            email: "user@example.com",
            displayName: "New User",
            bio: "",
            interests: [],
            circleIds: [],
            badges: [],
            points: 0,
            level: 1,
            joinedAt: Date(),
            lastActiveAt: Date(),
            hasCompletedOnboarding: false,
            availability: .init(),
            notificationPreferences: .init()
        )
    }
}

struct Availability: Codable, Hashable {
    var weekdayMornings: Bool = false
    var weekdayAfternoons: Bool = false
    var weekdayEvenings: Bool = true
    var weekendMornings: Bool = true
    var weekendAfternoons: Bool = true
    var weekendEvenings: Bool = true
}

struct NotificationPreferences: Codable, Hashable {
    var newMatches: Bool = true
    var circleActivity: Bool = true
    var eventReminders: Bool = true
    var badges: Bool = true
    var weeklyDigest: Bool = true
}
