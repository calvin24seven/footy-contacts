import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { router } from "expo-router"

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>Footy Contacts</Text>
        <Text style={styles.headline}>Football contact intelligence</Text>
        <Text style={styles.sub}>
          Search and connect with agents, scouts, clubs and coaches across world football.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/(auth)/signup")}
        >
          <Text style={styles.primaryBtnText}>Get started</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.secondaryBtnText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#222C41",
    padding: 24,
    justifyContent: "space-between",
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#F9D783",
    marginBottom: 16,
  },
  headline: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
  },
  sub: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    gap: 12,
    paddingBottom: 16,
  },
  primaryBtn: {
    backgroundColor: "#F9D783",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#222C41",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: "#2E3A52",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
})
