import ResetPasswordEmail from "@/components/emails/reset-password";
import * as schema from "@/db/schema";
import { db } from "@/lib/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        minPasswordLength: 10,
        sendResetPassword: async ({ user, url, token }, request) => {
            await resend.emails.send({
                from: 'support@404bidden.tpne.news',
                to: user.email,
                subject: 'Reset your password',
                react: ResetPasswordEmail({
                    resetLink: url,
                    userFirstName: user.name.split(" ")[0],
                }),
            });
        }
    },
    database: drizzleAdapter(db, {
        schema,
        provider: "pg",
    }),
});
