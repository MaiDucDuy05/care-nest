import Cocoa
import FlutterMacOS

class MainFlutterWindow: NSWindow {
  override func awakeFromNib() {
    let flutterViewController = FlutterViewController()
    let windowFrame = self.frame
    self.contentViewController = flutterViewController
    self.setFrame(windowFrame, display: true)

    RegisterGeneratedPlugins(registry: flutterViewController)

    super.awakeFromNib()
  }

  // Flutter captures all key events — forward Cmd+Q and Cmd+W to the system
  override func performKeyEquivalent(with event: NSEvent) -> Bool {
    if event.modifierFlags.intersection(.deviceIndependentFlagsMask) == .command {
      switch event.charactersIgnoringModifiers {
      case "q":
        NSApplication.shared.terminate(nil)
        return true
      case "w":
        self.performClose(nil)
        return true
      default:
        break
      }
    }
    return super.performKeyEquivalent(with: event)
  }
}
