import Foundation
import FirebaseFirestore
import Combine

@MainActor
class MatchViewModel: ObservableObject {
    @Published var pendingMatches: [Match] = []
    @Published var acceptedMatches: [Match] = []
    @Published var matchedUsers: [String: FriendlyUser] = [:]
    @Published var currentMatchIndex = 0
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let db = Firestore.firestore()
    private var listener: ListenerRegistration?

    func fetchMatches(userId: String) {
        isLoading = true
        listener = db.collection("matches")
            .whereField("userIds", arrayContains: userId)
            .order(by: "createdAt", descending: true)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self else { return }
                self.isLoading = false

                if let error {
                    self.errorMessage = error.localizedDescription
                    return
                }

                let matches = snapshot?.documents.compactMap {
                    try? $0.data(as: Match.self)
                } ?? []

                self.pendingMatches = matches.filter { $0.status == .pending }
                self.acceptedMatches = matches.filter { $0.status == .accepted }

                Task {
                    await self.fetchMatchedUsers(matches: matches, currentUserId: userId)
                }
            }
    }

    private func fetchMatchedUsers(matches: [Match], currentUserId: String) async {
        let otherUserIds = Set(matches.compactMap { $0.otherUserId(currentUserId: currentUserId) })

        for userId in otherUserIds where matchedUsers[userId] == nil {
            do {
                let doc = try await db.collection("users").document(userId).getDocument()
                if let user = try? doc.data(as: FriendlyUser.self) {
                    matchedUsers[userId] = user
                }
            } catch {
                print("Failed to fetch user \(userId): \(error)")
            }
        }
    }

    func respondToMatch(matchId: String, accept: Bool) async {
        do {
            try await db.collection("matches").document(matchId).updateData([
                "status": accept ? MatchStatus.accepted.rawValue : MatchStatus.declined.rawValue,
                "respondedAt": Timestamp(date: Date())
            ])
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func nextMatch() {
        if currentMatchIndex < pendingMatches.count - 1 {
            currentMatchIndex += 1
        }
    }

    func cleanup() {
        listener?.remove()
    }
}
