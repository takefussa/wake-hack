import AlarmKit
import ActivityKit
import AppIntents
import AVFoundation
import ExpoModulesCore
import Foundation
import SwiftUI

private struct WakeAlarmMetadata: AlarmMetadata {
  let source: String
}

@available(iOS 26.0, *)
private struct WakeAlarmStopIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "オキタ！を開く"
  static var openAppWhenRun: Bool = true

  @Parameter(title: "朝リクエストID")
  var morningRequestId: String

  init() { morningRequestId = "" }
  init(morningRequestId: String) { self.morningRequestId = morningRequestId }

  func perform() async throws -> some IntentResult {
    UserDefaults.standard.set(
      [
        "morningRequestId": morningRequestId,
        "stoppedAt": ISO8601DateFormatter().string(from: Date())
      ],
      forKey: "wake-hack-stopped-alarm"
    )
    return .result()
  }
}

private enum WakeAlarmFileError: LocalizedError {
  case invalidRemoteURL
  case invalidVoiceIdentifier
  case invalidResponse
  case audioConversionFailed
  case soundDirectoryUnavailable
  case operationFailed(stage: String, detail: String)

  var errorDescription: String? {
    switch self {
    case .invalidRemoteURL:
      return "The remote voice URL is invalid."
    case .invalidVoiceIdentifier:
      return "The voice identifier is invalid."
    case .invalidResponse:
      return "The remote voice could not be downloaded."
    case .audioConversionFailed:
      return "The remote voice could not be converted for AlarmKit."
    case .soundDirectoryUnavailable:
      return "The app sound directory is unavailable."
    case let .operationFailed(stage, detail):
      return "Wake alarm \(stage) failed: \(detail)"
    }
  }
}

