import { APP_SCHEME, BASE_URL, GOOGLE_AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } from "@/constants";


export async function GET(request: Request) {
    if(!GOOGLE_CLIENT_ID){
        return Response.json({error: "Missing GOOGLE_CLIENT_ID"}, {status: 500});
    }
    
    const url = new URL(request.url);

  //  console.log( "request", url)

    let idpClienId : string;
   const internalClient=url.searchParams.get("client_id");
   const redirectUri=url.searchParams.get("redirect_uri");

   let platform

   if(redirectUri=== APP_SCHEME){
     platform="mobile";
   }else if(redirectUri === BASE_URL){
     platform="web";
   }else{
     return Response.json({error: "Missing redirect_uri"}, {status: 500});
   }

   let state = platform+"|"+url.searchParams.get("state");

   if(internalClient === "google"){
     idpClienId = GOOGLE_CLIENT_ID;
   }else{
     return Response.json({error: "Missing client_id"}, {status: 500});
   }

   const params= new URLSearchParams({
     client_id: idpClienId,
     redirect_uri: GOOGLE_REDIRECT_URI,
     response_type: "code",
     scope: url.searchParams.get("scope") || "identity",
     prompt: "select_account",
     state: state,
   });
  
  //  console.log("----------------------------------------------------")
  //  console.log("final url ",GOOGLE_AUTH_URL+"?"+params.toString())

   return Response.redirect(GOOGLE_AUTH_URL+"?"+params.toString());
}