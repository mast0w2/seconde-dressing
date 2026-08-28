"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
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
  const supabase = createClientComponentClient();
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

    const fetchOrders = async () => {
      try {
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
          description: "Impossible de charger les commandes. Veuillez réessayer.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkUser();
    if (user) fetchOrders();
  }, [supabase, toast, user, profile]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [activeTab, user]);

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
        return <Calendar className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "En attente",
      processing: "En cours",
      shipped: "Expédié",
      delivered: "Livré",
      cancelled: "Annulé",
    };
    return statusMap[status] || status;
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return order.status === "pending" || order.status === "processing";
    if (activeTab === "completed") return order.status === "shipped" || order.status === "delivered";
    if (activeTab === "cancelled") return order.status === "cancelled";
    return true;
  });

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <section className="py-20">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl font-bold mb-4">Tableau de bord</h1>
              <p className="mb-8">Veuillez vous connecter pour accéder à votre tableau de bord.</p>
              <Button asChild>
                <Link href="/login">Se connecter</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <section className="py-20">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <p>Chargement du tableau de bord...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 to-pink-50 py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
              Bienvenue, {profile?.full_name || user?.email || "Utilisateur"} !
            </h1>
            <p className="text-muted-foreground">
              Voici votre tableau de bord de suivi des commandes
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Commandes totales</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    {profile?.role === "client" ? "Vos commandes" : "Commandes reçues"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} €</div>
                  <p className="text-xs text-muted-foreground">
                    {profile?.role === "client" ? "Vos gains" : "Vos revenus"}
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
                  <p className="text-xs text-muted-foreground">Commandes en attente</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Terminées</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedOrders}</div>
                  <p className="text-xs text-muted-foreground">Commandes complétées</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Orders Table */}
      <section className="py-8">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Mes commandes</CardTitle>
                <CardDescription>
                  Liste de toutes vos commandes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b">
                  <Button
                    variant={activeTab === "all" ? "default" : "ghost"}
                    onClick={() => setActiveTab("all")}
                    className="mb-2"
                  >
                    Toutes ({orders.length})
                  </Button>
                  <Button
                    variant={activeTab === "pending" ? "default" : "ghost"}
                    onClick={() => setActiveTab("pending")}
                    className="mb-2"
                  >
                    En attente ({stats.pendingOrders})
                  </Button>
                  <Button
                    variant={activeTab === "completed" ? "default" : "ghost"}
                    onClick={() => setActiveTab("completed")}
                    className="mb-2"
                  >
                    Terminées ({stats.completedOrders})
                  </Button>
                  <Button
                    variant={activeTab === "cancelled" ? "default" : "ghost"}
                    onClick={() => setActiveTab("cancelled")}
                    className="mb-2"
                  >
                    Annulées ({orders.filter(o => o.status === "cancelled").length})
                  </Button>
                </div>

                {/* Orders List */}
                {filteredOrders.length > 0 ? (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <Card key={order.id} className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold">#{order.order_number}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                {getStatusText(order.status)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {order.client_name} - {order.vendeuse_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.items_count} article(s) - {order.total_amount.toFixed(2)} €
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/${order.id}`}>Voir les détails</Link>
                            </Button>
                            {order.status === "pending" && (
                              <Button size="sm">Confirmer</Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Aucune commande trouvée pour cette catégorie.
                    </p>
                    {profile?.role === "client" && (
                      <Button className="mt-4" asChild>
                        <Link href="/client/rdv">Prendre un rendez-vous</Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-8">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Actions rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {profile?.role === "client" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Prendre un rendez-vous</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Planifiez un rendez-vous avec une vendeuse professionnelle
                      </p>
                      <Button asChild>
                        <Link href="/client/rdv">Voir les disponibilités</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Mes disponibilités</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Gérez vos créneaux disponibles pour les rendez-vous
                      </p>
                      <Button asChild>
                        <Link href="/client/disponibilites">Modifier mes disponibilités</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Paramètres du compte</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Mettez à jour vos informations personnelles
                      </p>
                      <Button asChild>
                        <Link href="/client/settings">Modifier mes paramètres</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              {profile?.role === "vendeuse" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Voir les demandes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Consultez les nouvelles demandes de rendez-vous
                      </p>
                      <Button asChild>
                        <Link href="/vendeuse/demandes">Voir les demandes</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Mon agenda</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Gérez votre agenda et vos rendez-vous
                      </p>
                      <Button asChild>
                        <Link href="/vendeuse/agenda">Voir mon agenda</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Paramètres du compte</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Mettez à jour vos informations professionnelles
                      </p>
                      <Button asChild>
                        <Link href="/vendeuse/settings">Modifier mes paramètres</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
