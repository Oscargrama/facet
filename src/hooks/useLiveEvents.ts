import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RwaEvent {
    id: string;
    lot_id: number | null;
    event_name: string;
    tx_hash: string;
    block_number: number;
    payload: any;
    created_at: string;
}

export function useLiveEvents(limit = 10, lotId?: number) {
    const [events, setEvents] = useState<RwaEvent[]>([]);
    const [latestEvent, setLatestEvent] = useState<RwaEvent | null>(null);

    useEffect(() => {
        // Initial fetch
        const fetchEvents = async () => {
            let query = supabase
                .from("rwa_lot_events")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(limit);

            if (lotId) {
                query = query.eq("lot_id", lotId);
            }

            const { data } = await query;
            if (data) setEvents(data as RwaEvent[]);
        };

        fetchEvents();

        // Subscribe to real-time changes
        const channel = supabase
            .channel("rwa_events_changes")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "rwa_lot_events",
                    filter: lotId ? `lot_id=eq.${lotId}` : undefined,
                },
                (payload) => {
                    const newEvent = payload.new as RwaEvent;
                    setLatestEvent(newEvent);
                    setEvents((prev) => [newEvent, ...prev].slice(0, limit));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [limit, lotId]);

    return { events, latestEvent };
}
