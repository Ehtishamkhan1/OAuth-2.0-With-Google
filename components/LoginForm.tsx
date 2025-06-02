import { useAuth } from '@/context/auth';
import React from 'react';
import { Button, Text, View } from 'react-native';

const LoginForm = () => {
    const {signIn} = useAuth();
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}} >
      <Text>LoginForm</Text>
      <Button title='Login'  onPress={signIn} />
    </View>
  )
}

export default LoginForm 