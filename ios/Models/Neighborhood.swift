import Foundation
import FirebaseFirestore
import CoreLocation

struct Neighborhood: Identifiable, Codable, Hashable {
    @DocumentID var id: String?
    var name: String
    var city: String
    var state: String
    var centerLatitude: Double
    var centerLongitude: Double
    var radiusMiles: Double
    var memberCount: Int
    var circleCount: Int
    var activeEventCount: Int
    var description: String
    var imageURL: String?

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: centerLatitude, longitude: centerLongitude)
    }

    var fullLocationName: String {
        "\(name), \(city)"
    }

    var activityLevel: ActivityLevel {
        let score = memberCount + (circleCount * 5) + (activeEventCount * 10)
        switch score {
        case 0..<20: return .quiet
        case 20..<50: return .moderate
        case 50..<100: return .active
        default: return .thriving
        }
    }

    static var placeholder: Neighborhood {
        Neighborhood(
            name: "Park Slope",
            city: "Brooklyn",
            state: "NY",
            centerLatitude: 40.6710,
            centerLongitude: -73.9814,
            radiusMiles: 1.0,
            memberCount: 145,
            circleCount: 12,
            activeEventCount: 8,
            description: "A vibrant neighborhood with tree-lined streets and an active community"
        )
    }
}

enum ActivityLevel: String, Codable {
    case quiet = "Quiet"
    case moderate = "Moderate"
    case active = "Active"
    case thriving = "Thriving"

    var color: String {
        switch self {
        case .quiet: return "ActivityQuiet"
        case .moderate: return "ActivityModerate"
        case .active: return "ActivityActive"
        case .thriving: return "ActivityThriving"
        }
    }
}
