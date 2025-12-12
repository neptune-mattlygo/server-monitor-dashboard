'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetadataRefreshSettings } from '@/app/dashboard/components/metadata-refresh-settings';

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and automation
          </p>
        </div>

        <Tabs defaultValue="metadata-refresh" className="space-y-4">
          <TabsList>
            <TabsTrigger value="metadata-refresh">Metadata Refresh</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          <TabsContent value="metadata-refresh">
            <MetadataRefreshSettings />
          </TabsContent>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  System-wide configuration options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Additional settings can be added here in the future.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}