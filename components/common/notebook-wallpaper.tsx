import { ImageBackground, StyleSheet, View } from 'react-native';

const notebookWallpaper = require('../../assets/images/notebook-wallpaper.png');

export function NotebookWallpaper() {
  return (
    <View pointerEvents="none" style={styles.background}>
      <ImageBackground
        resizeMode="cover"
        source={notebookWallpaper}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    flex: 1,
  },
});
