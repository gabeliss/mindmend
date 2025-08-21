import { convexAuth } from "convex-auth";
import Clerk from "@auth/clerk";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Clerk({
      // You'll need to add these environment variables
      // CLERK_JWT_ISSUER_DOMAIN and CLERK_JWT_VERIFICATION_KEY
      // from your Clerk dashboard
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: process.env.CLERK_APPLICATION_ID,
    }),
  ],
});