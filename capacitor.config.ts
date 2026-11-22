import type { CapacitorConfig } from "@capacitor/cli";

// Android открывает опубликованный TanStack Start-сайт: серверные маршруты
// импорта продолжают выполняться на нём, а не внутри WebView.
// Здесь задан постоянный production HTTPS-домен этого приложения.
// Не заменяйте его на localhost или временный preview URL.
const config: CapacitorConfig = {
  appId: "ru.example.receptvkarmane",
  appName: "Рецепт в кармане",
  webDir: "dist/client",
  server: {
    url: "https://recept-v-karmane.lovable.app",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
