import { StatusBar } from 'expo-status-bar';
import BillingScreen from './src/screens/BillingScreen';

export default function App() {
  return (
    <>
      <BillingScreen />
      <StatusBar style="dark" />
    </>
  );
}
