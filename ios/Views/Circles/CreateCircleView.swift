import SwiftUI

struct CreateCircleView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @ObservedObject var viewModel: CircleViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var description = ""
    @State private var category: CircleCategory = .social
    @State private var maxMembers = 20
    @State private var isPublic = true
    @State private var tags = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Circle Info") {
                    TextField("Circle Name", text: $name)
                    TextField("Description", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section("Category") {
                    Picker("Category", selection: $category) {
                        ForEach(CircleCategory.allCases, id: \.self) { cat in
                            Label(cat.rawValue, systemImage: cat.systemImage)
                                .tag(cat)
                        }
                    }
                }

                Section("Settings") {
                    Stepper("Max Members: \(maxMembers)", value: $maxMembers, in: 2...100)
                    Toggle("Public Circle", isOn: $isPublic)
                }

                Section("Tags") {
                    TextField("Tags (comma separated)", text: $tags)
                }
            }
            .navigationTitle("Create Circle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        Task {
                            let circle = Circle(
                                name: name,
                                description: description,
                                category: category,
                                iconName: category.systemImage,
                                neighborhoodId: authViewModel.currentUser?.neighborhoodId ?? "",
                                creatorId: authViewModel.currentUser?.id ?? "",
                                memberIds: [authViewModel.currentUser?.id ?? ""],
                                maxMembers: maxMembers,
                                isPublic: isPublic,
                                tags: tags.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) },
                                createdAt: Date()
                            )
                            try? await viewModel.createCircle(circle)
                            dismiss()
                        }
                    }
                    .disabled(name.isEmpty || description.isEmpty)
                }
            }
        }
    }
}
