import { betterAuth } from "better-auth";
import { verifyEmailForFree, normalizeEmail } from "./fortend/src/lib/email-verify";

const auth = betterAuth({
  database: { provider: "memory" },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          console.log("Hook called for user:", user);
          const normalized = normalizeEmail(user.email);
          const isValid = await verifyEmailForFree(normalized);
          if (!isValid) {
            return {
              data: null,
              error: {
                message: "Disposable emails are not allowed.",
              }
            };
          }
          user.email = normalized;
          return { data: user };
        }
      }
    }
  }
});
console.log(auth);
