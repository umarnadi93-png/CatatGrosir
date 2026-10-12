import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { ToastHost } from "@/src/components/ui";
import { queryClient } from "@/src/query-client";
import { StoreProvider } from "@/src/store";
import { useTheme } from "@/src/theme";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true)

export default function RootLayout() {
  const { colors } = useTheme();
  // One app level ErrorBoundary; a render crash shows a reload screen
  // instead of a blank app.
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
          <StoreProvider>
            <View style={{ flex: 1 }}>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  headerStyle: { backgroundColor: colors.surface },
                  headerTintColor: colors.onSurface,
                  headerTitleStyle: { fontWeight: "800" },
                  contentStyle: { backgroundColor: colors.surfaceSecondary },
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="rekap" options={{ headerShown: true, title: "Rekap" }} />
                <Stack.Screen name="admin" options={{ headerShown: true, title: "Admin Barang" }} />
                <Stack.Screen name="product/[id]" options={{ headerShown: true, title: "Detail Barang" }} />
                <Stack.Screen name="backup" options={{ headerShown: true, title: "Backup Data" }} />
              </Stack>
              <ToastHost />
            </View>
          </StoreProvider>
        </KeyboardProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
