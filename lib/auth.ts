import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../generated/prisma";
import { Resend } from "resend";
import ResetPasswordEmail from "@/components/emails/reset-password";

const resend = new Resend(process.env.RESEND_API_KEY);
const prisma = new PrismaClient();

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
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
});
