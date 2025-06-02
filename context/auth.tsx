import { BASE_URL, TOKEN_KEY_NAME } from "@/constants";
import { tokenCache } from "@/utils/cache";
import {
  AuthError,
  AuthRequestConfig,
  DiscoveryDocument,
  makeRedirectUri,
  useAuthRequest,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as jose from "jose";
import * as React from "react";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  email_verified: boolean;
  provider: string;
  exp: number;
  cookieExpiration: number;
};

export const AuthContext = React.createContext({
  user: null,
  signIn: () => {},
  signOut: () => {},
  fetchWithAuth:  (url: string, options: RequestInit) =>
    Promise.resolve(new Response()),
  isLoading: false,
  error: null as AuthError | null,
});

const config: AuthRequestConfig = {
  clientId: "google",
  scopes: ["openid", "profile", "email"],
  redirectUri: makeRedirectUri({
    native: "googleauth://",
    useProxy: Platform.select({ web: true, default: false }),
  } as any),
};

const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${BASE_URL}/api/auth/authorize`,
  // tokenEndpoint:`${BASE_URL}/api/auth/token`
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<AuthError | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
   const [refreshToken, setRefreshToken] = React.useState<string | null>(null);
  const isWeb = Platform.OS === "web";

  const [request, response, promptAsync] = useAuthRequest(config, discovery);

  React.useEffect(() => {
    handleResponse();
  }, [response]);

  React.useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      try {
        //WEb
        if (isWeb) {
          const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
            method: "GET",
            credentials: "include",
          });

          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            console.log("sessionData", sessionData);
            setUser(sessionData as AuthUser);
          }
        } else {
          //Mobile
          const storeTokenaccess = await tokenCache?.getToken(TOKEN_KEY_NAME);

          if (storeTokenaccess) {
            try {
              const decoded = jose.decodeJwt(storeTokenaccess);
              const exp = (decoded as any).exp;
              const now = Math.floor(Date.now() / 1000);

              if (exp && exp > now) {
                console.log("Access token is valid");
                setAccessToken(storeTokenaccess);
                setUser(decoded as AuthUser);
              } else {
                setUser(null);
                await tokenCache?.deleteToken(TOKEN_KEY_NAME);
              }
            } catch (e) {
              console.log(e);
            }
          }
        }
      } catch (e) {
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [isWeb]);

  async function handleResponse() {
    // This function is called when Google redirects back to our app
    // The response contains the authorization code that we'll exchange for tokens
    if (response?.type === "success") {
      try {
        setIsLoading(true);
        // Extract the authorization code from the response
        // This code is what we'll exchange for access and refresh tokens
        const { code } = response.params;

        // Create form data to send to our token endpoint
        // We include both the code and platform information
        // The platform info helps our server handle web vs native differently
        const formData = new FormData();
        formData.append("code", code);

        // Add platform information for the backend to handle appropriately
        if (isWeb) {
          formData.append("platform", "web");
        }

        console.log("request", request);

        // Get the code verifier from the request object
        // This is the same verifier that was used to generate the code challenge
        if (request?.codeVerifier) {
          formData.append("code_verifier", request.codeVerifier);
        } else {
          console.warn("No code verifier found in request object");
        }

        // Send the authorization code to our token endpoint
        // The server will exchange this code with Google for access and refresh tokens
        // For web: credentials are included to handle cookies
        // For native: we'll receive the tokens directly in the response
        const tokenResponse = await fetch(`${BASE_URL}/api/auth/token`, {
          method: "POST",
          body: formData,
          credentials: isWeb ? "include" : "same-origin", // Include cookies for web
        });

        if (isWeb) {
          // For web: The server sets the tokens in HTTP-only cookies
          // We just need to get the user data from the response
          const userData = await tokenResponse.json();
          if (userData.success) {
            // Fetch the session to get user data
            // This ensures we have the most up-to-date user information
            const sessionResponse = await fetch(
              `${BASE_URL}/api/auth/session`,
              {
                method: "GET",
                credentials: "include",
              }
            );

            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              setUser(sessionData as AuthUser);
            }
          }
        } else {
          const token = await tokenResponse.json();
          const refereshToken = token.refreshToken;
          const accessToken = token.accessToken;

          if (!accessToken) {
            console.log("No access token");
            return;
          }
          setRefreshToken(refereshToken);
          setAccessToken(accessToken);
          tokenCache?.saveToken(TOKEN_KEY_NAME, accessToken);


          const decoded = jose.decodeJwt(accessToken);
          setUser(decoded as AuthUser);
        }
      } catch (e) {
        console.error("Error handling auth response:", e);
      } finally {
        setIsLoading(false);
      }
    } else if (response?.type === "cancel") {
      alert("Sign in cancelled");
    } else if (response?.type === "error") {
      setError(response?.error as AuthError);
    }
  }

  const signIn = async () => {
    try {
      if (!request) {
        console.log("No request");
        return;
      }

      await promptAsync();
    } catch (e) {
      console.log(e);
    }
  };
  const signOut = async () => {

    await tokenCache?.deleteToken(TOKEN_KEY_NAME);
    setUser(null);
    setAccessToken("");
    setRefreshToken("");

  };
  const fetchWithAuth = async (url: string, options?: RequestInit) => {
    if (isWeb) {
      const response = await fetch(url, {
        ...options,
        credentials: "include",
      });
      // if (response.status === 401) {
      //   await signOut();
      // }

      return response;
      
    } else {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });


      if( response.status === 401) {

         const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          Authorization: `Bearer ${refreshToken}`,
        },
      });
       
        return response;
      }

      return response;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signOut,
        fetchWithAuth,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
};
