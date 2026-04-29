import { View, Text, StyleSheet } from 'react-native'
import { Colors, Fonts } from '../constants/theme'

export default function CoachScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coach</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: 20,
    color: Colors.textPrimary,
  },
})
