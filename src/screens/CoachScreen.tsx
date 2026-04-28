import { View, Text } from 'react-native'
import { Colors, Fonts } from '../constants/theme'

export default function CoachScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.appBg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: Fonts.serifSemiBold, fontSize: 20, color: Colors.textPrimary }}>Coach</Text>
    </View>
  )
}
