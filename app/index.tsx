 
import LoginForm from "@/components/LoginForm";
import { BASE_URL } from "@/constants";
import { useAuth } from "@/context/auth";
import { useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";

export default function Index() {
  const { user, isLoading,signOut,fetchWithAuth} = useAuth();
  const [data,setData] = useState(null);
  if(isLoading){
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  };


 async function getProtectedData() {

    const response = await fetchWithAuth(`${BASE_URL}/api/protected/data`,{
      method: "GET",
     
    });

    const data = await response.json();
    console.log("data", data);
    setData(data);
  
 }

  if(!user){
    return <LoginForm/>
  }
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Hello {user.sub}</Text>
       <Text>Hello {user.name}</Text> 
      <Button title="Logout" onPress={() => signOut()} />
        <Text>{JSON.stringify(data)}</Text>
        <Button title="Get Protected Data" onPress={() => getProtectedData()} />

    </View>
  );
}
