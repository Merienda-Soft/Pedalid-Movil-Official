import { Link } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { Platform } from 'react-native';

export function ExternalLink({ href, ...rest }) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (Platform.OS !== 'web') {
          // Evitar el comportamiento predeterminado en plataformas nativas.
          event.preventDefault();
          // Abre el enlace en un navegador dentro de la app.
          await openBrowserAsync(href);
        }
      }}
    />
  );
}
