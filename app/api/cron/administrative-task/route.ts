
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, etc.

    const results = [];
    const errors = [];

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const headers = { 'Authorization': `Bearer ${process.env.CRON_SECRET}` };

    try {
        // MONDAY (Day 1): Weekly Refresh (Odds, Week advancement)
        if (dayOfWeek === 1) {
            console.log("📅 Monday: Running Weekly Refresh...");
            const res = await fetch(`${baseUrl}/api/cron/weekly-refresh`, { headers });
            results.push({ task: 'weekly-refresh', status: res.status, data: await res.json() });
        }

        // TUESDAY (Day 2): Generate Predictions
        if (dayOfWeek === 2) {
            console.log("🔮 Tuesday: Generating Predictions...");
            const res = await fetch(`${baseUrl}/api/cron/generate-predictions`, { headers });
            results.push({ task: 'generate-predictions', status: res.status, data: await res.json() });
        }

        // WEDNESDAY (Day 3): Analyst Report
        if (dayOfWeek === 3) {
            console.log("📊 Wednesday: Generating Analyst Report...");
            const res = await fetch(`${baseUrl}/api/cron/weekly-analyst-report`, { headers });
            results.push({ task: 'weekly-analyst-report', status: res.status, data: await res.json() });
        }

        return NextResponse.json({ success: true, ran: results });

    } catch (err: any) {
        console.error("❌ Administrative Dispatch Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
