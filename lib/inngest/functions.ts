import {inngest} from "@/lib/inngest/client";
import {NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT} from "@/lib/inngest/prompts";
import {
    sendInactiveUserReminderEmail,
    sendNewsSummaryEmail,
    sendPriceAlertEmail,
    sendWelcomeEmail,
} from "@/lib/nodemailer";
import {getAllUsersForNewsEmail} from "@/lib/actions/user.actions";
import {getWatchlistSymbolsByEmail} from "@/lib/actions/watchlist.actions";
import {getNews, getStockQuote} from "@/lib/actions/finnhub.actions";
import {formatDateToday} from "@/lib/utils";
import {connectToDatabase} from "@/database/mongoose";
import PriceAlert, {type PriceAlertDocument} from "@/database/models/alert.model";

const frequencyMilliseconds: Record<PriceAlertDocument['frequency'], number> = {
    minute: 60_000,
    hour: 60 * 60_000,
    day: 24 * 60 * 60_000,
};

const safeStepId = (value: unknown) => String(value).replace(/[^a-zA-Z0-9_-]/g, '-');

export const sendSignUpEmail = inngest.createFunction(
    { id: 'sign-up-email', triggers: [{ event: 'app/user.created' }] },
    async ({ event, step }) => {
        const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile)

        const response = await step.ai.infer('generate-welcome-intro', {
            model: step.ai.models.gemini({
                model: process.env.GEMINI_MODEL || `gemini-2.5-flash-lite`,
            }),
            body: {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt }
                        ]
                    }]
            }

        })

        await step.run('send-welcome-email', async () => {
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text : null ) || 'Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.'

            const { data: { email, name } } = event;
            return await sendWelcomeEmail({
                email, name, intro: introText
            })
        })

        return{
            success: true,
            message: 'Welcome email sent successfully!'
        }
    }
)

export const sendDailyNewsSummary = inngest.createFunction(
    {
        id: 'daily-news-summary',
        // Once a day at 12:00 UTC; throttle prevents duplicate delivery bursts.
        triggers: [
            { event: 'app/send.daily.news' },
            { cron: '0 12 * * *' }, // 12:00 PM UTC daily
        ],
        concurrency: { limit: 1, key: 'daily-news-summary' },
        throttle: { limit: 1, period: '5m', key: 'daily-news-summary' },
        retries: 3,
    },

    async ({ step }) => {
        // Step #1: Get all users for news delivery
        const users = await step.run('get-all-users', getAllUsersForNewsEmail)

        if (!users || users.length === 0) return { success: true };

        // Step #2: For each user, get watchlist symbols -> fetch news (fallback to general)
        const results = await step.run('fetch-user-news', async () => {
            const perUser: Array<{ user: User; articles: MarketNewsArticle[] }> = [];
            for (const user of users as User[]) {
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = await getNews(symbols);
                    // Enforce max 6 articles per user
                    articles = (articles || []).slice(0, 6);
                    // If still empty, fallback to general
                    if (!articles || articles.length === 0) {
                        articles = await getNews();
                        articles = (articles || []).slice(0, 6);
                    }
                    perUser.push({ user, articles });
                } catch (e) {
                    console.error('daily-news: error preparing user news', user.email, e);
                    perUser.push({ user, articles: [] });
                }
            }
            return perUser;
        });

        // Step #3: Summarize this user's articles via AI (one resumable AI step per user).
        const userNewsSummaries: { user: User; newsContent: string | null }[] = [];

        for (const { user, articles } of results) {
            try {
                const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
                    '{{newsData}}',
                    JSON.stringify(articles, null, 2)
                );

                const response = await step.ai.infer(`summarize-news-${user.email}`, {
                    model: step.ai.models.gemini({
                        model: process.env.GEMINI_MODEL || `gemini-2.5-flash-lite`,
                    }),
                    body: {
                        contents: [{ role: 'user', parts: [{ text: prompt }] }]
                    }
                });

                const part = response.candidates?.[0]?.content?.parts?.[0];
                const newsContent = (part && 'text' in part ? part.text : null) || 'No market news.';

                userNewsSummaries.push({ user, newsContent });
            } catch (e) {
                console.error('Failed to summarize news for:', user.email, e);
                userNewsSummaries.push({ user, newsContent: null });
            }
        }

        // Step #4: Send the resulting email to each user.
        await Promise.all(
            userNewsSummaries.map(async ({ user, newsContent }) => {
                if (!newsContent) return;

                await step.run(`send-news-email-${safeStepId(user.email)}`, () =>
                    sendNewsSummaryEmail({ email: user.email, date: formatDateToday, newsContent })
                );
            })
        );

        return { success: true, message: 'Daily news summary emails sent successfully' }
    }
)

