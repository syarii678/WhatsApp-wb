"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, QrCode, Link, Bot, MessageSquare, Settings, Users, Activity } from "lucide-react";
import { toast } from "sonner";

interface BotStatus {
  connected: boolean;
  phoneNumber?: string;
  pairingCode?: string;
  lastActivity?: string;
  messagesCount?: number;
}

export default function Home() {
  const [botStatus, setBotStatus] = useState<BotStatus>({ connected: false });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const checkBotStatus = async () => {
    try {
      const response = await fetch("/api/bot/status");
      const data = await response.json();
      setBotStatus(data);
      addLog(`Bot status: ${data.connected ? "Connected" : "Disconnected"}`);
    } catch (error) {
      addLog(`Error checking status: ${error}`);
    }
  };

  const connectWithPairingCode = async () => {
    if (!phoneNumber) {
      toast.error("Please enter your phone number");
      return;
    }

    setIsLoading(true);
    addLog(`Attempting to connect with phone number: ${phoneNumber}`);

    try {
      const response = await fetch("/api/bot/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, usePairingCode: true })
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.pairingCode) {
          setBotStatus(prev => ({ ...prev, pairingCode: data.pairingCode }));
          toast.success(`Pairing code generated: ${data.pairingCode}`);
          addLog(`Pairing code: ${data.pairingCode}`);
        } else {
          toast.success("Bot connected successfully!");
          addLog("Bot connected successfully");
        }
      } else {
        toast.error(data.error || "Failed to connect bot");
        addLog(`Connection failed: ${data.error}`);
      }
    } catch (error) {
      toast.error("Failed to connect bot");
      addLog(`Connection error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectBot = async () => {
    setIsLoading(true);
    addLog("Disconnecting bot...");

    try {
      const response = await fetch("/api/bot/disconnect", { method: "POST" });
      const data = await response.json();
      
      if (data.success) {
        toast.success("Bot disconnected successfully");
        addLog("Bot disconnected successfully");
        setBotStatus({ connected: false });
      } else {
        toast.error(data.error || "Failed to disconnect bot");
        addLog(`Disconnection failed: ${data.error}`);
      }
    } catch (error) {
      toast.error("Failed to disconnect bot");
      addLog(`Disconnection error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkBotStatus();
    const interval = setInterval(checkBotStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">WhatsApp Bot Web</h1>
          <p className="text-gray-600">Connect and manage your WhatsApp bot with pairing code</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="connect" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Connect
            </TabsTrigger>
            <TabsTrigger value="commands" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Commands
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bot Status</CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {botStatus.connected ? (
                      <Badge variant="default" className="bg-green-500">Connected</Badge>
                    ) : (
                      <Badge variant="secondary">Disconnected</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {botStatus.connected ? "Bot is running" : "Bot is offline"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Phone Number</CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {botStatus.phoneNumber || "Not set"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Connected number
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {botStatus.messagesCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total messages processed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {botStatus.lastActivity ? new Date(botStatus.lastActivity).toLocaleTimeString() : "Never"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last bot activity
                  </p>
                </CardContent>
              </Card>
            </div>

            {botStatus.pairingCode && (
              <Alert>
                <QrCode className="h-4 w-4" />
                <AlertDescription>
                  <strong>Pairing Code:</strong> {botStatus.pairingCode}
                  <p className="text-sm mt-2">
                    Open WhatsApp on your phone, go to Settings {'>'} Linked Devices {'>'} Link a Device, and enter this pairing code.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="connect" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connect WhatsApp Bot</CardTitle>
                <CardDescription>
                  Connect your WhatsApp bot using pairing code authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Enter your phone number with country code (e.g., 6281234567890)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    disabled={isLoading || botStatus.connected}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter your phone number without the "+" sign
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={connectWithPairingCode}
                    disabled={isLoading || !phoneNumber || botStatus.connected}
                    className="flex-1"
                  >
                    {isLoading ? "Connecting..." : "Connect with Pairing Code"}
                  </Button>
                  
                  {botStatus.connected && (
                    <Button
                      onClick={disconnectBot}
                      disabled={isLoading}
                      variant="destructive"
                    >
                      Disconnect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <h3 className="font-semibold">Enter Number</h3>
                    <p className="text-sm text-muted-foreground">Enter your WhatsApp phone number</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-green-600 font-bold">2</span>
                    </div>
                    <h3 className="font-semibold">Get Code</h3>
                    <p className="text-sm text-muted-foreground">Generate pairing code</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-purple-600 font-bold">3</span>
                    </div>
                    <h3 className="font-semibold">Link Device</h3>
                    <p className="text-sm text-muted-foreground">Enter code in WhatsApp</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commands" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Commands</CardTitle>
                <CardDescription>
                  List of commands that your WhatsApp bot can respond to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold text-lg">!menu</h3>
                      <p className="text-sm text-muted-foreground">Show available commands</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold text-lg">!ping</h3>
                      <p className="text-sm text-muted-foreground">Check if bot is online</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold text-lg">!info</h3>
                      <p className="text-sm text-muted-foreground">Get bot information</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold text-lg">!help</h3>
                      <p className="text-sm text-muted-foreground">Show help information</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bot Logs</CardTitle>
                <CardDescription>
                  Real-time logs from your WhatsApp bot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <div key={index} className="mb-1">
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500">No logs available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}