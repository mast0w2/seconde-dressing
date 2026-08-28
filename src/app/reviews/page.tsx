"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";
import { Star } from "lucide-react";

interface Review {
  id: string;
  client_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ReviewsPage() {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Form states
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setName(profile?.full_name || "");
      }
    };

    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setReviews(data || []);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les avis. Veuillez réessayer.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkUser();
    fetchReviews();
  }, [supabase, toast]);

  const handleStarClick = (value: number) => {
    setRating(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || rating === 0 || !comment.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs et sélectionner une note.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("*")
        .eq("client_name", name)
        .single();

      if (existingReview) {
        toast({
          title: "Erreur",
          description: "Vous avez déjà soumis un avis.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("reviews")
        .insert([
          {
            client_name: name,
            rating,
            comment,
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) throw error;

      // Refresh reviews
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      setReviews(data || []);

      // Reset form
      setName("");
      setRating(0);
      setComment("");

      toast({
        title: "Succès",
        description: "Votre avis a été soumis avec succès. Merci !",
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Erreur",
        description: "Impossible de soumettre votre avis. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <section className="py-20">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <p>Chargement des avis...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 to-pink-50 py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">
              Avis Clients
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Découvrez ce que nos clients pensent de Seconde Dressing
            </p>
          </div>
        </div>
      </section>

      {/* Reviews Summary */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl text-center">
                  Note Globale
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const filled = Math.round(parseFloat(getAverageRating())) >= star;
                      return (
                        <Star
                          key={star}
                          className={`h-8 w-8 ${filled ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                        />
                      );
                    })}
                  </div>
                </div>
                <h2 className="text-4xl font-bold mb-2">{getAverageRating()}/5.0</h2>
                <p className="text-muted-foreground">
                  Basé sur {reviews.length} avis
                </p>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <div className="space-y-6 mb-12">
              <h2 className="text-2xl font-bold mb-6">Derniers Avis</h2>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <Card key={review.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>{review.client_name}</CardTitle>
                          <CardDescription>
                            {new Date(review.created_at).toLocaleDateString("fr-FR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const filled = review.rating >= star;
                            return (
                              <Star
                                key={star}
                                className={`h-5 w-5 ${filled ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                      Aucun avis pour le moment. Soyez le premier à en laisser un !
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Review Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Laissez votre avis</CardTitle>
                <CardDescription>
                  Partagez votre expérience avec Seconde Dressing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Votre nom complet"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Note</Label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleStarClick(star)}
                          className="p-0"
                          disabled={isSubmitting}
                        >
                          <Star
                            className={`h-8 w-8 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cliquez sur les étoiles pour noter (1 = médiocre, 5 = excellent)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comment">Votre avis</Label>
                    <Textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Décrivez votre expérience avec Seconde Dressing..."
                      rows={5}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Envoi en cours..." : "Soumettre mon avis"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
