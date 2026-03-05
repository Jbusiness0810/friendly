import Foundation
import FirebaseFirestore

struct Event: Identifiable, Codable, Hashable {
    @DocumentID var id: String?
    var title: String
    var description: String
    var circleId: String?
    var circleName: String?
    var hostId: String
    var hostName: String
    var location: EventLocation
    var startDate: Date
    var endDate: Date
    var maxAttendees: Int
    var attendeeIds: [String]
    var waitlistIds: [String]
    var category: CircleCategory
    var imageURL: String?
    var isOutdoor: Bool
    var cost: EventCost
    var createdAt: Date
    var isCancelled: Bool

    var attendeeCount: Int { attendeeIds.count }
    var isFull: Bool { attendeeIds.count >= maxAttendees }
    var hasWaitlist: Bool { !waitlistIds.isEmpty }
    var isUpcoming: Bool { startDate > Date() }
    var isPast: Bool { endDate < Date() }

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE, MMM d · h:mm a"
        return formatter.string(from: startDate)
    }

    var formattedTimeRange: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return "\(formatter.string(from: startDate)) – \(formatter.string(from: endDate))"
    }

    static var placeholder: Event {
        Event(
            title: "Morning Run",
            description: "A casual 5K run through the park",
            hostId: "",
            hostName: "Alex",
            location: .init(name: "Central Park", address: "123 Park Ave", latitude: 40.785091, longitude: -73.968285),
            startDate: Date().addingTimeInterval(86400),
            endDate: Date().addingTimeInterval(86400 + 3600),
            maxAttendees: 10,
            attendeeIds: [],
            waitlistIds: [],
            category: .fitness,
            isOutdoor: true,
            cost: .free,
            createdAt: Date(),
            isCancelled: false
        )
    }
}

struct EventLocation: Codable, Hashable {
    var name: String
    var address: String
    var latitude: Double
    var longitude: Double
}

enum EventCost: Codable, Hashable {
    case free
    case fixed(amount: Double)
    case splitEvenly

    var displayText: String {
        switch self {
        case .free: return "Free"
        case .fixed(let amount): return String(format: "$%.0f", amount)
        case .splitEvenly: return "Split evenly"
        }
    }
}
