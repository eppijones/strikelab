import Foundation

extension Notification.Name {
    /// Posted when a driving-range session is persisted to `practiceSessions`
    /// (watch `rangeEnded`, manual SAVE NOW, etc.) so cloud sync can run.
    static let strikeLabPracticeSessionSaved = Notification.Name("StrikeLabPracticeSessionSaved")
}