public final class WakeAlarmModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WakeAlarm")

    Function("isAvailable") {
      if #available(iOS 26.0, *) {
        return true
      }
      return false
    }

    Function("getAuthorizationStatus") {
      guard #available(iOS 26.0, *) else {
        return "unavailable"
      }
      return Self.authorizationStatusName(AlarmManager.shared.authorizationState)
    }

    AsyncFunction("requestAuthorization") { () async throws -> String in
      guard #available(iOS 26.0, *) else {
        return "unavailable"
      }
      let status = try await AlarmManager.shared.requestAuthorization()
      return Self.authorizationStatusName(status)
    }

    AsyncFunction("scheduleAlarm") {
      (idString: String, fireDateMs: Double, title: String, morningRequestId: String) async throws -> [String: Any] in
      guard #available(iOS 26.0, *) else {
        throw Exception(
          name: "WakeAlarmUnavailable",
          description: "AlarmKit requires iOS 26 or later."
        )
      }
      guard let id = UUID(uuidString: idString) else {
        throw Exception(
          name: "WakeAlarmInvalidIdentifier",
          description: "The alarm identifier is invalid."
        )
      }

      let fireDate = Date(timeIntervalSince1970: fireDateMs / 1_000)
      guard fireDate.timeIntervalSinceNow >= 5 else {
        throw Exception(
          name: "WakeAlarmInvalidDate",
          description: "The alarm date must be in the future."
        )
      }

      let configuration = Self.makeConfiguration(
        fireDate: fireDate,
        title: title,
        morningRequestId: morningRequestId,
        sound: .default
      )

      let alarm = try await AlarmManager.shared.schedule(
        id: id,
        configuration: configuration
      )
      return [
        "id": alarm.id.uuidString,
        "scheduledFor": fireDateMs
      ]
    }

    AsyncFunction("replaceAlarmWithVoice") {
      (
        oldIdString: String,
        newIdString: String,
        fireDateMs: Double,
        title: String,
        remoteUrlString: String,
        voiceId: String,
        morningRequestId: String
      ) async throws -> [String: Any] in
      guard #available(iOS 26.0, *) else {
        throw Exception(
          name: "WakeAlarmUnavailable",
          description: "AlarmKit requires iOS 26 or later."
        )
      }
      guard
        let oldId = UUID(uuidString: oldIdString),
        let newId = UUID(uuidString: newIdString)
      else {
        throw Exception(
          name: "WakeAlarmInvalidIdentifier",
          description: "The alarm identifier is invalid."
        )
      }

      let fireDate = Date(timeIntervalSince1970: fireDateMs / 1_000)
      guard fireDate.timeIntervalSinceNow >= 8 else {
        throw Exception(
          name: "WakeAlarmInvalidDate",
          description: "There is not enough time to replace the alarm sound."
        )
      }

      let soundFileName: String
      do {
        soundFileName = try await Self.prepareRemoteVoiceSound(
          remoteUrlString: remoteUrlString,
          voiceId: voiceId
        )
      } catch {
        throw WakeAlarmFileError.operationFailed(
          stage: "voice preparation",
          detail: error.localizedDescription
        )
      }
      let configuration = Self.makeConfiguration(
        fireDate: fireDate,
        title: title,
        morningRequestId: morningRequestId,
        sound: .named(soundFileName)
      )

      do {
        let replacement: Alarm
        do {
          replacement = try await AlarmManager.shared.schedule(
            id: newId,
            configuration: configuration
          )
        } catch {
          throw WakeAlarmFileError.operationFailed(
            stage: "custom sound scheduling",
            detail: error.localizedDescription
          )
        }
        do {
          try AlarmManager.shared.cancel(id: oldId)
        } catch {
          try? AlarmManager.shared.cancel(id: newId)
          try? Self.removePreparedSound(fileName: soundFileName)
          throw WakeAlarmFileError.operationFailed(
            stage: "previous alarm cancellation",
            detail: error.localizedDescription
          )
        }

        return [
          "id": replacement.id.uuidString,
          "scheduledFor": fireDateMs,
          "soundFileName": soundFileName
        ]
      } catch {
        try? Self.removePreparedSound(fileName: soundFileName)
        throw error
      }
    }

    AsyncFunction("rescheduleAlarmWithPreparedVoice") {
      (
        oldIdString: String,
        newIdString: String,
        fireDateMs: Double,
        title: String,
        soundFileName: String,
        morningRequestId: String
      ) async throws -> [String: Any] in
      guard #available(iOS 26.0, *) else {
        throw Exception(
          name: "WakeAlarmUnavailable",
          description: "AlarmKit requires iOS 26 or later."
        )
      }
      guard
        let oldId = UUID(uuidString: oldIdString),
        let newId = UUID(uuidString: newIdString)
      else {
        throw Exception(
          name: "WakeAlarmInvalidIdentifier",
          description: "The alarm identifier is invalid."
        )
      }

      let fireDate = Date(timeIntervalSince1970: fireDateMs / 1_000)
      guard fireDate.timeIntervalSinceNow >= 5 else {
        throw Exception(
          name: "WakeAlarmInvalidDate",
          description: "The alarm date must be in the future."
        )
      }
      let soundURL = try Self.preparedSoundURL(fileName: soundFileName)
      guard FileManager.default.fileExists(atPath: soundURL.path) else {
        throw WakeAlarmFileError.invalidResponse
      }

      let configuration = Self.makeConfiguration(
        fireDate: fireDate,
        title: title,
        morningRequestId: morningRequestId,
        sound: .named(soundFileName)
      )
      let replacement = try await AlarmManager.shared.schedule(
        id: newId,
        configuration: configuration
      )
      do {
        try AlarmManager.shared.cancel(id: oldId)
      } catch {
        try? AlarmManager.shared.cancel(id: newId)
        throw error
      }

      return [
        "id": replacement.id.uuidString,
        "scheduledFor": fireDateMs,
        "soundFileName": soundFileName
      ]
    }

    AsyncFunction("cancelAlarm") { (idString: String) throws in
      guard #available(iOS 26.0, *) else {
        return
      }
      guard let id = UUID(uuidString: idString) else {
        throw Exception(
          name: "WakeAlarmInvalidIdentifier",
          description: "The alarm identifier is invalid."
        )
      }
      try AlarmManager.shared.cancel(id: id)
    }

    AsyncFunction("removeSoundFile") { (fileName: String) throws in
      try Self.removePreparedSound(fileName: fileName)
    }

    Function("getAlarmIds") { () throws -> [String] in
      guard #available(iOS 26.0, *) else {
        return []
      }
      return try AlarmManager.shared.alarms.map { $0.id.uuidString }
    }

    Function("consumeStoppedAlarm") { () -> [String: String]? in
      let key = "wake-hack-stopped-alarm"
      let value = UserDefaults.standard.dictionary(forKey: key) as? [String: String]
      UserDefaults.standard.removeObject(forKey: key)
      return value
    }
  }

  @available(iOS 26.0, *)
  private static func makeConfiguration(
    fireDate: Date,
    title: String,
    morningRequestId: String,
    sound: AlertConfiguration.AlertSound
  ) -> AlarmManager.AlarmConfiguration<WakeAlarmMetadata> {
    let alertTitle = LocalizedStringResource(stringLiteral: title)
    let alert: AlarmPresentation.Alert
    if #available(iOS 26.1, *) {
      alert = AlarmPresentation.Alert(title: alertTitle)
    } else {
      alert = AlarmPresentation.Alert(
        title: alertTitle,
        stopButton: AlarmButton(
          text: "停止",
          textColor: .white,
          systemImageName: "stop.fill"
        )
      )
    }
    let presentation = AlarmPresentation(alert: alert)
    let attributes = AlarmAttributes<WakeAlarmMetadata>(
      presentation: presentation,
      metadata: WakeAlarmMetadata(source: "wake-hack"),
      tintColor: Color(red: 0.24, green: 0.34, blue: 0.56)
    )
    return AlarmManager.AlarmConfiguration<WakeAlarmMetadata>.alarm(
      schedule: .fixed(fireDate),
      attributes: attributes,
      stopIntent: WakeAlarmStopIntent(morningRequestId: morningRequestId),
      sound: sound
    )
  }

  private static func prepareRemoteVoiceSound(
    remoteUrlString: String,
    voiceId: String
  ) async throws -> String {
    let trimmed = remoteUrlString.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else {
      throw WakeAlarmFileError.invalidRemoteURL
    }

    let allowedIdentifier = voiceId.allSatisfy {
      $0.isLetter || $0.isNumber || $0 == "-" || $0 == "_"
    }
    guard allowedIdentifier, !voiceId.isEmpty else {
      throw WakeAlarmFileError.invalidVoiceIdentifier
    }

    let shouldDeleteSource: Bool
    let sourceURL: URL

    if let remoteURL = URL(string: trimmed), remoteURL.scheme?.lowercased() == "https" {
      let temporaryURL: URL
      let response: URLResponse
      do {
        (temporaryURL, response) = try await URLSession.shared.download(from: remoteURL)
      } catch {
        throw WakeAlarmFileError.operationFailed(
          stage: "voice download",
          detail: error.localizedDescription
        )
      }
      guard
        let httpResponse = response as? HTTPURLResponse,
        (200..<300).contains(httpResponse.statusCode)
      else {
        throw WakeAlarmFileError.invalidResponse
      }

      let downloadedURL = FileManager.default.temporaryDirectory
        .appendingPathComponent("wake-\(voiceId).m4a")
      if FileManager.default.fileExists(atPath: downloadedURL.path) {
        try FileManager.default.removeItem(at: downloadedURL)
      }
      try FileManager.default.moveItem(at: temporaryURL, to: downloadedURL)
      sourceURL = downloadedURL
      shouldDeleteSource = true
    } else {
      let candidateURL: URL
      if let localURL = URL(string: trimmed),
         localURL.scheme?.lowercased() == "file" || localURL.scheme?.lowercased() == "content"
      {
        candidateURL = localURL
      } else {
        candidateURL = URL(fileURLWithPath: trimmed)
      }

      guard FileManager.default.fileExists(atPath: candidateURL.path) else {
        throw WakeAlarmFileError.invalidRemoteURL
      }
      sourceURL = candidateURL
      shouldDeleteSource = false
    }
    defer {
      if shouldDeleteSource {
        try? FileManager.default.removeItem(at: sourceURL)
      }
    }

    // AlarmKit uses the same custom-sound constraints as local notifications.
    // A PCM WAV in Library/Sounds is the most broadly supported runtime format.
    let soundFileName = "wake-\(voiceId).wav"
    let destinationURL = try soundDirectoryURL().appendingPathComponent(soundFileName)
    if FileManager.default.fileExists(atPath: destinationURL.path) {
      try FileManager.default.removeItem(at: destinationURL)
    }

    do {
      if try isLinearPCMWaveFile(sourceURL) {
        try FileManager.default.copyItem(at: sourceURL, to: destinationURL)
      } else {
        try convertToLinearPCMWAV(from: sourceURL, to: destinationURL)
      }
      let attributes = try FileManager.default.attributesOfItem(atPath: destinationURL.path)
      guard (attributes[.size] as? NSNumber)?.intValue ?? 0 > 0 else {
        throw WakeAlarmFileError.audioConversionFailed
      }
      return soundFileName
    } catch {
      try? FileManager.default.removeItem(at: destinationURL)
      throw error
    }
  }

  private static func isLinearPCMWaveFile(_ url: URL) throws -> Bool {
    let handle = try FileHandle(forReadingFrom: url)
    defer { try? handle.close() }
    let header = try handle.read(upToCount: 12) ?? Data()
    guard header.count == 12 else { return false }

    let riff = Data("RIFF".utf8)
    let wave = Data("WAVE".utf8)
    return header.prefix(4) == riff && header.suffix(4) == wave
  }

  private static func convertToLinearPCMWAV(from sourceURL: URL, to destinationURL: URL) throws {
    let inputFile = try AVAudioFile(forReading: sourceURL)
    let inputFormat = inputFile.processingFormat
    let outputSampleRate = min(max(inputFormat.sampleRate, 8_000), 44_100)
    guard
      inputFormat.channelCount > 0,
      let outputFormat = AVAudioFormat(
        commonFormat: .pcmFormatInt16,
        sampleRate: outputSampleRate,
        channels: 1,
        interleaved: true
      ),
      let converter = AVAudioConverter(from: inputFormat, to: outputFormat)
    else {
      throw WakeAlarmFileError.audioConversionFailed
    }

    let outputFile = try AVAudioFile(
      forWriting: destinationURL,
      settings: outputFormat.settings,
      commonFormat: outputFormat.commonFormat,
      interleaved: outputFormat.isInterleaved
    )
    let inputCapacity: AVAudioFrameCount = 4_096
    let conversionRatio = outputFormat.sampleRate / inputFormat.sampleRate
    let outputCapacity = AVAudioFrameCount(
      max(4_096, ceil(Double(inputCapacity) * conversionRatio) + 32)
    )
    guard
      let inputBuffer = AVAudioPCMBuffer(
        pcmFormat: inputFormat,
        frameCapacity: inputCapacity
      ),
      let outputBuffer = AVAudioPCMBuffer(
        pcmFormat: outputFormat,
        frameCapacity: outputCapacity
      )
    else {
      throw WakeAlarmFileError.audioConversionFailed
    }

    var reachedEndOfInput = false
    var readError: Error?
    var iterationCount = 0

    while iterationCount < 10_000 {
      iterationCount += 1
      outputBuffer.frameLength = 0
      var conversionError: NSError?
      let status = converter.convert(
        to: outputBuffer,
        error: &conversionError
      ) { _, inputStatus in
        if reachedEndOfInput {
          inputStatus.pointee = .endOfStream
          return nil
        }

        do {
          inputBuffer.frameLength = 0
          try inputFile.read(into: inputBuffer, frameCount: inputCapacity)
          if inputBuffer.frameLength == 0 {
            reachedEndOfInput = true
            inputStatus.pointee = .endOfStream
            return nil
          }
          inputStatus.pointee = .haveData
          return inputBuffer
        } catch {
          readError = error
          inputStatus.pointee = .noDataNow
          return nil
        }
      }

      if let readError {
        throw readError
      }
      if let conversionError {
        throw conversionError
      }
      if outputBuffer.frameLength > 0 {
        try outputFile.write(from: outputBuffer)
      }

      switch status {
      case .endOfStream:
        return
      case .inputRanDry where reachedEndOfInput:
        return
      case .error:
        throw WakeAlarmFileError.audioConversionFailed
      default:
        continue
      }
    }

    throw WakeAlarmFileError.audioConversionFailed
  }

  private static func soundDirectoryURL() throws -> URL {
    guard let libraryURL = FileManager.default.urls(
      for: .libraryDirectory,
      in: .userDomainMask
    ).first else {
      throw WakeAlarmFileError.soundDirectoryUnavailable
    }
    let soundsURL = libraryURL.appendingPathComponent("Sounds", isDirectory: true)
    try FileManager.default.createDirectory(
      at: soundsURL,
      withIntermediateDirectories: true
    )
    return soundsURL
  }

  private static func removePreparedSound(fileName: String) throws {
    let fileURL = try preparedSoundURL(fileName: fileName)
    if FileManager.default.fileExists(atPath: fileURL.path) {
      try FileManager.default.removeItem(at: fileURL)
    }
  }

  private static func preparedSoundURL(fileName: String) throws -> URL {
    guard
      !fileName.isEmpty,
      fileName == URL(fileURLWithPath: fileName).lastPathComponent,
      fileName.hasPrefix("wake-"),
      fileName.hasSuffix(".wav") || fileName.hasSuffix(".caf")
    else {
      throw WakeAlarmFileError.invalidVoiceIdentifier
    }
    return try soundDirectoryURL().appendingPathComponent(fileName)
  }

  @available(iOS 26.0, *)
  private static func authorizationStatusName(
    _ status: AlarmManager.AuthorizationState
  ) -> String {
    switch status {
    case .notDetermined:
      return "notDetermined"
    case .denied:
      return "denied"
    case .authorized:
      return "authorized"
    @unknown default:
      return "unknown"
    }
  }
}
