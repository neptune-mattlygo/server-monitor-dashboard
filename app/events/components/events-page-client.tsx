'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EventsTableClient } from './events-table-client';
import { EventsSkeleton } from './events-skeleton';
import { Loader2 } from 'lucide-react';

type ServerStatus = 'up' | 'down' | 'degraded' | 'maintenance' | 'unknown';

interface ServerEvent {
  id: string;
  server_id: string;
  event_type: string;
  event_source: string;
  status: string | null;
  message: string | null;
  old_status: ServerStatus | null;
  new_status: ServerStatus | null;
  response_time_ms: number | null;
  error_message: string | null;
  backup_database: string | null;
  backup_file_size: number | null;
  metadata: any;
  payload: any;
  created_at: string;
  server: {
    name: string;
    ip_address: string | null;
  };
}

export function EventsPageClient() {
  const [events, setEvents] = useState<ServerEvent[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const pageSize = 50;

  const fetchEvents = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch(`/api/events?page=${pageNum}&pageSize=${pageSize}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      
      if (append) {
        setEvents(prev => [...prev, ...data.events]);
      } else {
        setEvents(data.events);
      }
      
      setTotal(data.total);
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [pageSize]);

  // Initial load
  useEffect(() => {
    fetchEvents(1, false);
  }, [fetchEvents]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          fetchEvents(page + 1, true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, isLoading, page, fetchEvents]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents(1, false);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchEvents]);

  if (isLoading && events.length === 0) {
    return (
      <main className="container mx-auto px-6 py-8">
        <EventsSkeleton />
      </main>
    );
  }

  if (error && events.length === 0) {
    return (
      <main className="container mx-auto px-6 py-8">
        <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => fetchEvents(1, false)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-6 py-8">
      <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-b border-blue-200/50 dark:border-blue-700/50">
          <CardTitle className="text-blue-700 dark:text-blue-300">Recent Events</CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-400">
            Webhook activity and server status changes ({total.toLocaleString()} total events)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <>
              <EventsTableClient 
                events={events}
                totalEvents={total}
              />
              
              {/* Loading indicator and intersection observer target */}
              <div ref={observerTarget} className="py-8 flex justify-center">
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading more events...</span>
                  </div>
                )}
                {!hasMore && events.length > 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No more events to load
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No events recorded yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Events will appear here when webhooks are received or server status changes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
