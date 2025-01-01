import { Image, StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/services/AuthProvider';
export default function ProfileScreen() {

  const {authuser} = useAuth();
  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      style={{flex:1, backgroundColor: 'red'}}
      headerImage={
        <Image
          source={{uri: authuser.picture}}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">
          { authuser.name }
        </ThemedText>
      </ThemedView>

      <ThemedView >
        <ThemedText type="defaultSemiBold">
          Apodo:
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.box}>
        <ThemedText type="default">
          { authuser.nickname }
        </ThemedText>
      </ThemedView>

      <ThemedView >
        <ThemedText type="defaultSemiBold">
          Email: 
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.box}>
        <ThemedText type="default">
          { authuser.email }
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  reactLogo: {
    height: '90%',
    width: '60%',
    borderRadius: 100
  },

  box: {
    backgroundColor: '#28A745',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
});