export const checkPriceAlerts = inngest.createFunction(
    {
        id: 'check-price-alerts',
        triggers: [
            { event: 'app/check.price.alerts' },
            { cron: '* * * * *' },
        ],
        concurrency: { limit: 1, key: 'check-price-alerts' },
        retries: 2,
    },
    async ({ step }) => {
        const alerts = await step.run('get-due-price-alerts', async () => {
            await connectToDatabase();
            const now = Date.now();
            const records = await PriceAlert.find({}).lean();

            return records.filter((alert) => {
                if (!alert.lastCheckedAt) return true;
                return now - new Date(alert.lastCheckedAt).getTime() >= frequencyMilliseconds[alert.frequency];
            }).map((alert) => ({
                id: alert._id.toString(),
                userId: alert.userId,
                symbol: alert.symbol,
                company: alert.company,
                alertType: alert.alertType,
                threshold: alert.threshold,
                conditionMet: alert.conditionMet ?? false,
            }));
        });

        if (alerts.length === 0) return { success: true, checked: 0, sent: 0 };

        const quotes = await step.run('fetch-alert-quotes', async () => {
            const symbols = [...new Set(alerts.map((alert) => alert.symbol))];
            const results = await Promise.allSettled(symbols.map(async (symbol) => ({
                symbol,
                quote: await getStockQuote(symbol),
            })));

            return results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
        });
        const quoteBySymbol = new Map(quotes.map(({ symbol, quote }) => [symbol, quote]));

        const userIds = [...new Set(alerts.map((alert) => alert.userId))];
        const users = await step.run('get-alert-users', async () => {
            const mongoose = await connectToDatabase();
            const db = mongoose.connection.db;
            if (!db) throw new Error('MongoDB connection failed');
            return db.collection('user').find(
                { id: { $in: userIds } },
                { projection: { id: 1, email: 1 } },
            ).toArray();
        });
        const emailByUserId = new Map(users.map((user) => [String(user.id), String(user.email)]));
        let sent = 0;

        for (const alert of alerts) {
            const quote = quoteBySymbol.get(alert.symbol);
            if (!quote) continue;
            const conditionMet = alert.alertType === 'upper'
                ? quote.currentPrice >= alert.threshold
                : quote.currentPrice <= alert.threshold;
            const shouldNotify = conditionMet && !alert.conditionMet;

            if (shouldNotify) {
                const email = emailByUserId.get(alert.userId);
                if (email) {
                    await step.run(`send-price-alert-${safeStepId(alert.id)}`, () => sendPriceAlertEmail({
                        email,
                        symbol: alert.symbol,
                        company: alert.company,
                        alertType: alert.alertType,
                        targetPrice: alert.threshold,
                        currentPrice: quote.currentPrice,
                        timestamp: new Date().toLocaleString('en-US', { timeZone: 'UTC', timeZoneName: 'short' }),
                    }));
                    sent += 1;
                }
            }

            await step.run(`update-price-alert-${safeStepId(alert.id)}`, async () => {
                await connectToDatabase();
                await PriceAlert.findByIdAndUpdate(
                    alert.id,
                    {
                        $set: {
                            conditionMet,
                            lastCheckedAt: new Date(),
                            ...(shouldNotify ? { lastTriggeredAt: new Date() } : {}),
                        },
                    },
                );
            });
        }

        return { success: true, checked: alerts.length, sent };
    },
);

export const sendInactiveUserReminders = inngest.createFunction(
    {
        id: 'send-inactive-user-reminders',
        triggers: [
            { event: 'app/send.inactive.reminders' },
            { cron: '0 14 * * *' },
        ],
        concurrency: { limit: 1, key: 'inactive-user-reminders' },
        retries: 2,
    },
    async ({ step }) => {
        const users = await step.run('get-inactive-users', async () => {
            const mongoose = await connectToDatabase();
            const db = mongoose.connection.db;
            if (!db) throw new Error('MongoDB connection failed');

            const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60_000);
            return db.collection('user').find({
                email: { $exists: true, $ne: null },
                $and: [
                    { $or: [{ lastLoginAt: { $lt: cutoff } }, { lastLoginAt: { $exists: false }, createdAt: { $lt: cutoff } }] },
                    { $or: [{ lastInactiveReminderAt: { $lt: cutoff } }, { lastInactiveReminderAt: { $exists: false } }] },
                ],
            }, { projection: { _id: 1, email: 1, name: 1 } }).toArray();
        });

        for (const user of users) {
            await step.run(`remind-inactive-${safeStepId(user._id)}`, async () => {
                await sendInactiveUserReminderEmail({
                    email: String(user.email),
                    name: String(user.name || 'Investor'),
                });
                const mongoose = await connectToDatabase();
                await mongoose.connection.db?.collection('user').updateOne(
                    { email: String(user.email) },
                    { $set: { lastInactiveReminderAt: new Date() } },
                );
            });
        }

        return { success: true, sent: users.length };
    },
);
