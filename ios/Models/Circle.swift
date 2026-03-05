import Foundation
import FirebaseFirestore

struct Circle: Identifiable, Codable, Hashable {
    @DocumentID var id: String?
    var name: String
    var description: String
    var category: CircleCategory
    var iconName: String
    var coverImageURL: String?
    var neighborhoodId: String
    var creatorId: String
    var memberIds: [String]
    var maxMembers: Int
    var isPublic: Bool
    var tags: [String]
    var createdAt: Date
    var nextEventDate: Date?

    var memberCount: Int { memberIds.count }
    var isFull: Bool { memberIds.count >= maxMembers }

    static var placeholder: Circle {
        Circle(
            name: "Morning Runners",
            description: "Early morning running group for all levels",
            category: .fitness,
            iconName: "figure.run",
            neighborhoodId: "",
            creatorId: "",
            memberIds: [],
            maxMembers: 20,
            isPublic: true,
            tags: ["running", "fitness", "outdoors"],
            createdAt: Date()
        )
    }
}

enum CircleCategory: String, Codable, CaseIterable, Hashable {
    case fitness = "Fitness"
    case food = "Food & Cooking"
    case books = "Book Club"
    case games = "Games"
    case outdoors = "Outdoors"
    case arts = "Arts & Crafts"
    case music = "Music"
    case tech = "Tech"
    case pets = "Pets"
    case parents = "Parents"
    case wellness = "Wellness"
    case social = "Social"
    case volunteer = "Volunteer"
    case other = "Other"

    var systemImage: String {
        switch self {
        case .fitness: return "figure.run"
        case .food: return "fork.knife"
        case .books: return "book.fill"
        case .games: return "gamecontroller.fill"
        case .outdoors: return "leaf.fill"
        case .arts: return "paintpalette.fill"
        case .music: return "music.note"
        case .tech: return "laptopcomputer"
        case .pets: return "pawprint.fill"
        case .parents: return "figure.2.and.child.holdinghands"
        case .wellness: return "heart.fill"
        case .social: return "cup.and.saucer.fill"
        case .volunteer: return "hands.sparkles.fill"
        case .other: return "star.fill"
        }
    }
}
