import SwiftUI

struct MatchesView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = MatchViewModel()
    @State private var selectedTab = 0

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Matches", selection: $selectedTab) {
                    Text("New").tag(0)
                    Text("Connected").tag(1)
                }
                .pickerStyle(.segmented)
                .padding()

                if viewModel.isLoading {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else if selectedTab == 0 {
                    // Pending matches - card stack
                    if viewModel.pendingMatches.isEmpty {
                        Spacer()
                        VStack(spacing: 12) {
                            Image(systemName: "heart.circle")
                                .font(.system(size: 64))
                                .foregroundColor(.secondary)
                            Text("No new matches")
                                .font(.headline)
                            Text("Check back soon — we're finding people near you!")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 40)
                        }
                        Spacer()
                    } else {
                        MatchCardStack(viewModel: viewModel)
                    }
                } else {
                    // Accepted matches list
                    if viewModel.acceptedMatches.isEmpty {
                        Spacer()
                        VStack(spacing: 12) {
                            Image(systemName: "person.2.fill")
                                .font(.system(size: 48))
                                .foregroundColor(.secondary)
                            Text("No connections yet")
                                .font(.headline)
                            Text("Accept a match to start connecting!")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                    } else {
                        List(viewModel.acceptedMatches) { match in
                            ConnectionRowView(
                                match: match,
                                user: viewModel.matchedUsers[match.otherUserId(currentUserId: authViewModel.currentUser?.id ?? "") ?? ""]
                            )
                        }
                        .listStyle(.plain)
                    }
                }
            }
            .navigationTitle("Matches")
            .task {
                if let userId = authViewModel.currentUser?.id {
                    viewModel.fetchMatches(userId: userId)
                }
            }
            .onDisappear {
                viewModel.cleanup()
            }
        }
    }
}

struct MatchCardStack: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @ObservedObject var viewModel: MatchViewModel

    var currentMatch: Match? {
        guard viewModel.currentMatchIndex < viewModel.pendingMatches.count else { return nil }
        return viewModel.pendingMatches[viewModel.currentMatchIndex]
    }

    var body: some View {
        if let match = currentMatch {
            let otherUser = viewModel.matchedUsers[match.otherUserId(currentUserId: authViewModel.currentUser?.id ?? "") ?? ""]

            VStack(spacing: 20) {
                Spacer()

                // Match card
                VStack(spacing: 16) {
                    // Avatar
                    Circle()
                        .fill(Color("AccentGreen").opacity(0.2))
                        .frame(width: 100, height: 100)
                        .overlay(
                            Text(otherUser?.initials ?? "?")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(Color("AccentGreen"))
                        )

                    Text(otherUser?.displayName ?? "Someone nearby")
                        .font(.title2)
                        .fontWeight(.bold)

                    Text("\(match.scorePercentage)% match")
                        .font(.headline)
                        .foregroundColor(Color("AccentGreen"))

                    Text(match.matchReason)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)

                    // Shared interests
                    if !match.sharedInterests.isEmpty {
                        VStack(spacing: 8) {
                            Text("Shared Interests")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            HStack {
                                ForEach(match.sharedInterests, id: \.self) { interest in
                                    Text(interest)
                                        .font(.caption)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 4)
                                        .background(Color("AccentGreen").opacity(0.1))
                                        .cornerRadius(12)
                                }
                            }
                        }
                    }
                }
                .padding(30)
                .background(Color(.systemBackground))
                .cornerRadius(20)
                .shadow(color: .black.opacity(0.1), radius: 10, y: 5)
                .padding(.horizontal, 20)

                Spacer()

                // Action buttons
                HStack(spacing: 40) {
                    Button {
                        Task {
                            if let matchId = match.id {
                                await viewModel.respondToMatch(matchId: matchId, accept: false)
                                viewModel.nextMatch()
                            }
                        }
                    } label: {
                        Image(systemName: "xmark")
                            .font(.title)
                            .foregroundColor(.red)
                            .frame(width: 64, height: 64)
                            .background(Color.red.opacity(0.1))
                            .clipShape(Circle())
                    }

                    Button {
                        Task {
                            if let matchId = match.id {
                                await viewModel.respondToMatch(matchId: matchId, accept: true)
                                viewModel.nextMatch()
                            }
                        }
                    } label: {
                        Image(systemName: "heart.fill")
                            .font(.title)
                            .foregroundColor(Color("AccentGreen"))
                            .frame(width: 64, height: 64)
                            .background(Color("AccentGreen").opacity(0.1))
                            .clipShape(Circle())
                    }
                }
                .padding(.bottom, 30)
            }
        }
    }
}

struct ConnectionRowView: View {
    let match: Match
    let user: FriendlyUser?

    var body: some View {
        HStack(spacing: 14) {
            Circle()
                .fill(Color("AccentGreen").opacity(0.2))
                .frame(width: 50, height: 50)
                .overlay(
                    Text(user?.initials ?? "?")
                        .fontWeight(.semibold)
                        .foregroundColor(Color("AccentGreen"))
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(user?.displayName ?? "Friend")
                    .font(.headline)
                Text(match.sharedInterests.prefix(3).joined(separator: " · "))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text("\(match.scorePercentage)%")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(Color("AccentGreen"))
        }
        .padding(.vertical, 4)
    }
}
