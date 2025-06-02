import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

type TOkenCache = {
    getToken : (key:string) => Promise<string | null>;
    saveToken : (key:string, value:string) => Promise<void>;
    deleteToken : (key:string) => Promise<void>;
}


const createTokenCache = () : TOkenCache => {
    return{
        getToken : async (key:string) => {
          try{
            const item=await SecureStore.getItemAsync(key);
            if (!item) {
              console.log('No cache found');
              return null;
            }else{
              console.log('Cache found');
            }
            return item;
          }catch(e){
            await SecureStore.deleteItemAsync(key);
            return null;
          }
            
        },
        saveToken : async (key:string, token:string) => {
            return SecureStore.setItemAsync(key, token);
        },
        deleteToken : async (key:string) => {
            return SecureStore.deleteItemAsync(key);
        }
    }
}


export const tokenCache =  Platform.OS === 'web' ? undefined: createTokenCache();