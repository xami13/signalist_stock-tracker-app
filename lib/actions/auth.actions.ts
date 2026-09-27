'use server';

import {auth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";
import {connectToDatabase} from "@/database/mongoose";

async function recordLogin(email: string) {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return;

    await db.collection('user').updateOne(
        { email },
        { $set: { lastLoginAt: new Date() } },
    );
}

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try{
        const response = await auth.api.signUpEmail({
            body: { email, password, name: fullName },
            headers: await headers(),
        })

        if(response) {
            await recordLogin(email);
            // fire-and-forget so the cookie write on the action response is not blocked on inngest
            void inngest.send({
                name: 'app/user.created',
                data: {
                    email,
                    name: fullName,
                    country,
                    investmentGoals,
                    riskTolerance,
                    preferredIndustry,
                }
            }).catch((err) => console.error("inngest send failed", err));
        }

        return { success: true, data: response }

    } catch (e) {
        console.log('Sign Up Failed', e);
        return { success: false, error: 'Sign Up Failed' };
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try{
        const response = await auth.api.signInEmail({
            body: { email, password },
            headers: await headers(),
        })

        if (response) await recordLogin(email);

        return { success: true, data: response }

    } catch (e) {
        console.log('Sign in Failed', e);
        return { success: false, error: 'Sign in Failed' };
    }
}

export const signOut = async () => {
    try{
        await auth.api.signOut({ headers: await headers() });
    }  catch (e) {
        console.log('Sign Out Failed', e);
        return { success: false, error: 'Sign Out Failed' };
    }
}
