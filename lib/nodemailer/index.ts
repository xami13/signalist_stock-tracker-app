import nodemailer from "nodemailer";
import {
    INACTIVE_USER_REMINDER_EMAIL_TEMPLATE,
    NEWS_SUMMARY_EMAIL_TEMPLATE,
    STOCK_ALERT_LOWER_EMAIL_TEMPLATE,
    STOCK_ALERT_UPPER_EMAIL_TEMPLATE,
    WELCOME_EMAIL_TEMPLATE,
} from "@/lib/nodemailer/templates";

const replaceTokens = (template: string, values: Record<string, string>) =>
    Object.entries(values).reduce(
        (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
        template,
    );

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,

    }
})

type WelcomeEmailParams = {
    email: string;
    name: string;
    intro: string;
};

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailParams) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro);

    const mailOptions = {
        from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: `Welcome to Signalist - your stock market toolkit is ready!`,
        text: 'Thanks for joining Signalist',
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);

}

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: `📈 Your Market News Summary for ${date}`,
        text: `Today's Market News Summary from Signalist`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};

type PriceAlertEmailParams = {
    email: string;
    symbol: string;
    company: string;
    alertType: 'upper' | 'lower';
    targetPrice: number;
    currentPrice: number;
    timestamp: string;
};

export async function sendPriceAlertEmail(params: PriceAlertEmailParams): Promise<void> {
    const template = params.alertType === 'upper'
        ? STOCK_ALERT_UPPER_EMAIL_TEMPLATE
        : STOCK_ALERT_LOWER_EMAIL_TEMPLATE;
    const html = replaceTokens(template, {
        symbol: params.symbol,
        company: params.company,
        targetPrice: `$${params.targetPrice.toFixed(2)}`,
        currentPrice: `$${params.currentPrice.toFixed(2)}`,
        timestamp: params.timestamp,
    });

    await transporter.sendMail({
        from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
        to: params.email,
        subject: `🔔 ${params.symbol} just hit your price alert`,
        text: `${params.symbol} is now $${params.currentPrice.toFixed(2)} (target: $${params.targetPrice.toFixed(2)}).`,
        html,
    });
}

type InactiveReminderEmailParams = {
    email: string;
    name: string;
};

export async function sendInactiveUserReminderEmail({ email, name }: InactiveReminderEmailParams): Promise<void> {
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';
    const html = replaceTokens(INACTIVE_USER_REMINDER_EMAIL_TEMPLATE, {
        name,
        dashboardUrl,
        unsubscribeUrl: `${dashboardUrl}/settings`,
    });

    await transporter.sendMail({
        from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: `🔔 ${name}, opportunities are waiting for you`,
        text: `We miss you, ${name}. Your Signalist watchlists are still ready for you.`,
        html,
    });
}
