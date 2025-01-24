import { Image, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useAuth } from '../../services/AuthProvider';

export default function ProfileScreen() {
  const { authuser } = useAuth();

  const ProfileField = ({ label, value }) => (
    <ThemedView style={styles.fieldContainer}>
      <ThemedText type="defaultSemiBold" style={styles.label}>
        {label}
      </ThemedText>
      <ThemedView style={styles.valueContainer}>
        <ThemedText type="default">{value}</ThemedText>
      </ThemedView>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <Image
          source={{ uri: authuser.picture }}
          style={styles.profileImage}
        />
        <ThemedText type="title" style={styles.name}>
          {authuser.name}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.infoContainer}>
        <ProfileField label="Apodo" value={authuser.nickname} />
        <ProfileField label="Email" value={authuser.email} />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#17A2B8',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoContainer: {
    padding: 24,
    gap: 24,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 18,
  },
  valueContainer: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(40, 167, 69, 0.2)',
  }
});
