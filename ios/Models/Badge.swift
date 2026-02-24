import Foundation

struct Badge: Identifiable, Codable, Hashable {
    var id: String
    var name: String
    var description: String
    var iconName: String
    var category: BadgeCategory
    var tier: BadgeTier
    var requirement: BadgeRequirement
    var earnedAt: Date?

    var isEarned: Bool { earnedAt != nil }

    static let allBadges: [Badge] = [
        // Social badges
        Badge(id: "first_circle", name: "Circle Starter", description: "Join your first circle", iconName: "badge-circle-starter", category: .social, tier: .bronze, requirement: .joinCircles(count: 1)),
        Badge(id: "social_butterfly", name: "Social Butterfly", description: "Join 5 circles", iconName: "badge-social-butterfly", category: .social, tier: .silver, requirement: .joinCircles(count: 5)),
        Badge(id: "community_pillar", name: "Community Pillar", description: "Join 10 circles", iconName: "badge-community-pillar", category: .social, tier: .gold, requirement: .joinCircles(count: 10)),

        // Event badges
        Badge(id: "first_event", name: "Event Explorer", description: "Attend your first event", iconName: "badge-event-explorer", category: .events, tier: .bronze, requirement: .attendEvents(count: 1)),
        Badge(id: "regular", name: "Regular", description: "Attend 10 events", iconName: "badge-regular", category: .events, tier: .silver, requirement: .attendEvents(count: 10)),
        Badge(id: "event_host", name: "Event Host", description: "Host your first event", iconName: "badge-event-host", category: .events, tier: .bronze, requirement: .hostEvents(count: 1)),

        // Match badges
        Badge(id: "first_match", name: "First Connection", description: "Accept your first match", iconName: "badge-first-connection", category: .matching, tier: .bronze, requirement: .acceptMatches(count: 1)),
        Badge(id: "connector", name: "Connector", description: "Accept 10 matches", iconName: "badge-connector", category: .matching, tier: .silver, requirement: .acceptMatches(count: 10)),

        // Seasonal badges
        Badge(id: "spring_bloom", name: "Spring Bloom", description: "Attend a spring event", iconName: "badge-spring-bloom", category: .seasonal, tier: .special, requirement: .seasonalEvent(season: "spring")),
        Badge(id: "summer_sun", name: "Summer Sun", description: "Attend a summer event", iconName: "badge-summer-sun", category: .seasonal, tier: .special, requirement: .seasonalEvent(season: "summer")),
        Badge(id: "fall_harvest", name: "Fall Harvest", description: "Attend a fall event", iconName: "badge-fall-harvest", category: .seasonal, tier: .special, requirement: .seasonalEvent(season: "fall")),
        Badge(id: "winter_cozy", name: "Winter Cozy", description: "Attend a winter event", iconName: "badge-winter-cozy", category: .seasonal, tier: .special, requirement: .seasonalEvent(season: "winter")),

        // Streak badges
        Badge(id: "week_streak", name: "Week Warrior", description: "7-day activity streak", iconName: "badge-week-warrior", category: .streaks, tier: .bronze, requirement: .activityStreak(days: 7)),
        Badge(id: "month_streak", name: "Month Master", description: "30-day activity streak", iconName: "badge-month-master", category: .streaks, tier: .gold, requirement: .activityStreak(days: 30)),
    ]
}

enum BadgeCategory: String, Codable, CaseIterable, Hashable {
    case social = "Social"
    case events = "Events"
    case matching = "Matching"
    case seasonal = "Seasonal"
    case streaks = "Streaks"
}

enum BadgeTier: String, Codable, Hashable {
    case bronze
    case silver
    case gold
    case special

    var displayName: String { rawValue.capitalized }
}

enum BadgeRequirement: Codable, Hashable {
    case joinCircles(count: Int)
    case attendEvents(count: Int)
    case hostEvents(count: Int)
    case acceptMatches(count: Int)
    case seasonalEvent(season: String)
    case activityStreak(days: Int)
}
