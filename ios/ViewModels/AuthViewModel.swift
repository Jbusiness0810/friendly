import Foundation
import FirebaseAuth
import FirebaseFirestore
import Combine

@MainActor
class AuthViewModel: ObservableObject {
    @Published var currentUser: FriendlyUser?
    @Published var isLoading = true
    @Published var errorMessage: String?
    @Published var hasCompletedOnboarding = false

    private var authStateListener: AuthStateDidChangeListenerHandle?
    private var userListener: ListenerRegistration?
    private let db = Firestore.firestore()

    init() {
        listenToAuthState()
    }

    deinit {
        if let listener = authStateListener {
            Auth.auth().removeStateDidChangeListener(listener)
        }
        userListener?.remove()
    }

    private func listenToAuthState() {
        authStateListener = Auth.auth().addStateDidChangeListener { [weak self] _, firebaseUser in
            guard let self else { return }
            if let firebaseUser {
                self.fetchUser(userId: firebaseUser.uid)
            } else {
                self.currentUser = nil
                self.isLoading = false
            }
        }
    }

    private func fetchUser(userId: String) {
        userListener?.remove()
        userListener = db.collection("users").document(userId)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self else { return }
                self.isLoading = false

                if let error {
                    self.errorMessage = error.localizedDescription
                    return
                }

                guard let snapshot, snapshot.exists else {
                    self.currentUser = nil
                    return
                }

                do {
                    self.currentUser = try snapshot.data(as: FriendlyUser.self)
                    self.hasCompletedOnboarding = self.currentUser?.hasCompletedOnboarding ?? false
                } catch {
                    self.errorMessage = "Failed to load user profile"
                }
            }
    }

    func signUp(email: String, password: String, displayName: String) async {
        errorMessage = nil
        do {
            let result = try await Auth.auth().createUser(withEmail: email, password: password)
            let user = FriendlyUser(
                email: email,
                displayName: displayName,
                bio: "",
                interests: [],
                circleIds: [],
                badges: [],
                points: 0,
                level: 1,
                joinedAt: Date(),
                lastActiveAt: Date(),
                hasCompletedOnboarding: false,
                availability: Availability(),
                notificationPreferences: NotificationPreferences()
            )
            try db.collection("users").document(result.user.uid).setData(from: user)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signIn(email: String, password: String) async {
        errorMessage = nil
        do {
            try await Auth.auth().signIn(withEmail: email, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signOut() {
        do {
            try Auth.auth().signOut()
            currentUser = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func updateOnboardingComplete() async {
        guard let userId = currentUser?.id else { return }
        do {
            try await db.collection("users").document(userId).updateData([
                "hasCompletedOnboarding": true
            ])
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
