import Foundation
import Security

/// Tiny Keychain wrapper for StrikeLab auth tokens. Generic-password class,
/// scoped by `service` ("com.strikelab.caddie.auth") + `account` (the field
/// name). Values survive app reinstalls when iCloud Keychain is enabled.
enum KeychainStore {
    private static let service = "com.strikelab.caddie.auth"

    @discardableResult
    static func set(_ value: String?, for account: String) -> Bool {
        let baseQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        SecItemDelete(baseQuery as CFDictionary)

        guard let value, let data = value.data(using: .utf8) else {
            return true
        }
        var addQuery = baseQuery
        addQuery[kSecValueData as String] = data
        addQuery[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        return SecItemAdd(addQuery as CFDictionary, nil) == errSecSuccess
    }

    static func get(_ account: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data,
              let str = String(data: data, encoding: .utf8) else {
            return nil
        }
        return str
    }

    static func clearAll() {
        let accounts = ["access_token", "refresh_token", "user_email"]
        for account in accounts {
            set(nil, for: account)
        }
    }
}
