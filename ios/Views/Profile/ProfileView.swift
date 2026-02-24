import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = ProfileViewModel()
    @State private var showEditProfile = false
    @State private var showSettings = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Avatar and name
                    VStack(spacing: 12) {
                        Circle()
                            .fill(Color("AccentGreen").opacity(0.2))
                            .frame(width: 100, height: 100)
                            .overlay(
                                Text(authViewModel.currentUser?.initials ?? "")
                                    .font(.largeTitle)
                                    .fontWeight(.bold)
                                    .foregroundColor(Color("AccentGreen"))
                            )

                        Text(authViewModel.currentUser?.displayName ?? "")
                            .font(.title2)
                            .fontWeight(.bold)

                        if let bio = authViewModel.currentUser?.bio, !bio.isEmpty {
                            Text(bio)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 40)
                        }
                    }
                    .padding(.top)

                    // Stats grid
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        StatCard(value: "\(viewModel.stats.circlesJoined)", label: "Circles")
                        StatCard(value: "\(viewModel.stats.eventsAttended)", label: "Events")
                        StatCard(value: "\(viewModel.stats.connectionsCount)", label: "Friends")
                    }
                    .padding(.horizontal)

                    // Level and points
                    VStack(spacing: 8) {
                        HStack {
                            Text("Level \(viewModel.stats.level)")
                                .font(.headline)
                            Spacer()
                            Text("\(viewModel.stats.points) pts")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        ProgressView(value: Double(viewModel.stats.points % 100), total: 100)
                            .tint(Color("AccentGreen"))
                    }
                    .padding(.horizontal)

                    // Interests
                    if let interests = authViewModel.currentUser?.interests, !interests.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Interests")
                                .font(.headline)
                                .padding(.horizontal)

                            FlowLayout(spacing: 8) {
                                ForEach(interests, id: \.self) { interest in
                                    Text(interest)
                                        .font(.caption)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(Color("AccentGreen").opacity(0.1))
                                        .foregroundColor(Color("AccentGreen"))
                                        .cornerRadius(16)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }

                    // Badges
                    if !viewModel.earnedBadges.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text("Badges")
                                    .font(.headline)
                                Spacer()
                                Text("\(viewModel.earnedBadges.count)/\(Badge.allBadges.count)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding(.horizontal)

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
                                    ForEach(viewModel.earnedBadges) { badge in
                                        BadgeCardView(badge: badge)
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Profile")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        showEditProfile = true
                    } label: {
                        Text("Edit")
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button("Settings") { showSettings = true }
                        Button("Sign Out", role: .destructive) {
                            authViewModel.signOut()
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $showEditProfile) {
                EditProfileView(viewModel: viewModel)
            }
            .task {
                if let userId = authViewModel.currentUser?.id {
                    await viewModel.loadProfile(userId: userId)
                }
            }
        }
    }
}

struct StatCard: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct BadgeCardView: View {
    let badge: Badge

    var body: some View {
        VStack(spacing: 6) {
            Image(badge.iconName)
                .resizable()
                .scaledToFit()
                .frame(width: 50, height: 50)
            Text(badge.name)
                .font(.caption2)
                .fontWeight(.medium)
                .multilineTextAlignment(.center)
        }
        .frame(width: 80)
        .padding(8)
        .background(Color(.systemBackground))
        .cornerRadius(10)
        .shadow(color: .black.opacity(0.05), radius: 2, y: 1)
    }
}

struct EditProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @ObservedObject var viewModel: ProfileViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var displayName = ""
    @State private var bio = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Display Name") {
                    TextField("Name", text: $displayName)
                }
                Section("Bio") {
                    TextEditor(text: $bio)
                        .frame(height: 100)
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            await viewModel.updateProfile(
                                displayName: displayName,
                                bio: bio,
                                interests: authViewModel.currentUser?.interests ?? []
                            )
                            dismiss()
                        }
                    }
                }
            }
            .onAppear {
                displayName = authViewModel.currentUser?.displayName ?? ""
                bio = authViewModel.currentUser?.bio ?? ""
            }
        }
    }
}
