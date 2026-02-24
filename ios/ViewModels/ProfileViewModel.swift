import Foundation
import FirebaseFirestore
import FirebaseAuth

@MainActor
class ProfileViewModel: ObservableObject {
    @Published var user: FriendlyUser?
    @Published var earnedBadges: [Badge] = []
    @Published var stats = UserStats()
    @Published var isEditing = false
    @Published var errorMessage: String?

    private let db = Firestore.firestore()

    func loadProfile(userId: String) async {
        do {
            let doc = try await db.collection("users").document(userId).getDocument()
            user = try doc.data(as: FriendlyUser.self)
            await loadBadges(userId: userId)
            await loadStats(userId: userId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func loadBadges(userId: String) async {
        guard let user else { return }
        earnedBadges = Badge.allBadges.filter { badge in
            user.badges.contains(badge.id)
        }
    }

    private func loadStats(userId: String) async {
        do {
            let circlesSnapshot = try await db.collection("circles")
                .whereField("memberIds", arrayContains: userId)
                .getDocuments()

            let eventsSnapshot = try await db.collection("events")
                .whereField("attendeeIds", arrayContains: userId)
                .getDocuments()

            let matchesSnapshot = try await db.collection("matches")
                .whereField("userIds", arrayContains: userId)
                .whereField("status", isEqualTo: MatchStatus.accepted.rawValue)
                .getDocuments()

            stats = UserStats(
                circlesJoined: circlesSnapshot.documents.count,
                eventsAttended: eventsSnapshot.documents.count,
                connectionsCount: matchesSnapshot.documents.count,
                badgesEarned: earnedBadges.count,
                points: user?.points ?? 0,
                level: user?.level ?? 1
            )
        } catch {
            print("Failed to load stats: \(error)")
        }
    }

    func updateProfile(displayName: String, bio: String, interests: [String]) async {
        guard let userId = user?.id else { return }
        do {
            try await db.collection("users").document(userId).updateData([
                "displayName": displayName,
                "bio": bio,
                "interests": interests,
                "lastActiveAt": Timestamp(date: Date())
            ])
            isEditing = false
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func deleteAccount() async {
        guard let userId = user?.id else { return }
        do {
            try await db.collection("users").document(userId).delete()
            try await Auth.auth().currentUser?.delete()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct UserStats {
    var circlesJoined: Int = 0
    var eventsAttended: Int = 0
    var connectionsCount: Int = 0
    var badgesEarned: Int = 0
    var points: Int = 0
    var level: Int = 1
}
