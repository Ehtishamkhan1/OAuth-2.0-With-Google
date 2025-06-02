import { APP_SCHEME, BASE_URL } from "@/constants";

export async function GET(request: Request) {
    // console.log("===================================")
    // console.log("request", request.url.split("?")[1]);

    const incomingParams = new URLSearchParams(request.url.split("?")[1]);

    // console.log("incomingParamss", incomingParams);

    const combinedPlatformAndState= incomingParams.get("state")

    if(!combinedPlatformAndState){

        return Response.json({error: "Missing state"}, {status: 500});

    }


    const platform = combinedPlatformAndState.split("|")[0];
    const state= combinedPlatformAndState.split("|")[1];


    const outgoingParams = new URLSearchParams({
        code: incomingParams.get("code")?.toString() || "",
        state
    })

    return Response.redirect(
        (platform === "web"? BASE_URL : APP_SCHEME) + "?" + outgoingParams.toString()
    )

}