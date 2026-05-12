//
//  TeeUserFacingError.swift
//  StrikeLabCaddie
//
//  Maps low-level URL errors (missing host, offline, etc.) to copy that
//  belongs in product UI instead of raw NSError dumps.
//

import Foundation

enum TeeUserFacingError {
    static func message(for error: Error) -> String {
        let ns = error as NSError
        if ns.domain == NSURLErrorDomain {
            switch ns.code {
            case NSURLErrorCannotFindHost,
                 NSURLErrorDNSLookupFailed,
                 NSURLErrorCannotConnectToHost:
                return "The StrikeLab Tee service isn’t reachable right now (server name or network). You can still start a round from the Round tab using courses on your phone."
            case NSURLErrorNotConnectedToInternet,
                 NSURLErrorDataNotAllowed:
                return "You’re offline. Tee booking needs a network connection."
            case NSURLErrorTimedOut:
                return "The request timed out. Try again in a moment."
            default:
                break
            }
        }
        return ns.localizedDescription
    }
}
