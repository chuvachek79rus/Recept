import config from "../../capacitor.config";

describe("Capacitor Android config", () => {
  it("uses the exact production HTTPS deployment, never localhost or a preview", () => {
    const serverUrl = config.server?.url;
    expect(serverUrl).toBe("https://recept-v-karmane.lovable.app");
    if (!serverUrl) throw new Error("Capacitor server.url is required");

    const url = new URL(serverUrl);
    expect(url.protocol).toBe("https:");
    expect(url.hostname).not.toBe("localhost");
    expect(url.hostname).not.toBe("127.0.0.1");
    expect(url.hostname.startsWith("id-preview--")).toBe(false);
  });

  it("keeps web assets separate and forbids cleartext or mixed content", () => {
    expect(config.webDir).toBe("dist/client");
    expect(config.server?.cleartext).toBe(false);
    expect(config.android?.allowMixedContent).toBe(false);
  });
});
