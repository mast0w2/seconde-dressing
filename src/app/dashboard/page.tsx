"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createBrowserClient } from "@supabase/ssr";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Package, Euro, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  order_number: string;
  client_name: string;
  vendeuse_name: string;
  items_count: number;
  total_amount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  created_at: string;
  updated_at: string;
}

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

export default function DashboardPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchOrders = async () => {
    if (!user || !profile) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      // Filter by user role
      if (profile?.role === "client") {
        query = query.eq("client_id", user?.id);
      } else if (profile?.role === "vendeuse") {
        query = query.eq("vendeuse_id", user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);

      // Calculate stats
      const totalOrders = data?.length || 0;
      const totalRevenue = data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const pendingOrders = data?.filter(order => order.status === "pending" || order.status === "processing").length || 0;
      const completedOrders = data?.filter(order => order.status === "shipped" || order.status === "delivered").length || 0;

      setStats({
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders,
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commandes. Veuillez reessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profile);
      }
    };

    checkUser();
  }, [supabase, toast]);

  useEffect(() => {
    if (user && profile) fetchOrders();
  }, [user, profile, activeTab]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Clock className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "processing":
        return "En cours";
      case "shipped":
        return "Expedie";
      case "delivered":
        return "Livre";
      case "cancelled":
        return "Annule";
      default:
        return status;
    }
  };

  const filteredOrders = activeTab === "all" 
    ? orders 
    : orders.filter(order => {
        if (activeTab === "pending") return order.status === "pending" || order.status === "processing";
        if (activeTab === "completed") return order.status === "shipped" || order.status === "delivered";
        if (activeTab === "cancelled") return order.status === "cancelled";
        return true;
      });

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {profile?.prenom || user?.email || "utilisateur"}!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes totales</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                +0% depuis le mois dernier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenu total</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Sur toutes les commandes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                Commandes a traiter
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terminees</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedOrders}</div>
              <p className="text-xs text-muted-foreground">
                Commandes livrees
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Mes commandes</CardTitle>
            <CardDescription>
              Liste de toutes vos commandes recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <div className="flex space-x-2 mb-6">
              <Button
                variant={activeTab === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("all")}
              >
                Toutes ({orders.length})
              </Button>
              <Button
                variant={activeTab === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("pending")}
              >
                En attente ({stats.pendingOrders})
              </Button>
              <Button
                variant={activeTab === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("completed")}
              >
                Terminees ({stats.completedOrders})
              </Button>
              <Button
                variant={activeTab === "cancelled" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("cancelled")}
              >
                Annulees
              </Button>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Aucune commande trouvee.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="border-0 shadow-none">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                          </div>
                          <div>
                            <div className="font-semibold">{order.order_number}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), "dd MMMM yyyy", { locale: fr })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(order.total_amount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.items_count} articles
                          </div>
                        </div>
                        <div>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {profile?.role === "client" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full">
                  <Link href="/client/rdv">Prendre un nouveau rendez-vous</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/client/settings">Modifier mon profil</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {profile?.role === "vendeuse" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full">
                  <Link href="/vendeuse/demandes">Voir les demandes de RDV</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/vendeuse/agenda">Gerer mon agenda</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/vendeuse/settings">Modifier mon profil</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
