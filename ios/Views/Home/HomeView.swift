import SwiftUI

struct HomeView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = HomeViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Welcome header
                    if let user = authViewModel.currentUser {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Hey, \(user.displayName.split(separator: " ").first.map(String.init) ?? user.displayName)!")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                            if let neighborhood = viewModel.neighborhood {
                                HStack(spacing: 4) {
                                    Image(systemName: "mappin.circle.fill")
                                    Text(neighborhood.fullLocationName)
                                }
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            }
                        }
                        .padding(.horizontal)
                    }

                    // Pending matches
                    if !viewModel.recentMatches.isEmpty {
                        HomeSection(title: "New Matches", systemImage: "heart.fill") {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
                                    ForEach(viewModel.recentMatches) { match in
                                        MatchCardSmall(match: match)
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                    }

                    // Upcoming events
                    if !viewModel.featuredEvents.isEmpty {
                        HomeSection(title: "Upcoming Events", systemImage: "calendar") {
                            VStack(spacing: 12) {
                                ForEach(viewModel.featuredEvents.prefix(3)) { event in
                                    EventRowView(event: event)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }

                    // Active circles
                    if !viewModel.activeCircles.isEmpty {
                        HomeSection(title: "Popular Circles", systemImage: "person.3.fill") {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
                                    ForEach(viewModel.activeCircles) { circle in
                                        CircleCardSmall(circle: circle)
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                    }
                }
                .padding(.vertical)
            }
            .navigationBarTitleDisplayMode(.inline)
            .refreshable {
                if let user = authViewModel.currentUser,
                   let neighborhoodId = user.neighborhoodId {
                    await viewModel.loadHomeData(userId: user.id ?? "", neighborhoodId: neighborhoodId)
                }
            }
            .task {
                if let user = authViewModel.currentUser,
                   let neighborhoodId = user.neighborhoodId {
                    await viewModel.loadHomeData(userId: user.id ?? "", neighborhoodId: neighborhoodId)
                }
            }
        }
    }
}

struct HomeSection<Content: View>: View {
    let title: String
    let systemImage: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: systemImage)
                    .foregroundColor(Color("AccentGreen"))
                Text(title)
                    .font(.title3)
                    .fontWeight(.semibold)
                Spacer()
                Text("See All")
                    .font(.subheadline)
                    .foregroundColor(Color("AccentGreen"))
            }
            .padding(.horizontal)

            content
        }
    }
}

struct MatchCardSmall: View {
    let match: Match

    var body: some View {
        VStack(spacing: 8) {
            Circle()
                .fill(Color("AccentGreen").opacity(0.2))
                .frame(width: 60, height: 60)
                .overlay(
                    Image(systemName: "person.fill")
                        .font(.title2)
                        .foregroundColor(Color("AccentGreen"))
                )
            Text("\(match.scorePercentage)% match")
                .font(.caption)
                .fontWeight(.medium)
            Text(match.sharedInterests.prefix(2).joined(separator: ", "))
                .font(.caption2)
                .foregroundColor(.secondary)
                .lineLimit(1)
        }
        .frame(width: 100)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
    }
}

struct CircleCardSmall: View {
    let circle: Circle

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: circle.category.systemImage)
                .font(.title2)
                .foregroundColor(Color("AccentGreen"))
                .frame(width: 44, height: 44)
                .background(Color("AccentGreen").opacity(0.15))
                .cornerRadius(10)

            Text(circle.name)
                .font(.subheadline)
                .fontWeight(.medium)
                .lineLimit(1)

            Text("\(circle.memberCount) members")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(width: 140)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
    }
}

struct EventRowView: View {
    let event: Event

    var body: some View {
        HStack(spacing: 12) {
            VStack {
                Text(event.startDate.formatted(.dateTime.month(.abbreviated)))
                    .font(.caption)
                    .foregroundColor(Color("AccentGreen"))
                Text(event.startDate.formatted(.dateTime.day()))
                    .font(.title2)
                    .fontWeight(.bold)
            }
            .frame(width: 50)

            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text(event.location.name)
                    .font(.caption)
                    .foregroundColor(.secondary)
                HStack(spacing: 4) {
                    Image(systemName: "person.2.fill")
                        .font(.caption2)
                    Text("\(event.attendeeCount)/\(event.maxAttendees)")
                        .font(.caption)
                }
                .foregroundColor(.secondary)
            }

            Spacer()

            Text(event.cost.displayText)
                .font(.caption)
                .fontWeight(.medium)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color("AccentGreen").opacity(0.1))
                .cornerRadius(6)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
    }
}
