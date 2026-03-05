import SwiftUI

struct CirclesListView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = CircleViewModel()
    @State private var showCreateCircle = false
    @State private var selectedCategory: CircleCategory?
    @State private var searchText = ""

    var filteredCircles: [Circle] {
        var result = viewModel.circles
        if let category = selectedCategory {
            result = result.filter { $0.category == category }
        }
        if !searchText.isEmpty {
            result = result.filter {
                $0.name.localizedCaseInsensitiveContains(searchText) ||
                $0.description.localizedCaseInsensitiveContains(searchText) ||
                $0.tags.contains { $0.localizedCaseInsensitiveContains(searchText) }
            }
        }
        return result
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Category filter
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        FilterChip(title: "All", isSelected: selectedCategory == nil) {
                            selectedCategory = nil
                        }
                        ForEach(CircleCategory.allCases, id: \.self) { category in
                            FilterChip(
                                title: category.rawValue,
                                isSelected: selectedCategory == category
                            ) {
                                selectedCategory = category
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }

                // Circles list
                if viewModel.isLoading {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else if filteredCircles.isEmpty {
                    Spacer()
                    VStack(spacing: 12) {
                        Image(systemName: "person.3.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.secondary)
                        Text("No circles found")
                            .font(.headline)
                        Text("Be the first to create one!")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                } else {
                    List(filteredCircles) { circle in
                        NavigationLink(destination: CircleDetailView(circle: circle)) {
                            CircleRowView(circle: circle)
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Circles")
            .searchable(text: $searchText, prompt: "Search circles...")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showCreateCircle = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showCreateCircle) {
                CreateCircleView(viewModel: viewModel)
            }
            .task {
                if let neighborhoodId = authViewModel.currentUser?.neighborhoodId {
                    viewModel.fetchCircles(forNeighborhood: neighborhoodId)
                }
                if let userId = authViewModel.currentUser?.id {
                    viewModel.fetchMyCircles(userId: userId)
                }
            }
            .onDisappear {
                viewModel.cleanup()
            }
        }
    }
}

struct CircleRowView: View {
    let circle: Circle

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: circle.category.systemImage)
                .font(.title3)
                .foregroundColor(.white)
                .frame(width: 48, height: 48)
                .background(Color("AccentGreen"))
                .cornerRadius(12)

            VStack(alignment: .leading, spacing: 4) {
                Text(circle.name)
                    .font(.headline)
                Text(circle.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                HStack(spacing: 12) {
                    Label("\(circle.memberCount)", systemImage: "person.2.fill")
                    Label(circle.category.rawValue, systemImage: "tag.fill")
                }
                .font(.caption2)
                .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
                .padding(.horizontal, 14)
                .padding(.vertical, 6)
                .background(isSelected ? Color("AccentGreen") : Color(.systemGray6))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(16)
        }
    }
}
