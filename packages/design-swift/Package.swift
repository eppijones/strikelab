// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "StrikeLabDesign",
    platforms: [
        .iOS(.v17),
        .watchOS(.v10),
    ],
    products: [
        .library(name: "StrikeLabDesign", targets: ["StrikeLabDesign"]),
    ],
    targets: [
        .target(
            name: "StrikeLabDesign",
            path: "Sources/StrikeLabDesign"
        ),
    ]
)
