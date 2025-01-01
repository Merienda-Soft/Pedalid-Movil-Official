import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ButtonLink } from '@/components/ButtonLink';


export default function HomeScreen() {
  return (
    <ParallaxScrollView
      modo={1}
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/logo.webp')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ButtonLink text="ENTRAR" modo='large' screenName='auth' color='primary'/>
      </ThemedView>
      
    </ParallaxScrollView>
  );
}


const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reactLogo: {
    height: '100%',
    width: '100%',
  },
});

